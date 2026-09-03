import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { tables } from '../core/markdown.js';
import { resolveResourceType } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/ram/latest/userguide/shareable.md';
const PARSER_ID = 'ram-shareable-resource-types';

/** Columns of the per-service tables. Column 1 is the use case, which is not read. */
const COLUMN = { iam: 2, outside: 3, customerManaged: 4, servicePrincipal: 5 } as const;

const CAPABILITIES: { key: keyof typeof COLUMN; id: string; name: string; counted: string }[] = [
  {
    key: 'iam',
    id: 'ram/share-with-iam-users-and-roles',
    name: 'AWS RAM sharing with IAM users and roles',
    counted: 'shareable resource types that AWS RAM can share with individual IAM roles and users, not only with accounts',
  },
  {
    key: 'outside',
    id: 'ram/share-outside-organization',
    name: 'AWS RAM sharing outside the organization',
    counted: 'shareable resource types that AWS RAM can share with accounts outside the owning account organization',
  },
  {
    key: 'customerManaged',
    id: 'ram/customer-managed-permissions',
    name: 'AWS RAM customer managed permissions',
    counted: 'shareable resource types that accept customer managed permissions, not only AWS managed permissions',
  },
  {
    key: 'servicePrincipal',
    id: 'ram/share-with-service-principals',
    name: 'AWS RAM sharing with service principals',
    counted: 'shareable resource types that AWS RAM can share with AWS service principals',
  },
];

const SUBSET_NOTE =
  'A subset of the resource types on "AWS RAM resource sharing". The four sharing capabilities on this page are separate capabilities measured on the same resource types, so counting each one is not double counting.';

const flat = (s: string): string => s.replace(/-/g, '').toLowerCase();

const kebab = (s: string): string =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

/**
 * Two codes no re-spelling reaches, where the row itself names the type.
 * `s3:AccessGrants` — the row reads "Create and manage S3 Access Grants Instance
 * centrally". `rds:Cluster` — the row is "Aurora DB Clusters" under Amazon Aurora,
 * which is AWS::RDS::DBCluster; the bare code matches only AWS::DocDB::DBCluster.
 */
const ALIAS: Record<string, string> = {
  's3:AccessGrants': 'AWS::S3::AccessGrantsInstance',
  'rds:Cluster': 'AWS::RDS::DBCluster',
};

/**
 * resource-types.json says AWS spells one type three ways, but the page uses a fourth,
 * `service:CamelCase`. These are the same string re-spelled, never a different type.
 */
const spellings = (code: string): string[] => {
  const i = code.indexOf(':');
  if (i < 0) return [code];
  const service = code.slice(0, i);
  const type = code.slice(i + 1);
  return [
    ...(ALIAS[code] ? [ALIAS[code]] : []),
    code,
    `${service}:${kebab(type)}`,
    `AWS::${service}::${type}`,
    `AWS::${flat(service)}::${type}`,
    `AWS::${flat(service)}::${flat(type)}`,
  ];
};

/**
 * An alias may sit on a type of another service — `rds:cluster` is held by
 * AWS::DocDB::DBCluster. Such a match is refused rather than counted wrongly.
 */
const ownedBy = (t: { id: string; serviceId: string; cloudFormationType?: string }, service: string): boolean => {
  const segment = t.cloudFormationType?.split('::')[1] ?? t.serviceId;
  return flat(segment).startsWith(flat(service));
};

const resolveCode = (code: string, name: string): { id?: string; rejected?: string } => {
  const service = code.includes(':') ? code.slice(0, code.indexOf(':')) : undefined;
  let rejected: string | undefined;
  for (const spelling of [...spellings(code), name]) {
    const hit = resolveResourceType(spelling);
    if (!hit) continue;
    if (!service || ownedBy(hit, service)) return { id: hit.id };
    rejected ??= hit.id;
  }
  return { rejected };
};

const cells = (row: string): string[] =>
  row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|');

/** A Yes/No cell carries an icon image and may carry a qualifier after `<br />`. */
const verdict = (cell: string): boolean | undefined => {
  const word = cell.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<br \/>[\s\S]*$/, '').trim().toLowerCase();
  return word === 'yes' ? true : word === 'no' ? false : undefined;
};

