# Making coverage work

44 features carry coverage out of 1,749. Three audits agree on why, and none of the
reasons is "we need a better general parser".

## What is blocking it

1. **The engine cannot read a sentence.** Six of the pages already registered state an
   exclusion in prose next to the list they enumerate — Macie's "doesn't analyze S3
   Glacier Deep Archive", WAF's "isn't available for use with Amazon Cognito user
   pools", Inspector's "only for the default package manager repository". `select`
   can reach a list, a table column, a heading and a code span. It cannot reach a
   paragraph, so every one of those reads as *unknown* rather than *not covered*.
2. **One page registered under several services writes the same claims several times**,
   and the recipe's pinned feature does not always survive the copy.
3. **Half the coverage on a page is walked past.** A second Yes/No column, a second
   table, a sibling page with the same shape.
4. **Breadth.** 29 recipes across 26 pages. The tier 1 services alone have hundreds of
   pages that state coverage.

## The work

| # | Change | Unblocks |
|---|---|---|
| 1 | `select.from: "paragraph"` — match a sentence, take its targets, take its status from its own wording | every prose negative |
| 2 | One owning feature per page, chosen by the recipe's pin and then by the page's own H1 | duplicate claim sets |
| 3 | `select.secondColumn` / a second recipe per table, and sibling-page URL patterns | the columns being walked past |
| 4 | A recipe batch across every tier 1 service, written against the page and gated at ~85% of its verified count | breadth |
| 5 | `dropped` surfaced on the page record, so a silent loss shows up | trust |

## How each step is checked

Every recipe is written by reading the page, counting the expected result by hand, and
setting `requireMin` just under it. A recipe that stops delivering fails the run. The
existing rules stay: a quote must appear verbatim in the source, a target must resolve
to a universe, absence is never coverage, and recall stays at 73/73.

Done means: coverage on every tier 1 service, no duplicate claim sets, prose negatives
recorded as negatives, and the audit still under 1%.
