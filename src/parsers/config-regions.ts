import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { sections, tables } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/config/latest/developerguide/config-region-support.md';
const PARSER_ID = 'config-regions';

const SECTION = 'List of Supported Regions';

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const block = sections(page.body).find((s) => s.title === SECTION)?.block ?? '';
  const table = tables(block).find((t) => t.headers.includes('Region Name') && t.headers.includes('Region'));

  const covered: EvidenceItem[] = [];
  const unresolved: Feature['unresolved'] = [];

  if (table) {
    const nameCol = table.headers.indexOf('Region Name');
    // "Region" is the code column; the endpoint hostname is never the key.
    const codeCol = table.headers.indexOf('Region');

    table.rows.forEach((row, i) => {
      const code = row[codeCol] ?? '';
      const name = row[nameCol] ?? '';
      const quote = table.rawRows[i] ?? '';
      const label = `${name} (${code})`.trim();
      const region = resolveRegion(code) ?? resolveRegion(name);
      if (!region) {
        unresolved.push({ label, quote, reason: 'no matching Region in regions.json' });
        return;
      }
      covered.push({ id: region.id, label, status: 'full', quote });
    });
  }

  const feature: Feature = {
    id: 'config/supported-regions',
    name: 'AWS Config',
    serviceId: 'config',
    scope: 'service',
    whatIsCounted: 'AWS Regions the page lists as Regions where you can enable AWS Config',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The Considerations section says some AWS Config features — resource types, managed rules, organizational rules, conformance packs, remediation actions, aggregators, advanced queries and the natural language query processor — run in a subset of these Regions, but it lists no Regions for any of them and only links to other pages. Each listed Region is counted in full for enabling AWS Config, which is what this number counts; the sub-features are counted on their own pages.',
      'Regions absent from the table (the China, ISO and European Sovereign Cloud partitions) are not named as unsupported, so they are neither covered nor excluded.',
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
