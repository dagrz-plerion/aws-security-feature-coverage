import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { bullets, normalizeSpaces, sections } from '../core/markdown.js';
import { resolveResourceType } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-resources.md';
const PARSER_ID = 'access-analyzer-resource-types';

/**
 * The two lists word each resource kind in prose. One bullet, "AWS Lambda functions and
 * layers", names two resource types, so a bullet may carry more than one id. The detail
 * sections lower down repeat the same kinds; nothing is read from them except carve-outs.
 */
const MAPPING: { bullet: string; ids: { id: string; label: string }[] }[] = [
  { bullet: 'Amazon Simple Storage Service buckets', ids: [{ id: 'AWS::S3::Bucket', label: 'Amazon Simple Storage Service buckets' }] },
  { bullet: 'Amazon Simple Storage Service directory buckets', ids: [{ id: 'AWS::S3Express::DirectoryBucket', label: 'Amazon Simple Storage Service directory buckets' }] },
  { bullet: 'AWS Identity and Access Management roles', ids: [{ id: 'AWS::IAM::Role', label: 'AWS Identity and Access Management roles' }] },
  { bullet: 'AWS Key Management Service keys', ids: [{ id: 'AWS::KMS::Key', label: 'AWS Key Management Service keys' }] },
  {
    bullet: 'AWS Lambda functions and layers',
    ids: [
      { id: 'AWS::Lambda::Function', label: 'AWS Lambda functions' },
      { id: 'AWS::Lambda::LayerVersion', label: 'AWS Lambda layers' },
    ],
  },
  { bullet: 'Amazon Simple Queue Service queues', ids: [{ id: 'AWS::SQS::Queue', label: 'Amazon Simple Queue Service queues' }] },
  { bullet: 'AWS Secrets Manager secrets', ids: [{ id: 'AWS::SecretsManager::Secret', label: 'AWS Secrets Manager secrets' }] },
  { bullet: 'Amazon Simple Notification Service topics', ids: [{ id: 'AWS::SNS::Topic', label: 'Amazon Simple Notification Service topics' }] },
  { bullet: 'Amazon Elastic Block Store volume snapshots', ids: [{ id: 'ec2:snapshot', label: 'Amazon Elastic Block Store volume snapshots' }] },
  { bullet: 'Amazon Relational Database Service DB snapshots', ids: [{ id: 'AWS::RDS::DBSnapshot', label: 'Amazon Relational Database Service DB snapshots' }] },
  { bullet: 'Amazon Relational Database Service DB cluster snapshots', ids: [{ id: 'AWS::RDS::DBClusterSnapshot', label: 'Amazon Relational Database Service DB cluster snapshots' }] },
  { bullet: 'Amazon Elastic Container Registry repositories', ids: [{ id: 'AWS::ECR::Repository', label: 'Amazon Elastic Container Registry repositories' }] },
  { bullet: 'Amazon Elastic File System file systems', ids: [{ id: 'AWS::EFS::FileSystem', label: 'Amazon Elastic File System file systems' }] },
  { bullet: 'Amazon DynamoDB streams', ids: [{ id: 'AWS::DynamoDB::Stream', label: 'Amazon DynamoDB streams' }] },
  { bullet: 'Amazon DynamoDB tables', ids: [{ id: 'AWS::DynamoDB::Table', label: 'Amazon DynamoDB tables' }] },
];

/**
 * Carve-outs the detail sections state about external access only. `section` names the
 * detail heading the sentence must sit under: the S3 bucket and directory bucket notes
 * are word-for-word identical, so a page-wide search would let either one mark both.
 */
const EXTERNAL_PARTIAL: Record<string, { section: string; note: string; evidence: string }> = {
  'AWS::S3::Bucket': {
    section: 'Amazon Simple Storage Service buckets',
    note: 'Bucket policies, ACLs and access points are analysed, but the page states the access point policy attached to a cross-account access point is not.',
    evidence: 'doesn’t analyze the access point policy attached to cross-account access points',
  },
  'AWS::S3Express::DirectoryBucket': {
    section: 'Amazon Simple Storage Service directory buckets',
    note: 'The directory bucket policy is analysed, but the page states the access point policy attached to a cross-account access point is not.',
    evidence: 'doesn’t analyze the access point policy attached to cross-account access points',
  },
  'AWS::Lambda::Function': {
    section: 'AWS Lambda functions and layers',
    note: 'Only the resource-based policy attached to the function is analysed. The page states policies attached to aliases and to specific versions invoked using a qualified ARN are not.',
    evidence: "doesn't report external access based on resource-based policies attached to aliases and specific versions",
  },
};

const UNUSED_QUOTE = 'Unused access analyzers only support IAM users and roles.';

const UNUSED: { id: string; label: string }[] = [
  { id: 'AWS::IAM::User', label: 'IAM users' },
  { id: 'AWS::IAM::Role', label: 'IAM roles' },
];

