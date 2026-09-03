import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { bullets, normalizeSpaces, sections } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/security-ir/latest/userguide/using-service-linked-roles.md';
const PARSER_ID = 'security-ir-slr-regions';

const REGION_SECTION = 'Supported regions for AWS Security Incident Response service-linked roles';

/** The page writes us-east-1 without the "N.", which regions.json keeps. */
const ALIAS: Record<string, string> = { 'US East (Virginia)': 'US East (N. Virginia)' };

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const section = sections(page.body).find((s) => normalizeSpaces(s.title) === REGION_SECTION);
  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const seen = new Set<string>();

  for (const item of bullets(section?.block ?? '')) {
    const region = resolveRegion(ALIAS[item.value] ?? item.value);
    if (!region) {
      unresolved.push({ label: item.value, quote: item.raw, reason: 'no matching Region in regions.json' });
      continue;
    }
    if (seen.has(region.id)) continue;
    seen.add(region.id);
    covered.push({ id: region.id, label: item.value, status: 'full', quote: item.raw });
  }

  const feature: Feature = {
    id: 'security-ir/service-linked-role-regions',
    name: 'AWS Security Incident Response service-linked roles',
    serviceId: 'security-ir',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions where AWS Security Incident Response supports using its service-linked roles',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The page states one Region list for both AWSServiceRoleForSecurityIncidentResponse and AWSServiceRoleForSecurityIncidentResponse_Triage, so this is one feature, not one per role.',
      'The page ties the list to where the service itself runs: "AWS Security Incident Response supports using service-linked roles in all of the regions where the service is available."',
      'The page names no unsupported Region, so there are no exclusions.',
      'One local alias is applied: the page writes "US East (Virginia)", which regions.json holds as "US East (N. Virginia)" (us-east-1). No other Region name on the page is hand-mapped.',
    ],
  };

  return covered.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] }
    : {
        sourceUrl: URL_,
        parserId: PARSER_ID,
        features: [],
        noCoverageReason: 'the supported Regions section listed no Region that resolved',
      };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
