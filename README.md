# AWS Security Feature Coverage

A map of every AWS security service, the features inside them, and what each feature
actually covers — by region, by resource type, by service and by data source.

**Live map: https://dagrz-plerion.github.io/aws-security-feature-coverage/**

## Why

"Does AWS cover X?" is normally answered from memory, and the answer is often wrong.
The truth is in the documentation, spread over more than a thousand guides. This joins
it up.

## Rules the data follows

1. **No claim without evidence.** Every claim carries a source URL, a hash of the page
   body it was read from, and a quote that must appear verbatim in that body. A test
   enforces it.
2. **Absence is never coverage.** If a source does not state that something is covered,
   the status is *unstated* — never *not covered*.
3. **Recall first.** Every AWS service is adjudicated in or out of scope with a stored
   reason. Nothing is dropped silently.

## Running it

```bash
npm install
npm run pipeline          # full run, incremental and idempotent
npm run pipeline -- --only stage4,stage5
npm test                  # unit, invariant and recall tests
npm run recall            # does the map still contain every feature it should?
npm run deploy            # rebuild the page and publish it
```

The pipeline is re-runnable at any time. HTTP responses are cached and revalidated with
`If-None-Match`, so an unchanged upstream costs one `304` and produces identical output.

## Sources

| Source | Gives |
|---|---|
| `servicereference.us-east-1.amazonaws.com` | every AWS service, its IAM actions and its resource ARNs |
| `docs.aws.amazon.com/llms.txt` | every documentation guide, and every page in each one |
| any docs page with `.md` instead of `.html` | clean Markdown to parse, instead of scraped HTML |
| AWS Regions and Availability Zones guide | the region list, with opt-in status |
| the regional services table | which services run in which regions |
| the General Reference endpoints pages | per-service region availability, joined by endpoint hostname |
| CloudFormation type registry, Resource Explorer | the resource type universe |
| bundled AWS CLI service models | API enums, which name capabilities precisely |
| the AWS Security Reference Architecture | AWS's own curated list of security services |

## Layout

```
src/core/        fetch cache, evidence, schemas, markdown parser, stage runner
src/universes/   the definitive lists everything is measured against
src/discovery/   which services carry security capability, and why
src/features/    what the named features are
src/coverage/    what each feature reaches
src/report/      the published page
data/            one JSON file per entity, all of it reviewable
```
