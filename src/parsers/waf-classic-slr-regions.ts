import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { sections, tables, yesNo } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/waf/latest/developerguide/classic-using-service-linked-roles.md';
const PARSER_ID = 'waf-classic-slr-regions';

const REGIONS_SECTION = 'Supported Regions for AWS WAF Classic service-linked roles';

const parse = (page: { body: string; sha256: string }): ParseResult => {
  // Only the Regions section. The trust-policy bullets elsewhere name service
  // principals, and the end-of-life warning names no Region at all.
  const section = sections(page.body).find((s) => s.title === REGIONS_SECTION);
  const table = section ? tables(section.block)[0] : undefined;

  const covered: EvidenceItem[] = [];
  const excluded: EvidenceItem[] = [];
  const unresolved: Feature['unresolved'] = [];

  table?.rows.forEach((row, i) => {
    const [name, code, support] = row;
    const supported = yesNo(support ?? '');
    if (supported === undefined || !code) return;
    const quote = table.rawRows[i] ?? '';
    // The code column is authoritative; the Region name is only wording.
    const region = resolveRegion(code);
    if (!region) {
      unresolved.push({ label: `${name} (${code})`, quote, reason: 'no Region matched the Region Identity code' });
      return;
    }
    (supported ? covered : excluded).push({
      id: region.id,
      label: `${name} (${code})`,
      status: 'full',
      quote,
    });
  });

  const feature: Feature = {
    id: 'waf/classic-service-linked-role-regions',
    name: 'AWS WAF Classic service-linked roles',
    serviceId: 'waf',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions where AWS WAF Classic supports the AWSServiceRoleForWAFLogging and AWSServiceRoleForWAFRegionalLogging service-linked roles',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded,
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'AWS WAF Classic is going through a planned end-of-life process, so this coverage is being withdrawn. The page tells readers to check their AWS Health dashboard for milestones and dates specific to their Region.',
      'The roles are used only for writing web ACL logs to Amazon Data Firehose, and only when you enable AWS WAF Classic logging.',
      'This is AWS WAF Classic (IAM prefix waf), not the current AWS WAF (wafv2).',
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
