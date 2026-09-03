import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { bullets, normalizeSpaces } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/verified-access/latest/ug/fips-compliance.md';
const PARSER_ID = 'verified-access-fips-regions';

const INTRO = 'FIPS compliance for Verified Access is available in the following AWS Regions:';

/**
 * Only the bullets between the introducing sentence and the blank line after it are
 * Regions. The rest of the page is setup steps naming instances, groups, endpoints and
 * trust providers, so extraction is anchored to that run rather than to the whole page.
 */
const regionBullets = (body: string): { raw: string; value: string }[] => {
  const lines = normalizeSpaces(body).split('\n');
  const start = lines.findIndex((l) => l.includes(INTRO));
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && !l.startsWith('+ '));
  return bullets(body.split('\n').slice(start + 1, end < 0 ? lines.length : end).join('\n'));
};

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (const b of regionBullets(page.body)) {
    const region = resolveRegion(b.value);
    if (!region) {
      unresolved.push({ label: b.value, quote: b.raw, reason: 'no entry in regions.json matched this Region name' });
      continue;
    }
    covered.push({ id: region.id, label: b.value, status: 'full', quote: b.raw });
  }

  const feature: Feature = {
    id: 'verified-access/fips-compliance-regions',
    name: 'AWS Verified Access FIPS compliance',
    serviceId: 'verified-access',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions where a Verified Access environment can be configured to adhere to FIPS Publication 140-2',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The page writes the GovCloud Regions as "AWS GovCloud (US) West" and "AWS GovCloud (US) East"; regions.json spells them "AWS GovCloud (US-West)" and "AWS GovCloud (US-East)". Both wordings resolve to the same Regions.',
      'FIPS compliance is switched on when the Verified Access instance is created. An existing instance must be deleted and re-created, so coverage means the Region allows the setting, not that any environment uses it.',
    ],
  };

  return covered.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] }
    : { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'no Region was listed under the FIPS availability sentence' };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
