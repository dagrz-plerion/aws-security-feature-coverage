/** The three axes that exist independently of any AWS service. */
export type Axis = 'region' | 'service' | 'resourceType';

/**
 * How much of the axis item the feature reaches.
 * - full: the page states the item is covered, with nothing carved out.
 * - partial: the page states the item is covered, but names a carve-out
 *   (e.g. a Region where the feature runs but some of its controls do not).
 */
export type CoverageStatus = 'full' | 'partial';

/** How the covered list was arrived at. */
export type Derivation =
  /** Every covered item is named on the page. */
  | 'enumerated'
  /** The page says "all <axis> except X". Only legal for the region axis. */
  | 'universe-minus-exclusions';

/** Where the feature sits. Guards against naming a sub-feature as a service. */
export type Scope =
  /** The whole service. Only when the page really is about the service. */
  | 'service'
  /** A named feature of a service, e.g. GuardDuty RDS Protection. */
  | 'feature'
  /** A part of a feature, e.g. one IAM condition key, one finding type. */
  | 'subfeature';

export interface EvidenceItem {
  /** Canonical universe id. Must exist in regions/services/resource-types. */
  id: string;
  /** The wording the page used, kept verbatim. */
  label: string;
  status: CoverageStatus;
  /** Required when status is partial: what is carved out, and how much. */
  note?: string;
  /** Verbatim substring of the page body. Enforced by test. */
  quote: string;
}

/** A value the page named that no universe entry matched. Never counted. */
export interface UnresolvedItem {
  label: string;
  quote: string;
  reason: string;
}

export interface Feature {
  /** Stable kebab-case id, unique across the dataset. */
  id: string;
  /** Precise name. Never a bare service name unless scope is 'service'. */
  name: string;
  /** IAM prefix of the owning service, from services.json. */
  serviceId: string;
  scope: Scope;
  /** One sentence naming exactly what the numerator counts. */
  whatIsCounted: string;
  axis: Axis;
  derivation: Derivation;
  /** Items the page states are covered. */
  covered: EvidenceItem[];
  /** Items the page states are NOT covered. Never counted in the numerator. */
  excluded: EvidenceItem[];
  /** Items named on the page that did not resolve. Never counted. */
  unresolved: UnresolvedItem[];
  sourceUrl: string;
  bodySha256: string;
  parserId: string;
  /** Anything a reader needs to read the number correctly. */
  notes: string[];
}

/** A parser's whole output for one page. */
export interface ParseResult {
  sourceUrl: string;
  parserId: string;
  features: Feature[];
  /**
   * Set when the page states no coverage on any axis (for example it only
   * links elsewhere). features must then be empty.
   */
  noCoverageReason?: string;
}

export interface PageBody {
  url: string;
  body: string;
  sha256: string;
}

export type Parser = (page: PageBody) => ParseResult;