interface Row {
  ids: { id: string; label: string }[];
  quote: string;
  verdicts: Record<keyof typeof COLUMN, boolean | undefined>;
  /** Set when a Yes/No cell says Yes for one sub-kind and No for another. */
  carveOut: Partial<Record<keyof typeof COLUMN, string>>;
}

const parse = (page: { body: string; sha256: string }): ParseResult => {
  // The first table on the page is a legend for the Yes/No columns, and has no headers.
  const data = tables(page.body).filter((t) => t.headers[0] === 'Resource type and code');
  const rows: Row[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (const table of data) {
    table.rawRows.forEach((raw, i) => {
      const cell = cells(raw);
      const first = cell[0] ?? '';
      const codes = [...first.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? '');
      const name = (first.split(/<br \/>|`/)[0] ?? '').trim();
      const ids: { id: string; label: string }[] = [];

      for (const code of codes.length ? codes : [name]) {
        const { id, rejected } = resolveCode(code, name);
        if (id) ids.push({ id, label: `${name} (${code})` });
        else
          unresolved.push({
            label: `${name} (${code})`,
            quote: first.trim(),
            reason: rejected
              ? `"${code}" matches only ${rejected}, a resource type of another service`
              : `no resource type matches the code "${code}"`,
          });
      }
      if (ids.length === 0) return;

      const verdicts = {} as Record<keyof typeof COLUMN, boolean | undefined>;
      const carveOut: Row['carveOut'] = {};
      for (const [key, index] of Object.entries(COLUMN) as [keyof typeof COLUMN, number][]) {
        const text = cell[index] ?? '';
        verdicts[key] = verdict(text);
        if (verdicts[key] === undefined && /(^|\s)Yes for /.test(text))
          carveOut[key] = text
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            .replace(/<br \/>/g, ' ')
            .replace(/\*\*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
      }
      rows.push({ ids, quote: (table.rawRows[i] ?? raw).trim(), verdicts, carveOut });
    });
  }

  const feature = (
    id: string,
    name: string,
    counted: string,
    covered: EvidenceItem[],
    excluded: EvidenceItem[],
    notes: string[],
    unresolvedHere: UnresolvedItem[] = [],
  ): Feature => ({
    id,
    name,
    serviceId: 'ram',
    scope: 'feature',
    whatIsCounted: counted,
    axis: 'resourceType',
    derivation: 'enumerated',
    covered,
    excluded,
    unresolved: unresolvedHere,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes,
  });

  const seen = new Set<string>();
  const base: EvidenceItem[] = [];
  for (const row of rows)
    for (const { id, label } of row.ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      base.push({ id, label, status: 'full', quote: row.quote });
    }

  const features: Feature[] = [
    feature(
      'ram/shareable-resource-types',
      'AWS RAM resource sharing',
      'AWS resource types that can be shared with other accounts by using AWS RAM',
      base,
      [],
      [
        'One row per resource type across 41 per-service tables. The section headings name services, not resource types, and are not counted.',
        'The AWS Network Firewall rule group row names two resource types, stateful and stateless rule groups, and is counted as two.',
        'Coverage means the type can be put in a resource share, not that any resource is shared.',
        'The four AWS RAM sharing capability features on this page are subsets of this feature, not independent measurements. Read this number first.',
      ],
      unresolved,
    ),
  ];

  for (const cap of CAPABILITIES) {
    const covered: EvidenceItem[] = [];
    const excluded: EvidenceItem[] = [];
    const taken = new Set<string>();
    for (const row of rows) {
      const yes = row.verdicts[cap.key];
      const carve = row.carveOut[cap.key];
      for (const { id, label } of row.ids) {
        if (taken.has(id)) continue;
        taken.add(id);
        if (yes === true) covered.push({ id, label, status: 'full', quote: row.quote });
        else if (yes === false) excluded.push({ id, label, status: 'full', quote: row.quote });
        else if (carve) covered.push({ id, label, status: 'partial', note: carve, quote: row.quote });
      }
    }
    if (covered.length)
      features.push(feature(cap.id, cap.name, cap.counted, covered, excluded, [SUBSET_NOTE]));
  }

  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features: base.length ? features : [],
    ...(base.length ? {} : { noCoverageReason: 'no shareable resource type on the page resolved to a known resource type' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
