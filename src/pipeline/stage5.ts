import path from "node:path";
import { paths } from "../core/paths.js";
import { pruneDir, readAllJson, readJson, writeJson } from "../core/store.js";
import { cachedFetch, mapPool, storeSyntheticBody } from "../core/fetch.js";
import { makeEvidence } from "../core/evidence.js";
import { idToFilename, slug } from "../core/ids.js";
import { quarantine, recordGap } from "../core/ops.js";
import { readGuideIndex } from "../sources/guidePages.js";
import type { GuideIndex } from "../sources/guidePages.js";
import { attributeGuides } from "../features/attribution.js";
import { guideKeyFromUrl, toMarkdownUrl } from "../sources/docsIndex.js";
import type { DocPage } from "../sources/docsIndex.js";
import { TargetResolver } from "../coverage/resolvers.js";
import { recipeRules, targetAliases } from "../core/seeds.js";
import { runRecipe } from "../coverage/recipe.js";
import type { Recipe } from "../coverage/recipe.js";
import { allPages, loadRegistry, recordResult, saveRegistry, summarise, upsert } from "../coverage/registry.js";
import type { CoveragePage } from "../coverage/registry.js";
import { extractFromPage, neverStatesCoverage } from "../coverage/extractors.js";
import { parseMarkdown } from "../core/markdown.js";
import { hasElidedTables, htmlTablesToMarkdown, spliceRecoveredTables } from "../sources/htmlTables.js";
import { adjudicationSchema } from "../core/schema.js";
import type {
  Adjudication, Conflict, CoverageClaim, DataSource, Feature,
  FeatureCoverage, Region, ResourceType, Service,
} from "../core/schema.js";
import type { Stage, StageResult } from "../core/runner.js";

