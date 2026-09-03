import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { normalizeSpaces, sections, tables, yesNo } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/directoryservice/latest/admin-guide/using-service-linked-roles.md';
const PARSER_ID = 'directory-service-slr-regions';

const SECTION = 'Supported Regions for Directory Service service-linked roles';

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const section = sections(page.body).find((s) => normalizeSpaces(s.title) === SECTION);
  const table = section ? tables(section.block)[0] : undefined;

  const covered: EvidenceItem[] = [];
  const excluded: EvidenceItem[] = [];
  const unresolved: Feature['unresolved'] = [];

  for (const [i, row] of (table?.rows ?? []).entries()) {
    const [name, code, support] = row;
    const supported = yesNo(support ?? '');
    if (supported === undefined) continue;
    const quote = table?.rawRows[i] ?? '';
    // The Region identity column carries the code; fall back to the Region name.
    const region = resolveRegion(code ?? '') ?? resolveRegion(name ?? '');
    if (!region) {
      unresolved.push({ label: `${name} (${code})`, quote, reason: 'no matching Region in regions.json' });
      continue;
    }
    (supported ? covered : excluded).push({
      id: region.id,
      label: `${name} (${code})`,
      status: 'full',
      quote,
    });
  }

  const feature: Feature = {
    id: 'ds/service-linked-role-regions',
    name: 'Directory Service service-linked role for hybrid directories',
    serviceId: 'ds',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions the page lists as supporting hybrid directory opt-in, which it gives as the only Regions where Directory Service uses the AWSServiceRoleForDirectoryService service-linked role',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded,
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The table measures hybrid directory opt-in support, not the service-linked role directly. Its column heading is "opt-in support" and its caption is "Hybrid directory opt-in Region support".',
      'The link to the role is one sentence: Directory Service "uses the AWSServiceRoleForDirectoryService role only in AWS Regions where you can opt-in to hybrid directories". That is an upper bound. It rules the role out everywhere else, but it does not promise the role in every Region of the table.',
      'Directory Service itself runs in more Regions than this. The page says it does not support service-linked roles in every Region where the service is available. That is not an "all Regions except X" statement, so Regions absent from the table are neither covered nor excluded.',
      'Every row of the table says Yes, so the page names no Region without support.',
      'This is not the same count as ds/managed-microsoft-ad-hybrid-regions, which reads a different page and counts Regions where an AWS Managed Microsoft AD (Hybrid Edition) directory can be created.',
    ],
  };

  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features: covered.length ? [feature] : [],
    ...(covered.length ? {} : { noCoverageReason: 'the hybrid directory opt-in Region table was not found' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
