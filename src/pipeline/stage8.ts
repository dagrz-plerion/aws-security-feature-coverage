import path from "node:path";
import { paths } from "../core/paths.js";
import { readAllJson, readJson } from "../core/store.js";
import { recordGap } from "../core/ops.js";
import { axisSynonyms } from "../core/seeds.js";
import type { Stage, StageResult } from "../core/runner.js";
import type { FeatureCoverage } from "../core/schema.js";

/**
 * What an independent reader said each page should produce.
 *
 * These are written by an agent that is shown the AWS page and nothing else — no
 * recipe, no output, no prior decision to defend. Storing the answer turns a one-off
 * review into a standing expectation: if a later change makes a page produce
 * something different, the run says so.
 *
 * Every other check in this pipeline tests internal consistency — a quote matches its
 * source, a target exists in a universe, a count fits its denominator. None of them
 * can tell that a correctly parsed quota table is not coverage. Only an expectation
 * written by someone who never saw the code can.
 */
export type Expectation = {
  url: string;
  pageTitle: string;
  whatThePageStates: string;
  recordedAt: string;
  features: {
    featureName: string;
    axis: string;
    axisKind: "external" | "catalogue";
    expectedCount: number;
    /**
     * How many distinct universe members those rows name, when the two differ.
     * The IAM services table has 440 rows but names 326 services: Billing alone gets
     * nine rows. The rows are the page's granularity; the claims are the universe's.
     * Comparing one against the other reports a drift that is really a unit mismatch,
     * so when this is set it is what gets compared, and `collapse` says why.
     */
    distinctTargets?: number;
    collapse?: string;
    statuses: string;
    scope?: string;
    reasoning: string;
    /** Why this expectation is deliberately not met. Waiving is a decision, recorded. */
    waived?: string;
  }[];
  shouldNotExtract: string;
  /**
   * Axes we publish from this page that the reader did not list, each with a reason.
   * Two things land here. Sometimes the reader saw the values and filed them as a
   * scope rather than an axis. Sometimes the reader was simply wrong — the KMS
   * conditions page states "The following table lists AWS services that ... support
   * the use of the kms:ViaService condition key" and the reader concluded the page
   * gives nothing for services. An exception recorded with its evidence is reviewable;
   * a check quietly relaxed is not.
   */
  alsoPublished?: { axis: string; count: number; reason: string }[];
  coverageDimensions?: string;
  trap?: string;
};

/** How far a count may drift from the independent reading before it is a defect. */
const TOLERANCE = 0.15;

