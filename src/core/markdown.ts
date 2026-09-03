export interface Section {
  level: number;
  title: string;
  anchor?: string;
  /** Everything below the heading, up to the next heading of any level. */
  text: string;
  /** Everything below the heading, up to the next heading of the same or higher level. */
  block: string;
}

const HEADING = /^(#{1,6})\s+(.*)$/;

export const sections = (body: string): Section[] => {
  const lines = body.split('\n');
  const heads: { level: number; title: string; line: number }[] = [];
  lines.forEach((l, i) => {
    const m = HEADING.exec(l);
    if (m?.[1] && m[2] !== undefined) heads.push({ level: m[1].length, title: m[2].trim(), line: i });
  });
  return heads.map((h, i) => {
    const nextAny = heads[i + 1]?.line ?? lines.length;
    let nextSame = lines.length;
    for (let j = i + 1; j < heads.length; j++) {
      const cand = heads[j]!;
      if (cand.level <= h.level) {
        nextSame = cand.line;
        break;
      }
    }
    const text = lines.slice(h.line + 1, nextAny).join('\n');
    const block = lines.slice(h.line + 1, nextSame).join('\n');
    const anchor = /<a name="([^"]+)"/.exec(text)?.[1];
    return { level: h.level, title: h.title, anchor, text, block };
  });
};

/**
 * AWS pages carry non-breaking and other Unicode spaces inside ordinary wording,
 * for example "Route<nbsp>53". Match against this; always quote the raw text.
 */
export const normalizeSpaces = (s: string): string =>
  s.replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ');

const LINK = /\[([^[\]]*)\]\([^()]*\)/g;

/** Unwrap the innermost link first, so a link nested in a link resolves cleanly. */
const unnest = (s: string): string => {
  let out = s;
  for (let i = 0; i < 6; i++) {
    const next = out.replace(LINK, '$1');
    if (next === out) break;
    out = next;
  }
  return out;
};

/**
 * `[label](url)` becomes `label`; images are dropped. AWS nests a footnote link
 * inside a row link, so the innermost link is unwrapped first, repeatedly.
 */
export const stripLinks = (s: string): string =>
  unnest(normalizeSpaces(s).replace(/!\[[^\]]*\]\([^)]*\)/g, ''))
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Top-level `+ ` or `- ` bullets, keeping the raw line for quoting. */
export const bullets = (text: string, indent = 0): { raw: string; value: string }[] => {
  const pad = ' '.repeat(indent);
  const re = new RegExp(`^${pad}[+-] (.*)$`);
  return text
    .split('\n')
    .map((l) => ({ line: l, m: re.exec(l) }))
    .filter((x): x is { line: string; m: RegExpExecArray } => x.m !== null)
    .map((x) => ({ raw: x.line.trim(), value: stripLinks(x.m[1] ?? '') }));
};

export interface Table {
  headers: string[];
  rows: string[][];
  /** The raw lines, for quoting. */
  rawRows: string[];
}

const cells = (line: string): string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim());

const isDivider = (line: string): boolean => /^\s*\|?[\s:-]*\|[\s|:-]*$/.test(line) && line.includes('-');

export const tables = (text: string): Table[] => {
  const lines = text.split('\n');
  const out: Table[] = [];
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i];
    const div = lines[i + 1];
    if (!head?.trim().startsWith('|') || !div || !isDivider(div)) continue;
    const headers = cells(head).map(stripLinks);
    const rows: string[][] = [];
    const rawRows: string[] = [];
    let j = i + 2;
    for (; j < lines.length; j++) {
      const l = lines[j];
      if (!l?.trim().startsWith('|')) break;
      rows.push(cells(l).map(stripLinks));
      rawRows.push(l);
    }
    out.push({ headers, rows, rawRows });
    i = j - 1;
  }
  return out;
};

/** "Yes"/"No" cells in AWS docs carry an icon image; read the word. */
export const yesNo = (cell: string): boolean | undefined => {
  // AWS hangs "<br /> Learn more" off a verdict cell. Read the verdict, drop the rest.
  const t = normalizeSpaces(cell)
    .split(/<br\s*\/?>/i)[0]!
    .replace(/\s*Learn more\s*$/i, '')
    .trim()
    .toLowerCase();
  if (t === 'yes' || t.endsWith(' yes')) return true;
  if (t === 'no' || t.endsWith(' no')) return false;
  return undefined;
};

/** Bold run-in headings AWS uses for definition lists: `**Title**  `. */
export const boldHeadings = (text: string): { title: string; body: string; raw: string }[] => {
  const lines = text.split('\n');
  const marks: { title: string; raw: string; line: number }[] = [];
  lines.forEach((l, i) => {
    const m = /^\*\*(.+)\*\*\s*$/.exec(l.trimEnd());
    if (m?.[1]) marks.push({ title: stripLinks(m[1]), raw: l, line: i });
  });
  return marks.map((mk, i) => ({
    title: mk.title,
    raw: mk.raw,
    body: lines.slice(mk.line + 1, marks[i + 1]?.line ?? lines.length).join('\n'),
  }));
};
