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

/**
 * Only a service's full published name may claim a page. A stripped variant is too
 * weak: "machine learning" appears in every SageMaker heading, and letting Amazon
 * Machine Learning claim those pages gave it 173 features that are not its own.
 */
function phrasesFor(service: Service): string[] {
  const raw = [service.productName, ...service.names].filter((n): n is string => Boolean(n));
  const out = new Set<string>();
  for (const name of raw) {
    const cleaned = name
      .replace(/\s*\(.*?\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!cleaned || GENERIC_PHRASES.has(cleaned)) continue;
    if (cleaned.split(" ").length < 2 && cleaned.length < 8) continue;
    if (looksLikeDocumentTitle(cleaned)) continue;
    if (canClaim(cleaned)) out.add(cleaned);
    const stripped = cleaned.replace(/^(amazon|aws)\s+/, "").trim();
    if (stripped !== cleaned && isDistinctive(stripped)) out.add(stripped);
  }
  return [...out];
}

/**
 * A phrase may claim a page only when it could not be ordinary English. A vendor
 * word is enough ("aws shield"); otherwise the phrase must be distinctive.
 * "machine learning" is neither, and it collected the whole SageMaker guide.
 */
function canClaim(phrase: string): boolean {
  if (/\b(aws|amazon)\b/.test(phrase)) return true;
  return isDistinctive(phrase);
}

/** Exam guides, tutorials and architecture diagrams name documents, not services. */
function looksLikeDocumentTitle(phrase: string): boolean {
  if (phrase.split(" ").length > 6) return true;
  return /(exam guide|architecture diagram|hands-on|tutorial|whitepaper|release notes|:|reference architecture)/.test(phrase);
}

/**
 * A name without its vendor word may still claim a page, but only when it could not
 * be ordinary English. "route 53 resolver" and "guardduty" qualify; "machine
 * learning" does not, and letting it through gave Amazon Machine Learning 173
 * features lifted from the SageMaker guide.
 */
function isDistinctive(phrase: string): boolean {
  const tokens = phrase.split(" ").filter(Boolean);
  if (tokens.length >= 3) return true;
  if (/\d/.test(phrase)) return true;
  return tokens.some((t) => t.length >= 9);
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
  // A chapter named after another service, or a page titled after it, belongs to
  // that service alone. The IAM guide's "IAM Access Analyzer" chapter is Access
  // Analyzer's, and leaving it with IAM as well produced the same feature twice.
  const dedicated = `${page.title} | ${page.section[0] ?? ""}`.toLowerCase();
  // Phrases the owner answers to as well. "Amazon Inspector" belongs to both
  // Inspector and Inspector Classic, so it can never take a page off its owner.
  const ownerPhrases = new Set(phrases.filter((p) => p.serviceId === ownerId).map((p) => p.phrase));
  const claimants = new Set<string>();
  let owned = true;
  for (const entry of phrases) {
    if (entry.serviceId === ownerId) continue;
    if (entry.phrase.length < MIN_CLAIM_PHRASE) continue;
    if (!entry.phrase.includes(" ")) continue;
    if (!haystack.includes(entry.phrase)) continue;
    claimants.add(entry.serviceId);
    if (dedicated.includes(entry.phrase) && !ownerPhrases.has(entry.phrase)) owned = false;
  }
  if (ownerId && owned) claimants.add(ownerId);
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
  // A guide whose prefix names a service belongs to it, even when the service
  // universe did not join the two.
  const serviceIds = new Set(services.map((s) => s.id));
  const flat = new Map<string, string>();
  for (const id of serviceIds) flat.set(id.replace(/[^a-z0-9]/g, ""), id);

  const result = new Map<string, Attribution[]>();
  let unowned = 0;
  for (const guide of guides) {
    if (!isCapabilityGuide(guide.guideKey)) continue;
    const prefix = (guide.guideKey.split("/")[0] ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const owner = ownerByGuideKey.get(guide.guideKey) ?? flat.get(prefix) ?? "";
    // A guide nobody owns must not have its pages handed out to whichever service
    // happens to share a word with a heading. That is how Amazon Machine Learning
    // collected the SageMaker guide.
    if (!owner) {
      unowned += 1;
      continue;
    }
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
  if (unowned > 0) unownedGuideCount = unowned;
  return result;
}

/** Guides skipped in the last run because no service claimed them. */
export let unownedGuideCount = 0;