export async function checkExpectations(): Promise<{ ok: string[]; drift: string[]; unmet: string[] }> {
  // The reader names an axis in the page's words, we name it in the map's. Where the
  // two denote the same set of things, say so once rather than pretending a naming
  // difference is missing data.
  const synonyms = await axisSynonyms();
  const canonical = (axis: string): string => synonyms[axis] ?? axis;
  const expectations = await readAllJson<Expectation>(paths.expectations);
  const coverage = await readAllJson<FeatureCoverage>(paths.coverage);

  const byUrl = new Map<string, { axis: string; count: number }[]>();
  for (const record of coverage) {
    for (const claim of record.claims) {
      const url = claim.evidence[0]?.sourceUrl;
      if (!url) continue;
      const list = byUrl.get(url) ?? [];
      list.push({ axis: claim.axis, count: 1 });
      // A scope is an axis too. The Regions on the Security Hub exclusions page are
      // carried as the scope of each control, and not counting them read as missing.
      if (claim.scope) list.push({ axis: claim.scope.axis, count: 1 });
      byUrl.set(url, list);
    }
  }

  const ok: string[] = [];
  const drift: string[] = [];
  const unmet: string[] = [];

  for (const expectation of expectations) {
    const claims = byUrl.get(expectation.url) ?? [];
    const actualByAxis = new Map<string, number>();
    const distinctByAxis = new Map<string, Set<string>>();
    for (const claim of coverage.flatMap((r) => r.claims)) {
      // Any evidence item, not just the first. The Cognito exclusion is stated on both
      // fraud-control pages; the dedupe keeps one claim carrying both quotes, and
      // testing only evidence[0] credited it to whichever page happened to sort first,
      // so the other page read as missing a claim it plainly states.
      if (!claim.evidence.some((e) => e.sourceUrl === expectation.url)) continue;
      const add = (axis: string, target: string): void => {
        const set = distinctByAxis.get(canonical(axis)) ?? new Set<string>();
        set.add(target);
        distinctByAxis.set(canonical(axis), set);
      };
      add(claim.axis, claim.targetId);
      if (claim.scope) add(claim.scope.axis, claim.scope.targetId);
    }
    for (const [axis, set] of distinctByAxis) actualByAxis.set(axis, set.size);

    // How many of OUR features carry claims from this page, per axis. Comparing only
    // pooled target counts let one row satisfy several expectations: the Directory
    // Service Regions page states seven separate availability lists on the region
    // axis, we published one merged row of 38, and all seven passed against that
    // single number. Two features stated on one axis need two features published.
    const featuresByAxis = new Map<string, Set<string>>();
    for (const record of coverage) {
      for (const claim of record.claims) {
        if (!claim.evidence.some((e) => e.sourceUrl === expectation.url)) continue;
        const key = canonical(claim.axis);
        const set = featuresByAxis.get(key) ?? new Set<string>();
        set.add(record.featureId);
        featuresByAxis.set(key, set);
      }
    }

    // A page the independent reader found no coverage on must produce no coverage.
    // The Firewall Manager chapter stub is a Topics navigation list, and we were
    // publishing its eight links as eight supported policy types — the reader named
    // that exact trap before seeing our output. Reading nothing is the correct result
    // for such a page, and this makes it enforceable rather than a matter of taste.
    if (!expectation.features.length) {
      const sourced = coverage
        .flatMap((r) => r.claims)
        .filter((c) => c.evidence.some((e) => e.sourceUrl === expectation.url));
      const label = `${expectation.url.split("/").pop()} :: states no coverage`;
      if (sourced.length) {
        drift.push(`${label}: the page states none, we take ${sourced.length} (${[...new Set(sourced.map((c) => c.axis))].join(", ")})`);
      } else {
        ok.push(label);
      }
      continue;
    }

    // An axis the independent reader never named on this page is one we invented.
    // The Identity Center OIDC page lists which service each access scope belongs to,
    // and we published that column as "five of 526 services support SAML and OAuth
    // applications" — a claim the reader explicitly called a per-scope qualifier
    // rather than coverage. The reader names every axis a page states; anything else
    // coming off that page is ours, not the page's.
    const named = new Set(expectation.features.map((f) => canonical(f.axis)));
    for (const extra of expectation.alsoPublished ?? []) named.add(canonical(extra.axis));
    // Only the axis a claim is ABOUT. A scope is the second dimension of a claim the
    // reader already accounted for — CloudHSM's x86 and arm, Inspector's scan
    // methods — and readers describe those in prose rather than as an axis of their
    // own, so counting them here fires on every scoped page.
    const primary = new Map<string, Set<string>>();
    for (const record of coverage) {
      for (const claim of record.claims) {
        if (!claim.evidence.some((e) => e.sourceUrl === expectation.url)) continue;
        const key = canonical(claim.axis);
        const set = primary.get(key) ?? new Set<string>();
        set.add(claim.targetId);
        primary.set(key, set);
      }
    }
    for (const [axis, targets] of primary) {
      if (named.has(axis)) continue;
      drift.push(
        `${expectation.url.split("/").pop()} :: we publish ${targets.size} ${axis} values the page was not read as stating`,
      );
    }

    const liveByAxis = new Map<string, number>();
    for (const wanted of expectation.features) {
      if (wanted.waived) continue;
      const key = canonical(wanted.axis);
      liveByAxis.set(key, (liveByAxis.get(key) ?? 0) + 1);
    }
    for (const [axis, wantedCount] of liveByAxis) {
      if (wantedCount < 2) continue;
      const published = featuresByAxis.get(axis)?.size ?? 0;
      if (published >= wantedCount) continue;
      drift.push(
        `${expectation.url.split("/").pop()} :: ${wantedCount} separate features on the ${axis} axis, we publish ${published} row${published === 1 ? "" : "s"} — one row cannot state ${wantedCount} different availabilities`,
      );
    }

    for (const wanted of expectation.features) {
      if (wanted.waived) continue;
      const actual = actualByAxis.get(canonical(wanted.axis)) ?? 0;
      const target = wanted.distinctTargets ?? wanted.expectedCount;
      const short = target > 0 && actual < target * (1 - TOLERANCE);
      const absent = actual === 0;
      const label = `${expectation.url.split("/").pop()} :: ${wanted.featureName} (${wanted.axis})`;
      const stated =
        wanted.distinctTargets === undefined
          ? `${wanted.expectedCount}`
          : `${wanted.expectedCount} rows naming ${wanted.distinctTargets} ${wanted.axis} values`;
      if (absent) unmet.push(`${label}: the page states ${stated}, we take none`);
      else if (short) drift.push(`${label}: the page states ${stated}, we take ${actual}`);
      else ok.push(label);
    }
  }
  return { ok, drift, unmet };
}

export const stage8: Stage = {
  id: "stage8-expectations",
  title: "Hold every page to what an independent reader said it should produce",
  async run(ctx): Promise<StageResult> {
    const { ok, drift, unmet } = await checkExpectations();
    if (ok.length + drift.length + unmet.length === 0) {
      ctx.log("  no expectations recorded yet — run the blind audit to write them");
      return { status: "skipped", counts: { expectations: 0 } };
    }
    for (const line of [...unmet, ...drift]) ctx.log(`  ✗ ${line}`);
    for (const line of [...unmet, ...drift]) {
      await recordGap({
        kind: "recall",
        subject: "expectation not met",
        detail: line,
        suggestedStage: "stage5-coverage",
      });
    }
    return {
      status: unmet.length > 0 ? "failed" : drift.length > 0 ? "partial" : "ok",
      counts: { met: ok.length, drifted: drift.length, unmet: unmet.length },
      ...(unmet.length || drift.length ? { notes: [...unmet, ...drift].slice(0, 20) } : {}),
    };
  },
};

void readJson;
void path;
