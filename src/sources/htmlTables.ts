/**
 * Some AWS Markdown pages drop their tables and leave only a link to the HTML.
 * The data is real and only reachable there, so those tables are recovered from the
 * HTML and spliced back in as Markdown. Without this the map silently loses, among
 * others, GuardDuty's supported kernel versions and its per-Region exclusions.
 */

export const ELIDED_TABLE_SENTINEL = "See the AWS documentation website for more details";

const ICON_MEANING: { test: RegExp; value: string }[] = [
  { test: /icon-yes|success_icon|check(mark)?_icon/i, value: "Yes" },
  { test: /icon-no|negative_icon|fail_icon/i, value: "No" },
];

function decode(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/gi, " ");
}

/** An icon is the only marker in many AWS matrices, so it becomes its word. */
function iconsToWords(html: string): string {
  return html.replace(/<img\b[^>]*src="([^"]*)"[^>]*>/gi, (whole, src: string) => {
    const meaning = ICON_MEANING.find((m) => m.test.test(src));
    return meaning ? ` ${meaning.value} ` : whole;
  });
}

function cellText(html: string): string {
  return decode(iconsToWords(html))
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\|/g, "/")
    .trim();
}

export function htmlTablesToMarkdown(html: string): string[] {
  const tables: string[] = [];
  for (const table of html.match(/<table[\s\S]*?<\/table>/gi) ?? []) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    const parsed: string[][] = [];
    for (const row of rows) {
      const cells = (row.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? []).map((cell) =>
        cellText(cell.replace(/^<t[hd][^>]*>/i, "").replace(/<\/t[hd]>$/i, "")),
      );
      if (cells.length > 0) parsed.push(cells);
    }
    if (parsed.length < 2) continue;
    const header = parsed[0] as string[];
    const width = Math.max(...parsed.map((r) => r.length));
    const pad = (row: string[]): string => {
      const filled = [...row];
      while (filled.length < width) filled.push("");
      return `| ${filled.join(" | ")} |`;
    };
    const lines = [pad(header), `| ${Array.from({ length: width }, () => "---").join(" | ")} |`];
    for (const row of parsed.slice(1)) lines.push(pad(row));
    tables.push(lines.join("\n"));
  }
  return tables;
}

export function hasElidedTables(markdown: string): boolean {
  return markdown.includes(ELIDED_TABLE_SENTINEL);
}

/** Put the recovered tables back where the Markdown said to look elsewhere. */
export function spliceRecoveredTables(markdown: string, tables: string[]): string {
  let index = 0;
  return markdown
    .split("\n")
    .map((line) => {
      if (!line.includes(ELIDED_TABLE_SENTINEL)) return line;
      const table = tables[index];
      index += 1;
      return table ? `${line}\n\n${table}` : line;
    })
    .join("\n");
}
