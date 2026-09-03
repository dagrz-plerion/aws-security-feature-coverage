# Adversarial review of a parser

You are reviewing ONE parser someone else wrote. Assume it is wrong until you have
checked it against the page yourself. A clean review that finds nothing is a failure of
review, not a success of the parser — but do not invent faults either. Report what is
actually there.

Read `docs/specs/parser-contract.md` first. It is the standard you are holding them to.

## Work from the page, not from the parser

Open the snapshot in `data/pages/` and derive the answer yourself before you read the
parser's output. If you read their number first you will anchor on it.

## The error classes you are hunting

These are the failures this project exists to prevent. Check each one explicitly and say
what you found for each.

1. **Bad feature naming.** Is the name the exact thing the page is about? A feature called
   "AWS KMS" when the page is about one condition key is wrong. Is `scope` honest —
   `service` only when the page really is about the whole service?
2. **Evidence that does not apply.** Take a sample of at least 8 covered items (all of them
   if there are fewer than 8, and include the first, the last and any that look odd). For
   each, does the quote actually establish coverage FOR THAT ITEM? A quote naming
   CloudFront is not evidence for Route 53. A section heading is evidence only when the
   heading names the item.
3. **Zero counts.** A feature with an empty `covered` list must not exist. A page with no
   coverage must return `features: []` with a `noCoverageReason`.
4. **Double counting.** Does any id appear twice inside one feature? Do two differently
   worded rows resolve to the same id and both get counted? Does the parser read the same
   list twice (a "Topics" navigation block AND the sections it points at)?
5. **Counting things that are not Regions, services or resource types.** IAM condition
   keys, IAM actions, findings, controls, managed rules, API operations, partitions,
   Availability Zones, Local Zones, Dedicated Local Zones, label strings, event field
   values, SDK names. None of these may be counted.
6. **General counted as specific, or specific as general.** The classic case: a page about
   `kms:ViaService` producing a feature that reads as "KMS service coverage". Also the
   reverse: a page that really does state whole-service coverage being narrowed to one
   sub-feature.
7. **Undercounting.** Did the parser silently drop items? Compare the number of candidate
   rows or bullets on the page with covered + excluded + unresolved. If those do not add
   up, something was dropped without being recorded. This is as serious as overcounting.
8. **Inference dressed as evidence.** `derivation: 'universe-minus-exclusions'` is legal
   ONLY on the region axis and ONLY when the page states something equivalent to "all
   Regions except X". Challenge it hard. If the page says "all Regions where GuardDuty is
   available except X", the baseline is not all 46 Regions, and the derivation overstates.
9. **Partial without a carve-out, or a carve-out without partial.** A `partial` item needs
   a note saying what is missing and how much. An item the page carves out must not be
   marked `full`.

## What to do with what you find

- Anything MECHANICAL that you can verify from the page yourself — a dropped row, a
  mis-resolved id, a wrong quote, a missing `partial`, an off-by-one — FIX IT, in both the
  parser and `tests/expected/<parserId>.json`, using the number YOU derived from the page.
  State in your report what you changed and what the number was before and after.
- Anything that is a JUDGEMENT CALL — what the feature should be named, whether a
  statement is coverage at all, whether two things are one feature or two — do NOT
  silently change it. Report it with the argument on both sides and your recommendation.
- If you conclude the parser is right, say so and show the working that convinced you.

## Rules

- Touch ONLY `src/parsers/<parserId>.ts` and `tests/expected/<parserId>.json`.
- NEVER edit `src/core/*`, `tests/*.test.ts` or `package.json`. If a shared helper is
  wrong, report it — several reviewers are running at once and a shared edit would
  collide.
- `npx vitest run tests/parsers.test.ts -t <parserId>` must be green when you finish. A
  failure naming a different parserId is not yours.
- Every quote must stay a verbatim substring of the snapshot.

## Your report

Structure it as: a verdict line (SOUND / FIXED / DISPUTED), then one short paragraph per
error class 1-9 saying what you checked and what you found, then the list of changes you
made with before-and-after numbers, then the judgement calls you are escalating.
