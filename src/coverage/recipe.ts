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
    from: "list-items" | "table-column" | "headings" | "code-spans";
    headerMatches?: string;
    level?: number;
    extract?: "whole" | "leading-bracket" | "leading-token" | "regex";
    pattern?: string;
    /** The extracted value must match this, so boilerplate headings are dropped. */
    matches?: string;
  };
  axis: string;
  status?: "covered" | "not-covered" | "from-column" | "from-context";
  statusColumn?: string;
  scope?: { axis: string; from: "block-title" | "page-title" | "column"; column?: string };
  featureId?: string;
  requireMin?: number;
};

export type RecipeOutcome = {
  claims: RawClaim[];
  blocksRead: number;
  /** Set when the recipe produced less than it promised, which means it has broken. */
  failure?: string;
};

// AWS writes a linked, id-prefixed item as "[[S3.24] S3 Multi-Region Access Points…](url)",
// so the opening bracket repeats and the id is the inner one.
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

function statusFor(recipe: Recipe, row: string[] | undefined, headers: string[]): CoverageStatus {
  if (recipe.status === "not-covered") return "not-covered";
  if (recipe.status === "from-column" && row) {
    const column = findColumn(headers, [new RegExp(recipe.statusColumn ?? "support", "i")]);
    const value = column >= 0 ? (row[column] ?? "").trim() : "";
    if (NO.test(value)) return "not-covered";
    if (YES.test(value)) return "covered";
    return "unknown";
  }
  return "covered";
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

export function runRecipe(
  recipe: Recipe,
  body: string,
  pageTitle: string,
  resolver: TargetResolver,
): RecipeOutcome {
  const doc = parseMarkdown(body);
  const blocks = blocksFor(doc, body, recipe, pageTitle);
  const claims: RawClaim[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const blockDoc = parseMarkdown(block.body);
    const values: { value: string; quote: string; row?: string[]; headers?: string[] }[] = [];

    if (recipe.select.from === "list-items") {
      for (const list of blockDoc.lists) {
        for (const item of list.items) {
          if (item.depth !== 0) continue;
          values.push({ value: item.text, quote: item.raw });
        }
      }
    } else if (recipe.select.from === "table-column") {
      for (const table of blockDoc.tables) {
        const column = recipe.select.headerMatches
          ? findColumn(table.headers, [new RegExp(recipe.select.headerMatches, "i")])
          : 0;
        if (column < 0) continue;
        for (let i = 0; i < table.rows.length; i += 1) {
          const row = table.rows[i] as string[];
          const value = row[column] ?? "";
          if (value) values.push({ value, quote: table.rawRows[i] ?? value, row, headers: table.headers });
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
    } else {
      for (const line of block.body.split("\n")) {
        for (const match of line.matchAll(/`([^`\n]{3,80})`/g)) {
          values.push({ value: (match[1] ?? "").trim(), quote: line.trim() });
        }
      }
    }

    // The scope is the other dimension the block states, most often a Region.
    let scope: RawClaim["scope"];
    if (recipe.scope) {
      const raw = recipe.scope.from === "page-title" ? pageTitle : block.title;
      const hit = resolver.resolve(raw, recipe.scope.axis as never);
      if (hit) scope = { axis: recipe.scope.axis, targetId: hit.targetId, label: raw };
    }

    const shape = recipe.select.matches ? new RegExp(recipe.select.matches) : undefined;
    for (const entry of values) {
      const target = extractTarget(entry.value, recipe);
      if (!target) continue;
      if (shape && !shape.test(target)) continue;
      const targetId = catalogTargetId(recipe.axis, target);
      const key = `${targetId}|${scope?.targetId ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      claims.push({
        axis: recipe.axis,
        targetId,
        targetLabel: entry.value.trim().slice(0, 200),
        ...(scope ? { scope } : {}),
        status: statusFor(recipe, entry.row, entry.headers ?? []),
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
    ...(claims.length < min
      ? { failure: `recipe ${recipe.id} produced ${claims.length} claims, fewer than the ${min} it promises` }
      : {}),
  };
}
