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

## Coverage pages are remembered, not re-derived

Finding a coverage page is allowed to be ad hoc — a title pattern, a sweep of a
guide, a web search, someone pasting a URL. Keeping it is not. Every page we have
ever decided documents coverage lives in `data/coverage-pages/<service>.json` and is
read again on every run, whether or not today's rules would still find it. Tightening
a discovery rule can shrink what is newly found; it can never lose what was found
before.

```bash
# register a page found any way at all
npm run add-page -- https://docs.aws.amazon.com/guardduty/latest/ug/some-page.html \
  --service guardduty --source search --note "found by a site: search"

# read it, along with every other registered page
npm run pipeline -- --only stage5
```

Each entry records where it came from, when it was last read, and what it produced,
so a page that stops yielding is visible rather than silently absent.

Decisions a person made are data too, not code. They live in `data/seeds/`:

| file | holds |
|---|---|
| `adjudication-overrides.json` | which services are security services, and why |
| `guide-prefix-overrides.json` | documentation guide prefix to service |
| `service-name-overrides.json` | published service name to service |
| `feature-aliases.json` | names people search by that AWS has renamed |
| `target-aliases.json` | coverage list wording to a universe id |

## Running it

```bash
npm install
npm run pipeline          # full run, incremental and idempotent
npm run pipeline -- --only stage4,stage5
npm test                  # unit, invariant and recall tests
npm run validate          # run every rule against the real data
npm run recall            # does the map still contain every feature it should?
npm run add-page          # register a coverage page found any way at all
npm run deploy            # rebuild and publish, refusing to publish a run that broke a rule
```

## Stages

| stage | does |
|---|---|
| `stage1-universes` | build the definitive lists: regions, partitions, services, resource types, IAM actions, data sources |
| `stage2-doc-pages` | index every page of every AWS documentation guide |
| `stage3-discovery` | decide, for every AWS service, whether it carries security capability, and record why |
| `stage4-features` | enumerate the named security features of every candidate service |
| `stage5-coverage` | read every registered coverage page and extract what each feature reaches |
| `stage6-validate` | check every rule the dataset must obey, and fail the run if one is broken |

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
