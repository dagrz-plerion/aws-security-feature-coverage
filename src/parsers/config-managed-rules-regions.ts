import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { sections } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/config/latest/developerguide/managing-rules-by-region-availability.md';
const PARSER_ID = 'config-managed-rules-regions';

/** `+ [rule-name](./rule-name.html)` — one managed rule inside a Region section. */
const RULE = /^\+ \[([^\]]+)\]/;

const ruleNames = (text: string): string[] =>
  text
    .split('\n')
    .map((l) => RULE.exec(l)?.[1])
    .filter((n): n is string => !!n);

/**
 * The page repeats each Region as a level-2 heading ("US East (Ohio) Region") and a
 * level-3 heading ("US East (Ohio)"). Only level 2 is read, so no Region counts twice.
 * Managed rules are hundreds of instances of one thing, so they are never the numerator:
 * they only decide whether a Region is full or partial.
 *
 * The page names 822 distinct managed rules and no Region lists all of them, so every
 * Region carves something out and every Region is partial. The largest, US East
 * (N. Virginia), still lacks eight rules that only US West (Oregon) lists.
 */
const parse = (page: { body: string; sha256: string }): ParseResult => {
  const heads = sections(page.body).filter((s) => s.level === 2);
  const total = new Set(ruleNames(page.body)).size;

  const seen: { id: string; label: string; quote: string; count: number }[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (const head of heads) {
    const label = head.title.replace(/\s+Region$/, '');
    const region = resolveRegion(label);
    const quote = `## ${head.title}`;
    if (!region) {
      unresolved.push({ label: head.title, quote, reason: 'not an AWS Region; a trailing section of related links' });
      continue;
    }
    if (seen.some((s) => s.id === region.id)) continue;
    seen.push({ id: region.id, label: head.title, quote, count: ruleNames(head.block).length });
  }

  const most = Math.max(0, ...seen.map((s) => s.count));
  const largest = seen.find((s) => s.count === most);

  // Full would mean the Region lists all `total` rules. None does, so none is full.
  const covered: EvidenceItem[] = seen.map((s) => ({
    id: s.id,
    label: s.label,
    status: 'partial',
    note: `lists ${s.count} of the ${total} distinct managed rules named on this page; ${total - s.count} are missing`,
    quote: s.quote,
  }));

  const feature: Feature = {
    id: 'config/managed-rules-by-region',
    name: 'AWS Config managed rules',
    serviceId: 'config',
    scope: 'feature',
    whatIsCounted: 'AWS Regions in which the page lists at least one AWS Config managed rule',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      `The page lists ${total} distinct managed rules. Rules are instances of one feature, not features, so the numerator counts Regions.`,
      `No Region lists all ${total} rules, so every Region carves something out and none is full. The largest is ${largest?.label ?? 'none'} with ${most}.`,
      'A Region absent from the page is not stated to be uncovered, so nothing is recorded as excluded.',
    ],
  };

  return {
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features: covered.length ? [feature] : [],
    ...(covered.length ? {} : { noCoverageReason: 'no Region section was found on the page' }),
  };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
