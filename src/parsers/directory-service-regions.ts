import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { tables, yesNo } from '../core/markdown.js';
import type { Table } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/directoryservice/latest/admin-guide/regions.md';
const PARSER_ID = 'directory-service-regions';

interface Column {
  header: string;
  id: string;
  name: string;
  serviceId: string;
  counted: string;
  notes: string[];
}

const OVERLAP =
  'The directory-type features on this page overlap: a Region may offer several directory types, so the numerators must never be added together.';
const COLUMN_QUOTE =
  'Each quote is the table row cut off at the column this feature reads, so the last Yes or No in the quote is the verdict for this directory type.';
const NOT_COVERAGE =
  'The Endpoint column is a hostname and the Protocol column is always HTTPS; neither states coverage.';

/**
 * Table 1: AWS Directory Service itself (ds.* endpoints). One column per
 * directory type. Each is a separate product with its own Region list, so each
 * becomes its own feature rather than one "Directory Service" feature.
 */
const DS_COLUMNS: Column[] = [
  {
    header: 'AWS Managed Microsoft AD (Standard and Enterprise Editions)',
    id: 'ds/managed-microsoft-ad-standard-enterprise-regions',
    name: 'AWS Managed Microsoft AD (Standard and Enterprise Editions)',
    serviceId: 'ds',
    counted:
      'AWS Regions where the first table states an AWS Managed Microsoft AD (Standard and Enterprise Editions) directory can be created',
    notes: [],
  },
  {
    header: 'AWS Managed Microsoft AD (Hybrid Edition)',
    id: 'ds/managed-microsoft-ad-hybrid-regions',
    name: 'AWS Managed Microsoft AD (Hybrid Edition)',
    serviceId: 'ds',
    counted:
      'AWS Regions where the first table states an AWS Managed Microsoft AD (Hybrid Edition) directory can be created',
    notes: [
      'Hybrid Edition is a separate column from Standard and Enterprise Editions and has a shorter Region list, so it is counted separately.',
    ],
  },
  {
    // "AD Connector" alone is a published name of the ds service, so it is qualified.
    header: 'AD Connector',
    id: 'ds/ad-connector-regions',
    name: 'AWS Directory Service AD Connector',
    serviceId: 'ds',
    counted:
      'AWS Regions where the first table states an AD Connector directory can be created',
    notes: [
      'The name is qualified because "AD Connector" on its own is a published name of the AWS Directory Service service. This feature is one directory type, not the whole service.',
    ],
  },
  {
    header: 'Simple AD',
    id: 'ds/simple-ad-regions',
    name: 'Simple AD',
    serviceId: 'ds',
    counted: 'AWS Regions where the first table states a Simple AD directory can be created',
    notes: [],
  },
];

/**
 * Table 2: AWS Directory Service Data (ds-data.* endpoints), a different IAM
 * service on the same page. Only the AWS Managed Microsoft AD column carries a
 * Yes; the other two columns are No in every listed Region and so yield no
 * feature.
 */
const DS_DATA_COLUMNS: Column[] = [
  {
    header: 'AWS Managed Microsoft AD',
    id: 'ds-data/managed-microsoft-ad-regions',
    name: 'Directory Service Data for AWS Managed Microsoft AD',
    serviceId: 'ds-data',
    counted:
      'AWS Regions where the Directory Service Data table states the API supports AWS Managed Microsoft AD directories',
    notes: [
      'This is the second table on the page, whose endpoints are ds-data.*. It is a different IAM service from the ds table above and is counted separately.',
      'That table lists 18 Regions. The AD Connector and Simple AD columns say No in every one of them, so neither becomes a feature.',
      'On the Europe (Ireland) row the Simple AD cell renders the affirmative icon beside the word "No". The word is read, matching identity-center-managed-applications, which faces the same icon-versus-word conflict.',
    ],
  },
  { header: 'AD Connector', id: 'ds-data/ad-connector-regions', name: 'Directory Service Data for AD Connector', serviceId: 'ds-data', counted: 'AWS Regions where the Directory Service Data table states the API supports AD Connector directories', notes: [] },
  { header: 'Simple AD', id: 'ds-data/simple-ad-regions', name: 'Directory Service Data for Simple AD', serviceId: 'ds-data', counted: 'AWS Regions where the Directory Service Data table states the API supports Simple AD directories', notes: [] },
];

/**
 * The row cut off after the cell this feature reads, so the quote ends on that
 * column's own verdict rather than on a neighbouring column's.
 */
const rowThroughCell = (raw: string, cell: number): string => {
  let at = -1;
  for (let n = 0; n <= cell + 1; n++) {
    at = raw.indexOf('|', at + 1);
    if (at < 0) return raw;
  }
  return raw.slice(0, at + 1);
};

const featuresFrom = (table: Table, columns: Column[], sha256: string, shared: string[]): Feature[] => {
  const nameCol = table.headers.indexOf('Region name');
  const codeCol = table.headers.indexOf('Region');
  const out: Feature[] = [];

  for (const col of columns) {
    const cell = table.headers.indexOf(col.header);
    if (cell < 0) continue;

    const covered: EvidenceItem[] = [];
    const excluded: EvidenceItem[] = [];
    const unresolved: Feature['unresolved'] = [];

    table.rows.forEach((row, i) => {
      const answer = yesNo(row[cell] ?? '');
      if (answer === undefined) return;
      const quote = rowThroughCell(table.rawRows[i] ?? '', cell);
      const label = row[nameCol] ?? '';
      // Only the Region column is resolved. The Endpoint column also holds a
      // Region code and would resolve, so it is never passed in.
      const region = resolveRegion(row[codeCol] ?? '');
      if (!region) {
        unresolved.push({ label, quote, reason: 'no entry in regions.json matched this Region' });
        return;
      }
      const item: EvidenceItem = { id: region.id, label, status: 'full', quote };
      (answer ? covered : excluded).push(item);
    });

    // A column that is No everywhere states no coverage, so it yields no feature.
    if (covered.length === 0) continue;

    out.push({
      id: col.id,
      name: col.name,
      serviceId: col.serviceId,
      scope: 'feature',
      whatIsCounted: col.counted,
      axis: 'region',
      derivation: 'enumerated',
      covered,
      excluded,
      unresolved,
      sourceUrl: URL_,
      bodySha256: sha256,
      parserId: PARSER_ID,
      notes: [...shared, ...col.notes],
    });
  }
  return out;
};

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const all = tables(page.body);
  // The Hybrid Edition column exists only in the ds table; ds-data endpoints
  // identify the second one.
  const dsTable = all.find((t) => t.headers.includes('AWS Managed Microsoft AD (Hybrid Edition)'));
  const dataTable = all.find((t) => t.rows.some((r) => r.some((c) => c.startsWith('ds-data.'))));

  const features: Feature[] = [
    ...(dsTable
      ? featuresFrom(dsTable, DS_COLUMNS, page.sha256, [
          'The first table lists one row per Region and one Yes/No column per directory type. A Yes is coverage for that directory type only.',
          NOT_COVERAGE,
          COLUMN_QUOTE,
          OVERLAP,
          'The second table on the page is AWS Directory Service Data (ds-data) and is counted as its own feature, not folded into these.',
        ])
      : []),
    ...(dataTable
      ? featuresFrom(dataTable, DS_DATA_COLUMNS, page.sha256, [NOT_COVERAGE, COLUMN_QUOTE, OVERLAP])
      : []),
  ];

  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features,
    ...(features.length
      ? {}
      : { noCoverageReason: 'no directory type column stated an available Region' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
