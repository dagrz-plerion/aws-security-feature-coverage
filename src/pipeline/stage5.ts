import path from "node:path";
import { paths } from "../core/paths.js";
import { pruneDir, readAllJson, readJson, writeJson } from "../core/store.js";
import { cachedFetch, mapPool } from "../core/fetch.js";
import { makeEvidence } from "../core/evidence.js";
import { idToFilename, slug } from "../core/ids.js";
import { quarantine, recordGap } from "../core/ops.js";
import { readGuideIndex } from "../sources/guidePages.js";
import type { GuideIndex } from "../sources/guidePages.js";
import { attributeGuides } from "../features/attribution.js";
import { guideKeyFromUrl, toMarkdownUrl } from "../sources/docsIndex.js";
import type { DocPage } from "../sources/docsIndex.js";
import { TargetResolver } from "../coverage/resolvers.js";
import { extractFromPage } from "../coverage/extractors.js";
import { parseMarkdown } from "../core/markdown.js";
import { adjudicationSchema } from "../core/schema.js";
import type {
  Adjudication, Conflict, CoverageClaim, DataSource, Feature,
  FeatureCoverage, Region, ResourceType, Service,
} from "../core/schema.js";
import type { Stage, StageResult } from "../core/runner.js";

/** Page titles that promise a list of what a feature does and does not reach. */
const COVERAGE_PAGE =
  /(supported|support for|availabilit|^regions?$|resource types?|data sources?|coverage|compatib|integrat|prerequisit|requirement|scan types?|finding types?|managed rules?|standards?|controls? reference)/i;

/** Read a whole guide only when it is substantial enough to be the service's own. */
function guide2Threshold(_pages: number): number {
  return 0;
}

/**
 * Coverage is often stated for the service as a whole rather than for one feature —
 * a region table for GuardDuty, a resource list for Backup. Rather than drop it, it
 * lands on a service-wide record so the statement keeps its source.
 */
function serviceWideFeature(
  serviceId: string,
  serviceById: Map<string, Service>,
  featuresByService: Map<string, Feature[]>,
): Feature | undefined {
  const id = `${serviceId}/service-wide`;
  const own = featuresByService.get(serviceId) ?? [];
  const existing = own.find((f) => f.id === id);
  if (existing) return existing;
  const service = serviceById.get(serviceId);
  if (!service) return undefined;
  const anchor = own[0];
  if (!anchor) return undefined;
  const record: Feature = {
    id,
    serviceId,
    name: `${service.productName ?? serviceId}: stated for the service as a whole`,
    aliases: [],
    kind: "configuration",
    tier: anchor.tier,
    summary: "Coverage the documentation states for the whole service rather than for one named feature.",
    docUrls: [],
    method: "deterministic",
    confidence: 0.7,
    discoveredBy: ["service-level"],
    evidence: anchor.evidence.slice(0, 1),
  };
  own.push(record);
  featuresByService.set(serviceId, own);
  return record;
}

async function wrapped<T>(file: string, key: string): Promise<T[]> {
  const value = await readJson<Record<string, T[]>>(file);
  return (value?.[key] as T[] | undefined) ?? [];
}

