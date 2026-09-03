import type { EvidenceItem, Feature, ParseResult, UnresolvedItem } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { normalizeSpaces, sections, tables, yesNo } from '../core/markdown.js';
import { resolveRegion } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/config/latest/developerguide/what-is-resource-config-coverage.md';
const PARSER_ID = 'config-resource-type-region-coverage';

const plain = (s: string): string => normalizeSpaces(s).replace(/\*/g, '').trim();

interface Matrix {
  section: string;
  headers: string[];
  rows: string[][];
  types: Set<string>;
}

/** The six `Resource type` x Region matrices, one per regional section. */
const matrices = (body: string): Matrix[] =>
  sections(body)
    .filter((s) => s.level === 2)
    .flatMap((s) =>
      tables(s.block)
        .filter((t) => plain(t.headers[0] ?? '') === 'Resource type')
        .map((t) => ({
          section: s.title,
          headers: t.headers,
          rows: t.rows,
          types: new Set(t.rows.map((r) => plain(r[0] ?? ''))),
        })),
    );

const verdicts = (m: Matrix, col: number): { yes: number; no: number } => {
  let yes = 0;
  let no = 0;
  for (const row of m.rows) {
    const recorded = yesNo(row[col] ?? '');
    if (recorded === true) yes++;
    else if (recorded === false) no++;
  }
  return { yes, no };
};

/**
 * Six tables, one per regional section, each a matrix of resource type rows against
 * Region columns. The resource types are hundreds of instances of one thing, so the
 * Regions are counted and the resource types only size the carve-out. The sibling
 * page resource-config-reference owns the resource type axis claim.
 *
 * Every note is measured against the page-wide catalogue, not against the rows of
 * one table, so the 38 numbers can be compared. No table holds a row marked No in
 * every one of its Regions, so a type a table leaves out is recorded in no Region
 * of that group; leaving it out of the denominator instead would rank a Region that
 * lists few types above a Region that records many more.
 */
const parse = (page: { body: string; sha256: string }): ParseResult => {
  const covered: EvidenceItem[] = [];
  const unresolved: UnresolvedItem[] = [];
  const seen = new Set<string>();

  const all = matrices(page.body);
  const catalogue = new Set(all.flatMap((m) => [...m.types]));

  // The page-wide denominator only holds while absence from a table means "not recorded".
  const allNo = all.reduce(
    (n, m) => n + m.rows.filter((r) => r.slice(1).every((c) => yesNo(c) === false)).length,
    0,
  );
  const pageWide = allNo === 0;

  for (const m of all) {
    for (let col = 1; col < m.headers.length; col++) {
      const cell = m.headers[col] ?? '';
      const label = plain(cell);
      if (!label) continue;

      const region = resolveRegion(label);
      if (!region) {
        unresolved.push({ label, quote: cell, reason: 'column heading is not a Region in regions.json' });
        continue;
      }
      if (seen.has(region.id)) continue;
      seen.add(region.id);

      const { yes, no } = verdicts(m, col);
      if (yes + no === 0) continue;

      const total = pageWide ? catalogue.size : yes + no;
      const absent = total - (yes + no);
      const note = absent
        ? `records ${yes} of the ${total} resource types listed on this page. The ${m.section} table lists ${yes + no} of them and marks ${no} No here. The other ${absent} types are absent from that table, which lists no type that every Region in the group marks No.`
        : `records ${yes} of the ${total} resource types listed on this page; the page marks the other ${no} No for this Region.`;

      covered.push({
        id: region.id,
        label,
        status: yes < total ? 'partial' : 'full',
        ...(yes < total ? { note } : {}),
        quote: cell,
      });
    }
  }

  const feature: Feature = {
    id: 'config/configuration-recording-by-region',
    name: 'AWS Config configuration recording by Region',
    serviceId: 'config',
    scope: 'feature',
    whatIsCounted:
      'AWS Regions in which AWS Config records at least one of the resource types listed on this page',
    axis: 'region',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'The evidence for each Region is its column heading in the coverage matrix. The page carries no sentence about a single Region; the page title "Resource Coverage by Region Availability" and the Yes and No cells under the heading give the verdict.',
      `Each note is measured against the ${catalogue.size} resource types the page lists anywhere, so the 38 numbers can be compared. The six tables list different subsets of those ${catalogue.size} types, and a smaller table is not a smaller yardstick: no table holds a row marked No in every one of its Regions, so a type a table leaves out is recorded in no Region of that group.`,
      'Each note also gives the count for the table the Region sits in, because that count is what the page states and the rest is read from the shape of the tables.',
      'A Region is partial when it does not record every listed resource type. No Region records all of them, so all 38 are partial.',
      'The page names 38 of the 46 Regions. It says nothing about the 8 ISO, ISOB, ISOF and European Sovereign Cloud Regions, so they are neither covered nor excluded.',
      'Resource types are hundreds of instances of one thing and are not counted here. The resource type axis is claimed by the sibling page resource-config-reference.',
    ],
  };

  return covered.length
    ? { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] }
    : { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'no Region column was found in the coverage tables' };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
