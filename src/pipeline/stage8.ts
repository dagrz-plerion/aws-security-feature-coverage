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
