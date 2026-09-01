import { findColumn, parseMarkdown } from "../core/markdown.js";
import type { MdList, MdTable } from "../core/markdown.js";
import { makeEvidence } from "../core/evidence.js";
import type { FetchResult } from "../core/fetch.js";
import type { CoverageStatus } from "../core/schema.js";
import type { TargetResolver, Universe } from "./resolvers.js";

export type RawClaim = {
  axis: Universe;
  targetId: string;
  targetLabel: string;
  status: CoverageStatus;
  qualifier?: string;
  extractorId: string;
  quote: string;
  locator: string;
};

export type ExtractionOutcome = {
  claims: RawClaim[];
  unresolved: { axis: string; raw: string }[];
  /** Set when the page looked like a coverage page but nothing could be read. */
  failure?: string;
};

const AXES: Universe[] = ["region", "resourceType", "service", "dataSource"];

/**
 * "AWS Lambda functions and layers" names two things. The words before the
 * conjunction carry the service, so they are carried onto the second half.
 */
export function expandConjunctions(text: string): string[] {
  const match = /^(.*?)\s+and\s+(.+)$/i.exec(text.trim());
  if (!match) return [text];
  const [, head = "", tail = ""] = match;
  if (!head || !tail || /,/.test(text)) return [text];
  const words = head.split(/\s+/);
  if (words.length < 2 || tail.split(/\s+/).length > 3) return [text];
  const prefix = words.slice(0, -1).join(" ");
  return [text, head, `${prefix} ${tail}`];
}

/**
 * Resolve a value to every target it names. "AWS Lambda functions and layers" is
 * two targets, so returning only the first would drop half the coverage.
 */
function resolveValues(resolver: TargetResolver, raw: string, axis: Universe) {
  const whole = resolver.resolve(raw, axis);
  const parts = expandConjunctions(raw).slice(1);
  const fromParts: NonNullable<ReturnType<TargetResolver["resolve"]>>[] = [];
  for (const candidate of parts) {
    const hit = resolver.resolve(candidate, axis);
    if (hit && !fromParts.some((x) => x.targetId === hit.targetId)) fromParts.push(hit);
  }
  // Two distinct halves beat one whole-string match, which is usually the tail only.
  if (fromParts.length > 1) return fromParts;
  return whole ? [whole] : fromParts;
}
/** Below this share of resolvable values we do not trust a column or list. */
const MIN_RESOLUTION_RATE = 0.6;
const MIN_VALUES = 3;

const YES = /^(yes|supported|available|✓|✔|x|all|full|general availability|ga)$/i;
const NO = /^(no|not supported|unsupported|unavailable|n\/a|-|—|none)$/i;
const PARTIAL = /^(partial|limited|preview|some|conditional)$/i;

function statusFrom(value: string | undefined): CoverageStatus | undefined {
  if (value === undefined) return undefined;
  const text = value.trim();
  if (!text) return undefined;
  if (YES.test(text)) return "covered";
  if (NO.test(text)) return "not-covered";
  if (PARTIAL.test(text)) return "partial";
  return undefined;
}

/**
 * Read a table without being told what it contains. Every column is tested against
 * every universe; the column that resolves best names the targets. A table that
 * resolves poorly is left alone rather than guessed at.
 */
export function extractFromTable(table: MdTable, resolver: TargetResolver): ExtractionOutcome {
  const unresolved: { axis: string; raw: string }[] = [];
  if (table.rows.length < MIN_VALUES) return { claims: [], unresolved };

  let best: { axis: Universe; column: number; rate: number } | undefined;
  for (let column = 0; column < table.headers.length; column += 1) {
    const values = table.rows.map((row) => row[column] ?? "").filter(Boolean);
    if (values.length < MIN_VALUES) continue;
    for (const axis of AXES) {
      const { rate } = resolver.rate(values, axis);
      if (rate >= MIN_RESOLUTION_RATE && (!best || rate > best.rate)) best = { axis, column, rate };
    }
  }
  if (!best) return { claims: [], unresolved, failure: "no column resolved to a known universe" };

  const statusColumn = findColumn(table.headers, [
    /support/i, /available/i, /status/i, /covered/i, /enabled/i, /^yes/i,
  ]);
  const qualifierColumn = findColumn(table.headers, [/note/i, /condition/i, /requirement/i, /comment/i]);

  const claims: RawClaim[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < table.rows.length; index += 1) {
    const row = table.rows[index] as string[];
    const raw = row[best.column] ?? "";
    if (!raw) continue;
    const hits = resolveValues(resolver, raw, best.axis);
    if (hits.length === 0) {
      unresolved.push({ axis: best.axis, raw });
      continue;
    }
    const status =
      (statusColumn >= 0 && statusColumn !== best.column ? statusFrom(row[statusColumn]) : undefined) ?? "covered";
    const qualifier = qualifierColumn >= 0 ? (row[qualifierColumn] ?? "").trim() : "";
    for (const hit of hits) {
      if (seen.has(hit.targetId)) continue;
      seen.add(hit.targetId);
      claims.push({
        axis: best.axis,
        targetId: hit.targetId,
        targetLabel: hit.label,
        status,
        ...(qualifier ? { qualifier: qualifier.slice(0, 200) } : {}),
        extractorId: "md-table",
        quote: (table.rawRows[index] ?? raw).trim(),
        locator: `${table.section.join(" > ")} | column "${table.headers[best.column] ?? best.column}"`,
      });
    }
  }
  return { claims, unresolved };
}

