import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { sections, stripLinks, tables } from '../core/markdown.js';
import { resolveService } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-services-that-work-with-iam.md';
const PARSER_ID = 'iam-services-that-work-with-iam';

/** One column of the table. Each is a separate IAM capability, so a separate feature. */
const CAPABILITIES: {
  header: string;
  id: string;
  name: string;
  whatIsCounted: string;
  partialNote: string;
}[] = [
  {
    header: 'Actions',
    id: 'iam/policy-actions',
    name: 'IAM individual action permissions',
    whatIsCounted:
      'AWS services whose individual actions can be named in the Action element of an IAM policy',
    partialNote:
      'The page marks this service Partial, so only some of its actions can be named individually.',
  },
  {
    header: 'Resource-level permissions',
    id: 'iam/resource-level-permissions',
    name: 'IAM resource-level permissions',
    whatIsCounted:
      'AWS services that let an IAM policy name individual resources by ARN in the Resource element',
    partialNote:
      'The page states: "If a service supports this feature for some resources but not others, it is indicated by Partial in the table." The page does not say which resources.',
  },
  {
    header: 'Resource-based policies',
    id: 'iam/resource-based-policies',
    name: 'IAM resource-based policies',
    whatIsCounted:
      'AWS services that support attaching a resource-based policy, with a Principal element, to a resource inside the service',
    partialNote:
      'The page marks this service Partial, so only some of its resources take a resource-based policy.',
  },
  {
    header: 'ABAC',
    id: 'iam/abac-authorization-based-on-tags',
    name: 'IAM ABAC (authorization based on tags)',
    whatIsCounted:
      'AWS services that support the aws:ResourceTag, aws:RequestTag and aws:TagKeys condition keys for tag-based access control',
    partialNote:
      'The page states: "If a service supports all three condition keys for only some resource types, then the value is Partial." The page does not say which resource types.',
  },
  {
    header: 'Temporary credentials',
    id: 'iam/temporary-credentials',
    name: 'IAM temporary security credentials',
    whatIsCounted:
      'AWS services reachable with short-term credentials from AWS STS, IAM Identity Center or a console role switch',
    partialNote:
      'The page marks this service Partial, so only some of its API actions accept temporary credentials.',
  },
  {
    header: 'Service-linked roles',
    id: 'iam/service-linked-roles',
    name: 'IAM service-linked roles',
    whatIsCounted: 'AWS services that support service-linked roles',
    partialNote:
      'The page marks this service Partial, so service-linked roles cover only some of its features.',
  },
];

const INFO = /\(\[Info\]\(#([^)]*)\)\)/;

/** `([Info](#swwiam_footnotes_x))` sits inside the cell link and defeats stripLinks. */
const cellText = (raw: string): string => stripLinks(raw.replace(/\s*\(\[Info\]\([^)]*\)\)/g, ''));

const splitCells = (line: string): string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|');

/**
 * The carve-out a Partial cell points at. A footnote of one paragraph is that
 * cell's own carve-out, so it is quoted. A footnote of several paragraphs covers
 * several columns at once, so the reader is sent to it by name instead.
 */
const footnotes = (body: string): Map<string, { title: string; only?: string }> => {
  const out = new Map<string, { title: string; only?: string }>();
  for (const s of sections(body)) {
    if (!s.anchor?.startsWith('swwiam_footnotes_')) continue;
    const paras = s.text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('<a name='));
    out.set(s.anchor, { title: s.title, only: paras.length === 1 ? stripLinks(paras[0]!) : undefined });
  }
  return out;
};

/**
 * AWS writes one name twice, as "Full Name (Abbrev)". Only the long form is
 * retried: the abbreviation alone is a weaker string that could land on another
 * service. Every pair on this page agrees when both halves resolve.
 */
const longForm = (label: string): string | undefined => /^(.*?)\s*\([^()]*\)$/.exec(label)?.[1];

/** True when the label spells out the service id, e.g. "… (Amazon RDS)" for `rds`. */
const namesTheId = (label: string, id: string): boolean => {
  const words = (s: string): string => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  return words(label).includes(words(id));
};

