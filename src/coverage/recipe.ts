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
    from: "list-items" | "table-column" | "headings" | "code-spans" | "paragraph";
    /** paragraph only: the sentence must match this before its targets are taken. */
    sentenceMatches?: string;
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
  };
  axis: string;
  status?: "covered" | "not-covered" | "from-column" | "from-context";
  statusColumn?: string;
  scope?: {
    axis: string;
    from: "block-title" | "page-title" | "column" | "constant";
    column?: string;
    /** scope.from = "constant": the same scope applies to every claim on the page. */
    value?: string;
  };
  featureId?: string;
  /** Read only the blocks whose heading matches. One page, several features. */
  onlyBlocksMatching?: string;
  requireMin?: number;
};

export type RecipeOutcome = {
  claims: RawClaim[];
  blocksRead: number;
  /** Values that did not resolve to an id on a closed axis. */
  dropped?: number;
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

/** Prose split into sentences, with the Markdown markup taken off. */
export function sentencesIn(body: string): string[] {
  const prose = body
    .split("\n")
    .filter((line) => !/^\s*(\||[+*-]\s|#{1,6}\s|<a )/.test(line))
    .join(" ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ");
  return prose
    .split(/(?<=[.:])\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 600);
}

/** One cell can hold a list. AWS joins those with a line break or a comma. */
function splitValue(value: string, recipe: Recipe): string[] {
  if (!recipe.select.split) return [value];
  return value
    .split(new RegExp(recipe.select.split))
    .map((part) => part.trim())
    .filter(Boolean);
}

type Block = { title: string; body: string };

function blocksFor(doc: MdDocument, body: string, recipe: Recipe, pageTitle: string): Block[] {
  const level = recipe.blocks === "h3-sections" ? 3 : 2;
  if (recipe.blocks === "h2-sections" || recipe.blocks === "h3-sections") {
    return doc.sections
      .filter((section) => section.level === level && section.body.trim())
      .map((section) => ({ title: section.title, body: section.body }));
  }
  return [{ title: pageTitle, body }];
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
  let dropped = 0;

  for (const block of blocks) {
    const blockDoc = parseMarkdown(block.body);
    const values: { value: string; quote: string; row?: string[]; headers?: string[] }[] = [];

    if (recipe.select.from === "list-items") {
      for (const list of blockDoc.lists) {
        for (const item of list.items) {
          if (item.depth !== 0) continue;
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
    } else if (recipe.select.from === "paragraph") {
      // AWS states most of its exclusions in a sentence beside the list, never in the
      // list. "Macie doesn't analyze S3 objects that use other storage classes, such
      // as S3 Glacier Deep Archive or S3 Express One Zone."
      const wanted = recipe.select.sentenceMatches ? new RegExp(recipe.select.sentenceMatches, "i") : undefined;
      for (const sentence of sentencesIn(block.body)) {
        if (wanted && !wanted.test(sentence)) continue;
        for (const value of splitValue(sentence, recipe)) values.push({ value, quote: sentence });
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

    const shape = recipe.select.matches ? new RegExp(recipe.select.matches) : undefined;
    for (const entry of values) {
      const target = extractTarget(entry.value, recipe);
      if (!target) continue;
      if (shape && !shape.test(target)) continue;
      let targetId = catalogTargetId(recipe.axis, target);
      if (CLOSED_AXES.has(recipe.axis)) {
        const hit = resolver.resolve(target, recipe.axis as never);
        if (!hit) {
          dropped += 1;
          continue;
        }
        targetId = hit.targetId;
      }
      const key = `${targetId}|${scope?.targetId ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const status = statusFor(recipe, entry.row, entry.headers ?? [], entry.quote);
      // "unknown" means the status column was not on this table, so the row was not
      // the one the recipe is for. Inspector's OS recipe swept four unrelated tables
      // this way and scoped all of them to a scan method they say nothing about.
      if (recipe.status === "from-column" && status === "unknown") {
        dropped += 1;
        continue;
      }
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

  const min = recipe.requireMin ?? 1;
  return {
    claims,
    blocksRead: blocks.length,
    ...(dropped ? { dropped } : {}),
    ...(claims.length < min
      ? { failure: `recipe ${recipe.id} produced ${claims.length} claims, fewer than the ${min} it promises` }
      : {}),
  };
}
