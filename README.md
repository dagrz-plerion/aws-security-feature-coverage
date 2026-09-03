# AWS security feature coverage

What AWS security features actually reach, read out of AWS's own documentation and
counted against the three axes that exist independently of any service: **Region**,
**service**, **resource type**.

Published page: `docs/` (GitHub Pages).

## The rules the numbers follow

1. **Nothing is counted unless a page says it.** Every covered item carries a quote that
   must appear verbatim in the page snapshot. A test enforces it.
2. **Absence is never coverage.** A Region a page does not mention is unstated, not
   uncovered. Coverage is only inferred from exclusions on the Region axis, and only when
   a page says something equivalent to "all Regions except X".
3. **Only Regions, services and resource types are counted.** Condition keys, IAM actions,
   findings, controls, managed rules, API operations, partitions and Availability Zones
   are not axis items and never enter a numerator.
4. **An empty answer is an answer.** A page that states no countable coverage is kept with
   the reason. An empty feature would be worse than no feature.
5. **Every count is measured against the whole universe** — 46 Regions, 692 services,
   3160 resource types — so numbers from different pages can be compared.

## Layout

```
coverage-urls.json   the 29 pages, and the axis each was flagged for
regions.json         the 46 Regions
services.json        the 692 services, keyed by IAM prefix
resource-types.json  the 3160 resource types
data/pages/          a snapshot of every page, read on every run
src/core/            types, the universe resolvers, the markdown helpers, the rule checker
src/parsers/         one purpose-built parser per page
tests/expected/      the count for each page, written by hand from the page
docs/                the published page
docs/specs/          the parser contract and the adversarial review brief
```

## Why one parser per page

The pages have almost nothing in common. One is a Region table, one is a matrix of 558
resource types against 38 Regions, one states coverage only as exclusions, and several
state no coverage at all and were flagged in error. A generic extractor gets all of them
slightly wrong. Each parser is written against its own page and is held to the same
contract, `docs/specs/parser-contract.md`.

Every parser was written twice over: once by an author working from the page, then
reviewed by an adversary who re-derived the count from the same page without reading the
author's answer first. `docs/specs/adversary-brief.md` is what the adversary was held to.

## Running it

```bash
npm install
npm test          # unit tests, the rule checker, and every parser against its hand count
npm run typecheck
npm run build     # rebuild docs/data.json, refusing to publish if any rule is broken
npm run serve     # view docs/ locally
```

`npm run build` fails the run rather than publishing a dataset that breaks a rule.

## The rules a feature must obey

Enforced in `src/core/validate.ts`, tested in `tests/validate.test.ts`:

| rule | means |
|---|---|
| `no-zero-count` | a feature must cover at least one item |
| `id-in-universe` | every item resolves to a real Region, service or resource type |
| `no-double-count` | no id appears twice inside one feature |
| `no-contradiction` | no id is both covered and excluded |
| `numerator-le-denominator` | a count cannot exceed the universe |
| `quote-is-verbatim` | every quote appears in the page snapshot |
| `partial-needs-note` | partial coverage must say what is missing |
| `name-precision` | a bare service name is only allowed at service scope |
| `says-what-is-counted` | the stated subject must name the axis |
| `derivation-region-only` | coverage is only inferred from exclusions on the Region axis |
| `derivation-adds-up` | inferred coverage plus exclusions must equal the universe |
| `unique-feature-id` | feature ids are unique across the dataset |
| `body-hash-current` | a feature is invalid once its page changes |
