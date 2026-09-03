import type { EvidenceItem, Feature, ParseResult } from '../core/types.js';
import type { ParserModule } from './registry.js';
import { boldHeadings, normalizeSpaces, sections } from '../core/markdown.js';
import { regions, resolveRegion, services } from '../core/universe.js';

const URL_ = 'https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_regions.md';
const PARSER_ID = 'guardduty-regional-feature-availability';

/**
 * One page, many things. Each bold run-in heading under "Region-specific feature
 * availability" is a different feature. Only headings that name the Regions where the
 * thing is NOT supported state Region coverage we can count; the rest name partitions,
 * API operations, AWS Dedicated Local Zones or nothing at all, and yield no feature.
 *
 * The baseline these headings state differences from is "the AWS Regions where GuardDuty
 * is available", not every Region. The page defines that set by reference, in its first
 * sentence, to the GuardDuty endpoints page in the General Reference; services.json
 * carries that same list under `general-reference-endpoints`. Regions absent from it are
 * therefore excluded, alongside the Regions each heading names.
 */
interface Spec {
  id: string;
  name: string;
  scope: Feature['scope'];
  /** One sentence naming what the numerator counts. */
  counted: string;
  heading: RegExp;
  /** Regions come either from the heading's own prose or from a recovered HTML table. */
  table?: RegExp;
}

const SPECS: Spec[] = [
  {
    id: 'guardduty/rds-protection-regions',
    name: 'GuardDuty RDS Protection',
    scope: 'feature',
    counted: 'AWS Regions where GuardDuty RDS Protection runs, taken as every Region where GuardDuty itself is available except the one the page names as unsupported',
    heading: /^RDS Protection$/,
  },
  {
    id: 'guardduty/finding-credentialaccess-iamuser-compromisedcredentials-regions',
    name: 'GuardDuty IAM finding type CredentialAccess:IAMUser/CompromisedCredentials',
    scope: 'subfeature',
    counted: 'AWS Regions where GuardDuty can raise the CredentialAccess:IAMUser/CompromisedCredentials finding type, taken as every Region where GuardDuty itself is available except the ones the page names as unsupported',
    heading: /^IAM finding type .*CredentialAccess:IAMUser\/CompromisedCredentials$/,
    table: /CredentialAccess:IAMUser\/CompromisedCredentials/,
  },
  {
    id: 'guardduty/finding-defenseevasion-iamuser-bedrockloggingdisabled-regions',
    name: 'GuardDuty IAM finding type DefenseEvasion:IAMUser/BedrockLoggingDisabled',
    scope: 'subfeature',
    counted: 'AWS Regions where GuardDuty can raise the DefenseEvasion:IAMUser/BedrockLoggingDisabled finding type, taken as every Region where GuardDuty itself is available except the one the page names as unsupported',
    heading: /^IAM finding type .*DefenseEvasion:IAMUser\/BedrockLoggingDisabled$/,
  },
  {
    id: 'guardduty/finding-defenseevasion-ec2-unusual-doh-dot-regions',
    name: 'GuardDuty EC2 finding types DefenseEvasion:EC2/UnusualDoHActivity and DefenseEvasion:EC2/UnusualDoTActivity',
    scope: 'subfeature',
    counted: 'AWS Regions where GuardDuty can raise the DefenseEvasion:EC2/UnusualDoHActivity and DefenseEvasion:EC2/UnusualDoTActivity finding types, taken as every Region where GuardDuty itself is available except the ones the page names as unsupported',
    heading: /^Amazon EC2 finding types .*UnusualDoTActivity$/,
    table: /UnusualDoHActivity/,
  },
];

/** "... not supported in Asia Pacific (Taipei) (`ap-east-2`) Region." */
const NAMED = /not supported in (?:the )?([^.]*?\(`([a-z0-9-]+)`\))/;

/** The sentence that defines the baseline by reference. Quoted for the Regions it rules out. */
const BASELINE = /^To view the AWS Regions where Amazon GuardDuty is available.*$/m;

/** A supplement block: a "Table N follows the heading: ..." line plus its rows. */
interface Recovered {
  heading: string;
  rows: { label: string; code: string; raw: string }[];
}

const recoveredTables = (supplement: string): Recovered[] => {
  const headings = [...supplement.matchAll(/^Table \d+ follows the heading:\s*(.+)$/gm)].map(
    (m) => m[1]!.trim(),
  );
  const out: Recovered[] = [];
  let current: Recovered | undefined;
  for (const line of supplement.split('\n')) {
    if (/^AWS Region\s*\|\s*Region code\s*$/.test(line)) {
      current = { heading: headings[out.length] ?? '', rows: [] };
      out.push(current);
      continue;
    }
    const cells = line.split('|').map((c) => c.trim());
    if (current && cells.length === 2 && cells[1] && /^[a-z]{2}[a-z-]*-\d$/.test(cells[1])) {
      current.rows.push({ label: cells[0]!, code: cells[1], raw: line.trimEnd() });
    } else if (!line.trim()) {
      current = undefined;
    }
  }
  return out;
};

