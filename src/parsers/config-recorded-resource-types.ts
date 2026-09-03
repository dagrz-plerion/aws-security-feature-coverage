import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { tables } from '../core/markdown.js';
import { resolveResourceType } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/config/latest/developerguide/resource-config-reference.md';
const PARSER_ID = 'config-recorded-resource-types';

/** `**Resource Type Value:** X / **Relationship:** ...`, or X alone on the line. */
const BULLET = /^\s*-\s+\*\*Resource Type Value:\*\*\s*(.*?)\s*(?:\/\s*\*\*(?:Relationship|Related Resource|Notes):\*\*.*)?$/;

/** Footnote markers, code ticks and the `<br />` the page puts before a type. */
const clean = (cell: string): string =>
  cell.replace(/\\\*/g, '').replace(/`/g, '').replace(/<br\s*\/?>/g, ' ').replace(/\s+/g, ' ').trim();

const typeOf = (label: string): string => label.split(' ').pop() ?? '';

/**
 * Types the page marks with a footnote that carves a sub-kind out of the type.
 * The other ten footnotes add context (a "learn more" link, a query limitation, a
 * relationship rule) or carve out other types, not the footnoted type itself.
 */
const CARVE_OUT: Record<string, string> = {
  'AWS::ECS::Service':
    'Recorded only for ECS services on the new (long) ARN format. The page prints the old format as "Old (not supported)" and does not say how many services are still on it.',
};

interface Listed {
  label: string;
  quote: string;
}

const listed = (body: string): Listed[] => {
  const out: Listed[] = [];

  for (const line of body.split('\n')) {
    const m = BULLET.exec(line);
    if (m?.[1]) out.push({ label: clean(m[1]), quote: line.trim() });
  }

  // The page also renders single-type services as a five-column table.
  for (const t of tables(body)) {
    const col = t.headers.indexOf('Resource Type Value');
    if (col < 0) continue;
    t.rows.forEach((row, i) => {
      const cell = clean(row[col] ?? '');
      if (cell) out.push({ label: cell, quote: (t.rawRows[i] ?? '').trim() });
    });
  }

  return out;
};

const parse = (page: { body: string; sha256: string }): ParseResult => {
  const covered: EvidenceItem[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const unresolved: Feature['unresolved'] = [];

  for (const item of listed(page.body)) {
    // One group heading carries "NA" where a type would be; it names no type.
    if (item.label === 'NA') continue;
    const hit = resolveResourceType(typeOf(item.label));
    if (!hit) {
      unresolved.push({ label: item.label, quote: item.quote, reason: 'no resource type matched' });
      continue;
    }
    if (seen.has(hit.id)) {
      duplicates.push(`${item.label} is a second listing of ${hit.id}`);
      continue;
    }
    seen.add(hit.id);
    const carveOut = CARVE_OUT[hit.id];
    covered.push({
      id: hit.id,
      label: item.label,
      status: carveOut ? 'partial' : 'full',
      ...(carveOut ? { note: carveOut } : {}),
      quote: item.quote,
    });
  }

  const feature: Feature = {
    id: 'config/recorded-resource-types',
    name: 'AWS Config configuration recording',
    serviceId: 'config',
    scope: 'feature',
    whatIsCounted:
      'AWS resource types whose configuration AWS Config can record as configuration items',
    axis: 'resourceType',
    derivation: 'enumerated',
    covered,
    excluded: [],
    unresolved,
    sourceUrl: URL_,
    bodySha256: page.sha256,
    parserId: PARSER_ID,
    notes: [
      'Counted from the "Resource Type Value" field only. The per-service headings and the "Related Resource" cells name services and relationship targets, not recorded types.',
      ...(duplicates.length ? [`Counted once each after removing ${duplicates.length} repeat listing(s): ${duplicates.join('; ')}.`] : []),
      'Do not read this as an independent measurement of the resource-type universe. resource-types.json names this page (source id "config-reference") as one of the sources it is generated from, so every value the page lists is in the universe by construction and the 100% resolve rate proves nothing. 22 of the 3160 universe entries exist only because this page named them, and all 22 are in this covered list. The denominator is a union of catalogues, not a census, so treat the ratio as a rough breadth signal.',
      'One row is garbled: the group heading is the resource type AWS::EC2::VPCGatewayAttachment and the Resource Type Value reads NA, with an empty Related Resource and no Notes field at all. "NA" elsewhere on the page means "not applicable", never "not recorded", so the row states neither coverage nor exclusion. It is counted in neither list.',
      'Application and Network Load Balancers appear as two rows sharing one Resource Type Value, AWS::ElasticLoadBalancingV2::LoadBalancer, so they are one count here. The Shield Advanced page spells the same distinction as two resource types, elasticloadbalancing:loadbalancer/app/ and /net/, and shield-protected-resource-types counts them separately. Both parsers follow their own page; the two features therefore do not join on a common load balancer id.',
      'Recording a type is per Region and per account. The page says some Regions support only a subset of these types, and that advanced queries, proactive evaluation and periodic rules each reach a smaller subset. None of those subsets is enumerated here.',
    ],
  };

  if (covered.length === 0)
    return { sourceUrl: URL_, parserId: PARSER_ID, features: [], noCoverageReason: 'no resource type value was found on the page' };

  return { sourceUrl: URL_, parserId: PARSER_ID, features: [feature] };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
