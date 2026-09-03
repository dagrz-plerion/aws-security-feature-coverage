import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { tables } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-supported-regions.md';
const PARSER_ID = 'cloudtrail-regions';

/**
 * One table of Regions with a control plane endpoint each. The Region column carries
 * the code; the endpoint hostname also contains a code, so read only the Region column.
 */
const parse = (page: { body: string; sha256: string }): ParseResult => {
  const table = tables(page.body).find(
    (t) => t.headers[0] === 'Region name' && t.headers[1] === 'Region',
  );

  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const seen = new Set<string>();

  table?.rows.forEach((row, i) => {
    const code = row[1] ?? '';
    const label = row[0] ?? '';
    const quote = table.rawRows[i] ?? '';
    const region = resolveRegion(code);
    if (!region) {
      unresolved.push({ label: `${label} (${code})`, quote, reason: 'no region in regions.json matches this code' });
      return;
    }
    if (seen.has(region.id)) return;
    seen.add(region.id);
    covered.push({ id: region.id, label, status: 'full', quote });
  });

  const feature: Feature = {
    id: 'cloudtrail/supported-regions',
    name: 'AWS CloudTrail',
    serviceId: 'cloudtrail',
    scope: 'service',
    whatIsCounted: 'AWS Regions where CloudTrail is supported, each with a control plane endpoint',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'Regions absent from the table are not named as unsupported, so they are not exclusions.',
      'The page points at CloudTrail Lake supported Regions, the General Reference data plane endpoints, the AWS GovCloud (US) User Guide and the China endpoints guide. Those pointers are not coverage.',
    ],
  };

  return covered.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] }
    : { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'the Region table was not found on the page' };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
