import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { tables, yesNo } from '../core/markdown.js';
import { resolveService, serviceCandidates } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_integrate_services_list.md';
const PARSER_ID = 'organizations-integrated-services';

/**
 * The service cell is a link followed by `<br />` and a description paragraph.
 * Only the link label names the service: one description even names a different
 * product than its own row. `yesNo` reads the verdict cells on its own.
 */
const linkLabel = (cell: string): string => (cell.split(/<br\s*\/?>/)[0] ?? '').trim();

const why = (label: string): string => {
  const cands = serviceCandidates(label);
  return cands.length > 1
    ? `this name is published by ${cands.length} services.json entries (${cands.map((c) => c.id).join(', ')}), so it is ambiguous`
    : 'no service in services.json matches this name, so it is not an item on the service axis';
};

interface Row {
  label: string;
  raw: string;
  serviceId?: string;
  trustedAccess?: boolean;
  delegatedAdmin?: boolean;
}

const readRows = (body: string): Row[] => {
  const table = tables(body).find(
    (t) => t.headers[0] === 'AWS service' && t.headers.some((h) => /trusted access/i.test(h)),
  );
  if (!table) return [];
  return table.rows.map((cells, i) => {
    const label = linkLabel(cells[0] ?? '');
    return {
      label,
      raw: table.rawRows[i] ?? '',
      serviceId: resolveService(label)?.id,
      trustedAccess: yesNo(cells[2] ?? ''),
      delegatedAdmin: yesNo(cells[3] ?? ''),
    };
  });
};

interface Column {
  id: string;
  header: string;
  name: string;
  whatIsCounted: string;
  value: (r: Row) => boolean | undefined;
}

const COLUMNS: Column[] = [
  {
    id: 'organizations/trusted-access',
    header: 'Supports trusted access',
    name: 'AWS Organizations trusted access',
    whatIsCounted:
      'AWS services that the page lists as supporting trusted access with AWS Organizations',
    value: (r) => r.trustedAccess,
  },
  {
    id: 'organizations/delegated-administrator',
    header: 'Supports delegated administrator',
    name: 'AWS Organizations delegated administrator',
    whatIsCounted:
      'AWS services that the page lists as supporting a delegated administrator account for AWS Organizations',
    value: (r) => r.delegatedAdmin,
  },
];

const buildFeature = (col: Column, rows: Row[], sha256: string): Feature => {
  const covered: EvidenceItem[] = [];
  const excluded: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const collisions: string[] = [];
  const unread: string[] = [];
  const seen = new Map<string, string>();

  for (const row of rows) {
    if (!row.serviceId) {
      unresolved.push({ label: row.label, quote: row.raw, reason: why(row.label) });
      continue;
    }
    const first = seen.get(row.serviceId);
    if (first !== undefined) {
      collisions.push(`"${row.label}" resolves to "${row.serviceId}", already counted for "${first}"; the first row is kept`);
      continue;
    }
    seen.set(row.serviceId, row.label);
    const value = col.value(row);
    if (value === undefined) {
      unread.push(row.label);
      continue;
    }
    const item: EvidenceItem = { id: row.serviceId, label: row.label, status: 'full', quote: row.raw };
    if (value) covered.push(item);
    else excluded.push(item);
  }

  return {
    id: col.id,
    name: col.name,
    serviceId: 'organizations',
    scope: 'feature',
    whatIsCounted: col.whatIsCounted,
    axis: 'service',
    derivation: 'enumerated',
    covered,
    excluded,
    unresolved,
    sourceUrl: URL_,
    bodySha256: sha256,
    parserId: PARSER_ID,
    notes: [
      `Read from the "${col.header}" column of the table. The quote is the whole table row, which carries the other column as well, so read the verdict from this column.`,
      'Trusted access and a delegated administrator are two different capabilities, so the page yields two features from the same table.',
      `${covered.length} covered + ${excluded.length} excluded + ${unresolved.length} unresolved = ${rows.length} rows in the table. The unresolved rows name a product or a feature that no services.json entry matches, or a name more than one entry publishes.`,
      ...collisions,
      ...(unread.length ? [`${unread.length} rows carried no readable Yes or No in this column and are counted nowhere: ${unread.join(', ')}.`] : []),
    ],
  };
};

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const rows = readRows(page.body);
  const features = rows.length
    ? COLUMNS.map((c) => buildFeature(c, rows, page.sha256)).filter((f) => f.covered.length > 0)
    : [];
  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features,
    ...(features.length ? {} : { noCoverageReason: 'the integrated services table was not found on the page' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
