import { findColumn, parseMarkdown } from "../core/markdown.js";
import type { MdList, MdTable } from "../core/markdown.js";
import { makeEvidence } from "../core/evidence.js";
import type { FetchResult } from "../core/fetch.js";
import type { CoverageStatus } from "../core/schema.js";
import type { TargetResolver, Universe } from "./resolvers.js";
import { catalogTargetId, classifyCatalog, splitCatalogCell } from "./catalog.js";

export type RawClaim = {
  axis: Universe | string;
  scope?: { axis: string; targetId: string; label?: string };
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
 * A list of names is not a statement of coverage. A page has to actually say that
 * the feature reaches these things. Without this, every "See also" list and every
 * table of contents becomes a coverage claim.
 */
const ASSERTS_COVERAGE =
  /\b(support|supported|supports|available|availability|coverage|covers?|covered|works? with|integrat|compatib|applies to|apply to|can (scan|analy[sz]e|monitor|protect|detect|evaluate|record|back up)|scans?|analy[sz]es|monitors?|protects?|detects?|evaluates?|records?|retrieves?|includes?|enabled for|eligible|not supported|unsupported|excluded|prerequisite|requirement)\b/i;

/**
 * Page kinds that never state coverage, however their tables happen to be shaped.
 * A service quota table lists resources with a "Yes" in an Adjustable column, which
 * reads exactly like a coverage matrix and is not one.
 */
const NEVER_COVERAGE =
  /\b(quotas?|limits?|pricing|price|cost|billing|troubleshoot\w*|release notes|document history|tutorial|walkthrough|getting started|what'?s new|api reference|code examples?|sample code)\b/i;

export function neverStatesCoverage(context: string): boolean {
  return NEVER_COVERAGE.test(context);
}

/** Headings whose lists are navigation, never data. */
const NAVIGATION_BLOCK = /^(topics?|contents?|see also|related( information| resources| topics)?|additional resources|more information|next steps?|in this (section|guide)|learn more)$/i;

export function assertsCoverage(context: string): boolean {
  return ASSERTS_COVERAGE.test(context);
}

export function isNavigation(context: string): boolean {
  return context
    .split(/\s*>\s*|\|/)
    .map((part) => part.trim())
    .some((part) => NAVIGATION_BLOCK.test(part));
}

/** Below this many distinct resolved targets, a list is not a coverage list. */
const MIN_DISTINCT_TARGETS = 3;

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

/**
 * AWS states what a feature does not reach as often as what it does, and those
 * statements are the most useful ones. They are phrased a dozen ways.
 */
export function statesAbsence(text: string): boolean {
  return /\b(not supported|aren'?t supported|isn'?t supported|are not available|aren'?t available|is not available|isn'?t available|not currently available|does ?n'?t support|do ?n'?t support|can'?t (be used|scan|generate)|unsupported|excluded from|no longer supported|discontinued)\b/i.test(
    text,
  );
}

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
export function extractFromTable(table: MdTable, resolver: TargetResolver, serviceId: string): ExtractionOutcome {
  const unresolved: { axis: string; raw: string }[] = [];
  if (table.rows.length < MIN_VALUES) return { claims: [], unresolved };
  const context = `${table.section.join(" > ")} | ${table.headers.join(" | ")}`;
  if (isNavigation(context) || neverStatesCoverage(context) || !assertsCoverage(context)) {
    return { claims: [], unresolved };
  }

  let best: { axis: Universe; column: number; rate: number } | undefined;
  for (let column = 0; column < table.headers.length; column += 1) {
    const values = table.rows.map((row) => row[column] ?? "").filter(Boolean);
    if (values.length < MIN_VALUES) continue;
    for (const axis of AXES) {
      const { rate } = resolver.rate(values, axis);
      if (rate >= MIN_RESOLUTION_RATE && (!best || rate > best.rate)) best = { axis, column, rate };
    }
  }
  if (!best) {
    const catalog = catalogFromTable(table, serviceId);
    if (catalog.length > 0) return { claims: catalog, unresolved };
    return { claims: [], unresolved, failure: "no column resolved to a known universe" };
  }

  // The header has to name support. "Adjustable" in a quota table also holds Yes.
  const statusColumn = findColumn(table.headers, [
    /\bsupport(ed|s)?\b/i, /\bavailab(le|ility)\b/i, /\bcovered\b/i, /\benabled\b/i, /\bapplies\b/i,
  ]);
  const qualifierColumn = findColumn(table.headers, [/note/i, /condition/i, /requirement/i, /comment/i]);

  const tableNegated = statesAbsence(table.section.join(" "));
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
      (statusColumn >= 0 && statusColumn !== best.column ? statusFrom(row[statusColumn]) : undefined) ??
      (tableNegated ? "not-covered" : "covered");
    const qualifier = qualifierColumn >= 0 ? (row[qualifierColumn] ?? "").trim() : "";
    for (const hit of hits) {
      if (seen.has(hit.targetId)) continue;
      seen.add(hit.targetId);
      claims.push({
        axis: hit.axis,
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
  return { claims: enoughTargets(claims), unresolved };
}

/** One or two names is a mention, not a coverage list. */
function enoughTargets(claims: RawClaim[]): RawClaim[] {
  const distinct = new Set(claims.map((c) => `${c.axis}|${c.targetId}`));
  return distinct.size >= MIN_DISTINCT_TARGETS ? claims : [];
}

/** A bullet list of supported things. Same resolution-rate test as a table column. */
export function extractFromList(list: MdList, resolver: TargetResolver, serviceId: string): ExtractionOutcome {
  const unresolved: { axis: string; raw: string }[] = [];
  const items = list.items.filter((item) => item.depth === 0).map((item) => item.text);
  if (items.length < MIN_VALUES) return { claims: [], unresolved };
  const context = `${list.section.join(" > ")} | ${list.intro ?? ""}`;
  if (isNavigation(context) || neverStatesCoverage(context) || !assertsCoverage(context)) {
    return { claims: [], unresolved };
  }

  let best: { axis: Universe; rate: number } | undefined;
  for (const axis of AXES) {
    const { rate } = resolver.rate(items, axis);
    if (rate >= MIN_RESOLUTION_RATE && (!best || rate > best.rate)) best = { axis, rate };
  }
  if (!best) {
    const catalog = catalogFromValues(
      list.items.filter((i) => i.depth === 0).map((i) => ({ value: i.text, quote: i.raw })),
      "md-bullet-list",
      list.section.join(" > ") || (list.intro ?? ""),
      serviceId,
      `${list.section.join(" ")} ${list.intro ?? ""}`,
      statesAbsence(`${list.intro ?? ""} ${list.section.join(" ")}`),
      list.intro,
    );
    return { claims: catalog, unresolved };
  }

  const negated = statesAbsence(`${list.intro ?? ""} ${list.section.join(" ")}`);
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
        axis: hit.axis,
        targetId: hit.targetId,
        targetLabel: hit.label,
        status: negated ? "not-covered" : "covered",
        extractorId: "md-bullet-list",
        quote: item.raw.trim(),
        locator: list.section.join(" > ") || (list.intro ?? ""),
      });
    }
  }
  return { claims: enoughTargets(claims), unresolved };
}

/** Build claims from a set of values that form a known catalog. */
export function catalogFromValues(
  values: { value: string; quote: string }[],
  extractorId: string,
  locator: string,
  serviceId: string,
  context: string,
  /** When the surrounding text says these are NOT covered. */
  negated = false,
  qualifier?: string,
): RawClaim[] {
  const expanded = values.flatMap((entry) =>
    splitCatalogCell(entry.value).map((value) => ({ value, quote: entry.quote })),
  );
  const match = classifyCatalog(expanded.map((v) => v.value), serviceId, context);
  if (!match) return [];
  const claims: RawClaim[] = [];
  const seen = new Set<string>();
  for (const entry of expanded) {
    const value = entry.value.trim();
    if (!match.shape.test.test(value)) continue;
    if (value.length > (match.shape.maxLength ?? 120)) continue;
    const targetId = catalogTargetId(match.shape.axis, value);
    if (seen.has(targetId)) continue;
    seen.add(targetId);
    claims.push({
      axis: match.shape.axis,
      targetId,
      targetLabel: value,
      status: negated ? "not-covered" : "covered",
      ...(qualifier ? { qualifier: qualifier.slice(0, 200) } : {}),
      extractorId,
      quote: entry.quote.trim(),
      locator,
    });
  }
  return claims;
}

/**
 * Some catalogs are named only in running text, marked as code. AWS WAF lists its
 * managed rule groups that way: "VendorName: `AWS`, Name: `AWSManagedRulesCommonRuleSet`".
 */
export function extractFromCodeSpans(body: string, serviceId: string): RawClaim[] {
  const lines = body.split("\n");
  const values: { value: string; quote: string }[] = [];
  for (const line of lines) {
    for (const m of line.matchAll(/`([^`\n]{3,80})`/g)) {
      values.push({ value: (m[1] ?? "").trim(), quote: line.trim() });
    }
  }
  if (values.length < 3) return [];
  return catalogFromValues(values, "md-code-span", "inline code", serviceId, body.slice(0, 4000));
}

function catalogFromTable(table: MdTable, serviceId: string): RawClaim[] {
  for (let column = 0; column < table.headers.length; column += 1) {
    const values = table.rows
      .map((row, index) => ({ value: row[column] ?? "", quote: table.rawRows[index] ?? row[column] ?? "" }))
      .filter((v) => v.value);
    const claims = catalogFromValues(
      values,
      "md-table",
      `${table.section.join(" > ")} | column "${table.headers[column] ?? column}"`,
      serviceId,
      `${table.section.join(" ")} ${table.headers[column] ?? ""}`,
      statesAbsence(table.section.join(" ")),
      table.section.at(-1),
    );
    if (claims.length > 0) return claims;
  }
  return [];
}

/** A run of headings, each naming one supported thing. */
export function extractFromHeadings(body: string, resolver: TargetResolver, serviceId: string): ExtractionOutcome {
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
    const headingContext = `${doc.title ?? ""} ${titles.slice(0, 6).join(" ")}`;
    if (neverStatesCoverage(headingContext) || !assertsCoverage(headingContext)) continue;
    let best: { axis: Universe; rate: number } | undefined;
    for (const axis of AXES) {
      const { rate } = resolver.rate(titles, axis);
      if (rate >= MIN_RESOLUTION_RATE && (!best || rate > best.rate)) best = { axis, rate };
    }
    if (!best) {
      const catalog = catalogFromValues(
        sections.map((section) => ({ value: section.title, quote: (doc.lines[section.line] ?? section.title).trim() })),
        "md-heading-series",
        `heading level ${level}`,
        serviceId,
        `${doc.title ?? ""} ${titles.slice(0, 3).join(" ")}`,
        statesAbsence(doc.title ?? ""),
      );
      claims.push(...catalog);
      continue;
    }
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
        axis: hit.axis,
        targetId: hit.targetId,
        targetLabel: hit.label,
        status: "covered",
        extractorId: "md-heading-series",
        quote: (doc.lines[section.line] ?? section.title).trim(),
        locator: `heading level ${level}`,
      });
    }
  }
  return { claims: enoughTargets(claims), unresolved };
}

export function extractFromPage(body: string, resolver: TargetResolver, serviceId: string): ExtractionOutcome {
  const doc = parseMarkdown(body);
  const claims: RawClaim[] = [];
  const unresolved: { axis: string; raw: string }[] = [];
  const failures: string[] = [];

  for (const table of doc.tables) {
    const outcome = extractFromTable(table, resolver, serviceId);
    claims.push(...outcome.claims);
    unresolved.push(...outcome.unresolved);
    if (outcome.failure) failures.push(outcome.failure);
  }
  for (const list of doc.lists) {
    const outcome = extractFromList(list, resolver, serviceId);
    claims.push(...outcome.claims);
    unresolved.push(...outcome.unresolved);
  }
  const headings = extractFromHeadings(body, resolver, serviceId);
  claims.push(...headings.claims);
  if (claims.length === 0) unresolved.push(...headings.unresolved);
  claims.push(...extractFromCodeSpans(body, serviceId));
  return {
    claims,
    unresolved,
    ...(claims.length === 0 && failures.length ? { failure: failures[0] as string } : {}),
  };
}

export function toEvidence(result: FetchResult, claim: RawClaim) {
  return makeEvidence(result, claim.quote, claim.locator);
}
