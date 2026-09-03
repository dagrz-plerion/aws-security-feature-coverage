import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { normalizeSpaces, sections } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/securityhub/latest/userguide/regions-controls.md';
const PARSER_ID = 'securityhub-control-region-availability';

/** `+  [[EC2.15] ...](ec2-controls.md#ec2-15)` — one unavailable control. */
const CONTROL = /^\+\s+\[\[([A-Za-z0-9]+\.\d+)\]/;

/** The sentence each Region section opens with. It names the Region, so it is the evidence. */
const CARVE_OUT = /^The following controls are not supported in the .+ Region\.$/;

const controlIds = (block: string): string[] =>
  block
    .split('\n')
    .map((l) => CONTROL.exec(normalizeSpaces(l))?.[1])
    .filter((x): x is string => x !== undefined);

const carveOutLine = (block: string): string | undefined =>
  block.split('\n').find((l) => CARVE_OUT.test(normalizeSpaces(l).trim()));

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const perRegion: { region: string; ids: string[]; quote: string; label: string }[] = [];
  const named = new Set<string>();

  // Only the "## " sections are Regions. The "Topics" list above them repeats every
  // Region name and is never read.
  for (const s of sections(page.body).filter((x) => x.level === 2)) {
    const region = resolveRegion(s.title);
    if (!region) {
      unresolved.push({ label: s.title, quote: `## ${s.title}`, reason: 'section title is not an AWS Region' });
      continue;
    }
    const quote = carveOutLine(s.block);
    if (!quote) continue;
    const ids = controlIds(s.block);
    for (const id of ids) named.add(id);
    perRegion.push({ region: region.id, ids, quote: quote.trimEnd(), label: s.title });
  }

  // The page gives no catalogue size. The only denominator it supplies is the set of
  // distinct controls it names anywhere, so every note says that is what it is.
  const denom = named.size;

  for (const r of perRegion) {
    const n = r.ids.length;
    covered.push({
      id: r.region,
      label: r.label,
      status: n > 0 ? 'partial' : 'full',
      ...(n > 0
        ? {
            note:
              `${n} of the ${denom} distinct controls named anywhere on this page are not available in this Region. ` +
              'The page never states how many Security Hub CSPM controls exist, so this is not a share of the whole catalogue.',
          }
        : {}),
      quote: r.quote,
    });
  }

  const worst = [...perRegion].sort((a, b) => b.ids.length - a.ids.length)[0];
  const best = [...perRegion].sort((a, b) => a.ids.length - b.ids.length)[0];

  const feature: Feature = {
    id: 'securityhub/cspm-control-region-availability',
    name: 'Security Hub CSPM controls',
    serviceId: 'securityhub',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions for which this page lists unavailable Security Hub CSPM controls; each Region counts once and controls themselves are never counted',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'This page is an exclusion list. It states which controls are NOT available per Region and never states that Security Hub CSPM is available anywhere. Coverage here is read from the presupposition of "Some AWS Security Hub CSPM controls aren\'t available in all AWS Regions" and of each section sentence: naming the controls that are missing from a Region implies the rest run there. It is not a positive availability statement. For that, read the Security Hub Region and endpoint page instead.',
      'Controls are hundreds of instances of one thing, so they are not the numerator. The numerator is Regions.',
      `Every Region on this page is partial, none is full. The page names ${named.size} distinct controls and gives no catalogue total, so a note reads "N of ${named.size} named on this page", never a share of all controls.`,
      worst && best
        ? `The carve-outs are not small or even. They run from ${best.ids.length} controls (${best.region}) to ${worst.ids.length} of the ${named.size} named (${worst.region}). Counting ${worst.region} as a covered Region says the service reaches it, not that it is usable there.`
        : '',
      'Regions absent from the page are unstated, not covered, and nothing is derived about them. A Region with no carve-outs would have no section here at all, so absence does not mean full coverage — it means the page is silent. The page names no Region where Security Hub CSPM is entirely unavailable, so there are no exclusions.',
    ].filter((n) => n !== ''),
  };

  return covered.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] }
    : { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'no Region section was found on the page' };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