const NOTES = (absent: string[]): string[] => [
  'The page lists differences from a baseline it states as "the AWS Regions where GuardDuty is available", not as every Region. That baseline is not enumerated here: the page defines it by reference to the GuardDuty endpoints page in the AWS General Reference. Coverage is therefore every Region on that endpoints list, minus the Regions this page names.',
  `${absent.length} Region(s) are excluded because GuardDuty is not offered there at all, per the endpoints list the page points at: ${absent.join(', ')}. They carry the page sentence that makes that list the baseline, not a statement about the feature.`,
  'Coverage of a Region the page is simply silent about rests on the section being a complete list of regional differences. That is the weakest evidence in this feature: the quote on each covered Region is the sentence naming the exceptions, not a statement about that Region.',
  'The page also carries separate "AWS GovCloud (US) Regions" and "China Regions" headings pointing at other guides. Those partitions are still inside this list — one heading names all four of their Regions as exceptions — so they are counted, but a difference documented only in those guides would not show up here.',
  'AWS Dedicated Local Zones are named on the page but are not Regions, so they appear in neither list.',
];

const parse = (page: { body: string; sha256: string; supplement?: string }): ParseResult => {
  const nothing = (why: string): ParseResult => ({
    sourceUrl: URL_,
    parserId: PARSER_ID,
    features: [],
    noCoverageReason: why,
  });

  const section = sections(page.body).find((s) => s.title === 'Region-specific feature availability');
  if (!section) return nothing('the Region-specific feature availability section was not found');

  const baselineQuote = BASELINE.exec(page.body)?.[0]?.trimEnd();
  const available = new Set(services.find((s) => s.id === 'guardduty')?.regions ?? []);
  if (!baselineQuote || !available.size)
    return nothing('the page states differences from the Regions where GuardDuty is available, and that baseline could not be established');

  /** Regions outside the baseline: GuardDuty is not offered, so no GuardDuty feature is. */
  const absent: EvidenceItem[] = regions
    .filter((r) => !available.has(r.id))
    .map((r) => ({ id: r.id, label: r.name, status: 'full' as const, quote: baselineQuote }));

  const heads = boldHeadings(section.block);
  const tables = recoveredTables(page.supplement ?? '');
  const features: Feature[] = [];

  for (const spec of SPECS) {
    const head = heads.find((h) => spec.heading.test(h.title));
    if (!head) continue;

    const lines = head.body.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
    const statement = lines[0];
    if (!statement) continue;

    const named: EvidenceItem[] = [];
    if (spec.table) {
      const table = tables.find((t) => spec.table!.test(t.heading));
      for (const row of table?.rows ?? []) {
        const region = resolveRegion(row.code);
        if (region && !named.some((e) => e.id === region.id))
          named.push({ id: region.id, label: row.label, status: 'full', quote: row.raw });
      }
    } else {
      for (const line of lines) {
        const m = NAMED.exec(normalizeSpaces(line));
        const region = m?.[2] ? resolveRegion(m[2]) : undefined;
        if (region && !named.some((e) => e.id === region.id))
          named.push({ id: region.id, label: m![1]!.trim(), status: 'full', quote: line });
      }
    }
    if (!named.length) continue;

    const excluded = [...named, ...absent.filter((a) => !named.some((e) => e.id === a.id))];
    const gone = new Set(excluded.map((e) => e.id));
    const covered: EvidenceItem[] = regions
      .filter((r) => !gone.has(r.id))
      .map((r) => ({ id: r.id, label: r.name, status: 'full' as const, quote: statement }));

    features.push({
      id: spec.id,
      name: spec.name,
      serviceId: 'guardduty',
      scope: spec.scope,
      whatIsCounted: spec.counted,
      axis: 'region',
      derivation: 'universe-minus-exclusions',
      covered,
      excluded,
      unresolved: [],
      sourceUrl: URL_,
      bodySha256: page.sha256,
      parserId: PARSER_ID,
      notes: NOTES(absent.map((a) => a.id)),
    });
  }

  if (!features.length)
    return nothing('no heading named the Regions where a GuardDuty feature is unsupported');

  return { sourceUrl: URL_, parserId: PARSER_ID, features };
};

export const parser: ParserModule = { url: URL_, parserId: PARSER_ID, parse };