const verdict = (cell: string): 'yes' | 'no' | 'partial' | undefined => {
  if (/^Yes\b/.test(cell)) return 'yes';
  if (/^No\b/.test(cell)) return 'no';
  if (/^Partial\b/.test(cell)) return 'partial';
  return undefined;
};

interface Row {
  id: string;
  label: string;
  cells: string[];
  raw: string[];
  line: string;
}

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const table = tables(page.body).find((t) =>
    t.headers.some((h) => h.replace(/\*/g, '').trim() === 'Service'),
  );
  if (!table) {
    return { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'the services table was not found on the page' };
  }

  const columnOf = new Map(
    table.headers.map((h, i) => [h.replace(/\*/g, '').trim(), i] as const),
  );
  const notes = footnotes(page.body);

  const resolved: Row[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (const line of table.rawRows) {
    const raw = splitCells(line);
    const cells = raw.map(cellText);
    const label = cells[0] ?? '';
    if (!label) continue;
    const long = longForm(label);
    const svc = resolveService(label) ?? (long ? resolveService(long) : undefined);
    if (!svc) {
      unresolved.push({
        label,
        quote: line,
        reason: 'no entry in services.json matches this published service name',
      });
      continue;
    }
    resolved.push({ id: svc.id, label, cells, raw, line });
  }

  /**
   * Several rows can share one service id: the page lists Amazon Neptune and
   * Amazon RDS separately, both `rds`. One id can carry one verdict, so one row
   * has to represent it — the row that spells out the id, else the first row.
   */
  const groups = new Map<string, Row[]>();
  for (const row of resolved) groups.set(row.id, [...(groups.get(row.id) ?? []), row]);

  const rows: Row[] = [];
  const dropped: string[] = [];
  for (const [id, group] of groups) {
    const named = group.filter((r) => namesTheId(r.label, id));
    const keep = (named.length === 1 ? named[0] : group[0])!;
    rows.push(keep);
    for (const r of group) {
      if (r !== keep) dropped.push(`"${r.label}" also resolves to "${id}", represented by "${keep.label}"`);
    }
  }

  const features: Feature[] = [];
  for (const cap of CAPABILITIES) {
    const col = columnOf.get(cap.header);
    if (col === undefined) continue;

    const covered: EvidenceItem[] = [];
    const excluded: EvidenceItem[] = [];
    for (const row of rows) {
      const v = verdict(row.cells[col] ?? '');
      const item = { id: row.id, label: row.label, quote: row.line };
      if (v === 'yes') covered.push({ ...item, status: 'full' });
      else if (v === 'no') excluded.push({ ...item, status: 'full' });
      else if (v === 'partial') {
        const foot = notes.get(INFO.exec(row.raw[col] ?? '')?.[1] ?? '');
        const note = foot?.only
          ? `The page's footnote says: "${foot.only}"`
          : foot
            ? `${cap.partialNote} The page's footnote for this service, under "${foot.title}" in More information, gives the detail.`
            : cap.partialNote;
        covered.push({ ...item, status: 'partial', note });
      }
    }
    if (covered.length === 0) continue;

    features.push({
      id: cap.id,
      name: cap.name,
      serviceId: 'iam',
      scope: 'feature',
      whatIsCounted: cap.whatIsCounted,
      axis: 'service',
      derivation: 'enumerated',
      covered,
      excluded,
      unresolved,
      sourceUrl: URL_,
      bodySha256: page.sha256,
      parserId: PARSER_ID,
      notes: [
        `Read from the "${cap.header}" column of the services table. Yes is counted, Partial is counted as partial, No is an exclusion.`,
        `The table has ${table.rawRows.length} rows: ${rows.length} distinct services are counted, ${unresolved.length} names matched no entry in services.json and are listed in unresolved, and ${dropped.length} rows repeat a service another row already represents.`,
        ...(dropped.length ? [`Rows repeating a service already represented: ${dropped.join('; ')}.`] : []),
        // A column that excludes nobody measures membership of the page, not a capability.
        ...(excluded.length === 0
          ? [
              `Every service on this page says Yes to this column, so it excludes nothing. Read the number as which services this page covers, not as a capability that separates one service from another.`,
            ]
          : []),
      ],
    });
  }

  return features.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features }
    : { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'no capability column carried Yes or No data' };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
