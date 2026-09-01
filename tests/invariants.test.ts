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

maybe("open axes", () => {
  it("keeps every catalog member in the shape its axis expects", async () => {
    const open = await readJson<{ axes: { axis: string; members: string[] }[] }>(
      path.join(paths.universes, "open-axes.json"),
    );
    const shapes: Record<string, RegExp> = {
      findingType: /^[A-Z][A-Za-z]*:[A-Za-z0-9]+\/.+$/,
      control: /^[A-Z][A-Za-z0-9]{1,20}\.\d{1,3}$/,
      configRule: /^[a-z][a-z0-9]*(-[a-z0-9]+){2,}$/,
      dataIdentifier: /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/,
      // AWS publishes both the code name and the prose name for a rule group.
      managedRuleGroup: /^(AWSManagedRules[A-Za-z0-9]+|[A-Za-z][A-Za-z0-9 ]+managed rule group)$/i,
    };
    const bad: string[] = [];
    for (const axis of open?.axes ?? []) {
      const shape = shapes[axis.axis];
      if (!shape) continue;
      for (const member of axis.members) if (!shape.test(member)) bad.push(`${axis.axis}: ${member}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it("never counts more distinct targets than the axis has members", async () => {
    const open = await readJson<{ axes: { axis: string; members: string[] }[] }>(
      path.join(paths.universes, "open-axes.json"),
    );
    const sizes = new Map((open?.axes ?? []).map((a) => [a.axis, a.members.length]));
    const over: string[] = [];
    for (const record of coverage) {
      const byAxis = new Map<string, Set<string>>();
      for (const claim of record.claims) {
        const set = byAxis.get(claim.axis) ?? new Set<string>();
        set.add(claim.targetId);
        byAxis.set(claim.axis, set);
      }
      for (const [axis, targets] of byAxis) {
        const size = sizes.get(axis);
        if (size !== undefined && targets.size > size) over.push(`${record.featureId} ${axis}: ${targets.size} > ${size}`);
      }
    }
    expect(over).toEqual([]);
  });
});

maybe("pages a person chose", () => {
  it("still reads the pages that carry a recipe", async () => {
    const dir = path.join(paths.data, "coverage-pages");
    const withRecipes: { url: string; status?: string; detail?: string }[] = [];
    for (const name of await import("node:fs/promises").then((fs) => fs.readdir(dir))) {
      if (!name.endsWith(".json")) continue;
      const file = await readJson<{ pages: { url: string; recipes?: unknown[]; lastResult?: { status: string; detail?: string } }[] }>(
        path.join(dir, name),
      );
      for (const page of file?.pages ?? []) {
        if (page.recipes?.length) {
          withRecipes.push({ url: page.url, status: page.lastResult?.status, detail: page.lastResult?.detail });
        }
      }
    }
    expect(withRecipes.length).toBeGreaterThan(0);
    const broken = withRecipes.filter((p) => p.status !== "ok").map((p) => `${p.url}: ${p.detail ?? p.status}`);
    expect(broken).toEqual([]);
  });
});
