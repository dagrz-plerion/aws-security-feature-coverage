import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { sections, tables, yesNo } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/acm/latest/userguide/acm-slr.md';
const PARSER_ID = 'acm-slr-regions';

const SECTION = 'Supported Regions for ACM SLRs';

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const block = sections(page.body).find((s) => s.title === SECTION)?.block ?? '';
  const table = tables(block).find((t) => t.headers.includes('Support in ACM'));

  const covered: EvidenceItem[] = [];
  const excluded: EvidenceItem[] = [];
  const unresolved: Feature['unresolved'] = [];

  if (table) {
    const name = table.headers.indexOf('Region name');
    const identity = table.headers.indexOf('Region identity');
    const support = table.headers.indexOf('Support in ACM');

    table.rows.forEach((row, i) => {
      const yes = yesNo(row[support] ?? '');
      if (yes === undefined) return;
      const quote = table.rawRows[i] ?? '';
      const label = `${row[name] ?? ''} (${row[identity] ?? ''})`.trim();
      // The Region identity cell is the reliable key; the name cell carries stray words.
      const region = resolveRegion(row[identity] ?? '') ?? resolveRegion(row[name] ?? '');
      if (!region) {
        unresolved.push({ label, quote, reason: 'no matching Region in regions.json' });
        return;
      }
      (yes ? covered : excluded).push({ id: region.id, label, status: 'full', quote });
    });
  }

  const feature: Feature = {
    id: 'acm/service-linked-role-regions',
    name: 'ACM service-linked roles',
    serviceId: 'acm',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions the page lists as supporting the ACM service-linked role (AWSServiceRoleForCertificateManager)',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded,
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The table is the only countable evidence. The prose says SLRs work "in all of the regions where both ACM and AWS Private CA are available", which is a condition on another service\'s footprint, not an "all Regions except X" statement, so Regions absent from the table are neither covered nor excluded.',
      'Every row of the table reads Yes, so the page names no unsupported Region.',
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
