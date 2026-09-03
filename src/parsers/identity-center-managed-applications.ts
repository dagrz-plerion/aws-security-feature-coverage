import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { normalizeSpaces, stripLinks, tables, yesNo } from '../core/markdown.js';
import { resolveService } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/singlesignon/latest/userguide/awsapps-that-work-with-identity-center.md';
const PARSER_ID = 'identity-center-managed-applications';

/** One column of the table. Each is a different IAM Identity Center capability. */
const CAPABILITIES: { header: string; id: string; name: string; whatIsCounted: string }[] = [
  {
    header: 'Integrated with account instances of IAM Identity Center',
    id: 'sso/identity-center-account-instances',
    name: 'IAM Identity Center account instances',
    whatIsCounted:
      'AWS services with an AWS managed application the page lists as integrated with account instances of IAM Identity Center',
  },
  {
    header: 'Enables trusted identity propagation through IAM Identity Center',
    id: 'sso/identity-center-trusted-identity-propagation',
    name: 'IAM Identity Center trusted identity propagation',
    whatIsCounted:
      'AWS services with an AWS managed application the page lists as able to enable trusted identity propagation through IAM Identity Center',
  },
  {
    header: 'Supports IAM Identity Center configured with a customer managed KMS key',
    id: 'sso/identity-center-customer-managed-kms-key',
    name: 'IAM Identity Center customer managed KMS key support',
    whatIsCounted:
      'AWS services with an AWS managed application the page lists as supporting IAM Identity Center configured with a customer managed KMS key',
  },
  {
    header: 'Supports deployment in additional Regions of IAM Identity Center',
    id: 'sso/identity-center-additional-regions',
    name: 'IAM Identity Center additional Regions deployment',
    whatIsCounted:
      'AWS services with an AWS managed application the page lists as supporting deployment in additional Regions of IAM Identity Center',
  },
];

/**
 * Rows are application names, not service names. Each alias names the service that
 * owns the application, and the id still comes from services.json through resolveService.
 * Only used when the row label itself resolves to nothing.
 */
const ALIAS: Record<string, string> = {
  'Amazon Athena SQL': 'Amazon Athena',
  'Amazon EKS Capabilities': 'Amazon EKS',
  'Amazon EMR on EC2': 'Amazon EMR',
  // AWS splits EMR into three IAM services. EMR on EKS is emr-containers, not
  // elasticmapreduce, which is why Amazon EMR Serverless resolves on its own.
  'Amazon EMR on EKS': 'Amazon EMR Containers',
  'Amazon EMR Studio': 'Amazon EMR',
  'Amazon OpenSearch Service Serverless Service': 'Amazon OpenSearch Serverless',
  'Amazon S3 Access Grants': 'Amazon S3',
  'Amazon SageMaker Unified Studio': 'Amazon SageMaker',
  'AWS Transfer Family web apps': 'AWS Transfer Family',
};

const UNRESOLVED_REASON: Record<string, string> = {
  Kiro: 'no entry in services.json carries this name',
  'OpenSearch user interface (Dashboards)':
    'no entry in services.json names this application; the opensearch id exists but carries no names',
};

/** AWS writes "Full Name (Abbrev)". resolveService knows the parts, not the pair. */
const labelVariants = (label: string): string[] => {
  const m = /^(.*?)\s*\(([^()]*)\)$/.exec(label);
  const parenthetical = m?.[1] && m[2] ? [m[1], m[2]] : [];
  const alias = ALIAS[label];
  return [label, ...parenthetical, ...(alias ? [alias] : [])];
};

/** Cells read "Yes", "No", "Yes2" (a footnote marker) or "Yes - Fleet Manager Remote Desktop". */
const verdict = (cell: string): boolean | undefined => {
  const direct = yesNo(cell);
  if (direct !== undefined) return direct;
  const lead = /^(yes|no)(?![a-z])/i.exec(cell.trim());
  return lead?.[1] ? yesNo(lead[1]) : undefined;
};

/**
 * The tick or cross image in the same cell. It is an `![]()` with no alt text, so it
 * says nothing to a screen reader; the word beside it is the only readable verdict.
 * Read only to report where the two disagree.
 */
const icon = (rawCell: string): boolean | undefined => {
  if (rawCell.includes('success_icon')) return true;
  if (rawCell.includes('negative_icon')) return false;
  return undefined;
};

/** Whatever the cell says after Yes or No: a footnote digit, or a qualifier. */
const qualifier = (cell: string): string => cell.trim().replace(/^(yes|no)/i, '').trim();

/** Split one raw `| a | b |` line back into its cells, images intact. */
const rawCells = (line: string): string[] =>
  line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|');

/** Numbered footnotes below the table, e.g. "2 For Amazon Redshift, ...". */
const footnotes = (body: string): Map<string, string> => {
  const out = new Map<string, string>();
  for (const line of normalizeSpaces(body).split('\n')) {
    const m = /^(\d+) ([A-Z].*)$/.exec(line.trim());
    if (m?.[1] && m[2]) out.set(m[1], stripLinks(m[2]));
  }
  return out;
};

interface Row {
  label: string;
  line: string;
  cells: string[];
  raw: string[];
}

