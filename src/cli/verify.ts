import path from "node:path";
import { paths } from "../core/paths.js";
import { readAllJson, readJson, writeJson } from "../core/store.js";
import { cachedFetch } from "../core/fetch.js";
import { quoteAppearsIn } from "../core/evidence.js";
import { parseMarkdown } from "../core/markdown.js";
import { assertsCoverage, isNavigation } from "../coverage/extractors.js";
import { stripBoilerplate } from "../coverage/recipe.js";
import { loadRegistry, saveRegistry } from "../coverage/registry.js";
import type { FeatureCoverage } from "../core/schema.js";

/**
 * Check every coverage row against the page it came from.
 *
 * Three questions, asked of each page:
 *   1. Does every quote still appear on the live page?
 *   2. Does the target the claim names appear in the quote it cites?
 *   3. How much of the page did we read? A page offering 49 candidates that yielded
 *      13 claims is the shape of a silent parsing failure, and that is exactly how
 *      CloudTrail's network activity events came out at zero.
 *
 * The third answer is stored on the page as `verified.readRatio`, so the next run has
 * a number to drift from. Any new page gets the same treatment automatically.
 */
export type PageVerdict = {
  url: string;
  featureIds: string[];
  claims: number;
  candidates: number;
  readRatio: number;
  quotesChecked: number;
  quotesMissing: number;
  labelsNotInQuote: number;
  verdict: "ok" | "partial-read" | "stale-quotes" | "empty";
  note?: string;
};

/** Values on the page that a coverage reader could plausibly have taken. */
export function countCandidates(body: string): number {
  const doc = parseMarkdown(stripBoilerplate(body));
  let n = 0;
  for (const list of doc.lists) {
    const context = `${list.section.join(" > ")} | ${list.intro ?? ""}`;
    if (isNavigation(context) || !assertsCoverage(context)) continue;
    const items = list.items.filter((i) => i.depth === 0);
    // A list of anchors is the page's own table of contents under another name.
    const anchorsOnly = items.length > 0 && items.every((i) => i.links.every((l) => l.href.startsWith("#")));
    if (anchorsOnly) continue;
    n += items.length;
  }
  for (const table of doc.tables) {
    const context = `${table.section.join(" > ")} | ${table.headers.join(" | ")}`;
    if (isNavigation(context) || !assertsCoverage(context)) continue;
    n += table.rows.length;
  }
  return n;
}

const LOW_READ = 0.5;

export async function verify(maxAgeMs = 24 * 3600_000): Promise<PageVerdict[]> {
  const coverage = await readAllJson<FeatureCoverage>(paths.coverage);
  const byUrl = new Map<string, { featureIds: Set<string>; claims: FeatureCoverage["claims"] }>();
  for (const record of coverage) {
    for (const claim of record.claims) {
      const url = claim.evidence[0]?.sourceUrl;
      if (!url) continue;
      const entry = byUrl.get(url) ?? { featureIds: new Set<string>(), claims: [] };
      entry.featureIds.add(record.featureId);
      entry.claims.push(claim);
      byUrl.set(url, entry);
    }
  }

  const registry = await loadRegistry();
  const verdicts: PageVerdict[] = [];

  for (const [url, entry] of byUrl) {
    let body = "";
    try {
      body = (await cachedFetch(url, { maxAgeMs, allowStatus: [404] })).body;
    } catch {
      /* checked below */
    }
    const candidates = countCandidates(body);
    // A scoped claim is one statement per (target, scope) pair, and a page listing
    // 828 rules under 38 Region headings offers 21,391 of them. Counting only distinct
    // targets there would read as a 4% failure when the page was read in full.
    const distinct = new Set(entry.claims.map((c) => `${c.targetId}|${c.scope?.targetId ?? ""}`)).size;
    const readRatio = candidates > 0 ? Math.min(1, distinct / candidates) : 1;

    const sample = entry.claims.filter((_, i) => i % Math.max(1, Math.floor(entry.claims.length / 25)) === 0).slice(0, 25);
    let missing = 0;
    let labelMiss = 0;
    for (const claim of sample) {
      const quote = claim.evidence[0]?.quote ?? "";
      if (!body || !quoteAppearsIn(body, quote)) missing += 1;
      const label = (claim.targetLabel ?? "").toLowerCase();
      const words = label.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3);
      if (words.length >= 2 && !words.some((w) => quote.toLowerCase().includes(w))) labelMiss += 1;
    }

    const verdict: PageVerdict["verdict"] =
      distinct === 0 ? "empty" : missing > 0 ? "stale-quotes" : readRatio < LOW_READ ? "partial-read" : "ok";

    verdicts.push({
      url,
      featureIds: [...entry.featureIds].sort(),
      claims: entry.claims.length,
      candidates,
      readRatio: Number(readRatio.toFixed(2)),
      quotesChecked: sample.length,
      quotesMissing: missing,
      labelsNotInQuote: labelMiss,
      verdict,
      ...(verdict === "partial-read"
        ? { note: `read ${distinct} of about ${candidates} candidate values on the page` }
        : {}),
    });

    for (const pages of registry.values()) {
      const page = pages.get(url);
      if (page) {
        page.verified = {
          at: new Date().toISOString(),
          distinctTargets: distinct,
          candidates,
          readRatio: Number(readRatio.toFixed(2)),
          verdict,
        };
      }
    }
  }

  await saveRegistry(registry);
  verdicts.sort((a, b) => a.readRatio - b.readRatio);
  await writeJson(path.join(paths.state, "verification.json"), {
    generatedAt: new Date().toISOString(),
    pages: verdicts.length,
    problems: verdicts.filter((v) => v.verdict !== "ok").length,
    verdicts,
  });
  return verdicts;
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const verdicts = await verify();
  const bad = verdicts.filter((v) => v.verdict !== "ok");
  console.log(`${verdicts.length} pages checked, ${bad.length} with a problem\n`);
  for (const v of bad) {
    console.log(`${v.verdict.padEnd(13)} ${String(v.claims).padStart(6)} claims / ~${String(v.candidates).padEnd(5)} candidates  ratio ${v.readRatio}`);
    console.log(`   ${v.url.replace("https://docs.aws.amazon.com/", "")}`);
    console.log(`   -> ${v.featureIds.join(", ")}`);
    if (v.quotesMissing) console.log(`   ${v.quotesMissing} of ${v.quotesChecked} sampled quotes no longer appear on the page`);
  }
  const ok = verdicts.length - bad.length;
  console.log(`\n${ok} pages verified clean.`);
}
void readJson;
