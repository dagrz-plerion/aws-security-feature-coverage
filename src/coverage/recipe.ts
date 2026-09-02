import { findColumn, parseMarkdown } from "../core/markdown.js";
import type { MdDocument } from "../core/markdown.js";
import { catalogTargetId } from "./catalog.js";
import type { RawClaim } from "./extractors.js";
import type { TargetResolver } from "./resolvers.js";
import type { CoverageStatus } from "../core/schema.js";

/**
 * A declarative reader for one page shape. See docs/specs/coverage-extraction.md.
 * A recipe changes how a page is read; it can never invent a claim, because every
 * claim still carries a quote taken from the page.
 */
export type Recipe = {
  id: string;
  note?: string;
  blocks?: "whole-page" | "h2-sections" | "h3-sections";
  select: {
    from: "list-items" | "table-column" | "headings" | "code-spans" | "paragraph" | "matrix";
    /** paragraph only: the sentence must match this before its targets are taken. */
    sentenceMatches?: string;
    /**
     * paragraph only: shortest line to consider. The default of 20 characters keeps
     * prose and drops stray fragments, but AWS also states a value as a bold line of
     * its own — "Linux", "macOS", "Windows" — and those are shorter than the floor.
     */
    minSentenceLength?: number;
    headerMatches?: string;
    level?: number;
    extract?: "whole" | "leading-bracket" | "leading-token" | "regex";
    pattern?: string;
    /** The extracted value must match this, so boilerplate headings are dropped. */
    matches?: string;
    /** Combine several columns into one target: "AlmaLinux" + "8" = "AlmaLinux 8". */
    joinColumns?: string[];
    /** Split one cell into several targets, for a list crammed into a cell. */
    split?: string;
    /** "any" reads nested bullets too; AWS indents its per-service rows one level. */
    depth?: "top" | "any";
  };
  axis: string;
  status?: "covered" | "not-covered" | "from-column" | "from-context";
  statusColumn?: string;
  scope?: {
    axis: string;
    from: "block-title" | "page-title" | "column" | "constant" | "column-header";
    column?: string;
    /** scope.from = "constant": the same scope applies to every claim on the page. */
    value?: string;
  };
  featureId?: string;
  /**
   * "scope-coverage" collapses a catalogue-by-scope page into coverage of the scope.
   *
   * Security Hub publishes which controls are unavailable in which Region. Read
   * literally that is 6,313 statements about 589 individual controls, and stating
   * those honestly would need a row per control. What the page actually supports at
   * the feature level is simpler: Security Hub controls apply in this Region, with
   * some unavailable. So one claim per Region, carrying the member count as its
   * qualifier, and the members themselves are counted rather than claimed.
   */
  emit?: "claims" | "scope-coverage";
  /** Read only the blocks whose heading matches. One page, several features. */
  onlyBlocksMatching?: string;
  requireMin?: number;
};

export type RecipeOutcome = {
  claims: RawClaim[];
  blocksRead: number;
  /** Values that did not resolve to an id on a closed axis. */
  dropped?: number;
  /**
   * The values a recipe read but could not resolve to a universe member, verbatim.
   * A count alone says a page was misread without saying how, so these are kept and
   * written to a gap file, which is what makes the resolver fixable rather than a
   * guess.
   */
  droppedValues?: string[];
  /** Set when the recipe produced less than it promised, which means it has broken. */
  failure?: string;
};

// AWS writes a linked, id-prefixed item as "[[S3.24] S3 Multi-Region Access Points…](url)",
// so the opening bracket repeats and the id is the inner one.
/**
 * Axes with a universe of their own. A recipe may not put raw page text into one of
 * these: the value has to resolve to a known id, or it is dropped. Open axes have no
 * universe until the documentation defines one, so their values pass through.
 */
const CLOSED_AXES = new Set(["region", "partition", "service", "resourceType", "dataSource"]);

const LEADING_BRACKET = /^\[+([^[\]]{2,60})\]/;
const LEADING_TOKEN = /^([A-Za-z][A-Za-z0-9._:-]{1,40})\b/;

function extractTarget(value: string, recipe: Recipe): string | undefined {
  const text = value.trim();
  switch (recipe.select.extract ?? "whole") {
    case "leading-bracket":
      return LEADING_BRACKET.exec(text)?.[1]?.trim();
    case "leading-token":
      return LEADING_TOKEN.exec(text)?.[1];
    case "regex": {
      if (!recipe.select.pattern) return undefined;
      return new RegExp(recipe.select.pattern).exec(text)?.[1]?.trim();
    }
    default:
      return text || undefined;
  }
}

