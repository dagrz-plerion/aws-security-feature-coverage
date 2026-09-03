import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { normalizeSpaces, tables } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake-supported-regions.md';
const PARSER_ID = 'cloudtrail-lake-regions';

const LEAD = 'Currently, CloudTrail Lake is supported in the following AWS Regions:';

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const body = page.body;
  // Only the table introduced by the support sentence counts. The trailing text
  // points at the endpoints page and the GovCloud guide; a pointer is not coverage.
  const at = normalizeSpaces(body).indexOf(LEAD);
  const table = at === -1 ? undefined : tables(body.slice(at))[0];

  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];

  table?.rows.forEach((cells, i) => {
    const name = cells[0] ?? '';
    const code = cells[1] ?? '';
    const quote = table.rawRows[i] ?? '';
    if (!name || !code) return;
    const region = resolveRegion(code) ?? resolveRegion(name);
    if (!region) {
      unresolved.push({ label: `${name} (${code})`, quote, reason: 'no matching Region in regions.json' });
      return;
    }
    covered.push({ id: region.id, label: name, status: 'full', quote });
  });

  const feature: Feature = {
    id: 'cloudtrail/lake-regions',
    name: 'CloudTrail Lake',
    serviceId: 'cloudtrail',
    scope: 'feature',
    whatIsCounted: 'AWS Regions where CloudTrail Lake is supported',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The page names no Region as unsupported, so there are no exclusions to derive from.',
      'The page states CloudTrail Lake closes to new customers on May 31, 2026. That changes who can start using it, not which Regions support it.',
    ],
  };

  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features: covered.length ? [feature] : [],
    ...(covered.length ? {} : { noCoverageReason: 'the supported Regions table was not found on the page' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
