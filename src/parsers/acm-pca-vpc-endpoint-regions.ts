import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { bullets, normalizeSpaces } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/privateca/latest/userguide/vpc-endpoints.md';
const PARSER_ID = 'acm-pca-vpc-endpoint-regions';

/**
 * Only the bullets introduced by this sentence are coverage. The page also carries
 * Considerations bullets above it and a `{{region}}` endpoint example below it.
 */
const INTRO = 'AWS Private CA API currently supports VPC endpoints in the following AWS Regions:';

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const lines = page.body.split('\n');
  const start = lines.findIndex((l) => normalizeSpaces(l).trim() === INTRO);

  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];

  // The list ends at the first line that is not a bullet. Match normalized, quote raw.
  for (const raw of start < 0 ? [] : lines.slice(start + 1)) {
    const m = /^\+ (.*)$/.exec(normalizeSpaces(raw).trimEnd());
    if (!m?.[1]) break;
    const label = m[1].trim();
    const quote = raw.trimEnd();
    const region = resolveRegion(label);
    if (!region) {
      unresolved.push({ label, quote, reason: 'no matching Region in regions.json' });
      continue;
    }
    covered.push({ id: region.id, label, status: 'full', quote });
  }

  const feature: Feature = {
    id: 'acm-pca/vpc-endpoint-regions',
    name: 'AWS Private CA VPC endpoints (AWS PrivateLink)',
    serviceId: 'acm-pca',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions where the AWS Private CA API supports interface VPC endpoints (AWS PrivateLink)',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'Counted from the Region list the page enumerates. The `{{region}}` endpoint format and its "us-east-2" worked example are examples, not coverage.',
      'The page warns that some Availability Zones inside a supported Region may not offer the endpoint. Availability Zones are not an axis, so this does not change the count.',
    ],
  };

  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features: covered.length ? [feature] : [],
    ...(covered.length ? {} : { noCoverageReason: 'the Region list introducing AWS Private CA VPC endpoint support was not found' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