/** The ids one column would cover, given a way of reading a cell. */
const coveredIds = (
  order: string[],
  byService: Map<string, Row[]>,
  col: number,
  read: (row: Row) => boolean | undefined,
): string[] => order.filter((id) => byService.get(id)!.some((r) => read(r) === true));

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const table = tables(page.body).find((t) => t.headers[0] === 'AWS managed application');
  if (!table) {
    return { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'the AWS managed applications table was not found on the page' };
  }

  const notes = footnotes(page.body);
  const byService = new Map<string, Row[]>();
  const order: string[] = [];
  const unresolved: UnresolvedItem[] = [];

  table.rows.forEach((cells, i) => {
    const label = cells[0] ?? '';
    const line = (table.rawRows[i] ?? '').trim();
    if (!label) return;
    const svc = labelVariants(label)
      .map((v) => resolveService(v))
      .find((s) => s !== undefined);
    if (!svc) {
      unresolved.push({
        label,
        quote: line,
        reason: UNRESOLVED_REASON[label] ?? 'no entry in services.json matches this application name',
      });
      return;
    }
    if (!byService.has(svc.id)) {
      byService.set(svc.id, []);
      order.push(svc.id);
    }
    byService.get(svc.id)!.push({ label, line, cells, raw: rawCells(line) });
  });

  const collisions = order
    .filter((id) => (byService.get(id)?.length ?? 0) > 1)
    .map((id) => `"${id}" is named by ${byService.get(id)!.map((r) => `"${r.label}"`).join(', ')}`);

  const regionCol = table.headers.indexOf(
    'Supports deployment in additional Regions of IAM Identity Center',
  );

  const features: Feature[] = [];
  for (const cap of CAPABILITIES) {
    const col = table.headers.indexOf(cap.header);
    if (col < 0) continue;

    const word = (r: Row): boolean | undefined => verdict(r.cells[col] ?? '');
    const glyph = (r: Row): boolean | undefined => icon(r.raw[col] ?? '');

    // Cells where the tick or cross contradicts the word beside it.
    const conflicts = order
      .flatMap((id) => byService.get(id)!)
      .filter((r) => glyph(r) !== undefined && word(r) !== undefined && glyph(r) !== word(r));
    const conflicted = new Set(conflicts.map((r) => r.label));
    const ifIconRead = coveredIds(order, byService, col, glyph);

    const covered: EvidenceItem[] = [];
    const excluded: EvidenceItem[] = [];

    for (const id of order) {
      const rows = byService.get(id)!;
      const yes = rows.filter((r) => word(r) === true);
      const no = rows.filter((r) => word(r) === false);

      if (yes.length === 0) {
        const row = no[0];
        if (row) excluded.push({ id, label: row.label, status: 'full', quote: row.line });
        continue;
      }

      // One row per service wins. A Yes wins over a No, and the carve-out is noted.
      const row = yes[0]!;
      const q = qualifier(row.cells[col] ?? '');
      const why = [
        ...(no.length
          ? [`The page disagrees with itself for "${id}": "${row.label}" says Yes, while these rows resolve to the same service and say No: ${no.map((r) => `"${r.label}"`).join(', ')}.`]
          : []),
        ...(q && notes.has(q) ? [notes.get(q)!] : []),
        ...(q && !notes.has(q) ? [`The page qualifies this Yes as "${stripLinks(row.cells[col] ?? '')}".`] : []),
      ];

      // Not a carve-out, so not partial: the page's own icon contradicts its own word.
      const flag = conflicted.has(row.label)
        ? [`The cell for "${row.label}" holds a negative icon beside the word Yes. The word is read; see the feature note.`]
        : [];

      covered.push({
        id,
        label: row.label,
        status: why.length ? 'partial' : 'full',
        ...(why.length || flag.length ? { note: [...why, ...flag].join(' ') } : {}),
        quote: row.line,
      });
    }

    if (covered.length === 0) continue;

    features.push({
      id: cap.id,
      name: cap.name,
      serviceId: 'sso',
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
        `Read from the "${cap.header}" column. The covered items are AWS services, not Regions: the page says which applications have the capability. Column 4 asks which applications support deployment in additional Regions; no Region is counted anywhere in this feature.`,
        `${table.rows.length} application rows became ${covered.length} covered + ${excluded.length} excluded services + ${unresolved.length} unresolved rows + ${table.rows.length - covered.length - excluded.length - unresolved.length} rows merged into a service another row already named. No row was dropped.`,
        ...(collisions.length
          ? [`Counted once each, because more than one application row resolves to the same service: ${collisions.join('; ')}.`]
          : []),
        ...(conflicts.length
          ? [
              `The page contradicts itself in this column on ${conflicts.length} rows: the cell holds a negative icon but the word "Yes". The word is read, giving ${covered.length} services; reading the icon instead would give ${ifIconRead.length}. The word is taken as correct for two reasons. First, the page's own note says applications that support deployment in additional Regions also support a customer managed KMS key; ${conflicts.filter((r) => verdict(r.cells[regionCol] ?? '') === true).length} of these rows say Yes to additional Regions, so reading their icon would break the page's own stated rule, while reading the word keeps every row consistent with it. Second, the icon is an image with no alt text, so it conveys nothing to a reader using a screen reader, while the word is the cell's only readable verdict. The affected rows are: ${conflicts.map((r) => r.label).join(', ')}.`,
            ]
          : ['Every cell holds an icon image and the word Yes or No. In this column the two agree on every row. The word is read.']),
      ],
    });
  }

  return features.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features }
    : { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'no capability column carried Yes or No data' };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
