import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { normalizeSpaces, sections } from '../core/markdown.js';
import { resolveResourceType } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-acfp.md';
const PARSER_ID = 'waf-acfp-rule-group';

/**
 * The page is the reference for the AWSManagedRulesACFPRuleSet managed rule group.
 * Its 16 rules, their rule actions and its awswaf:managed:* labels are instances
 * inside one rule group, not items on any axis, and none is counted.
 *
 * One resource type is enumerated. Two rules state that AWS WAF evaluates them in
 * protection packs (web ACLs) that protect Amazon CloudFront distributions, which
 * says positively that CloudFront distributions are reached. That is the response
 * inspection part of the rule group only, so it is recorded as a subfeature. The
 * page never lists the resource types the rest of the rule group reaches, so the
 * numerator is not, and must not be read as, the rule group's protected types.
 */
const CLOUDFRONT_ONLY =
  'AWS WAF only evaluates this rule in protection packs (web ACLs) that protect Amazon CloudFront distributions.';
const NO_HTTP3 =
  "AWS WAF doesn't inspect responses for web requests that clients send over HTTP/3 (QUIC).";
const COGNITO_EXCLUSION = "This rule group isn't available for use with Amazon Cognito user pools.";

const CHANGED =
  'The page no longer carries the sentence "AWS WAF only evaluates this rule in protection packs (web ACLs) that protect Amazon CloudFront distributions", which was the only resource type the ACFP page enumerated, so it must be read again by hand before any coverage is claimed.';

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const body = page.body;
  // The Cognito sentence is the Considerations statement about the whole rule group,
  // not the UnsupportedCognitoIDP rule row that repeats it.
  const considerations = sections(body).find((s) =>
    s.title.startsWith('Considerations for using this rule group'),
  );
  const excludesUserPools =
    considerations !== undefined &&
    normalizeSpaces(considerations.block).includes(COGNITO_EXCLUSION) &&
    body.includes(COGNITO_EXCLUSION);

  if (!body.includes(CLOUDFRONT_ONLY) || !resolveResourceType('AWS::CloudFront::Distribution'))
    return { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: CHANGED };

  const carvedOut = body.includes(NO_HTTP3);
  const covered: EvidenceItem[] = [
    {
      id: 'AWS::CloudFront::Distribution',
      label: 'Amazon CloudFront distributions',
      status: carvedOut ? 'partial' : 'full',
      ...(carvedOut
        ? {
            note: 'Responses to web requests that clients send over HTTP/3 (QUIC) are not inspected. The page gives no proportion.',
          }
        : {}),
      quote: CLOUDFRONT_ONLY,
    },
  ];

  const excluded: EvidenceItem[] = excludesUserPools
    ? [
        {
          id: 'AWS::Cognito::UserPool',
          label: 'Amazon Cognito user pools',
          status: 'full',
          quote: COGNITO_EXCLUSION,
        },
      ]
    : [];

  const feature: Feature = {
    id: 'wafv2/acfp-response-inspection-resource-types',
    name: 'AWS WAF ACFP rule group response inspection',
    serviceId: 'wafv2',
    scope: 'subfeature',
    whatIsCounted:
      "Resource types that a protection pack (web ACL) must protect for the ACFP rule group's response inspection rules to be evaluated",
    axis: 'resourceType',
    derivation: 'enumerated',
    covered,
    excluded,
    unresolved: [],
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'This is not the set of resource types the ACFP rule group protects. The page states only that the rules VolumetricIPSuccessfulResponse and VolumetricSessionSuccessfulResponse are evaluated in protection packs (web ACLs) that protect CloudFront distributions. The resource types the other 14 rules reach are enumerated nowhere on the page.',
      'Amazon Cognito user pools are excluded from the whole rule group, so they are excluded from these rules too. Every other resource type a protection pack can protect falls outside this subfeature by implication, but the page does not name any of them, so none is recorded either way.',
      'Rule names, rule actions and awswaf:managed:* label strings are instances inside one rule group, not items on any axis, and none is counted. Amazon CloudWatch is named only as where label metrics are reported, which is not coverage.',
    ],
  };

  return { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