/** A bullet list of supported things. Same resolution-rate test as a table column. */
export function extractFromList(list: MdList, resolver: TargetResolver): ExtractionOutcome {
  const unresolved: { axis: string; raw: string }[] = [];
  const items = list.items.filter((item) => item.depth === 0).map((item) => item.text);
  if (items.length < MIN_VALUES) return { claims: [], unresolved };

  let best: { axis: Universe; rate: number } | undefined;
  for (const axis of AXES) {
    const { rate } = resolver.rate(items, axis);
    if (rate >= MIN_RESOLUTION_RATE && (!best || rate > best.rate)) best = { axis, rate };
  }
  if (!best) return { claims: [], unresolved };

  const negated = /\bnot\b.*\b(support|available|include)/i.test(list.intro ?? "");
  const claims: RawClaim[] = [];
  const seen = new Set<string>();
  for (const item of list.items) {
    if (item.depth !== 0) continue;
    const hits = resolveValues(resolver, item.text, best.axis);
    if (hits.length === 0) {
      unresolved.push({ axis: best.axis, raw: item.text });
      continue;
    }
    for (const hit of hits) {
      if (seen.has(hit.targetId)) continue;
      seen.add(hit.targetId);
      claims.push({
        axis: best.axis,
        targetId: hit.targetId,
        targetLabel: hit.label,
        status: negated ? "not-covered" : "covered",
        extractorId: "md-bullet-list",
        quote: item.raw.trim(),
        locator: list.section.join(" > ") || (list.intro ?? ""),
      });
    }
  }
  return { claims, unresolved };
}

/** A run of headings, each naming one supported thing. */
export function extractFromHeadings(body: string, resolver: TargetResolver): ExtractionOutcome {
  const doc = parseMarkdown(body);
  const unresolved: { axis: string; raw: string }[] = [];
  const byLevel = new Map<number, { title: string; line: number }[]>();
  for (const section of doc.sections) {
    const list = byLevel.get(section.level);
    if (list) list.push({ title: section.title, line: section.startLine });
    else byLevel.set(section.level, [{ title: section.title, line: section.startLine }]);
  }
  const claims: RawClaim[] = [];
  for (const [level, sections] of byLevel) {
    const titles = sections.map((s) => s.title);
    if (titles.length < MIN_VALUES) continue;
    let best: { axis: Universe; rate: number } | undefined;
    for (const axis of AXES) {
      const { rate } = resolver.rate(titles, axis);
      if (rate >= MIN_RESOLUTION_RATE && (!best || rate > best.rate)) best = { axis, rate };
    }
    if (!best) continue;
    const seen = new Set<string>();
    for (const section of sections) {
      const hit = resolver.resolve(section.title, best.axis);
      if (!hit) {
        unresolved.push({ axis: best.axis, raw: section.title });
        continue;
      }
      if (seen.has(hit.targetId)) continue;
      seen.add(hit.targetId);
      claims.push({
        axis: best.axis,
        targetId: hit.targetId,
        targetLabel: hit.label,
        status: "covered",
        extractorId: "md-heading-series",
        quote: (doc.lines[section.line] ?? section.title).trim(),
        locator: `heading level ${level}`,
      });
    }
  }
  return { claims, unresolved };
}

export function extractFromPage(body: string, resolver: TargetResolver): ExtractionOutcome {
  const doc = parseMarkdown(body);
  const claims: RawClaim[] = [];
  const unresolved: { axis: string; raw: string }[] = [];
  const failures: string[] = [];

  for (const table of doc.tables) {
    const outcome = extractFromTable(table, resolver);
    claims.push(...outcome.claims);
    unresolved.push(...outcome.unresolved);
    if (outcome.failure) failures.push(outcome.failure);
  }
  for (const list of doc.lists) {
    const outcome = extractFromList(list, resolver);
    claims.push(...outcome.claims);
    unresolved.push(...outcome.unresolved);
  }
  if (claims.length === 0) {
    const outcome = extractFromHeadings(body, resolver);
    claims.push(...outcome.claims);
    unresolved.push(...outcome.unresolved);
  }
  return {
    claims,
    unresolved,
    ...(claims.length === 0 && failures.length ? { failure: failures[0] as string } : {}),
  };
}

export function toEvidence(result: FetchResult, claim: RawClaim) {
  return makeEvidence(result, claim.quote, claim.locator);
}
