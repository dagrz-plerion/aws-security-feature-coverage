import path from "node:path";
import { paths } from "../core/paths.js";
import { pruneDir, readAllJson, readJson, writeJson } from "../core/store.js";
import { cachedFetch, storeSyntheticBody } from "../core/fetch.js";
import { listLocalModels, readLocalModel } from "../core/aws.js";
import { idToFilename } from "../core/ids.js";
import { recordGap } from "../core/ops.js";
import { makeEvidence } from "../core/evidence.js";
import { extraFeatures, featureAliases } from "../core/seeds.js";
import { extractFeatureCandidates } from "../features/extract.js";
import { mergeCandidates } from "../features/merge.js";
import { readGuideIndex } from "../sources/guidePages.js";
import type { GuideIndex } from "../sources/guidePages.js";
import { attributeGuides, unownedGuideCount } from "../features/attribution.js";
import { guideKeyFromUrl } from "../sources/docsIndex.js";
import type { Stage, StageResult } from "../core/runner.js";
import { adjudicationSchema } from "../core/schema.js";
import type { Adjudication, Feature, Service } from "../core/schema.js";

const API_MODEL_DOC = "https://github.com/aws/aws-sdk-js-v3/tree/main/codegen/sdk-codegen/aws-models";

export const stage4: Stage = {
  id: "stage4-features",
  title: "Enumerate the named security features of every candidate service",
  async run(ctx): Promise<StageResult> {
    const services =
      (await readJson<{ services: Service[] }>(path.join(paths.universes, "services.json")))?.services ?? [];
    const serviceById = new Map(services.map((s) => [s.id, s]));
    const adjudications = await readAllJson<Adjudication>(paths.services, adjudicationSchema);
    const inScope = adjudications.filter((a) => a.tier === "tier1" || a.tier === "tier2" || a.candidate);

    const modelNames = new Set(await listLocalModels());

    // Load every guide once, then decide page by page which service each page documents.
    const guideKeys = [...new Set(services.flatMap((s) => s.docGuides.map((g) => guideKeyFromUrl(g.url))))];
    const guides: GuideIndex[] = [];
    for (const key of guideKeys) {
      const index = await readGuideIndex(key);
      if (index) guides.push(index);
    }
    const inScopeIds = new Set(inScope.map((a) => a.serviceId));
    const attributions = attributeGuides(services, guides, inScopeIds);
    ctx.log(`  ${guides.length} guides loaded, pages attributed across ${attributions.size} services`);
    if (unownedGuideCount > 0) {
      await recordGap({
        kind: "alias",
        subject: "guides with no owning service",
        detail: `${unownedGuideCount} capability guides were skipped because no service claimed them. Their features are missing until the guide joins to a service.`,
        suggestedStage: "stage1-universes",
      });
    }

    const allFeatures: Feature[] = [];
    const promoted: string[] = [];
    let noFeatureFound = 0;

    for (const adjudication of inScope) {
      const service = serviceById.get(adjudication.serviceId);
      if (!service) continue;

      const serviceAttributions = attributions.get(adjudication.serviceId) ?? [];

      const apiModel = await loadApiModel(adjudication.serviceId, modelNames);
      const tier = adjudication.tier === "not-security" ? "tier2" : adjudication.tier;
      const candidates = await extractFeatureCandidates({
        serviceId: adjudication.serviceId,
        tier: adjudication.tier,
        serviceNames: [service.productName, ...service.names].filter((n): n is string => Boolean(n)),
        attributions: serviceAttributions,
        ...(apiModel ? { apiModel } : {}),
      });
      const features = mergeCandidates(candidates, tier);

      if (features.length === 0) {
        noFeatureFound += 1;
        if (adjudication.tier === "tier1") {
          await recordGap({
            kind: "recall",
            subject: `features:${adjudication.serviceId}`,
            detail: `${adjudication.serviceId} is a tier 1 security service but no named feature was extracted. ${serviceAttributions.length} guides carry pages attributed to it.`,
            suggestedStage: "stage4-features",
          });
        }
        continue;
      }

      allFeatures.push(...features);

      // A candidate earns tier 2 only when a named security feature is found.
      if (adjudication.tier === "not-security" && adjudication.candidate) {
        promoted.push(adjudication.serviceId);
        await writeJson(path.join(paths.services, `${adjudication.serviceId.replace(/[/:.]/g, "__")}.json`), {
          ...adjudication,
          tier: "tier2",
          promoted: true,
          reason: `${adjudication.reason} Promoted to tier 2: ${features.length} named security features were found in its documentation.`,
        });
      }
    }

    // Historical and short-form names people search by. These only add search terms.
    const aliasSeed = { aliases: await featureAliases() };
    const featureById = new Map(allFeatures.map((f) => [f.id, f]));
    let aliasesApplied = 0;
    let aliasesUnmatched = 0;
    for (const entry of aliasSeed?.aliases ?? []) {
      const feature = featureById.get(entry.featureId);
      if (!feature) {
        aliasesUnmatched += 1;
        await recordGap({
          kind: "alias",
          subject: `feature-alias:${entry.featureId}`,
          detail: `The alias "${entry.alias}" points at ${entry.featureId}, which no longer exists. Either the feature was renamed or the seed is stale.`,
          suggestedStage: "stage4-features",
        });
        continue;
      }
      if (!feature.aliases.includes(entry.alias)) feature.aliases = [...feature.aliases, entry.alias].sort();
      aliasesApplied += 1;
    }

    // Capabilities declared by hand, each still carrying a quote from its page.
    let declared = 0;
    for (const extra of await extraFeatures()) {
      if (allFeatures.some((f) => f.id === extra.id)) continue;
      const result = await cachedFetch(extra.sourceUrl, { maxAgeMs: ctx.maxAgeMs, allowStatus: [404] });
      if (result.status === 404) continue;
      allFeatures.push({
        id: extra.id,
        serviceId: extra.serviceId,
        name: extra.name,
        aliases: [],
        kind: extra.kind as Feature["kind"],
        tier: (adjudications.find((a) => a.serviceId === extra.serviceId)?.tier ?? "tier2") as Feature["tier"],
        ...(extra.summary ? { summary: extra.summary } : {}),
        docUrls: [extra.sourceUrl],
        method: "manual",
        confidence: 1,
        discoveredBy: ["declared"],
        evidence: [makeEvidence(result, extra.quote, "declared in data/seeds/extra-features.json")],
      });
      declared += 1;
    }

    const written = new Set<string>();
    for (const feature of allFeatures) {
      const filename = `${idToFilename(feature.id)}.json`;
      written.add(filename);
      await writeJson(path.join(paths.features, filename), feature);
    }
    const pruned = await pruneDir(paths.features, written);

    await storeSyntheticBody(allFeatures.map((f) => f.id).join("\n"));

    return {
      status: "ok",
      counts: {
        scanned: inScope.length,
        features: allFeatures.length,
        servicesWithFeatures: new Set(allFeatures.map((f) => f.serviceId)).size,
        promotedToTier2: promoted.length,
        noFeatureFound,
        declaredFeatures: declared,
        aliasesApplied,
        aliasesUnmatched,
        prunedStaleRecords: pruned.length,
      },
    };
  },
};

async function loadApiModel(serviceId: string, modelNames: Set<string>) {
  const candidates = [serviceId, serviceId.replace(/-/g, ""), serviceId.replace(/\./g, "-")];
  const name = candidates.find((c) => modelNames.has(c));
  if (!name) return undefined;
  const loaded = await readLocalModel(name);
  if (!loaded) return undefined;
  const body = JSON.stringify(loaded.model, null, 1);
  const bodySha256 = await storeSyntheticBody(body);
  return {
    model: loaded.model,
    file: loaded.file,
    bodySha256,
    retrievedAt: new Date().toISOString(),
    url: `${API_MODEL_DOC}/${name}.json`,
  };
}
