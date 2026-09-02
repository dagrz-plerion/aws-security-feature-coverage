# Coverage extraction

## The problem

Generic shape detection reads about seven pages in ten. The pages it cannot read are
often the most valuable ones, because AWS reserves its odd layouts for its richest
data: per-Region exclusion lists, capability matrices drawn with icons, catalogues
crammed into one table cell.

Two bad answers were available. Keep generalising the shared parser until it reads
everything, which breaks pages that already worked. Or special-case pages in code,
which is invisible, untestable and lost on the next refactor.

## The answer: a recipe is reference metadata

A page may carry a **recipe** — a declaration of how to read that page, stored beside
the page in the registry. Recipes are data, not code:

- reviewable in a diff,
- re-run on every pass,
- testable against a stored snapshot of the page,
- reported when they stop working.

Generic extraction stays the default. A recipe is written only when a page is worth
reading and the generic path cannot read it.

## Recipe shape

```jsonc
{
  "id": "securityhub-regional-control-limits",
  "note": "One H2 per Region; each lists the controls NOT available there.",
  "blocks": "h2-sections",          // whole-page | h2-sections | h3-sections
  "select": {
    "from": "list-items",           // list-items | table-column | headings | code-spans
    "headerMatches": "control",     // table-column only: which column
    "level": 2,                     // headings only
    "extract": "leading-bracket"    // whole | leading-bracket | leading-token | regex
  },
  "axis": "control",
  "status": "not-covered",          // covered | not-covered | from-column | from-context
  "statusColumn": "supported",      // status: from-column
  "scope": {                        // the second dimension, when there is one
    "axis": "region",
    "from": "block-title"           // block-title | page-title | column
  },
  "featureId": "securityhub/security-hub-cspm",
  "requireMin": 5                   // fewer results than this means the recipe broke
}
```

## Two-dimensional coverage

"ElastiCache.4 is not available in us-east-1" is a statement about a control **and** a
Region. Flattening it loses the half that matters. A claim therefore carries an
optional `scope`:

```jsonc
{ "axis": "control", "targetId": "ElastiCache.4", "status": "not-covered",
  "scope": { "axis": "region", "targetId": "us-east-1" } }
```

Unscoped claims keep their present meaning: the statement holds wherever the feature
runs.

## Rules that do not bend

1. A recipe may change **how** a page is read. It may never invent a claim: every
   claim still quotes the page verbatim, and the quote is checked.
2. A recipe that returns fewer than `requireMin` results is a failure. It is recorded
   on the page, raised as a gap, and the run reports it. A silently empty recipe is
   the one failure mode that would let the map rot.
3. Removing or tightening a discovery rule may never lose a page. The registry is the
   record; discovery only adds to it.

## Where things live

| path | holds |
|---|---|
| `data/coverage-pages/<service>.json` | every known coverage page, its provenance, its recipe, and what it last produced |
| `data/seeds/recipes.json` | recipes that apply to any page matching a URL pattern |
| `src/coverage/recipe.ts` | the engine that runs a recipe |
| `src/coverage/extractors.ts` | the generic path, used when no recipe applies |

## A row is named after what it measures

If every claim on an axis is scoped to one member of a catalogue, the row is named
after the parent but measures the member. Two examples, both of which shipped:

- 92 services that support `kms:ViaService` were filed under a feature called
  "Condition keys", so the map read *KMS condition keys reach 92 of 526 services* —
  something the page never says. The condition key is the feature.
- The IAM services table has six capability columns. Read as one row scoped by
  capability, it answered six questions with one number, and hid the fact that
  resource-based policies reach only 22 of 283 services.

The rule: **a scope onto a catalogue member means the member is the feature.** A scope
is for a genuine second dimension — per Region, per scan method — where the values
vary. `stage6-validate` enforces it, and `tests/guards.test.ts` proves the check fires
on the exact shape that got through.

## Expectations

`data/expectations/<page>.json` holds what an independent reader said a page should
produce: which capabilities it documents, on which axes, how many values, and what
must not be taken. Those readers are shown the page and nothing else — no recipe, no
output, no prior decision to defend — because a reviewer handed an implementation
tends to validate it.

`stage8-expectations` checks every run against them. Every other check in this
pipeline tests internal consistency: a quote matches its source, a target exists in a
universe, a count fits its denominator. None of them can tell that a correctly parsed
quota table is not coverage. Only an expectation written by someone who never saw the
code can.

Record them with `npm run record-expectations -- <specs.json>`.

## Every published row has its own parser

The generic reader — the one that infers an axis from the shape of a list — is for
**discovery**. It finds pages worth a recipe. It is not a source of published claims,
because a quota table has the same shape as a coverage table and it cannot tell them
apart. That is how `verified-access` came to claim 4 resource types off a table of
service quotas.

`stage6-validate` fails the run if any published row contains a claim the generic
reader produced. In practice that means: one page, one recipe, written after reading
that page.
