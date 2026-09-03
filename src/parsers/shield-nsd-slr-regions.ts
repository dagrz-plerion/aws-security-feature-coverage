import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { normalizeSpaces, sections, tables } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/waf/latest/developerguide/security_iam_nsd-with-iam-roles-service-linked.md';
const PARSER_ID = 'shield-nsd-slr-regions';

const SECTION = 'Supported Regions for AWS Shield network security director service-linked roles';

/**
 * Extraction is anchored to the supported-Regions section only. The role's
 * permissions policy higher up the page holds IAM action strings such as
 * `ec2:DescribeRegions`; those are actions, not Regions, and must never leak in.
 */
const parse = (page: { body: string; sha256: string }): ParseResult => {
  const section = sections(page.body).find((s) => normalizeSpaces(s.title) === SECTION);
  const table = section ? tables(section.block).find((t) => t.headers.includes('Region')) : undefined;

  const covered: EvidenceItem[] = [];
  const unresolved: Feature['unresolved'] = [];
  const seen = new Set<string>();

  for (const [i, row] of (table?.rows ?? []).entries()) {
    const name = row[0] ?? '';
    const code = row[1] ?? '';
    const label = `${name} (${code})`;
    const quote = (table?.rawRows[i] ?? '').trim();
    const byName = resolveRegion(name);
    const byCode = resolveRegion(code);

    // A row that names one Region and codes another cannot be resolved either
    // way without asserting a Region the row itself contradicts.
    if (byName && byCode && byName.id !== byCode.id) {
      unresolved.push({
        label,
        quote,
        reason: `the row contradicts itself: the name column is ${byName.id} and the code column is ${byCode.id}`,
      });
      continue;
    }

    const region = byCode ?? byName;
    if (!region) {
      unresolved.push({ label, quote, reason: 'no region in regions.json matches this row' });
      continue;
    }
    if (seen.has(region.id)) continue;
    seen.add(region.id);
    covered.push({ id: region.id, label, status: 'full', quote });
  }

  const rowCount = table?.rows.length ?? 0;

  const feature: Feature = {
    id: 'shield/nsd-service-linked-role-regions',
    name: 'AWS Shield network security director service-linked role',
    serviceId: 'shield',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions where AWS Shield network security director supports its service-linked role and can retrieve data about your resources',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The page names no unsupported Region, so the list is enumerated, not derived from exclusions.',
      'AWS marks the feature as a public preview release that is subject to change.',
      ...(unresolved.length
        ? [
            `The page lists ${rowCount} Regions, but ${unresolved.length} row(s) print a Region name that disagrees with the Region code beside it, so the numerator is ${covered.length}: ${unresolved
              .map((u) => u.label)
              .join(', ')}. Each is recorded as unresolved rather than counted as either Region.`,
          ]
        : []),
    ],
  };

  return covered.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] }
    : {
        sourceUrl: URL_,
        parserId: PARSER_ID,
        features: [],
        noCoverageReason: 'the supported-Regions table for the service-linked role was not found on the page',
      };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
