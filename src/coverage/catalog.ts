/**
 * Some axes have no universe until AWS defines one. GuardDuty finding types,
 * Security Hub controls, Config managed rules and Macie data identifiers exist only
 * as catalogs inside the documentation. These are recognised by the shape of their
 * names, and the universe is the union of everything found.
 */

export type CatalogShape = {
  axis: string;
  label: string;
  test: RegExp;
  /** A catalog needs at least this many members before we believe it is one. */
  min: number;
  /** Longest plausible member name. */
  maxLength?: number;
  /**
   * The surrounding heading or column header must mention this. Macie error codes
   * look exactly like Macie data identifiers, and only the context tells them apart.
   */
  contextHint: RegExp;
  /**
   * Services that actually publish this catalog. Without this, Pinpoint metric names
   * read as Config rules and Directory Service status codes read as Macie data
   * identifiers, because the name shapes are identical.
   */
  services: string[];
};

export const CATALOG_SHAPES: CatalogShape[] = [
  {
    axis: "findingType",
    label: "finding type",
    // Backdoor:EC2/C&CActivity.B, UnauthorizedAccess:IAMUser/TorIPCaller
    test: /^[A-Z][A-Za-z]*:[A-Za-z0-9]+\/[A-Za-z0-9._!&\\-]+$/,
    min: 4,
    contextHint: /finding|detection|threat/i,
    services: ["guardduty", "securityhub", "inspector2", "inspector", "macie2", "detective", "securitylake", "security-ir"],
  },
  {
    axis: "control",
    label: "security control",
    // [S3.1], EC2.19, IAM.4
    test: /^\[?[A-Z][A-Za-z0-9]{1,20}\.\d{1,3}\]?$/,
    min: 4,
    contextHint: /control|standard|benchmark|check/i,
    services: ["securityhub", "config", "controltower", "auditmanager", "controlcatalog"],
  },
  {
    axis: "configRule",
    label: "Config managed rule",
    // s3-bucket-public-read-prohibited
    // Must not swallow a run of region codes glued together, nor a long metric name.
    test: /^(?!.*\b[a-z]{2,4}-[a-z]+-\d\b)[a-z][a-z0-9]*(-[a-z0-9]+){2,}$/,
    min: 5,
    maxLength: 60,
    contextHint: /rule|conformance|managed/i,
    services: ["config", "securityhub", "auditmanager", "controltower", "backup"],
  },
  {
    axis: "dataIdentifier",
    label: "managed data identifier",
    // USA_SOCIAL_SECURITY_NUMBER, CREDIT_CARD_NUMBER
    test: /^[A-Z][A-Z0-9]*(_[A-Z0-9]+){1,}$/,
    min: 4,
    // "sensitive data" alone is too loose: Macie's job error codes sit under it.
    contextHint: /data identifier/i,
    services: ["macie2"],
  },
  {
    axis: "managedRuleGroup",
    label: "managed rule group",
    // A rule group is a name, not a sentence about one.
    test: /^(AWSManagedRules[A-Za-z0-9]+|[A-Za-z][A-Za-z0-9 ]{2,44}\brule group)$/i,
    min: 3,
    maxLength: 60,
    contextHint: /rule group|managed rule/i,
    services: ["wafv2", "waf", "waf-regional", "fms", "shield"],
  },
  {
    axis: "ipsRule",
    label: "rule group",
    test: /^[A-Za-z][A-Za-z0-9]*(Rule(Set|Group)|RuleGroup)$/,
    min: 3,
    contextHint: /rule group|rule set|ruleset/i,
    services: ["network-firewall", "wafv2", "fms"],
  },
];

const NOISE = /^(see also|next|previous|note|important|warning|example|overview|contents?)$/i;

/**
 * A cell often lists several catalog members at once:
 * "Depending on country or region: FRANCE_BANK_ACCOUNT_NUMBER, GERMANY_..." .
 */
export function splitCatalogCell(value: string): string[] {
  const parts = value
    .split(/[,;·]|\s+or\s+/)
    .map((p) => p.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)\]]+$/g, "").trim())
    .filter(Boolean);
  return parts.length > 1 ? [value.trim(), ...parts] : [value.trim()];
}

export type CatalogMatch = { shape: CatalogShape; values: string[]; rate: number };

/** Does this run of values look like one of the known catalogs? */
export function classifyCatalog(values: string[], serviceId: string, context = ""): CatalogMatch | undefined {
  const cleaned = values.map((v) => v.trim()).filter((v) => v.length > 2 && !NOISE.test(v));
  if (cleaned.length < 3) return undefined;
  let best: CatalogMatch | undefined;
  for (const shape of CATALOG_SHAPES) {
    if (!shape.services.includes(serviceId)) continue;
    if (!shape.contextHint.test(context)) continue;
    const hits = cleaned.filter((v) => shape.test.test(v) && v.length <= (shape.maxLength ?? 120));
    if (hits.length < shape.min) continue;
    const rate = hits.length / cleaned.length;
    if (rate < 0.7) continue;
    if (!best || rate > best.rate || (rate === best.rate && hits.length > best.values.length)) {
      best = { shape, values: hits, rate };
    }
  }
  return best;
}

/** Normalise a catalog member so the same item from two pages counts once. */
export function catalogTargetId(axis: string, value: string): string {
  const text = value.trim().replace(/^\[|\]$/g, "").replace(/\\!/g, "!");
  // A published name keeps its case; a lower-case identifier is normalised.
  if (axis === "configRule") return text.toLowerCase();
  return text;
}
