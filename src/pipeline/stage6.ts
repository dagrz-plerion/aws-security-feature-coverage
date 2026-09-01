import path from "node:path";
import { paths } from "../core/paths.js";
import { readAllJson, readJson } from "../core/store.js";
import { verifyEvidence } from "../core/evidence.js";
import { recordGap } from "../core/ops.js";
import { runRecall } from "../cli/recall.js";
import type { Stage, StageResult } from "../core/runner.js";
import type {
  Adjudication, CoverageClaim, DataSource, Feature, FeatureCoverage,
  Region, ResourceType, Service,
} from "../core/schema.js";

async function wrapped<T>(file: string, key: string): Promise<T[]> {
  const value = await readJson<Record<string, T[]>>(path.join(paths.universes, file));
  return (value?.[key] as T[] | undefined) ?? [];
}

export type Violation = { rule: string; detail: string };

/**
 * Every rule the dataset must obey, checked on the real data at the end of a run.
 * The same rules run under vitest; here they run as part of the pipeline so a bad
 * run reports itself instead of being published.
 */
export async function validate(sampleSize = 250): Promise<{ violations: Violation[]; counts: Record<string, number> }> {
  const violations: Violation[] = [];
  const add = (rule: string, details: string[]): void => {
    for (const detail of details.slice(0, 8)) violations.push({ rule, detail });
    if (details.length > 8) violations.push({ rule, detail: `…and ${details.length - 8} more` });
  };

  const services = await wrapped<Service>("services.json", "services");
  const regions = await wrapped<Region>("regions.json", "regions");
  const resourceTypes = await wrapped<ResourceType>("resource-types.json", "resourceTypes");
  const dataSources = await wrapped<DataSource>("data-sources.json", "dataSources");
  const openAxes =
    (await readJson<{ axes: { axis: string; members: string[] }[] }>(path.join(paths.universes, "open-axes.json")))
      ?.axes ?? [];
  const features = await readAllJson<Feature>(paths.features);
  const coverage = await readAllJson<FeatureCoverage>(paths.coverage);
  const adjudications = await readAllJson<Adjudication>(paths.services);
  const claims: CoverageClaim[] = coverage.flatMap((c) => c.claims);

  const decided = new Set(adjudications.map((a) => a.serviceId));
  add("every service is adjudicated", services.filter((s) => !decided.has(s.id)).map((s) => s.id));
  add("every decision states a reason", adjudications.filter((a) => a.reason.trim().length < 10).map((a) => a.serviceId));
  add("every feature carries evidence", features.filter((f) => f.evidence.length === 0).map((f) => f.id));

  // A service cannot run in a Region that does not exist. FIPS endpoint keys read
  // like Region codes and made services appear to span more Regions than there are.
  const regionIds = new Set(regions.map((r) => r.id));
  add(
    "every Region a service claims exists",
    [...new Set(services.flatMap((s) => s.regions.filter((r) => !regionIds.has(r)).map((r) => `${s.id}: ${r}`)))],
  );

  const featureIds = new Set(features.map((f) => f.id));
  add("every claim belongs to a feature", [...new Set(claims.filter((c) => !featureIds.has(c.featureId)).map((c) => c.featureId))]);
  add("no claim is stated without evidence", claims.filter((c) => c.evidence.length === 0).map((c) => c.id));

  const universe: Record<string, Set<string>> = {
    region: new Set(regions.map((r) => r.id)),
    resourceType: new Set(resourceTypes.map((t) => t.id)),
    service: new Set(services.map((s) => s.id)),
    dataSource: new Set(dataSources.map((d) => d.id)),
  };
  for (const axis of openAxes) universe[axis.axis] = new Set(axis.members);
  add(
    "every target exists in its axis universe",
    [...new Set(
      claims
        .filter((c) => universe[c.axis] && !(universe[c.axis] as Set<string>).has(c.targetId))
        .map((c) => `${c.axis}:${c.targetId}`),
    )],
  );
  // Counted per distinct target, not per claim: one control excluded in forty Regions
  // is forty statements about one control.
  add(
    "no feature covers more distinct targets than its axis holds",
    coverage.flatMap((record) => {
      const byAxis = new Map<string, Set<string>>();
      for (const claim of record.claims) {
        const set = byAxis.get(claim.axis) ?? new Set<string>();
        set.add(claim.targetId);
        byAxis.set(claim.axis, set);
      }
      return [...byAxis.entries()]
        .filter(([axis, targets]) => universe[axis] && targets.size > (universe[axis] as Set<string>).size)
        .map(([axis, targets]) => `${record.featureId} ${axis}: ${targets.size} > ${(universe[axis] as Set<string>).size}`);
    }),
  );

  add(
    "every scoped claim names a target in the scope axis",
    [...new Set(
      claims
        .filter((c) => c.scope && universe[c.scope.axis] && !(universe[c.scope.axis] as Set<string>).has(c.scope.targetId))
        .map((c) => `${c.scope?.axis}:${c.scope?.targetId}`),
    )],
  );

  // Quotes are the whole basis of the map, so a sample is re-checked every run.
  const step = Math.max(1, Math.floor(claims.length / sampleSize));
  const sampled = claims.filter((_, i) => i % step === 0).slice(0, sampleSize);
  const quoteFailures: string[] = [];
  for (const claim of sampled) {
    for (const evidence of claim.evidence) {
      const check = await verifyEvidence(evidence);
      if (!check.ok) quoteFailures.push(`${claim.id}: ${check.reason}`);
    }
  }
  add("every quote still appears in its source", quoteFailures);

  const recall = await runRecall(path.join(paths.root, "tests", "fixtures", "known-features.json"));
  add("the map contains every feature the fixture names", recall.missing.map((m) => `${m.serviceId}: ${m.terms.join(" + ")}`));

  return {
    violations,
    counts: {
      services: services.length,
      features: features.length,
      claims: claims.length,
      quotesChecked: sampled.length,
      recallFound: recall.found,
      recallTotal: recall.total,
      violations: violations.length,
    },
  };
}

export const stage6: Stage = {
  id: "stage6-validate",
  title: "Check every rule the dataset must obey",
  async run(ctx): Promise<StageResult> {
    const { violations, counts } = await validate();
    for (const violation of violations.slice(0, 20)) ctx.log(`  ✗ ${violation.rule}: ${violation.detail}`);
    if (violations.length > 0) {
      await recordGap({
        kind: "recall",
        subject: "validation violations",
        detail: `${violations.length} rules were broken in the last run, starting with "${violations[0]?.rule}".`,
        suggestedStage: "stage6-validate",
      });
    }
    return {
      status: violations.length > 0 ? "failed" : "ok",
      counts,
      ...(violations.length ? { notes: violations.slice(0, 20).map((v) => `${v.rule}: ${v.detail}`) } : {}),
    };
  },
};
