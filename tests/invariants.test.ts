import path from "node:path";
import { describe, expect, it } from "vitest";
import { paths } from "../src/core/paths.js";
import { readAllJson, readJson } from "../src/core/store.js";
import { verifyEvidence } from "../src/core/evidence.js";
import { runRecall } from "../src/cli/recall.js";
import type { Adjudication, Feature, FeatureCoverage, Region, ResourceType, Service } from "../src/core/schema.js";

async function wrapped<T>(file: string, key: string): Promise<T[]> {
  const value = await readJson<Record<string, T[]>>(path.join(paths.universes, file));
  return (value?.[key] as T[] | undefined) ?? [];
}

const features = await readAllJson<Feature>(paths.features);
const coverage = await readAllJson<FeatureCoverage>(paths.coverage);
const adjudications = await readAllJson<Adjudication>(paths.services);
const services = await wrapped<Service>("services.json", "services");
const regions = await wrapped<Region>("regions.json", "regions");
const resourceTypes = await wrapped<ResourceType>("resource-types.json", "resourceTypes");

const hasData = features.length > 0;
const maybe = hasData ? describe : describe.skip;

maybe("universes", () => {
  it("has a plausible number of regions and partitions", () => {
    expect(regions.length).toBeGreaterThan(30);
    expect(regions.every((r) => /^[a-z]{2,4}(-[a-z]+)+-\d+$/.test(r.id))).toBe(true);
  });

  it("has no duplicate resource type ids", () => {
    const ids = resourceTypes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("records at least one source for every region and resource type", () => {
    expect(regions.every((r) => r.seenIn.length > 0)).toBe(true);
    expect(resourceTypes.every((t) => t.seenIn.length > 0)).toBe(true);
  });
});

maybe("adjudication", () => {
  it("adjudicates every service in the universe", () => {
    const decided = new Set(adjudications.map((a) => a.serviceId));
    const missing = services.filter((s) => !decided.has(s.id)).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it("gives every decision a written reason", () => {
    expect(adjudications.every((a) => a.reason.trim().length > 10)).toBe(true);
  });
});

maybe("features", () => {
  it("gives every feature at least one piece of evidence", () => {
    const bare = features.filter((f) => f.evidence.length === 0).map((f) => f.id);
    expect(bare).toEqual([]);
  });

  it("ties every feature to a service that was adjudicated", () => {
    const decided = new Set(adjudications.map((a) => a.serviceId));
    const orphans = [...new Set(features.filter((f) => !decided.has(f.serviceId)).map((f) => f.serviceId))];
    expect(orphans).toEqual([]);
  });

  it("finds every feature the recall fixture expects", async () => {
    const result = await runRecall(path.join(paths.root, "tests", "fixtures", "known-features.json"));
    expect(result.missing.map((m) => `${m.serviceId}: ${m.terms.join(" + ")}`)).toEqual([]);
  });
});

maybe("coverage claims", () => {
  const claims = coverage.flatMap((c) => c.claims);

  it("never states that something is not covered without a source saying so", () => {
    const invented = claims.filter((c) => c.status === "not-covered" && c.evidence.length === 0);
    expect(invented).toEqual([]);
  });

  it("resolves every claim target to a known universe value", () => {
    const universes: Record<string, Set<string>> = {
      region: new Set(regions.map((r) => r.id)),
      resourceType: new Set(resourceTypes.map((t) => t.id)),
      service: new Set(services.map((s) => s.id)),
    };
    const unknown = claims
      .filter((c) => universes[c.axis] && !(universes[c.axis] as Set<string>).has(c.targetId))
      .map((c) => `${c.axis}:${c.targetId}`);
    expect([...new Set(unknown)]).toEqual([]);
  });

  it("ties every claim to a feature that exists", () => {
    const ids = new Set(features.map((f) => f.id));
    const orphans = [...new Set(claims.filter((c) => !ids.has(c.featureId)).map((c) => c.featureId))];
    expect(orphans).toEqual([]);
  });

  it("quotes text that really appears in the stored source, on a sample", async () => {
    const sample = claims.filter((_, i) => i % Math.max(1, Math.floor(claims.length / 120)) === 0).slice(0, 120);
    const failures: string[] = [];
    for (const claim of sample) {
      for (const evidence of claim.evidence) {
        const check = await verifyEvidence(evidence);
        if (!check.ok) failures.push(`${claim.id}: ${check.reason}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
