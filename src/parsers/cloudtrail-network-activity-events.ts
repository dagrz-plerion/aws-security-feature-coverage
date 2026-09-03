import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { bullets, normalizeSpaces } from '../core/markdown.js';
import { resolveService, services } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-network-events-with-cloudtrail.md';
const PARSER_ID = 'cloudtrail-network-activity-events';

const INTRO = 'You can log network activity events for the following services:';

/** Carve-outs the page states inside a listed service. */
const PARTIAL: Record<string, string> = {
  s3: 'Amazon S3 Multi-Region Access Points are not supported.',
};

/**
 * Display names the services.json name index resolves wrongly or not at all.
 * The page names the same service twice — once as a bullet, once as an
 * `eventSource` principal — so the principal settles the identity. Each value
 * must appear in the page's own eventSource list or the row is left unresolved.
 */
const BY_PRINCIPAL: Record<string, string> = {
  // services.json hangs the alias "Billing and Cost Management" on budgets.
  'billing and cost management': 'billing.amazonaws.com',
  // services.json hangs the alias "AWS Data Exports" on cur (the older CUR API).
  'aws data exports': 'bcm-data-exports.amazonaws.com',
  // Only the products-directory row carries this name; it has no IAM prefix.
  'amazon lookout for vision': 'lookoutvision.amazonaws.com',
  // The name is shared by cloudhsm and cloudhsmv2.
  'aws cloudhsm': 'cloudhsm.amazonaws.com',
  // No services.json row publishes this name.
  'aws pricing calculator': 'bcm-pricing-calculator.amazonaws.com',
};

const key = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** A name shared by two services.json rows resolves to nothing rather than to one of them. */
const reasonFor = (label: string): string => {
  const hits = services.filter((s) => s.names.some((n) => key(n) === key(label)));
  return hits.length > 1
    ? `name is ambiguous across ${hits.map((h) => h.id).join(' and ')}`
    : 'no services.json entry carries this name';
};

/**
 * The list is the leading one, introduced by INTRO, and it ends at the first blank
 * line. An inline **Note** sits inside it, so the list cannot be cut at the first
 * non-bullet line. Everything below is configuration guidance and example event
 * records; the services those examples name are illustrations, never coverage.
 */
const introducedList = (body: string): { raw: string; value: string }[] => {
  // Raw lines, so a quote stays a verbatim substring of the page.
  const lines = body.split('\n');
  const at = (i: number): string => normalizeSpaces(lines[i] ?? '').trim();
  const start = lines.findIndex((_, i) => at(i) === INTRO);
  if (start < 0) return [];
  let end = start + 1;
  while (end < lines.length && at(end) !== '') end++;
  return bullets(lines.slice(start + 1, end).join('\n'), 0);
};

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const notes: string[] = [];
  const seen = new Map<string, string>();
  const body = normalizeSpaces(page.body);

  for (const item of introducedList(page.body)) {
    const principal = BY_PRINCIPAL[key(item.value)];
    const viaPrincipal = principal && body.includes(`\`${principal}\``);
    const service = resolveService(viaPrincipal ? principal : item.value);
    // A products-directory or regional catalogue row is not an IAM service.
    if (!service || service.id.includes(':')) {
      unresolved.push({ label: item.value, quote: item.raw, reason: reasonFor(item.value) });
      continue;
    }
    if (viaPrincipal)
      notes.push(`"${item.value}" is counted as ${service.id}, the service behind the page's own eventSource value ${principal}; the services.json name index alone does not reach it.`);
    const first = seen.get(service.id);
    if (first !== undefined) {
      notes.push(`"${item.value}" and "${first}" both resolve to ${service.id}; counted once.`);
      continue;
    }
    seen.set(service.id, item.value);
    const carveOut = PARTIAL[service.id];
    covered.push({
      id: service.id,
      label: item.value,
      status: carveOut ? 'partial' : 'full',
      ...(carveOut ? { note: carveOut } : {}),
      quote: item.raw,
    });
  }

  const feature: Feature = {
    id: 'cloudtrail/network-activity-events',
    name: 'CloudTrail network activity events',
    serviceId: 'cloudtrail',
    scope: 'feature',
    whatIsCounted:
      'AWS services whose VPC endpoint API calls CloudTrail can record as network activity events',
    axis: 'service',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      ...notes,
      'Counted from the leading list introduced by "You can log network activity events for the following services:" — 62 bullets. The example event selectors and event records further down name services and API operations as illustrations only, and are not counted.',
      'The page separately lists 76 valid values of the eventSource advanced event selector field. Those are field values, not axis items, so they are not counted. The two lists disagree in both directions: the eventSource list names 17 services with no bullet (among them ssm, iot, comprehend, rolesanywhere, voiceid and bedrock-agentcore) and the bullet list names services with no matching principal (AWS Systems Manager Incident Manager). Counting the union on the service axis would give 77.',
      'Network activity events are off by default. Coverage means the service can be configured as an event source, not that any event is being logged.',
    ],
  };

  return covered.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] }
    : { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'the introduced list of services was not found on the page' };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
