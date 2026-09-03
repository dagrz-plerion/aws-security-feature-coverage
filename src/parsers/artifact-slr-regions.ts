import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { sections, tables, yesNo } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/artifact/latest/ug/using-service-linked-roles.md';
const PARSER_ID = 'artifact-slr-regions';

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const section = sections(page.body).find((s) =>
    /^Supported Regions for AWS Artifact service-linked roles$/.test(s.title),
  );
  const table = section ? tables(section.block)[0] : undefined;

  const covered: EvidenceItem[] = [];
  const excluded: EvidenceItem[] = [];
  const unresolved: Feature['unresolved'] = [];

  const cols = table
    ? {
        name: table.headers.indexOf('Region name'),
        id: table.headers.indexOf('Region identity'),
        support: table.headers.findIndex((h) => /^Support in/.test(h)),
      }
    : undefined;

  if (table && cols && cols.id >= 0 && cols.support >= 0) {
    table.rows.forEach((row, i) => {
      const quote = table.rawRows[i] ?? '';
      // Same label shape as the other service-linked-role Region parsers: name (code).
      const label = `${row[cols.name] ?? ''} (${row[cols.id] ?? ''})`.trim();
      const supported = yesNo(row[cols.support] ?? '');
      if (supported === undefined) return;
      // The Region identity cell carries the code, which resolves more reliably than the name.
      const region = resolveRegion(row[cols.id] ?? '') ?? resolveRegion(row[cols.name] ?? '');
      if (!region) {
        unresolved.push({ label, quote, reason: 'no matching Region in regions.json' });
        return;
      }
      (supported ? covered : excluded).push({ id: region.id, label, status: 'full', quote });
    });
  }

  const feature: Feature = {
    id: 'artifact/service-linked-role-regions',
    name: 'AWS Artifact service-linked roles',
    serviceId: 'artifact',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions where the AWSServiceRoleForArtifact service-linked role can be used',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded,
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The page states AWS Artifact does not support service-linked roles in every Region where the service is available, so coverage is only what the table marks Yes.',
      'The table names 25 Regions. Regions it does not name are neither covered nor excluded.',
    ],
  };

  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features: covered.length ? [feature] : [],
    ...(covered.length ? {} : { noCoverageReason: 'the supported-Regions table was not found or marks no Region Yes' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
