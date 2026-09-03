import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { sections, tables } from '../core/markdown.js';
import { resolveService, serviceCandidates } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/kms/latest/developerguide/conditions-kms.md';
const PARSER_ID = 'kms-condition-keys';

/** The one table on the page that states coverage, rather than showing an example. */
const TABLE_ANCHOR = 'viaService_table';

/** `athena.{{AWS_region}}.amazonaws.com`, with the underscore escaped as Markdown leaves it. */
const VIA_NAME = /([a-z0-9-]+)\.\{\{AWS\\?_region\}\}\.amazonaws\.com/;

/** services.json catalogue rows carry no IAM prefix, so they are never counted. */
const SYNTHETIC = /^(?:product|regional|doc):/;

/** Carve-outs the row itself states, keyed by the resolved service. */
const PARTIAL: Record<string, string> = {
  ec2: 'The ViaService name is marked "(EBS only)", so only Amazon EBS requests are reached, not Amazon EC2 generally.',
  bedrock: 'The table lists only Amazon Bedrock Model Copy, not Amazon Bedrock as a whole.',
  guardduty:
    'The ViaService name is malware-protection, so only GuardDuty Malware Protection requests are reached, not GuardDuty generally.',
};

const realService = (label: string): { id: string } | undefined => {
  const hit = resolveService(label);
  return hit && !SYNTHETIC.test(hit.id) ? hit : undefined;
};

const why = (name: string, prefix: string | undefined): string => {
  const via = prefix
    ? `its ViaService name ${prefix} is not an IAM service`
    : 'it gives no ViaService name';
  const catalogue = resolveService(name);
  if (catalogue)
    return `"${name}" matches only the catalogue row ${catalogue.id}, which has no IAM prefix, and ${via}`;
  const cands = serviceCandidates(name).map((c) => c.id);
  if (cands.length > 1) return `"${name}" is ambiguous between ${cands.join(' and ')}, and ${via}`;
  return `no service is named "${name}", and ${via}`;
};

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const block = sections(page.body).find((s) => s.anchor === TABLE_ANCHOR)?.block ?? '';
  const table = tables(block).find((t) => t.headers[0] === 'Service name');

  const rows = (table?.rows ?? []).map((row, i) => {
    const name = row[0] ?? '';
    const prefix = VIA_NAME.exec(row[1] ?? '')?.[1];
    return {
      name,
      prefix,
      quote: table?.rawRows[i] ?? '',
      byName: realService(name),
      byVia: prefix ? realService(`${prefix}.amazonaws.com`) : undefined,
    };
  });

  const viaIds = new Set(rows.map((r) => r.byVia?.id).filter((x): x is string => !!x));

  /**
   * The product name wins: it is what the page states coverage for (AWS Snowball
   * Edge, not the legacy importexport principal it still uses). It yields only
   * when it lands on a service that another row already states through its own
   * ViaService name — Amazon DocumentDB is an alias of rds, which four other rows
   * state directly, so this row's distinct claim is its own docdb-elastic name.
   */
  const pick = (r: (typeof rows)[number]): { id: string } | undefined =>
    r.byName && r.byVia && r.byVia.id !== r.byName.id && viaIds.has(r.byName.id)
      ? r.byVia
      : (r.byName ?? r.byVia);

  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    const hit = pick(r);
    if (!hit) {
      unresolved.push({ label: r.name, quote: r.quote, reason: why(r.name, r.prefix) });
      continue;
    }
    // Four rows share the rds ViaService name; the universe holds them as one service.
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    const note = PARTIAL[hit.id];
    covered.push({
      id: hit.id,
      label: r.name,
      status: note ? 'partial' : 'full',
      ...(note ? { note } : {}),
      quote: r.quote,
    });
  }

  const feature: Feature = {
    id: 'kms/via-service-supported-services',
    name: 'AWS KMS kms:ViaService condition key',
    serviceId: 'kms',
    scope: 'subfeature',
    whatIsCounted:
      'AWS services the page lists as supporting the kms:ViaService condition key in customer managed key policies',
    axis: 'service',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'Only the table under "Services that support the kms:ViaService condition key" is counted. The service principals in the example policy documents above it, and Amazon EBS in the kms:GrantIsForAWSResource prose, are examples, not coverage.',
      'The table has 96 rows: 89 count, 3 collapse onto a service another row already carries, and 4 resolve to no IAM service.',
      'Amazon Aurora, Amazon Neptune, Amazon RDS Performance Insights and Amazon Relational Database Service (Amazon RDS) all use the rds ViaService name and are one service in the universe, so they count once, labelled by the first of those rows.',
      'Amazon DocumentDB is an alias of rds in the universe, but its row states the docdb-elastic ViaService name, which is a service of its own. It is counted as docdb-elastic.',
      'Amazon GuardDuty is counted from its product name and marked partial, because its ViaService name is malware-protection, which reaches GuardDuty Malware Protection only.',
      'Where a row gives a second ViaService name (dax for Amazon ElastiCache, aoss for Amazon OpenSearch Service), only the service the row is about is counted.',
      'AWS DeepRacer is not counted. It resolves only to a products-directory catalogue row with no IAM prefix, and deepracer is not a service in the universe.',
      'The page says the services in the table might not be available in all Regions, so this is a count of services, not of service-Region pairs.',
    ],
  };

  return covered.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] }
    : {
        sourceUrl: URL_,
        parserId: PARSER_ID,
        features: [],
        noCoverageReason: 'the kms:ViaService service table was not found on the page',
      };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
