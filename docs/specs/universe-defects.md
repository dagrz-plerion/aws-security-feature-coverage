# Defects found in the universe files

These are faults in `services.json` and `resource-types.json`, not in the parsers. They
were each found by an adversarial reviewer working from an AWS page and hitting a value
that would not resolve, or resolved to the wrong thing. Nothing here was patched — the
universe files are inputs. Each one suppresses or distorts real coverage, so they are
worth fixing upstream.

## services.json

### A name hung on the wrong service

| Name published by | Should belong to | Effect |
|---|---|---|
| `budgets` publishes "Billing and Cost Management" | `billing` | Any page naming the console umbrella resolves to AWS Budgets. The CloudTrail network-events page has no `budgets` principal at all, so this was a false positive until the parser overrode it. |
| `cur` publishes "AWS Data Exports" | `bcm-data-exports` | A stale rename. Same shape: resolves to the older Cost and Usage Report API. |
| `pi` (Performance Insights) publishes "Amazon RDS" | `rds` alone | Makes the bare label "Amazon RDS" permanently ambiguous, so every page that writes it plainly loses the row. |

### Missing the vendor-prefixed names AWS itself publishes

AWS writes "AWS Elastic Load Balancing"; `services.json` stores "Elastic Load Balancing".
On the IAM services page alone, **32 of 440 rows** would resolve if the leading "AWS " or
"Amazon " were dropped, including Elastic Load Balancing, AWS Recycle Bin, Amazon Route 53
Profiles, AWS HealthImaging, Amazon CloudWatch RUM and Amazon CloudWatch Synthetics. All 32
are silently absent from every feature on that page.

This was deliberately **not** worked around in a parser, because stripping the prefix is
guessing rather than re-spelling. Tested against the same page it resolves
"AWS Billing and Cost Management" to `budgets` (wrong — the page lists AWS Budget Service on
its own row), "AWS Auto Scaling" to `autoscaling` (wrong — that is EC2 Auto Scaling; the page
means `autoscaling-plans`), "Amazon Inspector" to `inspector` (Inspector Classic, which the
page lists separately) and "AWS WAF" to `waf` (WAF Classic, likewise listed separately). A
rule wrong about one row in sixteen is not a spelling bridge.

The fix belongs in `services.json`: add the vendor-prefixed form as a published name on the
rows that have one.

### Real services with no names at all

`lookoutmetrics`, `lookoutvision`, `opsworks-cm`, `sqlworkbench`, `elemental-activations`,
`payments`, `purchase-orders` and `consolidatedbilling` have an empty `names` array. A page
naming one of them can only reach the synthetic `product:` row, which the contract forbids
counting — so the service is silently lost. Several parsers recover these from a service
principal the page itself supplies; the rest simply undercount.

### Names two real services share

`Amazon Cognito` (cognito-identity, cognito-idp), `AWS CloudHSM` (cloudhsm, cloudhsmv2),
`Amazon Inspector` (inspector, inspector2, inspector-scan), `AWS WAF` (waf, wafv2) and
`Amazon Chime SDK` (chime, identity-chime). These resolve to nothing, by design — guessing
between two real services would be worse. But AWS reusing one name across a service and its
v2 is common enough that it costs real counts on every service-axis page.

### Synthetic rows shadowing real ones

66 `product:`, 7 `regional:` and 93 `doc:` rows sit alongside the 526 real IAM services and
publish the same names. `resolveService` now refuses to return any of them, and prefers a
real IAM service where both publish a name.

## resource-types.json

### The same resource under two ids

- `ec2:snapshot` and `ebs:snapshot` — identical ARN format, two entries.
- `AWS::RDS::DBClusterSnapshot` and `AWS::RDS::ClusterSnapshot`.
- `AWS::Lambda::LayerVersion` and `lambda:layer`.

A parser must pick one, and two parsers reading two different AWS pages can pick
differently, so the same real resource can appear under two ids in the dataset.

### The Elastic Load Balancing family — the worst case

`resource-types.json` holds four overlapping rows for load balancers:
`AWS::ElasticLoadBalancing::LoadBalancer` (Classic), plus
`elasticloadbalancing:loadbalancer/app/`, `/net/` and `/gwy/`, plus
`AWS::ElasticLoadBalancingV2::LoadBalancer`, whose CloudFormation type covers app, net and
gwy alike but which carries `resourceExplorerType: "elasticloadbalancing:loadbalancer/net"`
— one id for three kinds, pinned to the NLB spelling. That alias is then shadowed: the
string `elasticloadbalancing:loadbalancer/net` resolves to the `/net/` row, never to the V2
row.

Two consequences. The denominator double counts load balancers. And two features in this
dataset cannot be joined on them: the Shield page names Application, Classic and Network
Load Balancers as separately protectable and Gateway Load Balancers as not, so that parser
uses three ids and records the exclusion; the AWS Config page prints one Resource Type
Value, `AWS::ElasticLoadBalancingV2::LoadBalancer`, for both Application and Network, so
that parser records one. Each parser is faithful to its own page. The fix belongs upstream —
these rows need alias merging, or an explicit link from a spelling to its canonical row.

### An alias on the wrong type

`AWS::DocDB::DBCluster` carries `resourceExplorerType: "rds:cluster"`, while
`AWS::RDS::DBCluster` carries no alias. Any parser resolving the string `rds:cluster` lands
silently on DocumentDB. One parser now refuses a match whose service segment disagrees with
the code's prefix, and records the row unresolved instead.

### Spelling coverage — the one worth fixing first

AWS writes one resource type three ways. `resolveResourceType` indexes only `id`,
`cloudFormationType` and `resourceExplorerType`. It ignores `serviceReferenceName`, which is
present on most rows and is exactly the spelling AWS docs use for codes such as
`apigateway:Domainnames` (whose `serviceReferenceName` is `DomainNames`).

The cost is measurable: on the AWS RAM page only 31 of 84 codes resolve directly, so 49 of
them reach an id through mechanical re-spelling written inside that one parser. Indexing
`${serviceId}:${serviceReferenceName}` in `src/core/universe.ts` would remove most of that
machinery and would help any page written in the same style.

This was left undone deliberately. Changing a resolver moves counts across the whole
dataset, and every count here has already been derived by hand and checked by a second
reader. It should be done as its own change, with those counts re-derived after it.
