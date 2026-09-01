import path from "node:path";
import { paths } from "../core/paths.js";
import { readAllJson } from "../core/store.js";
import type { CoverageClaim, FeatureCoverage } from "../core/schema.js";

/**
 * Find claims that look wrong, without being told which ones. Every rule here was
 * written because a real claim broke it: a quota table read as coverage, a status
 * taken from a column that meant something else, a target that never appears in the
 * text it cites.
 */
export type Suspicion = { rule: string; weight: number; detail: string };

const QUOTA_VOCAB = /\b(quota|limit|maximum number|default value|adjustable|per account|per region|throttl|rate limit|burst)\b/i;
const PRICING_VOCAB = /\b(price|pricing|cost|free tier|per GB|per month|billed)\b/i;
const TUTORIAL_VOCAB = /\b(step \d|walkthrough|tutorial|getting started|choose|click|select the)\b/i;
const CONSOLE_VOCAB = /\b(open the .* console|in the navigation pane|choose Save)\b/i;

export function suspicionsFor(claim: CoverageClaim): Suspicion[] {
  const out: Suspicion[] = [];
  const quotes = claim.evidence.map((e) => e.quote).join(" \n ");
  const locators = claim.evidence.map((e) => e.locator ?? "").join(" ");
  const haystack = `${quotes} ${locators}`;

  if (QUOTA_VOCAB.test(haystack)) {
    out.push({ rule: "cites a quota or limit table", weight: 3, detail: firstMatch(haystack, QUOTA_VOCAB) });
  }
  if (PRICING_VOCAB.test(haystack)) {
    out.push({ rule: "cites pricing", weight: 3, detail: firstMatch(haystack, PRICING_VOCAB) });
  }
  if (TUTORIAL_VOCAB.test(haystack) || CONSOLE_VOCAB.test(haystack)) {
    out.push({ rule: "cites a walkthrough", weight: 2, detail: firstMatch(haystack, TUTORIAL_VOCAB) });
  }

  // The words the claim is about should appear in the text it cites.
  const label = (claim.targetLabel ?? "").toLowerCase();
  if (label) {
    const words = label.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3);
    const present = words.filter((w) => quotes.toLowerCase().includes(w));
    if (words.length >= 2 && present.length / words.length < 0.5) {
      out.push({ rule: "the target is not named in the quote", weight: 3, detail: label.slice(0, 60) });
    }
  }
  if (claim.evidence.length === 0) {
    out.push({ rule: "no evidence at all", weight: 5, detail: claim.id });
  }
  return out;
}

function firstMatch(text: string, pattern: RegExp): string {
  return pattern.exec(text)?.[0] ?? "";
}

export type AuditReport = {
  claims: number;
  suspect: number;
  byRule: Record<string, number>;
  worst: { featureId: string; axis: string; targetId: string; score: number; rules: string[]; quote: string }[];
  byFeature: { featureId: string; suspect: number; total: number }[];
};

export async function audit(): Promise<AuditReport> {
  const coverage = await readAllJson<FeatureCoverage>(paths.coverage);
  const byRule: Record<string, number> = {};
  const worst: AuditReport["worst"] = [];
  const perFeature = new Map<string, { suspect: number; total: number }>();
  let claims = 0;
  let suspect = 0;

  for (const record of coverage) {
    for (const claim of record.claims) {
      claims += 1;
      const counter = perFeature.get(record.featureId) ?? { suspect: 0, total: 0 };
      counter.total += 1;
      const found = suspicionsFor(claim);
      if (found.length > 0) {
        suspect += 1;
        counter.suspect += 1;
        for (const s of found) byRule[s.rule] = (byRule[s.rule] ?? 0) + 1;
        worst.push({
          featureId: record.featureId,
          axis: claim.axis,
          targetId: claim.targetId,
          score: found.reduce((sum, s) => sum + s.weight, 0),
          rules: found.map((s) => s.rule),
          quote: (claim.evidence[0]?.quote ?? "").slice(0, 110),
        });
      }
      perFeature.set(record.featureId, counter);
    }
  }

  worst.sort((a, b) => b.score - a.score);
  const byFeature = [...perFeature.entries()]
    .map(([featureId, v]) => ({ featureId, ...v }))
    .filter((f) => f.suspect > 0)
    .sort((a, b) => b.suspect - a.suspect);

  return { claims, suspect, byRule, worst: worst.slice(0, 40), byFeature: byFeature.slice(0, 30) };
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const report = await audit();
  console.log(`${report.suspect} of ${report.claims} claims look wrong (${((report.suspect / report.claims) * 100).toFixed(1)}%)\n`);
  console.log("by rule:");
  for (const [rule, count] of Object.entries(report.byRule).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(6)}  ${rule}`);
  }
  console.log("\nworst features:");
  for (const f of report.byFeature.slice(0, 15)) {
    console.log(`  ${String(f.suspect).padStart(5)}/${String(f.total).padEnd(5)} ${f.featureId}`);
  }
  console.log("\nexamples:");
  for (const w of report.worst.slice(0, 12)) {
    console.log(`  [${w.rules.join(", ")}]\n    ${w.featureId} ${w.axis}:${w.targetId}\n    ${w.quote}`);
  }
}
