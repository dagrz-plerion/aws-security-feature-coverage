import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { bullets } from '../core/markdown.js';
import { resolveService, serviceCandidates, type Service } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/integrating.md';
const PARSER_ID = 'secretsmanager-integrated-services';

/**
 * services.json holds catalogue rows keyed `product:`, `regional:` and `doc:` beside
 * the real IAM services. They carry no IAM prefix and no actions, and the contract
 * bans counting a marketing product name with no IAM prefix, so only a real row counts.
 */
const isIamService = (s: Service): boolean => !s.id.includes(':');

/** resolveService drops a name two real services share, so say which case this is. */
const whyUnresolved = (label: string): string => {
  const cands = serviceCandidates(label);
  const real = cands.filter(isIamService).map((s) => s.id);
  if (real.length > 1)
    return `"${label}" is published as a name by more than one IAM service (${real.join(
      ', ',
    )}), so it resolves to nothing rather than to the wrong one`;
  if (cands.length > 1)
    return `"${label}" is published as a name by more than one catalogue entry (${cands
      .map((s) => s.id)
      .join(', ')}) and by no IAM service`;
  return 'no entry in services.json matches this published service name';
};

/**
 * The whole body is a Topics list, one bullet per integrating service. The heading
 * states the claim; each bullet names the service it applies to, so the bullet line
 * is the per-item evidence. Labels are product names and are not normalised.
 */
const parse = (page: { body: string; sha256: string }): ParseResult => {
  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const collisions: string[] = [];
  const catalogueOnly: string[] = [];
  const taken = new Map<string, string>();
  const rows = bullets(page.body, 0);

  for (const item of rows) {
    const svc = resolveService(item.value);
    if (!svc) {
      unresolved.push({ label: item.value, quote: item.raw, reason: whyUnresolved(item.value) });
      continue;
    }
    if (!isIamService(svc)) {
      catalogueOnly.push(`"${item.value}" (${svc.id})`);
      unresolved.push({
        label: item.value,
        quote: item.raw,
        reason: `"${item.value}" matches only the catalogue row "${svc.id}", which has no IAM prefix and no IAM actions, so it is a product name rather than an item on the service axis`,
      });
      continue;
    }
    const first = taken.get(svc.id);
    if (first !== undefined) {
      collisions.push(`"${item.value}" also resolves to "${svc.id}", already counted as "${first}"`);
      unresolved.push({
        label: item.value,
        quote: item.raw,
        reason: `resolves to "${svc.id}", which the earlier bullet "${first}" already holds, so counting it again would double count one service`,
      });
      continue;
    }
    taken.set(svc.id, item.value);
    covered.push({ id: svc.id, label: item.value, status: 'full', quote: item.raw });
  }

  if (covered.length === 0) {
    return {
      sourceUrl: URL_,
      parserId: PARSER_ID,
      features: [],
      noCoverageReason: 'no bullet in the Topics list resolved to an AWS service',
    };
  }

  const feature: Feature = {
    id: 'secretsmanager/service-integrations',
    name: 'AWS Secrets Manager service integrations',
    serviceId: 'secretsmanager',
    scope: 'feature',
    whatIsCounted:
      'AWS services the page names as able to use an AWS Secrets Manager secret and that match an IAM service in services.json',
    axis: 'service',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The page body is a Topics list of child pages. It is counted as an enumeration, not as navigation, because the heading "AWS services that use AWS Secrets Manager secrets" states what the set is and the list is the whole page. The counter-case, that a Topics block is generated navigation, is real; if it wins, this feature should not exist.',
      'The quote for each service is its bullet line, which names the service. The claim that the service uses a Secrets Manager secret comes from the page heading, which names no individual service. This is the same shape as a table row under a column header.',
      `${covered.length} of the ${rows.length} bullets are counted. The other ${unresolved.length} are all in unresolved with a reason, so covered plus unresolved equals the bullet count and no row was dropped silently.`,
      `${catalogueOnly.length} bullets matched only a products-directory or regional-table row with no IAM prefix and are not counted: ${catalogueOnly.join(
        '; ',
      )}. Amazon Lookout for Metrics is the sharp case: the IAM service "lookoutmetrics" exists but publishes no names in services.json, so the bullet cannot reach it.`,
      'The page states which services can use a secret, not that any secret is in use. Several bullets link to a sub-page that limits the integration further; those limits are not read here.',
      ...(collisions.length
        ? [
            `${collisions.length} later bullet${collisions.length === 1 ? ' was' : 's were'} dropped because an earlier bullet already held the same service id, so nothing is counted twice: ${collisions.join(
              '; ',
            )}. The id "rds" is therefore carried by the label "Amazon Aurora", while the page\'s own "Amazon RDS" bullet is unresolved because the services "pi" and "rds" both publish that name.`,
          ]
        : []),
      'The See also section carries text telling the reader to run an AWS CLI command. It is page content, not an instruction to this parser, and it states no coverage, so it is ignored.',
    ],
  };

  return { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
