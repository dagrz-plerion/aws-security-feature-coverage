/**
 * Parser for the Markdown twin of an AWS documentation page
 * (any docs URL with .html swapped for .md).
 */

export type MdTable = {
  headers: string[];
  rows: string[][];
  /** The unmodified source line for each row, so extractors can quote verbatim. */
  rawRows: string[];
  /** Heading path above the table, outermost first. */
  section: string[];
  /** Raw source of the table, usable as evidence. */
  raw: string;
  startLine: number;
};

export type MdList = {
  items: MdListItem[];
  section: string[];
  raw: string;
  startLine: number;
  /** Text of the paragraph immediately before the list. */
  intro?: string;
};

export type MdListItem = {
  text: string;
  /** Link targets found in the item. */
  links: { text: string; href: string }[];
  depth: number;
  raw: string;
};

export type MdSection = {
  path: string[];
  title: string;
  level: number;
  anchor?: string;
  body: string;
  startLine: number;
};

export type MdDocument = {
  title?: string;
  sections: MdSection[];
  tables: MdTable[];
  lists: MdList[];
  lines: string[];
};

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const ANCHOR = /^<a name="([^"]+)"><\/a>\s*$/;
const TABLE_ROW = /^\s*\|(.*)\|\s*$/;
const TABLE_DIVIDER = /^\s*\|[\s|:-]+\|\s*$/;
const BULLET = /^(\s*)(?:\+|-|\*)\s+(.*)$/;
const LINK = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export function stripLinks(text: string): string {
  return text.replace(LINK, "$1").trim();
}

export function extractLinks(text: string): { text: string; href: string }[] {
  const out: { text: string; href: string }[] = [];
  for (const match of text.matchAll(LINK)) {
    out.push({ text: match[1] ?? "", href: match[2] ?? "" });
  }
  return out;
}

/** Remove Markdown emphasis and inline code fences from a cell or item. */
export function cleanText(text: string): string {
  return stripLinks(text)
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/\\([_*`~\[\]\\!])/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function splitRow(line: string): string[] {
  const inner = TABLE_ROW.exec(line)?.[1] ?? "";
  return inner.split("|").map((cell) => cleanText(cell));
}

export function parseMarkdown(body: string): MdDocument {
  const lines = body.split("\n");
  const sections: MdSection[] = [];
  const tables: MdTable[] = [];
  const lists: MdList[] = [];
  const path: string[] = [];
  let title: string | undefined;
  let current: MdSection | undefined;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] as string;

    const heading = HEADING.exec(line);
    if (heading) {
      const level = (heading[1] as string).length;
      const text = cleanText(heading[2] as string);
      path.length = Math.max(0, level - 1);
      path[level - 1] = text;
      if (level === 1 && !title) title = text;
      const anchorLine = lines[i + 1] ?? "";
      const anchor = ANCHOR.exec(anchorLine.trim())?.[1];
      current = {
        path: path.filter(Boolean).slice(),
        title: text,
        level,
        ...(anchor ? { anchor } : {}),
        body: "",
        startLine: i,
      };
      sections.push(current);
      continue;
    }

    if (current) current.body += `${line}\n`;

    // tables
    if (TABLE_ROW.test(line) && TABLE_DIVIDER.test(lines[i + 1] ?? "")) {
      const headers = splitRow(line);
      const rows: string[][] = [];
      const rawRows: string[] = [];
      const rawLines = [line, lines[i + 1] as string];
      let j = i + 2;
      while (j < lines.length && TABLE_ROW.test(lines[j] as string)) {
        rawLines.push(lines[j] as string);
        rawRows.push(lines[j] as string);
        rows.push(splitRow(lines[j] as string));
        j += 1;
      }
      tables.push({
        headers,
        rows,
        rawRows,
        section: path.filter(Boolean).slice(),
        raw: rawLines.join("\n"),
        startLine: i,
      });
      if (current) current.body += `${rawLines.join("\n")}\n`;
      i = j - 1;
      continue;
    }

    // bullet lists
    if (BULLET.test(line)) {
      const items: MdListItem[] = [];
      const rawLines: string[] = [];
      let j = i;
      while (j < lines.length) {
        const candidate = lines[j] as string;
        const bullet = BULLET.exec(candidate);
        if (bullet) {
          const indent = (bullet[1] as string).length;
          const text = bullet[2] as string;
          items.push({
            text: cleanText(text),
            links: extractLinks(text),
            depth: Math.floor(indent / 2),
            raw: candidate,
          });
          rawLines.push(candidate);
          j += 1;
          continue;
        }
        // a continuation line belongs to the previous item
        if (/^\s{2,}\S/.test(candidate) && items.length > 0) {
          const last = items[items.length - 1] as MdListItem;
          last.text = cleanText(`${last.text} ${candidate}`);
          rawLines.push(candidate);
          j += 1;
          continue;
        }
        break;
      }
      const introLine = findIntro(lines, i);
      lists.push({
        items,
        section: path.filter(Boolean).slice(),
        raw: rawLines.join("\n"),
        startLine: i,
        ...(introLine ? { intro: introLine } : {}),
      });
      if (current) current.body += `${rawLines.join("\n")}\n`;
      i = j - 1;
      continue;
    }
  }

  return { ...(title ? { title } : {}), sections, tables, lists, lines };
}

function findIntro(lines: string[], listStart: number): string | undefined {
  for (let i = listStart - 1; i >= 0 && i > listStart - 6; i -= 1) {
    const line = (lines[i] ?? "").trim();
    if (!line) continue;
    if (HEADING.test(line) || ANCHOR.test(line)) return undefined;
    // A bold lead-in labels the list that follows; keep the label unmodified.
    const bold = /^\*\*(.+?)\*\*/.exec(line);
    return bold ? cleanText(`${bold[1]} ${line.slice(bold[0].length)}`) : cleanText(line);
  }
  return undefined;
}

/** Column index whose header matches any of the given patterns. */
export function findColumn(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i += 1) {
    const header = headers[i] ?? "";
    if (patterns.some((p) => p.test(header))) return i;
  }
  return -1;
}
