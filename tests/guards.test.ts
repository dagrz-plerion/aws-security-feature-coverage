import { describe, expect, it } from "vitest";

/**
 * The rule that catches a row named after the parent of the one thing it measures.
 *
 * This is the shape that got past me three times: 92 services that support
 * kms:ViaService were filed under a feature called "Condition keys", so the map read
 * "KMS condition keys reach 92 of 526 services" — something the page never says.
 * The same shape hid six IAM capabilities inside one row.
 *
 * The rule is reproduced here against synthetic data, so a change that stops it
 * detecting the defect fails immediately rather than silently.
 */
type Claim = { axis: string; scope?: { axis: string; targetId: string } };

export function scopeCollapse(
  records: { featureId: string; claims: Claim[] }[],
  kinds: Record<string, { kind: string }>,
): string[] {
  const out: string[] = [];
  for (const record of records) {
    const byAxis = new Map<string, Set<string>>();
    for (const claim of record.claims) {
      if (!claim.scope) continue;
      const key = `${claim.axis}|${claim.scope.axis}`;
      const set = byAxis.get(key) ?? new Set<string>();
      set.add(claim.scope.targetId);
      byAxis.set(key, set);
    }
    for (const [key, scopes] of byAxis) {
      const [axis, scopeAxis] = key.split("|");
      if (scopes.size !== 1) continue;
      if (kinds[scopeAxis as string]?.kind !== "catalogue") continue;
      const total = record.claims.filter((c) => c.axis === axis).length;
      const scoped = record.claims.filter((c) => c.axis === axis && c.scope).length;
      if (scoped !== total) continue;
      out.push(`${record.featureId}: every ${axis} claim is scoped to ${scopeAxis} "${[...scopes][0]}"`);
    }
  }
  return out;
}

const KINDS = { conditionKey: { kind: "catalogue" }, region: { kind: "external" }, service: { kind: "external" } };

describe("a row named after the parent of what it measures", () => {
  it("catches the KMS shape: every service scoped to one condition key", () => {
    const broken = [{
      featureId: "kms/condition-keys",
      claims: Array.from({ length: 92 }, (_, i) => ({
        axis: "service",
        scope: { axis: "conditionKey", targetId: "kms:ViaService" },
        _i: i,
      })),
    }];
    expect(scopeCollapse(broken, KINDS)).toHaveLength(1);
    expect(scopeCollapse(broken, KINDS)[0]).toContain("kms:ViaService");
  });

  it("accepts the fixed shape: the condition key is its own feature", () => {
    const fixed = [{
      featureId: "kms/kms-viaservice-condition-key",
      claims: Array.from({ length: 92 }, () => ({ axis: "service" })),
    }];
    expect(scopeCollapse(fixed, KINDS)).toEqual([]);
  });

  it("leaves a genuine scope alone: many Regions is a real second dimension", () => {
    const scoped = [{
      featureId: "config/aws-config-rules",
      claims: [
        { axis: "configRule", scope: { axis: "region", targetId: "us-east-1" } },
        { axis: "configRule", scope: { axis: "region", targetId: "eu-west-1" } },
      ],
    }];
    expect(scopeCollapse(scoped, KINDS)).toEqual([]);
  });

  it("leaves a single external scope alone: that is a qualifier, not a mis-naming", () => {
    const one = [{
      featureId: "inspector2/automated-scans",
      claims: [{ axis: "operatingSystem", scope: { axis: "region", targetId: "us-east-1" } }],
    }];
    expect(scopeCollapse(one, KINDS)).toEqual([]);
  });
});