/** Page titles that promise a list of what a feature does and does not reach. */
const COVERAGE_PAGE =
  /(supported|support for|supportabilit|availabilit|^regions?$|regional limits?|resource types?|data sources?|source data|coverage|compatib|integrat|prerequisit|requirement|scan types?|finding types?|managed rules?|standards?|controls? reference|services that|list of|capabilities of|quotas?|verified platforms?|ecosystem|discontinued|unsupported|not available|sample templates|storage classes?|operating systems?|file (types?|formats?)|encryption)/i;

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
  tier: string | undefined,
  /** A page someone chose deliberately is not a sweep, so the tier rule is relaxed. */
  chosenByHand = false,
): Feature | undefined {
  // Only a security service can state coverage "for the service as a whole". For a
  // storage or deployment service, a page about what the service supports is not a
  // statement about security, and sweeping it in buried the map in noise.
  if (tier !== "tier1" && !chosenByHand) return undefined;
  const id = `${serviceId}/service-wide`;
  const own = featuresByService.get(serviceId) ?? [];
  const existing = own.find((f) => f.id === id);
  if (existing) return existing;
  const service = serviceById.get(serviceId);
  if (!service) return undefined;
  const anchor = own[0];
  if (!anchor) return undefined;
  // productName is seeded from whatever source named the service, and a "What's New"
  // headline sometimes wins. A headline has a colon or runs long; fall back to the id.
  const candidate = service.productName ?? serviceId;
  const looksLikeHeadline = candidate.includes(":") || candidate.split(/\s+/).length > 6;
  const displayName = looksLikeHeadline ? serviceId : candidate;
  const record: Feature = {
    id,
    serviceId,
    name: `${displayName}: stated for the service as a whole`,
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
    const resolver = new TargetResolver({ regions, services, resourceTypes, dataSources, aliases: await targetAliases() });

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

    // Discovery adds to the registry; it never decides what gets read. Anything
    // registered on an earlier run, or added by hand, is read again regardless of
    // whether today's rules would have found it.
    const registry = await loadRegistry();
    let discovered = 0;
    for (const [serviceId, list] of attributions) {
      const tier = tierById.get(serviceId);
      if (tier !== "tier1" && tier !== "tier2") continue;
      if ((featuresByService.get(serviceId) ?? []).length === 0) continue;
      for (const attribution of list) {
        for (const page of attribution.pages) {
          const haystack = [page.title, ...page.section].join(" | ");
          const byTitle = COVERAGE_PAGE.test(haystack);
          if (!byTitle && tier !== "tier1") continue;
          const { added } = upsert(registry, {
            url: page.url,
            serviceId,
            source: byTitle ? "title-match" : "tier1-sweep",
          });
          if (added) discovered += 1;
        }
      }
    }

    // A recipe is reference metadata: it says how to read one page shape. Seed rules
    // attach by URL pattern, so a recipe covers every page of that shape.
    const rules = (await recipeRules()).map((rule) => ({ ...rule, re: new RegExp(rule.urlPattern) }));
    // A URL someone wrote a recipe for is read that way and no other way, whichever
    // service registered it. Otherwise the guide's owner reads it generically too and
    // collects a second, vaguer copy of the same claims.
    const recipeUrls = new Set<string>();
    let recipesAttached = 0;
    const matchedRules = new Set<string>();
    for (const page of allPages(registry)) {
      const rule = rules.find((r) => r.re.test(page.url));
      // Recipes are stored on the page, so a rule that no longer owns this
      // registration has to have its recipes cleared, or a stale copy keeps running.
      if (!rule || page.serviceId !== rule.serviceId) delete page.recipes;
      if (!rule) continue;
      matchedRules.add(rule.urlPattern);
      if (page.serviceId === rule.serviceId) {
        page.recipes = rule.recipes as Recipe[];
        if (rule.note) page.note = rule.note;
        recipesAttached += page.recipes.length;
      }
      recipeUrls.add(page.url);
    }

    // A rule whose page was never discovered fails silently: requireMin lives inside
    // the recipe run, and the run never happens. The gate has to sit here too.
    let orphanRules = 0;
    for (const rule of rules) {
      if (matchedRules.has(rule.urlPattern)) continue;
      orphanRules += 1;
      await recordGap({
        kind: "parser",
        subject: `recipe-rule:${rule.urlPattern}`,
        detail: `No registered page matches this rule, so its recipes never run. Register the page with "npm run add-page", or correct the pattern.`,
        suggestedStage: "stage5-coverage",
      });
      ctx.log(`  ✗ no page matches recipe rule ${rule.urlPattern}`);
    }

    const pageBySection = new Map<string, DocPage>();
    for (const list of attributions.values()) {
      for (const attribution of list) {
        for (const page of attribution.pages) pageBySection.set(toMarkdownUrl(page.url), page);
      }
    }

    type Job = { page: CoveragePage; doc: DocPage; features: Feature[]; ownsGuide: boolean; namesService: boolean };
    const ownedGuideKeys = new Map<string, Set<string>>();
    for (const service of services) {
      ownedGuideKeys.set(service.id, new Set(service.docGuides.map((g) => guideKeyFromUrl(g.url))));
    }
    const namesOf = new Map<string, string[]>();
    for (const service of services) {
      namesOf.set(
        service.id,
        [service.productName, ...service.names]
          .filter((n): n is string => typeof n === "string" && n.length >= 6)
          .map((n) => n.toLowerCase()),
      );
    }
    const jobs: Job[] = [];
    for (const page of allPages(registry)) {
      if (!page.enabled) continue;
      const own = featuresByService.get(page.serviceId) ?? [];
      const doc = pageBySection.get(page.url) ?? {
        title: page.url.split("/").pop()?.replace(/\.md$/, "") ?? page.url,
        url: page.url,
        section: [],
      };
      const guideKey = guideKeyFromUrl(page.url);
      const ownsGuide = ownedGuideKeys.get(page.serviceId)?.has(guideKey) ?? false;
      const haystack = `${doc.title} ${doc.section.join(" ")} ${page.url}`.toLowerCase();
      const namesService =
        (namesOf.get(page.serviceId) ?? []).some((n) => haystack.includes(n)) ||
        haystack.includes(`/${page.serviceId}/`);
      jobs.push({ page, doc, features: own, ownsGuide, namesService });
    }
    ctx.log(`  registry holds ${allPages(registry).length} coverage pages (${discovered} new); reading them`);

    const unattached: { serviceId: string; url: string; title: string }[] = [];
    const claimsByFeature = new Map<string, CoverageClaim[]>();
    const serviceWideUsed = new Set<string>();
    const unresolvedByFeature = new Map<string, { axis: string; raw: string; sourceUrl: string }[]>();
    let read = 0;
    let failed = 0;
    let tablesRecovered = 0;
    let recipeFailures = 0;
    let rejectedPages = 0;

    await mapPool(jobs, 10, async (job) => {
      const url = job.page.url;
      try {
        const result = await cachedFetch(url, { maxAgeMs: ctx.maxAgeMs, allowStatus: [404] });
        if (result.status === 404) {
          failed += 1;
          recordResult(job.page, { claims: 0, axes: [], status: "failed", detail: "page is gone (404)" });
          return;
        }

        // Some Markdown pages drop their tables and link to the HTML instead. The
        // tables are recovered so the data is not silently lost.
        let body = result.body;
        let bodySha256 = result.bodySha256;
        if (hasElidedTables(body)) {
          const htmlUrl = url.replace(/\.md$/, ".html");
          try {
            const page = await cachedFetch(htmlUrl, { maxAgeMs: ctx.maxAgeMs, allowStatus: [404] });
            if (page.status !== 404) {
              const recovered = htmlTablesToMarkdown(page.body);
              if (recovered.length > 0) {
                body = spliceRecoveredTables(body, recovered);
                // The quote now comes from the spliced text, so that is what must be
                // stored and hashed, or the quote check has nothing to verify against.
                bodySha256 = await storeSyntheticBody(body);
                tablesRecovered += recovered.length;
              }
            }
          } catch {
            /* the Markdown still stands on its own */
          }
        }

        // A single page often documents several features, one per heading. Each
        // heading is read on its own so its list lands on the right feature.
        const doc = parseMarkdown(body);
        // The table of contents label and the page's own H1 can disagree, and the H1
        // wins. The RDS guide lists its TLS page under a label of "Data encryption",
        // and trusting the label attached certificate Regions to a feature about
        // encrypting data at rest.
        const pageTitle = doc.title?.trim() || job.doc.title;

        if (!job.page.recipes?.length) {
          // A page in someone else's guide has to name this service, or its lists are
          // about that other service. A Detective page is not IAM coverage.
          // Naming a service is not the same as being about it. Every AWS guide
          // mentions CloudWatch Logs. Only the owning guide is read generically;
          // anything else needs a recipe someone wrote on purpose.
          if (recipeUrls.has(job.page.url)) {
            rejectedPages += 1;
            recordResult(job.page, { claims: 0, axes: [], status: "empty", detail: "another service reads this page with a recipe" });
            return;
          }
          if (!job.ownsGuide) {
            rejectedPages += 1;
            recordResult(job.page, { claims: 0, axes: [], status: "empty", detail: "page belongs to another service's guide" });
            return;
          }
          if (neverStatesCoverage(pageTitle, `${job.doc.title} ${job.doc.section.join(" ")} ${url}`)) {
            rejectedPages += 1;
            recordResult(job.page, { claims: 0, axes: [], status: "empty", detail: "page kind never states coverage" });
            return;
          }
        }

        const blocks: { headings: string[]; body: string }[] = [];
        const headed = doc.sections.filter((section) => section.level === 2 && section.body.trim());
        if (headed.length >= 2) {
          for (const section of headed) blocks.push({ headings: [section.title], body: section.body });
        }
        // The whole page is read last. On a finding-types page the headings are
        // themselves the catalog, so splitting by heading would hide it. Anything a
        // heading already claimed is left alone, or the page-level pass would pull
        // every heading's list back into one record.
        blocks.push({ headings: [pageTitle], body });

        let attachedAny = false;
        let blockClaims = 0;
        const seenAxes = new Set<string>();

        // A recipe may read any page, because a person chose it deliberately. The
        // generic reader may not touch a page whose own title says it is a quota
        // list, a price list or a walkthrough.
        if (job.page.recipes?.length) {
          const failures: string[] = [];
          for (const recipe of job.page.recipes) {
            const outcome = runRecipe(recipe, body, pageTitle, resolver);
            if (outcome.failure) {
              recipeFailures += 1;
              failures.push(outcome.failure);
              await recordGap({
                kind: "parser",
                subject: `recipe:${recipe.id}`,
                detail: `${outcome.failure} on ${url}. The page shape has probably changed.`,
                suggestedStage: "stage5-coverage",
              });
            }
            const pinned = recipe.featureId ?? job.page.featureId;
            const feature =
              (pinned ? job.features.find((f) => f.id === pinned) : undefined) ??
              bestFeatureFor([pageTitle], job.features) ??
              serviceWideFeature(job.page.serviceId, serviceById, featuresByService, tierById.get(job.page.serviceId), true);
            if (!feature) continue;
            const list = claimsByFeature.get(feature.id) ?? [];
            const already = new Set(list.map((c) => `${c.axis}|${c.targetId}|${c.scope?.targetId ?? ""}`));
            for (const raw of outcome.claims) {
              const key = `${raw.axis}|${raw.targetId}|${raw.scope?.targetId ?? ""}`;
              if (already.has(key)) continue;
              already.add(key);
              blockClaims += 1;
              seenAxes.add(raw.axis);
              list.push({
                id: slug(`${feature.id}-${raw.axis}-${raw.targetId}-${raw.scope?.targetId ?? ""}-${raw.extractorId}`),
                featureId: feature.id,
                axis: raw.axis,
                targetId: raw.targetId,
                targetLabel: raw.targetLabel,
                ...(raw.scope ? { scope: raw.scope } : {}),
                status: raw.status,
                ...(raw.qualifier ? { qualifier: raw.qualifier } : {}),
                method: "deterministic",
                extractorId: raw.extractorId,
                confidence: 0.95,
                evidence: [makeEvidence({ ...result, body, bodySha256 }, raw.quote, `${url} :: ${raw.locator}`)],
              });
            }
            claimsByFeature.set(feature.id, list);
          }
          attachedAny = blockClaims > 0;
          recordResult(job.page, {
            claims: blockClaims,
            axes: [...seenAxes].sort(),
            status: failures.length ? "failed" : blockClaims > 0 ? "ok" : "empty",
            ...(failures.length ? { detail: failures.join("; ").slice(0, 300) } : {}),
          });
          if (attachedAny) read += 1;
          return;
        }

        const claimedByHeading = new Set<string>();
        for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
          const block = blocks[blockIndex] as { headings: string[]; body: string };
          const isWholePage = blockIndex === blocks.length - 1 && blocks.length > 1;
          const outcome = extractFromPage(block.body, resolver, job.page.serviceId, block.headings.join(" "));
          if (outcome.claims.length === 0) continue;
          // The heading nearest the list decides. Only when it names no feature do
          // we fall back to the page as a whole.
          // A pinned feature wins; otherwise the nearest heading decides.
          const pinned = job.page.featureId ? job.features.find((f) => f.id === job.page.featureId) : undefined;
          // The nearest heading, then the page's own title. An ancestor chapter is
          // not evidence: an RDS page about TLS certificates sits under a chapter
          // called "Data encryption", and that is not what the page states.
          const named = pinned ?? bestFeatureFor(block.headings, job.features) ?? bestFeatureFor([pageTitle], job.features);
          const feature = named ?? serviceWideFeature(job.page.serviceId, serviceById, featuresByService, tierById.get(job.page.serviceId));
          if (!feature) {
            unattached.push({ serviceId: job.page.serviceId, url: url, title: block.headings[0] ?? pageTitle });
            continue;
          }
          if (!named) serviceWideUsed.add(job.page.serviceId);
          attachedAny = true;
          const list = claimsByFeature.get(feature.id) ?? [];
          const already = new Set(list.map((c) => `${c.axis}|${c.targetId}`));
          // A page whose headings are Regions is stating per-Region availability.
          // Recording the claim without that scope asserts it holds everywhere, which
          // is the opposite of what such a page exists to say.
          const blockScope = scopeFromHeading(block.headings, resolver);
          for (const rawClaim of outcome.claims) {
            const raw =
              blockScope && !rawClaim.scope && rawClaim.axis !== "region"
                ? { ...rawClaim, scope: blockScope }
                : rawClaim;
            const pageKey = `${raw.axis}|${raw.targetId}|${raw.scope?.targetId ?? ""}`;
            if (isWholePage && claimedByHeading.has(pageKey)) continue;
            if (already.has(`${raw.axis}|${raw.targetId}`)) continue;
            already.add(`${raw.axis}|${raw.targetId}`);
            if (!isWholePage) claimedByHeading.add(pageKey);
            blockClaims += 1;
            seenAxes.add(raw.axis);
            list.push({
              id: slug(`${feature.id}-${raw.axis}-${raw.targetId}-${raw.extractorId}`),
              featureId: feature.id,
              axis: raw.axis,
              targetId: raw.targetId,
              targetLabel: raw.targetLabel,
              status: raw.status,
              ...(raw.scope ? { scope: raw.scope } : {}),
              ...(raw.qualifier ? { qualifier: raw.qualifier } : {}),
              method: "deterministic",
              extractorId: raw.extractorId,
              confidence: raw.extractorId === "md-table" ? 0.9 : 0.8,
              evidence: [makeEvidence({ ...result, body, bodySha256 }, raw.quote, `${url} :: ${raw.locator}`)],
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
        recordResult(job.page, {
          claims: blockClaims,
          axes: [...seenAxes].sort(),
          status: blockClaims > 0 ? "ok" : "empty",
        });
      } catch (error) {
        failed += 1;
        recordResult(job.page, {
          claims: 0,
          axes: [],
          status: "failed",
          detail: error instanceof Error ? error.message.slice(0, 200) : String(error),
        });
        await quarantine({
          stage: "stage5-coverage",
          subject: `${job.page.serviceId} :: ${job.doc.title}`,
          sourceUrl: url,
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

    const registered = await saveRegistry(registry);
    void registered;

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
        ...summarise(registry),
        newlyDiscovered: discovered,
        pagesConsidered: jobs.length,
        pagesRead: read,
        pagesFailed: failed,
        tablesRecoveredFromHtml: tablesRecovered,
        pagesRejectedByKind: rejectedPages,
        recipesAttached,
        recipeFailures,
        recipeRulesWithNoPage: orphanRules,
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

/**
 * The feature a heading documents. The name has to appear in the heading, verbatim.
 *
 * There used to be a fallback that scored word overlap, and it was wrong far more
 * often than it was right: an RDS page about TLS certificates landed on a feature
 * called "Data encryption", and a page about dual-stack mode landed on "RDS for
 * MySQL". A claim on the wrong feature is worse than no claim, so a page that names
 * no feature now yields nothing and is reported instead.
 */
export function bestFeatureFor(headings: string[], features: Feature[]): Feature | undefined {
  let best: { feature: Feature; length: number } | undefined;
  for (const heading of headings) {
    const text = (heading ?? "").toLowerCase().trim();
    if (!text) continue;
    for (const feature of features) {
      for (const name of [feature.name, ...feature.aliases]) {
        const needle = name.toLowerCase().trim();
        if (needle.length < 8 || !needle.includes(" ")) continue;
        if (!isSubjectOf(needle, text)) continue;
        if (!best || needle.length > best.length) best = { feature, length: needle.length };
      }
    }
  }
  return best?.feature;
}

/** A heading that names a Region scopes everything read beneath it to that Region. */
function scopeFromHeading(headings: string[], resolver: TargetResolver): { axis: string; targetId: string; label?: string } | undefined {
  for (const heading of headings) {
    const text = (heading ?? "").trim();
    if (!text) continue;
    const hit = resolver.resolve(text.replace(/\s+Region$/i, ""), "region");
    if (hit) return { axis: "region", targetId: hit.targetId, label: text };
  }
  return undefined;
}

/** Words a heading may open with before it names its subject. */
const HEADING_LEAD =
  /^(the|a|an|using|use|configuring|configure|managing|manage|understanding|understand|about|supported|working with|how)\s+/;

/**
 * The name has to BE what the heading is about, not something mentioned in passing.
 * "Dual-stack mode with RDS for MySQL" contains "RDS for MySQL", but the heading is
 * about dual-stack mode, and attaching Region coverage to the MySQL engine was wrong.
 */
export function isSubjectOf(needle: string, heading: string): boolean {
  if (!heading.includes(needle)) return false;
  const lead = heading.replace(HEADING_LEAD, "");
  if (lead.startsWith(needle)) return true;
  // Otherwise the name has to account for most of the heading.
  return needle.length / heading.length >= 0.5;
}

/** Same target, different answer, means the sources disagree. We record both. */
function dedupeClaims(claims: CoverageClaim[], conflicts: Conflict[], detectedAt: string): CoverageClaim[] {
  const byTarget = new Map<string, CoverageClaim[]>();
  for (const claim of claims) {
    // A scoped claim is a different statement from an unscoped one. "Not supported
    // in us-east-1" does not contradict "supported"; it narrows it.
    const key = `${claim.axis}|${claim.targetId}|${claim.scope?.targetId ?? ""}`;
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