const YES = /^(yes|supported|available|✓|✔|all|full)$/i;
const NO = /^(no|not supported|unsupported|unavailable|n\/a|-|—|none)$/i;

/** A target whose own name says it is withdrawn cannot be recorded as covered. */
const SELF_DEPRECATING = /\((deprecated|legacy|retired|removed|end of life|eol)\)|\b(deprecated|retired)$/i;

const ABSENCE =
  /\b(not supported|aren'?t supported|isn'?t supported|are not available|aren'?t available|is not available|isn'?t available|not currently available|does ?n'?t (support|analy[sz]e|scan|include)|do ?n'?t (support|analy[sz]e|scan|include)|can'?t (be used|scan|generate)|unsupported|excluded|no longer|retired|only for|only in|only with)\b/i;

function statusFor(recipe: Recipe, row: string[] | undefined, headers: string[], sentence?: string): CoverageStatus {
  if (recipe.status === "from-context" && sentence) return ABSENCE.test(sentence) ? "not-covered" : "covered";
  if (recipe.status === "not-covered") return "not-covered";
  if (recipe.status === "from-column" && row) {
    const column = findColumn(headers, [new RegExp(recipe.statusColumn ?? "support", "i")]);
    // A status cell often carries an icon, then the word, then a link:
    // "Yes · Learn more". The verdict is the leading word.
    const value = column >= 0 ? (row[column] ?? "").trim() : "";
    // The icon becomes a word too, so the cell can read "Yes Yes · Learn more".
    const lead = (value.split(/\s*·\s*|\s{2,}|\n/)[0] ?? value).trim();
    const firstWord = (lead.split(/\s+/)[0] ?? "").trim();
    if (NO.test(firstWord)) return "not-covered";
    if (YES.test(firstWord)) return "covered";
    if (NO.test(lead)) return "not-covered";
    if (YES.test(lead)) return "covered";
    if (NO.test(value)) return "not-covered";
    if (YES.test(value)) return "covered";
    return "unknown";
  }
  return "covered";
}

/**
 * Prose split into sentences, each carrying the source line it came from.
 *
 * The line is what gets quoted. Joining lines and re-splitting produced sentences
 * that never appear on the page ("RDS Protection RDS Protection is not supported…"),
 * which the evidence check rightly refused.
 */
export function sentencesIn(body: string, minLength = 20): { text: string; raw: string }[] {
  const out: { text: string; raw: string }[] = [];
  for (const raw of body.split("\n")) {
    if (/^\s*(\||[+*-]\s|#{1,6}\s|<a )/.test(raw)) continue;
    const clean = raw
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[*`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) continue;
    for (const sentence of clean.split(/(?<=[.:])\s+(?=[A-Z(])/)) {
      const text = sentence.trim();
      if (text.length > minLength && text.length < 600) out.push({ text, raw: raw.trim() });
    }
  }
  return out;
}

/** One cell can hold a list. AWS joins those with a line break or a comma. */
function splitValue(value: string, recipe: Recipe): string[] {
  if (!recipe.select.split) return [value];
  return value
    .split(new RegExp(recipe.select.split))
    .map((part) => part.trim())
    .filter(Boolean);
}

/** One claim per scope value, carrying how many catalogue members it was built from. */
function collapseToScope(claims: RawClaim[], recipe: Recipe): RawClaim[] {
  const byScope = new Map<string, RawClaim[]>();
  for (const claim of claims) {
    if (!claim.scope) continue;
    const list = byScope.get(claim.scope.targetId) ?? [];
    list.push(claim);
    byScope.set(claim.scope.targetId, list);
  }
  const out: RawClaim[] = [];
  for (const [scopeTarget, group] of byScope) {
    const first = group[0] as RawClaim;
    const members = new Set(group.map((c) => c.targetId)).size;
    const noun = recipe.axis;
    out.push({
      axis: first.scope?.axis ?? "region",
      targetId: scopeTarget,
      targetLabel: first.scope?.label ?? scopeTarget,
      status: recipe.status === "not-covered" ? "partial" : "covered",
      qualifier:
        recipe.status === "not-covered"
          ? `${members} ${noun} values are not available here`
          : `${members} ${noun} values are available here`,
      extractorId: `recipe:${recipe.id}`,
      quote: first.quote,
      locator: first.locator,
    });
  }
  return out;
}

function shapeOf(recipe: Recipe): RegExp | undefined {
  return recipe.select.matches ? new RegExp(recipe.select.matches) : undefined;
}

/** A matrix cell says yes, no, or nothing at all. */
function cellVerdict(value: string): CoverageStatus | undefined {
  const first = (value.trim().split(/\s+/)[0] ?? "").trim();
  if (NO.test(first) || NO.test(value.trim())) return "not-covered";
  if (YES.test(first) || YES.test(value.trim())) return "covered";
  return undefined;
}

type Block = { title: string; body: string };

/**
 * A block runs from its heading to the next heading at the same level or shallower.
 * A section's own body stops at the next heading of ANY level, so an H2 block was
 * losing everything nested under its H3s — which is where AWS puts the actual lists.
 */
function blocksFor(doc: MdDocument, body: string, recipe: Recipe, pageTitle: string): Block[] {
  const level = recipe.blocks === "h3-sections" ? 3 : 2;
  if (recipe.blocks !== "h2-sections" && recipe.blocks !== "h3-sections") {
    return [{ title: pageTitle, body }];
  }
  const heads = doc.sections.filter((section) => section.level === level);
  const blocks: Block[] = [];
  // Everything above the first heading of this level is the page's own section, and
  // it was being thrown away. The Directory Service Regions page puts its main table
  // there and a second table under an H2, so the two could not be told apart and the
  // narrower one's columns were read against both.
  const first = heads[0];
  const preamble = doc.lines.slice(0, first ? first.startLine : doc.lines.length).join("\n");
  if (preamble.trim()) blocks.push({ title: pageTitle, body: preamble });
  for (const head of heads) {
    const next = doc.sections.find((s) => s.startLine > head.startLine && s.level <= level);
    const end = next ? next.startLine : doc.lines.length;
    const text = doc.lines.slice(head.startLine + 1, end).join("\n");
    if (text.trim()) blocks.push({ title: head.title, body: text });
  }
  return blocks;
}

/**
 * Every AWS page now ends with a "See also" block carrying the same boilerplate
 * bullet about AI coding assistants. Left in, it became a compliance framework in
 * Audit Manager and a package ecosystem in Inspector. It is cut once, here, rather
 * than guarded against in every recipe.
 */
export function stripBoilerplate(body: string): string {
  const lines = body.split("\n");
  const cut = lines.findIndex((line) => /^##\s+(see also|related (information|resources))\s*$/i.test(line.trim()));
  return cut >= 0 ? lines.slice(0, cut).join("\n") : body;
}

export function runRecipe(
  recipe: Recipe,
  rawBody: string,
  pageTitle: string,
  resolver: TargetResolver,
): RecipeOutcome {
  const body = stripBoilerplate(rawBody);
  const doc = parseMarkdown(body);
  let blocks = blocksFor(doc, body, recipe, pageTitle);
  if (recipe.onlyBlocksMatching) {
    const wanted = new RegExp(recipe.onlyBlocksMatching, "i");
    blocks = blocks.filter((block) => wanted.test(block.title));
  }
  const claims: RawClaim[] = [];
  const seen = new Set<string>();
  /** key -> index in `claims`, so a repeated target is merged rather than dropped. */
  const claimAt = new Map<string, number>();
  /**
   * AWS names one service on several rows. The IAM services table has nine Billing
   * rows and four EC2 rows, and 44 of the 52 services it repeats disagree with
   * themselves on at least one column: "AWS Auto Scaling" is No where "Amazon EC2
   * Auto Scaling" is Yes. Keeping whichever row came first published a coin flip. The
   * honest reading at service granularity is all-yes covered, all-no not-covered,
   * anything mixed partial — which is what Partial already means everywhere else.
   */
  const merge = (key: string, status: CoverageStatus, label: string): boolean => {
    const at = claimAt.get(key);
    if (at === undefined) return false;
    const existing = claims[at] as RawClaim;
    if (existing.status !== status) {
      existing.status = "partial";
      existing.qualifier = existing.qualifier ?? "AWS states this on several rows for the same service, and they disagree";
    }
    // The quote stays the first row's, verbatim. Evidence is re-checked against the
    // stored body, and a quote stitched from two lines appears in neither.
    if (existing.targetLabel && !existing.targetLabel.includes(label)) {
      existing.targetLabel = `${existing.targetLabel}; ${label}`.slice(0, 200);
    }
    return true;
  };
  let dropped = 0;
  const droppedValues: string[] = [];
  /**
   * A table row names a service in prose and links to its guide. When the prose does
   * not resolve, the link still does: "AWS Budget Service" is not a name we hold, but
   * awsaccountbilling/latest/aboutv2 is a guide we map to `budgets`. Only the first
   * link is used, which is the one on the row's own label.
   */
  const resolveVia = (axis: string, value: string, quote: string): string | undefined => {
    // Name first, link second. The name is usually the more specific of the two:
    // Route 53 Recovery Cluster, Control Config and Readiness are three IAM services
    // sharing one guide, and resolving by link would merge them. The link only steps
    // in when the name is one we do not hold.
    const hit = resolver.resolve(value, axis as never);
    if (hit) return hit.targetId;
    if (axis !== "service") return undefined;
    const link = /\]\((https?:\/\/docs\.aws\.amazon\.com\/[^)\s]+)\)/i.exec(quote);
    return link ? resolver.resolveByDocUrl(link[1] as string) : undefined;
  };
  const drop = (value: string) => {
    dropped += 1;
    if (droppedValues.length < 200 && !droppedValues.includes(value)) droppedValues.push(value);
  };

  for (const block of blocks) {
    const blockDoc = parseMarkdown(block.body);
    const values: { value: string; quote: string; row?: string[]; headers?: string[] }[] = [];
    const matrixCells: { target: string; header: string; status: CoverageStatus; quote: string }[] = [];

    if (recipe.select.from === "list-items") {
      for (const list of blockDoc.lists) {
        for (const item of list.items) {
          if (recipe.select.depth !== "any" && item.depth !== 0) continue;
          for (const value of splitValue(item.text, recipe)) values.push({ value, quote: item.raw });
        }
      }
    } else if (recipe.select.from === "table-column") {
      for (const table of blockDoc.tables) {
        const column = recipe.select.headerMatches
          ? findColumn(table.headers, [new RegExp(recipe.select.headerMatches, "i")])
          : 0;
        if (column < 0) continue;
        const extra = (recipe.select.joinColumns ?? [])
          .map((header) => findColumn(table.headers, [new RegExp(header, "i")]))
          .filter((index) => index >= 0);
        for (let i = 0; i < table.rows.length; i += 1) {
          const row = table.rows[i] as string[];
          const base = row[column] ?? "";
          if (!base) continue;
          const joined = [base, ...extra.map((index) => row[index] ?? "")].filter(Boolean).join(" ").trim();
          const quote = table.rawRows[i] ?? base;
          for (const value of splitValue(joined, recipe)) {
            values.push({ value, quote, row, headers: table.headers });
          }
        }
      }
    } else if (recipe.select.from === "headings") {
      const wanted = recipe.select.level ?? 2;
      for (const section of blockDoc.sections) {
        if (section.level !== wanted) continue;
        // Quote the source line, not a rebuilt heading: the raw text carries Markdown
        // escapes ("C&CActivity.B\!DNS") that a rebuilt string would not match.
        const raw = blockDoc.lines[section.startLine];
        values.push({ value: section.title, quote: (raw ?? `${"#".repeat(wanted)} ${section.title}`).trim() });
      }
    } else if (recipe.select.from === "matrix") {
      // A matrix names its targets down the first column and its scope across the
      // header row: resource type by Region, feature by Region. Each cell is one
      // statement, so the whole table is targets x scopes.
      for (const table of blockDoc.tables) {
        const keyCol = recipe.select.headerMatches
          ? findColumn(table.headers, [new RegExp(recipe.select.headerMatches, "i")])
          : 0;
        if (keyCol < 0) continue;
        for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
          const row = table.rows[rowIndex] as string[];
          const target = extractTarget(row[keyCol] ?? "", recipe);
          if (!target) continue;
          if (shapeOf(recipe) && !shapeOf(recipe)?.test(target)) continue;
          for (let col = 0; col < table.headers.length; col += 1) {
            if (col === keyCol) continue;
            const header = (table.headers[col] ?? "").trim();
            if (!header) continue;
            const cellStatus = cellVerdict(row[col] ?? "");
            if (!cellStatus) continue;
            matrixCells.push({ target, header, status: cellStatus, quote: (table.rawRows[rowIndex] ?? "").trim() });
          }
        }
      }
    } else if (recipe.select.from === "paragraph") {
      // AWS states most of its exclusions in a sentence beside the list, never in the
      // list. "Macie doesn't analyze S3 objects that use other storage classes, such
      // as S3 Glacier Deep Archive or S3 Express One Zone."
      const wanted = recipe.select.sentenceMatches ? new RegExp(recipe.select.sentenceMatches, "i") : undefined;
      for (const sentence of sentencesIn(block.body, recipe.select.minSentenceLength)) {
        if (wanted && !wanted.test(sentence.text)) continue;
        for (const value of splitValue(sentence.text, recipe)) values.push({ value, quote: sentence.raw });
      }
    } else {
      for (const line of block.body.split("\n")) {
        for (const match of line.matchAll(/`([^`\n]{3,80})`/g)) {
          values.push({ value: (match[1] ?? "").trim(), quote: line.trim() });
        }
      }
    }

    // The scope is the other dimension the block states, most often a Region.
    let scope: RawClaim["scope"];
    if (recipe.scope?.from === "constant" && recipe.scope.value) {
      scope = { axis: recipe.scope.axis, targetId: recipe.scope.value, label: recipe.scope.value };
    } else if (recipe.scope) {
      const raw = recipe.scope.from === "page-title" ? pageTitle : block.title;
      const hit = resolver.resolve(raw, recipe.scope.axis as never);
      if (hit) scope = { axis: recipe.scope.axis, targetId: hit.targetId, label: raw };
    }

    // A matrix produces its own claims: one per cell.
    if (recipe.select.from === "matrix") {
      for (const cell of matrixCells) {
        const targetId0 = catalogTargetId(recipe.axis, cell.target);
        let targetId = targetId0;
        if (CLOSED_AXES.has(recipe.axis)) {
          const hit = resolveVia(recipe.axis, cell.target, cell.quote);
          if (!hit) { drop(cell.target); continue; }
          targetId = hit;
        }
        let cellScope: RawClaim["scope"];
        if (recipe.scope?.from === "column-header") {
          const hit = resolver.resolve(cell.header.replace(/\s+Region$/i, ""), recipe.scope.axis as never);
          if (!hit) { drop(cell.header); continue; }
          cellScope = { axis: recipe.scope.axis, targetId: hit.targetId, label: cell.header };
        }
        const key = `${targetId}|${cellScope?.targetId ?? cell.header}`;
        if (merge(key, cell.status, cell.target)) continue;
        seen.add(key);
        claimAt.set(key, claims.length);
        claims.push({
          axis: recipe.axis,
          targetId,
          targetLabel: cell.target,
          ...(cellScope ? { scope: cellScope } : {}),
          status: cell.status,
          extractorId: `recipe:${recipe.id}`,
          quote: cell.quote,
          locator: block.title,
        });
      }
      matrixCells.length = 0;
      continue;
    }

    const shape = recipe.select.matches ? new RegExp(recipe.select.matches) : undefined;
    for (const entry of values) {
      const target = extractTarget(entry.value, recipe);
      if (!target) continue;
      if (shape && !shape.test(target)) continue;
      let targetId = catalogTargetId(recipe.axis, target);
      if (CLOSED_AXES.has(recipe.axis)) {
        const hit = resolveVia(recipe.axis, target, entry.quote);
        if (!hit) {
          drop(target);
          continue;
        }
        targetId = hit;
      }
      const key = `${targetId}|${scope?.targetId ?? ""}`;
      let status = statusFor(recipe, entry.row, entry.headers ?? [], entry.quote);
      // "kms:CustomerMasterKeySpec (deprecated)" was being published as covered. The
      // name says otherwise, and the name is AWS's own wording.
      if (status === "covered" && SELF_DEPRECATING.test(target)) status = "not-covered";
      // "unknown" means the status column was not on this table, so the row was not
      // the one the recipe is for. Inspector's OS recipe swept four unrelated tables
      // this way and scoped all of them to a scan method they say nothing about.
      if (recipe.status === "from-column" && status === "unknown") {
        drop(target);
        continue;
      }
      if (merge(key, status, entry.value.trim())) continue;
      seen.add(key);
      claimAt.set(key, claims.length);
      claims.push({
        axis: recipe.axis,
        targetId,
        targetLabel: entry.value.trim().slice(0, 200),
        ...(scope ? { scope } : {}),
        status,
        extractorId: `recipe:${recipe.id}`,
        quote: entry.quote.trim(),
        locator: block.title,
      });
    }
  }

  const finalClaims = recipe.emit === "scope-coverage" ? collapseToScope(claims, recipe) : claims;

  const min = recipe.requireMin ?? 1;
  return {
    claims: finalClaims,
    blocksRead: blocks.length,
    ...(dropped ? { dropped, droppedValues } : {}),
    ...(finalClaims.length < min
      ? { failure: `recipe ${recipe.id} produced ${finalClaims.length} claims, fewer than the ${min} it promises` }
      : {}),
  };
}
