import { guideKeyFromUrl } from "../sources/docsIndex.js";
import type { DocPage } from "../sources/docsIndex.js";
import type { GuideIndex } from "../sources/guidePages.js";
import type { Service } from "../core/schema.js";

/**
 * A guide often documents more than one service. The IAM guide carries IAM Access
 * Analyzer, the WAF guide carries Shield and Firewall Manager, the Route 53 guide
 * carries Resolver DNS Firewall. Attribution decides, page by page, which service a
 * page is really about, so features land on the right service.
 */

export type Attribution = { guide: GuideIndex; pages: DocPage[] };

const GENERIC_PHRASES = new Set([
  "aws", "amazon", "service", "services", "cloud", "web services", "aws cloud",
  "console", "api", "sdk", "cli", "guide", "user guide", "developer guide",
]);

function phrasesFor(service: Service): string[] {
  const raw = [service.productName, ...service.names].filter((n): n is string => Boolean(n));
  const out = new Set<string>();
  for (const name of raw) {
    const clean = name
      .replace(/\s*\(.*?\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!clean || GENERIC_PHRASES.has(clean)) continue;
    const words = clean.split(" ");
    if (words.length < 2 && clean.length < 8) continue;
    out.add(clean);
    // Drop a leading vendor word so "amazon detective" also matches "detective".
    const stripped = clean.replace(/^(amazon|aws)\s+/, "");
    if (stripped !== clean && (stripped.split(" ").length >= 2 || stripped.length >= 8)) out.add(stripped);
  }
  return [...out];
}

/**
 * Guides that describe capability. Cross-service reference material (API references,
 * the managed policy list, code examples, the CloudFormation template reference)
 * names every service without describing any capability, so it is excluded.
 */
const REFERENCE_GUIDE_PREFIX = new Set([
  "code-library", "aws-managed-policy", "online-register", "service-authorization",
  "general", "powershell", "cli", "code-samples", "glossary", "aws-certification",
  "hands-on", "documentation", "decision-guides", "architecture-center", "whitepapers",
  "sdkref", "sdk-for-java", "sdk-for-javascript", "sdk-for-php", "sdk-for-ruby",
  "sdk-for-net", "sdk-for-go", "sdk-for-cpp", "sdk-for-kotlin", "sdk-for-rust",
  "sdk-for-swift", "sdk-for-sapabap", "pythonsdk", "reference-architecture-diagrams",
  "solutions", "marketplace", "aws-technical-content", "tag-editor",
]);

const CAPABILITY_GUIDE_SUFFIX =
  /\/(ug|userguide|user|developerguide|devguide|dg|adminguide|admin-guide|administrationguide|gsg|bestpractices|latest)$/i;

export function isCapabilityGuide(guideKey: string): boolean {
  const prefix = guideKey.split("/")[0] ?? "";
  if (REFERENCE_GUIDE_PREFIX.has(prefix)) return false;
  if (/\/(APIReference|apireference|TemplateReference|CLIReference|clireference)$/i.test(guideKey)) return false;
  return CAPABILITY_GUIDE_SUFFIX.test(guideKey);
}

export type PhraseIndex = { phrase: string; serviceId: string }[];

export function buildPhraseIndex(services: Service[], inScope: Set<string>): PhraseIndex {
  const index: PhraseIndex = [];
  for (const service of services) {
    if (!inScope.has(service.id)) continue;
    for (const phrase of phrasesFor(service)) index.push({ phrase, serviceId: service.id });
  }
  // Longest phrase wins, so "iam access analyzer" beats "iam".
  return index.sort((a, b) => b.phrase.length - a.phrase.length);
}

/** A phrase must be this specific before it can claim a page from another guide. */
const MIN_CLAIM_PHRASE = 10;

/**
 * Attribution is additive. The guide's owner keeps every page, and any other service
 * named in a page's title or headings also receives that page. Sharing rather than
 * stealing is what lets a capability documented in a neighbouring guide be found,
 * without the owning guide losing its own chapters.
 */
export function attributePage(page: DocPage, ownerId: string, phrases: PhraseIndex): string[] {
  const haystack = [page.title, ...page.section].join(" | ").toLowerCase();
  const claimants = new Set<string>();
  if (ownerId) claimants.add(ownerId);
  for (const entry of phrases) {
    if (entry.serviceId === ownerId) continue;
    if (entry.phrase.length < MIN_CLAIM_PHRASE) continue;
    if (!entry.phrase.includes(" ")) continue;
    if (haystack.includes(entry.phrase)) claimants.add(entry.serviceId);
  }
  return [...claimants];
}

/** Map every indexed guide page to the service it documents. */
export function attributeGuides(
  services: Service[],
  guides: GuideIndex[],
  inScope: Set<string>,
): Map<string, Attribution[]> {
  const phrases = buildPhraseIndex(services, inScope);
  const ownerByGuideKey = new Map<string, string>();
  for (const service of services) {
    for (const guide of service.docGuides) {
      const key = guideKeyFromUrl(guide.url);
      if (!ownerByGuideKey.has(key)) ownerByGuideKey.set(key, service.id);
    }
  }

  const result = new Map<string, Attribution[]>();
  for (const guide of guides) {
    if (!isCapabilityGuide(guide.guideKey)) continue;
    const owner = ownerByGuideKey.get(guide.guideKey) ?? "";
    const buckets = new Map<string, DocPage[]>();
    for (const page of guide.pages) {
      for (const serviceId of attributePage(page, owner, phrases)) {
        const bucket = buckets.get(serviceId);
        if (bucket) bucket.push(page);
        else buckets.set(serviceId, [page]);
      }
    }
    for (const [serviceId, pages] of buckets) {
      if (!serviceId) continue;
      const list = result.get(serviceId);
      const attribution: Attribution = { guide, pages };
      if (list) list.push(attribution);
      else result.set(serviceId, [attribution]);
    }
  }
  return result;
}