export const stage5: Stage = {
  id: "stage5-coverage",
  title: "Read what each feature covers, one documented list at a time",
  async run(ctx): Promise<StageResult> {
    const u = paths.universes;
    const services = await wrapped<Service>(path.join(u, "services.json"), "services");
    const regions = await wrapped<Region>(path.join(u, "regions.json"), "regions");
    const resourceTypes = await wrapped<ResourceType>(path.join(u, "resource-types.json"), "resourceTypes");
    const dataSources = await wrapped<DataSource>(path.join(u, "data-sources.json"), "dataSources");
    const aliasFile = await readJson<Record<string, string>>(path.join(paths.data, "seeds", "target-aliases.json"));
    const resolver = new TargetResolver({ regions, services, resourceTypes, dataSources, aliases: aliasFile ?? {} });

    const adjudications = await readAllJson<Adjudication>(paths.services, adjudicationSchema);
    const tierById = new Map(adjudications.map((a) => [a.serviceId, a.tier]));
    const inScope = new Set(adjudications.filter((a) => a.tier !== "not-security" || a.candidate).map((a) => a.serviceId));

    const serviceById = new Map(services.map((s) => [s.id, s]));
    const features = await readAllJson<Feature>(paths.features);
    const featuresByService = new Map<string, Feature[]>();
    for (const feature of features) {
      const list = featuresByService.get(feature.serviceId);
      if (list) list.push(feature);
      else featuresByService.set(feature.serviceId, [feature]);
    }

    const guideKeys = [...new Set(services.flatMap((s) => s.docGuides.map((g) => guideKeyFromUrl(g.url))))];
    const guides: GuideIndex[] = [];
    for (const key of guideKeys) {
      const index = await readGuideIndex(key);
      if (index) guides.push(index);
    }
    const attributions = attributeGuides(services, guides, inScope);

    // One work item per coverage page, tied to the feature it documents.
    type Job = { serviceId: string; page: DocPage; features: Feature[] };
    const jobs: Job[] = [];
    const unattached: { serviceId: string; url: string; title: string }[] = [];
    const seenPages = new Set<string>();

    for (const [serviceId, list] of attributions) {
      const tier = tierById.get(serviceId);
      if (tier !== "tier1" && tier !== "tier2") continue;
      const own = featuresByService.get(serviceId) ?? [];
      if (own.length === 0) continue;
      for (const attribution of list) {
        // A security service documents its coverage all over its guide, not only on
        // pages with "supported" in the title. GuardDuty finding types and WAF rule
        // groups never say it, so tier 1 guides are read in full.
        const readEverything = tier === "tier1" && attribution.pages.length > guide2Threshold(attribution.pages.length);
        for (const page of attribution.pages) {
          const haystack = [page.title, ...page.section].join(" | ");
          if (!readEverything && !COVERAGE_PAGE.test(haystack)) continue;
          const key = `${serviceId}|${page.url}`;
          if (seenPages.has(key)) continue;
          seenPages.add(key);
          jobs.push({ serviceId, page, features: own });
        }
      }
    }
    ctx.log(`  ${jobs.length} coverage pages to read, ${unattached.length} not attached to a feature`);

    const claimsByFeature = new Map<string, CoverageClaim[]>();
    const serviceWideUsed = new Set<string>();
    const unresolvedByFeature = new Map<string, { axis: string; raw: string; sourceUrl: string }[]>();
    let read = 0;
    let failed = 0;

    await mapPool(jobs, 10, async (job) => {
      try {
        const url = toMarkdownUrl(job.page.url);
        const result = await cachedFetch(url, { maxAgeMs: ctx.maxAgeMs, allowStatus: [404] });
        if (result.status === 404) {
          failed += 1;
          return;
        }

        // A single page often documents several features, one per heading. Each
        // heading is read on its own so its list lands on the right feature.
        const doc = parseMarkdown(result.body);
        const blocks: { headings: string[]; body: string }[] = [];
        const headed = doc.sections.filter((section) => section.level === 2 && section.body.trim());
        if (headed.length >= 2) {
          for (const section of headed) blocks.push({ headings: [section.title], body: section.body });
        }
        // The whole page is read as well. On a finding-types page the headings are
        // themselves the catalog, so splitting by heading would hide it.
        blocks.push({ headings: [job.page.title, ...job.page.section], body: result.body });

        let attachedAny = false;
        for (const block of blocks) {
          const outcome = extractFromPage(block.body, resolver, job.serviceId);
          if (outcome.claims.length === 0) continue;
          // The heading nearest the list decides. Only when it names no feature do
          // we fall back to the page as a whole.
          const named =
            bestFeatureFor(block.headings, job.features) ??
            bestFeatureFor([job.page.title, ...job.page.section], job.features);
          const feature = named ?? serviceWideFeature(job.serviceId, serviceById, featuresByService);
          if (!feature) {
            unattached.push({ serviceId: job.serviceId, url: job.page.url, title: block.headings[0] ?? job.page.title });
            continue;
          }
          if (!named) serviceWideUsed.add(job.serviceId);
          attachedAny = true;
          const list = claimsByFeature.get(feature.id) ?? [];
          const already = new Set(list.map((c) => `${c.axis}|${c.targetId}`));
          for (const raw of outcome.claims) {
            if (already.has(`${raw.axis}|${raw.targetId}`)) continue;
            already.add(`${raw.axis}|${raw.targetId}`);
            list.push({
              id: slug(`${feature.id}-${raw.axis}-${raw.targetId}-${raw.extractorId}`),
              featureId: feature.id,
              axis: raw.axis,
              targetId: raw.targetId,
              targetLabel: raw.targetLabel,
              status: raw.status,
              ...(raw.qualifier ? { qualifier: raw.qualifier } : {}),
              method: "deterministic",
              extractorId: raw.extractorId,
              confidence: raw.extractorId === "md-table" ? 0.9 : 0.8,
              evidence: [makeEvidence(result, raw.quote, `${url} :: ${raw.locator}`)],
            });
          }
          claimsByFeature.set(feature.id, list);
          if (outcome.unresolved.length) {
            const pending = unresolvedByFeature.get(feature.id) ?? [];
            for (const item of outcome.unresolved.slice(0, 40)) pending.push({ ...item, sourceUrl: url });
            unresolvedByFeature.set(feature.id, pending);
          }
        }
        if (attachedAny) read += 1;
      } catch (error) {
        failed += 1;
        await quarantine({
          stage: "stage5-coverage",
          subject: `${job.serviceId} :: ${job.page.title}`,
          sourceUrl: job.page.url,
          extractorId: "coverage-page",
          reason: "coverage page could not be read",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Persist any service-wide records that were created while reading.
    for (const serviceId of serviceWideUsed) {
      const record = (featuresByService.get(serviceId) ?? []).find((f) => f.id === `${serviceId}/service-wide`);
      if (record) await writeJson(path.join(paths.features, `${idToFilename(record.id)}.json`), record);
    }
    const allFeatures = [...features, ...[...serviceWideUsed]
      .map((id) => (featuresByService.get(id) ?? []).find((f) => f.id === `${id}/service-wide`))
      .filter((f): f is Feature => Boolean(f))];

    // An open axis has no universe until AWS publishes one. The universe is the union
    // of everything the catalogs name, so a denominator still means something.
    const openAxisMembers = new Map<string, Set<string>>();
    for (const claims of claimsByFeature.values()) {
      for (const claim of claims) {
        if (["region", "partition", "service", "resourceType", "dataSource"].includes(claim.axis)) continue;
        const set = openAxisMembers.get(claim.axis) ?? new Set<string>();
        set.add(claim.targetId);
        openAxisMembers.set(claim.axis, set);
      }
    }
    await writeJson(path.join(paths.universes, "open-axes.json"), {
      generatedAt: new Date().toISOString(),
      note: "Axes AWS defines only inside its documentation. Membership is everything the catalogs name.",
      axes: [...openAxisMembers.entries()]
        .map(([axis, members]) => ({ axis, count: members.size, members: [...members].sort() }))
        .sort((a, b) => b.count - a.count),
    });

    // Write one coverage file per feature, and surface sources that disagree.
    const written = new Set<string>();
    const conflicts: Conflict[] = [];
    const generatedAt = new Date().toISOString();
    for (const [featureId, claims] of claimsByFeature) {
      const feature = allFeatures.find((f) => f.id === featureId);
      if (!feature) continue;
      const deduped = dedupeClaims(claims, conflicts, generatedAt);
      const coverage: FeatureCoverage = {
        featureId,
        serviceId: feature.serviceId,
        axes: [...new Set(deduped.map((c) => c.axis))].sort(),
        claims: deduped.sort((a, b) => a.axis.localeCompare(b.axis) || a.targetId.localeCompare(b.targetId)),
        unresolvedTargets: unresolvedByFeature.get(featureId) ?? [],
        generatedAt,
      };
      const filename = `${idToFilename(featureId)}.json`;
      written.add(filename);
      await writeJson(path.join(paths.coverage, filename), coverage);
    }
    const pruned = await pruneDir(paths.coverage, written);

    const conflictFiles = new Set<string>();
    for (const conflict of conflicts) {
      const filename = `${conflict.id}.json`;
      conflictFiles.add(filename);
      await writeJson(path.join(paths.conflicts, filename), conflict);
    }
    await pruneDir(paths.conflicts, conflictFiles);

    const totalUnresolved = [...unresolvedByFeature.values()].reduce((sum, list) => sum + list.length, 0);
    if (totalUnresolved > 0) {
      await recordGap({
        kind: "alias",
        subject: "unresolved coverage targets",
        detail: `${totalUnresolved} names in coverage lists did not resolve to a universe id. Each is recorded on its feature so an alias can be added.`,
        suggestedStage: "stage5-coverage",
      });
    }
    if (unattached.length > 0) {
      await recordGap({
        kind: "parser",
        subject: "coverage pages without a feature",
        detail: `${unattached.length} coverage-shaped pages could not be tied to a named feature, for example "${unattached[0]?.title}".`,
        suggestedStage: "stage5-coverage",
      });
    }

    const allClaims = [...claimsByFeature.values()].flat();
    return {
      status: failed > 0 ? "partial" : "ok",
      counts: {
        pagesConsidered: jobs.length,
        pagesRead: read,
        pagesFailed: failed,
        featuresWithCoverage: claimsByFeature.size,
        serviceWideRecords: serviceWideUsed.size,
        openAxes: openAxisMembers.size,
        openAxisMembers: [...openAxisMembers.values()].reduce((sum, m) => sum + m.size, 0),
        claims: allClaims.length,
        covered: allClaims.filter((c) => c.status === "covered").length,
        notCovered: allClaims.filter((c) => c.status === "not-covered").length,
        conflicts: conflicts.length,
        unresolvedTargets: totalUnresolved,
        unattachedPages: unattached.length,
        prunedStaleRecords: pruned.length,
      },
    };
  },
};

const STOPWORD = new Set([
  "a", "an", "the", "of", "for", "in", "on", "to", "with", "and", "or", "your",
  "aws", "amazon", "supported", "support", "types", "type", "using", "use",
]);

function distinctiveWords(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORD.has(w)),
    ),
  ];
}

/**
 * The feature a heading documents. An exact name match wins. Otherwise the feature
 * whose distinctive words the heading mostly repeats wins, which is how "Supported
 * resource types for external access" reaches the external access analyzer.
 */
export function bestFeatureFor(headings: string[], features: Feature[]): Feature | undefined {
  const haystack = headings.join(" | ").toLowerCase();
  const hayWords = new Set(distinctiveWords(haystack));
  let exact: { feature: Feature; length: number } | undefined;
  let fuzzy: { feature: Feature; score: number; size: number } | undefined;

  for (const feature of features) {
    for (const name of [feature.name, ...feature.aliases]) {
      const needle = name.toLowerCase();
      // A single word is never specific enough to claim a coverage list.
      if (needle.includes(" ") && needle.length >= 8 && haystack.includes(needle)) {
        if (!exact || needle.length > exact.length) exact = { feature, length: needle.length };
      }
      const words = distinctiveWords(name);
      if (words.length < 2) continue;
      const shared = words.filter((w) => hayWords.has(w));
      if (shared.length < 2) continue;
      const score = shared.length / words.length;
      if (score < 0.6) continue;
      if (!fuzzy || score > fuzzy.score || (score === fuzzy.score && words.length > fuzzy.size)) {
        fuzzy = { feature, score, size: words.length };
      }
    }
  }
  return exact?.feature ?? fuzzy?.feature;
}

/** Same target, different answer, means the sources disagree. We record both. */
function dedupeClaims(claims: CoverageClaim[], conflicts: Conflict[], detectedAt: string): CoverageClaim[] {
  const byTarget = new Map<string, CoverageClaim[]>();
  for (const claim of claims) {
    const key = `${claim.axis}|${claim.targetId}`;
    const list = byTarget.get(key);
    if (list) list.push(claim);
    else byTarget.set(key, [claim]);
  }
  const out: CoverageClaim[] = [];
  for (const [key, group] of byTarget) {
    const statuses = new Set(group.map((c) => c.status));
    if (statuses.size > 1) {
      const first = group[0] as CoverageClaim;
      conflicts.push({
        id: slug(`${first.featureId}-${key}`),
        featureId: first.featureId,
        axis: first.axis,
        targetId: first.targetId,
        claims: group,
        detectedAt,
      });
    }
    const best = group.slice().sort((a, b) => b.confidence - a.confidence)[0] as CoverageClaim;
    out.push({ ...best, evidence: dedupeEvidence(group.flatMap((c) => c.evidence)).slice(0, 3) });
  }
  return out;
}

function dedupeEvidence(list: CoverageClaim["evidence"]): CoverageClaim["evidence"] {
  const seen = new Set<string>();
  const out: CoverageClaim["evidence"] = [];
  for (const item of list) {
    const key = `${item.bodySha256}|${item.quote}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
