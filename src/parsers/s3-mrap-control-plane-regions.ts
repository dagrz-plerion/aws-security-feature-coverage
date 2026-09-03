import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { normalizeSpaces } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/MrapOperations.md';
const PARSER_ID = 's3-mrap-control-plane-regions';

/**
 * The page states two separate Region restrictions and nothing else countable. The
 * first sentence names one Region for create-or-maintain control plane requests. A
 * later section names five Regions that route configuration commands can be run
 * against. They are different operation groups, so they are two features. Everything
 * else on the page is API operation names, an SDK compatibility link, or Region codes
 * inside `{{user input placeholders}}` in sample commands.
 */
const CONTROL_PLANE =
  /All control plane requests to create or maintain Multi-Region Access Points must be routed to the `([^`]+)` Region\./;

const ROUTE_REGIONS =
  /Multi-Region Access Point route commands can be run against the following five Regions:\n((?:\+ `[a-z0-9-]+`\n)+)/;

/**
 * The regexes run over `normalizeSpaces(body)`, which substitutes single characters
 * and so keeps every offset. Slicing the raw body at the match offset therefore gives
 * a quote that is byte-exact even if AWS reflows the sentence with a hard space.
 */
const rawMatch = (body: string, hit: RegExpExecArray): string =>
  body.slice(hit.index, hit.index + hit[0].length);

const base = (page: { sha256: string }) => ({
  serviceId: 's3',
  scope: 'subfeature' as const,
  axis: 'region' as const,
  derivation: 'enumerated' as const,
  excluded: [],
  unresolved: [],
  sourceUrl: URL_,
  bodySha256: page.sha256,
  parserId: PARSER_ID,
});

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const text = normalizeSpaces(page.body);
  const features: Feature[] = [];

  const cpHit = CONTROL_PLANE.exec(text);
  const cpRegion = cpHit?.[1] ? resolveRegion(cpHit[1]) : undefined;
  if (cpHit && cpRegion) {
    features.push({
      ...base(page),
      id: 's3/mrap-control-plane-regions',
      name: 'S3 Multi-Region Access Point control plane',
      whatIsCounted:
        'Regions that accept control plane requests to create or maintain an S3 Multi-Region Access Point',
      covered: [
        {
          id: cpRegion.id,
          label: cpHit[1] as string,
          status: 'full',
          quote: rawMatch(page.body, cpHit),
        },
      ],
      notes: [
        'A numerator of 1 is a RESTRICTION, not weak coverage. Create-or-maintain requests are accepted in exactly one Region; the other 45 reject them by design. Do not read this as "S3 works in 1 of 46 Regions".',
        'The Multi-Region Access Point itself spans buckets in many Regions. This counts only where the control plane request must be sent.',
        'Route configuration commands have their own, wider Region restriction. It is counted as a separate feature, and the two numerators must never be added.',
        'The page also says failover control plane requests go to "one of the five supported Regions" but names none of them in that sentence.',
        'API operations, the AWS SDK compatibility link and Region codes inside sample commands are not items on any axis and are ignored.',
      ],
    });
  }

  const rtHit = ROUTE_REGIONS.exec(text);
  if (rtHit?.[1]) {
    const quote = rawMatch(page.body, rtHit).trimEnd();
    const unresolved: Feature['unresolved'] = [];
    const covered: EvidenceItem[] = [];
    for (const line of rtHit[1].trim().split('\n')) {
      const label = line.replace(/^\+ /, '').replace(/`/g, '').trim();
      const region = resolveRegion(label);
      if (!region) {
        unresolved.push({ label, quote, reason: 'no matching Region in regions.json' });
        continue;
      }
      if (covered.some((c) => c.id === region.id)) continue;
      covered.push({ id: region.id, label, status: 'full', quote });
    }
    if (covered.length) {
      features.push({
        ...base(page),
        id: 's3/mrap-route-configuration-regions',
        name: 'S3 Multi-Region Access Point route configuration',
        whatIsCounted:
          'Regions that S3 Multi-Region Access Point route configuration commands can be run against',
        covered,
        unresolved,
        notes: [
          'A numerator of 5 is a RESTRICTION, not weak coverage. Route commands are accepted in exactly five Regions; the other 41 reject them by design.',
          'The page names these five under "Update a Multi-Region Access Point route configuration". Route configuration is how a Multi-Region Access Point fails over, and the introduction says failover control plane requests must go to "one of the five supported Regions" — the same count. The page never joins the two sentences, so this feature is scoped to what it states literally: where route commands run.',
          'One Region, us-west-2, is also the sole Region of the create-or-maintain control plane feature from this page. The two features overlap and must not be summed.',
          'The Regions are named as codes in a bullet list, not inside a sample command, so they are a statement of where the commands run rather than user input placeholders.',
        ],
      });
    }
  }

  return features.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features }
    : {
        sourceUrl: URL_,
        parserId: PARSER_ID,
        features: [],
        noCoverageReason: 'neither Region restriction sentence was found on the page',
      };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
