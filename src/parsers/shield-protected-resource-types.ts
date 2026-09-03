import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { bullets } from '../core/markdown.js';
import { resolveResourceType } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/waf/latest/developerguide/ddos-protections-by-resource-type.md';
const PARSER_ID = 'shield-protected-resource-types';

const LEAD_IN =
  'You can use Shield Advanced for advanced monitoring and protection with the following resource types:';

const BY_ASSOCIATION = (kind: string): string =>
  `Reached only through association to a protected Elastic IP address. ${kind} with no protected Elastic IP address is not reached. The page gives no proportion.`;

/**
 * The page names resources in prose, not in a table. Application, Network and Gateway
 * Load Balancers share one CloudFormation type but hold a separate id each in the
 * universe, so each kind is mapped to its own id and no id is counted twice.
 */
const WANTED: {
  id: string;
  label: string;
  match: RegExp;
  partial?: string;
}[] = [
  { id: 'AWS::CloudFront::Distribution', label: 'Amazon CloudFront distributions', match: /^Amazon CloudFront distributions\./ },
  { id: 'AWS::Route53::HostedZone', label: 'Amazon Route 53 hosted zones', match: /^Amazon Route 53 hosted zones\./ },
  {
    id: 'AWS::GlobalAccelerator::Accelerator',
    label: 'AWS Global Accelerator standard accelerators',
    match: /^AWS Global Accelerator standard accelerators\./,
    partial: 'Standard accelerators only. The page states custom routing accelerators cannot be protected, and both share this resource type.',
  },
  { id: 'AWS::EC2::EIP', label: 'Amazon EC2 Elastic IP addresses', match: /^Amazon EC2 Elastic IP addresses\./ },
  {
    id: 'AWS::EC2::Instance',
    label: 'Amazon EC2 instances, through association to Amazon EC2 Elastic IP addresses',
    match: /^Amazon EC2 instances, through association/,
    partial: BY_ASSOCIATION('An instance'),
  },
  { id: 'elasticloadbalancing:loadbalancer/app/', label: 'Application Load Balancers', match: /^Application Load Balancers\./ },
  { id: 'AWS::ElasticLoadBalancing::LoadBalancer', label: 'Classic Load Balancers', match: /^Classic Load Balancers\./ },
  {
    id: 'elasticloadbalancing:loadbalancer/net/',
    label: 'Network Load Balancers, through associations to Amazon EC2 Elastic IP addresses',
    match: /^Network Load Balancers, through associations/,
    partial: BY_ASSOCIATION('A load balancer'),
  },
];

/** The catch-all sentence states the exclusion; the second sentence names the type. */
const CATCH_ALL = "You can't use Shield Advanced to protect any other resource type.";

const NOT_PROTECTED: { id: string; label: string; to: string }[] = [
  {
    id: 'elasticloadbalancing:loadbalancer/gwy/',
    label: 'Gateway Load Balancers',
    to: "you can't protect AWS Global Accelerator custom routing accelerators or Gateway Load Balancers.",
  },
  {
    id: 'AWS::EC2::NatGateway',
    label: 'NAT Gateways',
    to: 'NAT Gateways handle outbound traffic only, whereas Shield Advanced protects against inbound DDoS.',
  },
];

/** A verbatim span of the page, so an exclusion can quote every sentence that states it. */
const span = (body: string, from: string, to: string): string | undefined => {
  const a = body.indexOf(from);
  const b = a < 0 ? -1 : body.indexOf(to, a);
  return b < 0 ? undefined : body.slice(a, b + to.length);
};

const CUSTOM_ROUTING = "you can't protect AWS Global Accelerator custom routing accelerators";

const parse = (page: { body: string; sha256: string }): ParseResult => {
  // Load balancer kinds sit one level in, under "The following ... load balancers:".
  const items = [...bullets(page.body, 0), ...bullets(page.body, 2)];
  const covered: EvidenceItem[] = [];

  for (const want of WANTED) {
    const hit = items.find((i) => want.match.test(i.value));
    if (!hit) continue;
    const line = hit.raw;
    if (!resolveResourceType(want.id)) continue;
    covered.push({
      id: want.id,
      label: want.label,
      status: want.partial ? 'partial' : 'full',
      ...(want.partial ? { note: want.partial } : {}),
      quote: line,
    });
  }

  const excluded: EvidenceItem[] = NOT_PROTECTED.map((x) => ({
    ...x,
    quote: span(page.body, CATCH_ALL, x.to),
  }))
    .filter((x): x is typeof x & { quote: string } => x.quote !== undefined)
    .map((x) => ({ id: x.id, label: x.label, status: 'full', quote: x.quote }));

  // Named as not protected, but no id of its own to exclude: recorded as a carve-out
  // on the standard accelerator instead, so it is never counted either way.
  const unresolved: UnresolvedItem[] = page.body.includes(CUSTOM_ROUTING)
    ? [
        {
          label: 'AWS Global Accelerator custom routing accelerators',
          quote: CUSTOM_ROUTING,
          reason:
            'no separate resource type exists; custom routing and standard accelerators share AWS::GlobalAccelerator::Accelerator, which is therefore covered as partial',
        },
      ]
    : [];

  const feature: Feature = {
    id: 'shield/advanced-protected-resource-types',
    name: 'AWS Shield Advanced protected resources',
    serviceId: 'shield',
    scope: 'feature',
    whatIsCounted:
      'AWS resource types that Shield Advanced can protect, either directly or through association with a protected resource',
    axis: 'resourceType',
    derivation: 'enumerated',
    covered,
    excluded,
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      `Each covered quote is one entry in the list the page introduces with "${LEAD_IN}".`,
      'Application, Classic and Network Load Balancers are counted as three resource types because the universe holds a separate id for each. AWS Config documentation gives Application and Network Load Balancers one shared value, AWS::ElasticLoadBalancingV2::LoadBalancer, so the two features do not join on those two kinds.',
      'Shield Advanced protects only resources you register with it or with a Firewall Manager policy. Coverage here means the type can be registered, not that any resource is protected.',
      'Shield Advanced supports IPv4 and not IPv6, for every type counted here.',
      'The page also states that no other resource type can be protected. Only the types it names are recorded as excluded.',
    ],
  };

  return { sourceUrl: URL_, parserId: PARSER_ID, features: covered.length ? [feature] : [], ...(covered.length ? {} : { noCoverageReason: 'no protected resource type was found on the page' }) };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