const listUnder = (body: string, title: string): { raw: string; value: string }[] => {
  const s = sections(body).find((x) => x.title === title);
  return s ? bullets(s.text) : [];
};

/** The detail section's own text, so a carve-out is read only where it is written. */
const sectionText = (body: string, title: string): string =>
  normalizeSpaces(sections(body).find((x) => x.title === title)?.block ?? '');

/** Reads one bullet list into evidence, deduplicating by id inside the feature. */
const readList = (
  items: { raw: string; value: string }[],
  partial: Record<string, { section: string; note: string; evidence: string }>,
  body: string,
): { covered: EvidenceItem[]; unresolved: UnresolvedItem[] } => {
  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const row = MAPPING.find((m) => m.bullet === item.value);
    if (!row) {
      unresolved.push({ label: item.value, quote: item.raw, reason: 'no resource type wording matched this bullet' });
      continue;
    }
    for (const { id, label } of row.ids) {
      if (seen.has(id) || !resolveResourceType(id)) continue;
      seen.add(id);
      const carve = partial[id];
      const marked = carve && sectionText(body, carve.section).includes(normalizeSpaces(carve.evidence));
      covered.push({
        id,
        label,
        status: marked ? 'partial' : 'full',
        ...(marked ? { note: carve.note } : {}),
        quote: item.raw,
      });
    }
  }
  return { covered, unresolved };
};

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const text = normalizeSpaces(page.body);
  const base = { serviceId: 'access-analyzer', scope: 'feature' as const, axis: 'resourceType' as const, derivation: 'enumerated' as const, sourceUrl: URL_, bodySha256: page.sha256, parserId: PARSER_ID, excluded: [] as EvidenceItem[] };

  const external = readList(listUnder(page.body, 'Supported resource types for external access'), EXTERNAL_PARTIAL, page.body);
  const internal = readList(listUnder(page.body, 'Supported resource types for internal access'), {}, page.body);

  const features: Feature[] = [];

  if (external.covered.length)
    features.push({
      ...base,
      id: 'access-analyzer/external-access-resource-types',
      name: 'IAM Access Analyzer external access analysis',
      whatIsCounted:
        'AWS resource types whose resource-based policies an IAM Access Analyzer external access analyzer analyzes for access granted outside your zone of trust',
      covered: external.covered,
      unresolved: external.unresolved,
      notes: [
        'The bullet "AWS Lambda functions and layers" names two resource types, so 15 bullets yield 16 resource types.',
        'The detail sections lower on the page repeat the same resource kinds. They are read only for carve-outs, never counted again.',
        'Amazon Elastic Block Store volume snapshots are counted as ec2:snapshot, the id AWS Access Analyzer itself reports as AWS::EC2::Snapshot. The universe holds no AWS::EC2::Snapshot, and its ebs:snapshot row is the same physical resource under the EBS direct-API prefix, so counting both would double count.',
        'All 6 resource types of the internal access feature are also in this list. Do not add 16 and 6: the union of the two features is 16 resource types.',
        'The S3 bucket section also names access points and multi-Region access points. They are how a bucket grants access, not supported resource types of their own, so they are not counted.',
      ],
    });

  if (internal.covered.length)
    features.push({
      ...base,
      id: 'access-analyzer/internal-access-resource-types',
      name: 'IAM Access Analyzer internal access analysis',
      whatIsCounted:
        'AWS resource types an IAM Access Analyzer internal access analyzer analyzes for access granted to principals inside your organization or account',
      covered: internal.covered,
      unresolved: internal.unresolved,
      notes: [
        'Every one of these 6 resource types is also in the external access list. The two analyzer kinds are separate features, so each type is counted once in each. Do not add 16 and 6: the union of the two features is 16 resource types.',
        'The carve-outs the page states about cross-account access points are worded for external access findings, so nothing here is marked partial.',
      ],
    });

  const unused = text.includes(UNUSED_QUOTE)
    ? UNUSED.filter((u) => resolveResourceType(u.id)).map(
        (u): EvidenceItem => ({ id: u.id, label: u.label, status: 'full', quote: UNUSED_QUOTE }),
      )
    : [];

  if (unused.length)
    features.push({
      ...base,
      id: 'access-analyzer/unused-access-resource-types',
      name: 'IAM Access Analyzer unused access analysis',
      whatIsCounted: 'AWS resource types an IAM Access Analyzer unused access analyzer reviews for unused access',
      covered: unused,
      unresolved: [],
      notes: [
        'The page names these two resource types in one sentence, not in a bullet list. "IAM users and roles" is two resource types, counted once each.',
        'This page is about external and internal access. The unused access sentence is the whole of what it says about unused access analyzers, and the word "only" makes the two types exhaustive as stated here.',
      ],
    });

  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features,
    ...(features.length ? {} : { noCoverageReason: 'neither supported resource type list was found on the page' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
