/**
 * The two rules about what a row is allowed to say.
 *
 * They live here, not inline in stage6, so the tests exercise the code that runs
 * rather than a copy of it. Both take plain data.
 */
export type RuleClaim = {
  axis: string;
  targetId: string;
  scope?: { axis: string; targetId: string };
};
export type RuleRecord = { featureId: string; claims: RuleClaim[] };
export type AxisKinds = Record<string, { kind: string } | undefined>;

/**
 * A row named after the parent of the one thing it measures.
 *
 * 92 services that support kms:ViaService were filed under a feature called
 * "Condition keys", so the map read "KMS condition keys reach 92 of 526 services" —
 * something the page never says. The same shape hid six IAM capabilities in one row.
 * If every claim on an axis is scoped to a single catalogue member, that member is
 * the feature.
 */
export function scopeCollapse(records: RuleRecord[], kinds: AxisKinds): string[] {
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
      const [axis, scopeAxis] = key.split("|") as [string, string];
      if (scopes.size !== 1) continue;
      if (kinds[scopeAxis]?.kind !== "catalogue") continue;
      const total = record.claims.filter((c) => c.axis === axis).length;
      const scoped = record.claims.filter((c) => c.axis === axis && c.scope).length;
      if (scoped !== total) continue;
      out.push(
        `${record.featureId}: every ${axis} claim is scoped to ${scopeAxis} "${[...scopes][0]}" — that is the feature, not this one`,
      );
    }
  }
  return out;
}

/**
 * A coverage-shaped number on a catalogue.
 *
 * "522 of 589 controls are unavailable somewhere" is a claim about 589 individual
 * controls, and stating it honestly needs 589 rows. We do not want 589 rows, so we do
 * not make the claim. The page still earns its keep the other way round: the Regions
 * it maps become Region coverage for the one feature that owns the catalogue, which
 * is what the scope-coverage recipe does.
 */
export const MEASURED_CATALOGUE_LIMIT = 20;

export function measuredCatalogue(records: RuleRecord[], kinds: AxisKinds): string[] {
  const out: string[] = [];
  for (const record of records) {
    const members = new Map<string, Set<string>>();
    for (const claim of record.claims) {
      if (!claim.scope) continue;
      if (kinds[claim.axis]?.kind !== "catalogue") continue;
      const set = members.get(claim.axis) ?? new Set<string>();
      set.add(claim.targetId);
      members.set(claim.axis, set);
    }
    for (const [axis, set] of members) {
      if (set.size < MEASURED_CATALOGUE_LIMIT) continue;
      out.push(
        `${record.featureId}: ${set.size} ${axis} members carry per-member coverage — count the catalogue and measure its scope instead`,
      );
    }
  }
  return out;
}
