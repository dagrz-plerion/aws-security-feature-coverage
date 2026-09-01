import { readRawBody } from "../core/fetch.js";
import { quoteAppearsIn } from "../core/evidence.js";
import { featureId } from "../core/ids.js";
import { isContainer, isStructural, matchesNamedControl } from "./patterns.js";
import { guideKeyFromUrl } from "../sources/docsIndex.js";
import type { GuideIndex } from "../sources/guidePages.js";
import type { DocPage } from "../sources/docsIndex.js";
import type { Evidence, Feature, SecurityTier } from "../core/schema.js";
import type { ServiceModel } from "../core/aws.js";

export type FeatureCandidate = {
  id: string;
  serviceId: string;
  name: string;
  aliases: string[];
  kind: Feature["kind"];
  discoveredBy: string;
  docUrls: string[];
  summary?: string;
  evidence: Evidence[];
};

/** Enum shapes whose values name capabilities rather than states. */
/**
 * The shape must END with one of these. Matching anywhere caught CoverageSortKey
 * and CoverageStatus, whose values are sort keys and states, not capabilities.
 */
const FEATURE_ENUM_SHAPE =
  /(Feature|Features|ScanType|ScanTypes|DataSource|DataSources|AnalyzerType|PolicyType|ProtectionPlan|ProtectionType|StandardsControl)$/;
/** Above this many values, an enum is a taxonomy rather than a set of capabilities. */
const MAX_CAPABILITY_ENUM = 15;

/** Shape names that describe a setting the API can switch on or off. */
const TOGGLE_SHAPE = /(Preference|Preferences|Setting|Settings)$/;

const STATE_ENUM_VALUE = /^(ENABLED|DISABLED|ENABLING|DISABLING|ACTIVE|INACTIVE|PENDING|FAILED|SUCCEEDED|CREATING|DELETING|UPDATING|ALL|NONE|UNKNOWN|TRUE|FALSE)$/;

function kindFor(name: string): Feature["kind"] {
  const n = name.toLowerCase();
  if (/protection plan|protection$/.test(n)) return "protection-plan";
  if (/scan|assessment|sbom/.test(n)) return "scan-type";
  if (/analyz/.test(n)) return "analyzer";
  if (/polic/.test(n)) return "policy-type";
  if (/encrypt|key|kms|cipher|post-quantum/.test(n)) return "encryption";
  if (/log|trail|audit|event data store|insight/.test(n)) return "logging";
  if (/firewall|acl|security group|network|tls|ddos|waf|rule group|web acl/.test(n)) return "network-control";
  if (/identity|role|mfa|credential|federation|saml|oidc|permission|access/.test(n)) return "identity-control";
  if (/control|standard|guardrail|conformance/.test(n)) return "control-set";
  if (/integration|subscriber|export/.test(n)) return "integration";
  if (/detect|threat|malware|finding|behavior graph|runtime monitoring/.test(n)) return "detection-capability";
  if (/remediat|response|incident/.test(n)) return "response";
  return "configuration";
}

/**
 * A one-word heading like "Access" or "Findings" names a page, not a capability.
 * Such names also swallow coverage lists that belong to a real feature.
 */
const GENERIC_NAME = new Set([
  "access", "findings", "finding", "controls", "control", "policies", "policy",
  "results", "dashboard", "overview", "settings", "setting", "rules", "rule",
  "events", "event", "logs", "log", "keys", "key", "roles", "role", "users",
  "user", "groups", "group", "reports", "report", "features", "feature",
  "resources", "resource", "services", "service", "actions", "action", "usage",
  "types", "type", "options", "option", "status", "details", "notifications",
]);

function isTooGeneric(name: string): boolean {
  const words = name.toLowerCase().split(/\s+/);
  if (words.length === 1) return true;
  // Three words are specific enough even when each one is common on its own:
  // "service control policies" is a real feature, "access control" is not.
  if (words.length > 2) return false;
  return words.every((w) => GENERIC_NAME.has(w));
}

/** A heading names a capability; a sentence describes one. Keep only headings. */
function looksLikeSentence(name: string): boolean {
  if (/[.!?]$/.test(name)) return true;
  const words = name.split(/\s+/);
  if (words.length > 8) return true;
  return /\b(this|that|these|those|you|your|when|which|because|provides?|contains?|includes?|should|must|can be)\b/i.test(name);
}

const LEADING_VERB =
  /^(configuring|configure|using|use|working with|work with|setting up|set up|managing|manage|enabling|enable|disabling|disable|understanding|understand|reviewing|review|archiving|archive|filtering|filter|resolving|resolve|previewing|preview|monitoring|monitor|how)\s+(?:(?:an?|the|your)\s+)?/i;

/** After a verb is stripped, a leading joining word means we cut a phrase in half. */
const DANGLING_START = /^(and|or|for|with|in|to|by|of|the|a|an|from|on|at|as|that|which)\b/i;

function normaliseName(raw: string): string {
  return raw
    .replace(LEADING_VERB, "")
    .replace(/\s+in\s+(amazon|aws)\s+\S+$/i, "")
    .replace(/\s+for\s+(amazon|aws)\s+\S+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function makeGuideEvidence(guide: GuideIndex, body: string | undefined, page: DocPage): Evidence[] {
  const quote = `[${page.title}](${page.url})`;
  if (!body || !quoteAppearsIn(body, quote)) return [];
  return [
    {
      sourceUrl: guide.llmsTxt,
      bodySha256: guide.bodySha256,
      retrievedAt: guide.fetchedAt,
      quote,
      locator: page.section.length ? page.section.join(" > ") : guide.title,
    },
  ];
}

export type ExtractInput = {
  serviceId: string;
  /** Published names of the service, used to anchor features inside a borrowed guide. */
  serviceNames: string[];
  tier: SecurityTier;
  /** Pages attributed to this service, grouped by the guide they came from. */
  attributions: { guide: GuideIndex; pages: DocPage[] }[];
  apiModel?: { model: ServiceModel; file: string; bodySha256: string; retrievedAt: string; url: string };
};

/**
 * Pull feature candidates from a service's guides and API model. Nothing here
 * decides what is real; it collects everything with a source, and the merge step
 * de-duplicates.
 */
export async function extractFeatureCandidates(input: ExtractInput): Promise<FeatureCandidate[]> {
  const out: FeatureCandidate[] = [];
  const push = (candidate: Omit<FeatureCandidate, "id">): void => {
    const name = normaliseName(candidate.name);
    if (!name || name.length < 3 || name.length > 70) return;
    if (isTooGeneric(name)) return;
    if (DANGLING_START.test(name)) return;
    if (isStructural(name)) return;
    if (looksLikeSentence(name)) return;
    out.push({ ...candidate, name, id: featureId(input.serviceId, name) });
  };

  for (const { guide, pages } of input.attributions) {
    const body = await readRawBody(guide.bodySha256);
    const isUserGuide = /\/(ug|userguide|user|developerguide|dg|admin-guide|adminguide)$/i.test(guide.guideKey);
    const ownsGuide = pages.length > guide.pages.length / 2;

    // A. Top-level chapters of a security service's own user guide are its features.
    //    For a service that is not itself a security service, only chapters that name
    //    a security control count, so a storage guide does not become 600 features.
    const chapterFilter = (label: string, parentPath: string[]): boolean =>
      input.tier === "tier1" ||
      Boolean(matchesNamedControl(label)) ||
      parentPath.some((p) => Boolean(matchesNamedControl(p)) || /^security\b/i.test(p));

    if (isUserGuide && ownsGuide) {
      const chapters = new Map<string, DocPage>();
      for (const page of pages) {
        const top = page.section[0];
        if (top && !chapters.has(top)) chapters.set(top, page);
      }
      // AWS nests capability one or two levels deep, so both levels are collected.
      const subChapters = new Map<string, DocPage>();
      for (const page of pages) {
        const top = page.section[0];
        const second = page.section[1];
        if (!top || !second || isStructural(top) || isStructural(second)) continue;
        const key = `${top} > ${second}`;
        if (!subChapters.has(key)) subChapters.set(key, page);
      }
      for (const [, page] of subChapters) {
        const second = page.section[1] as string;
        if (!chapterFilter(second, page.section.slice(0, 1))) continue;
        push({
          serviceId: input.serviceId,
          name: second,
          aliases: [],
          kind: kindFor(second),
          discoveredBy: "guide-subchapter",
          docUrls: [page.url],
          ...(page.description ? { summary: page.description } : {}),
          evidence: makeGuideEvidence(guide, body, page),
        });
      }

      for (const [chapter, page] of chapters) {
        if (isStructural(chapter)) continue;
        if (!isContainer(chapter) && !chapterFilter(chapter, [])) continue;
        if (isContainer(chapter)) {
          // The children carry the real names.
          const children = new Map<string, DocPage>();
          for (const p of pages) {
            if (p.section[0] !== chapter) continue;
            const child = p.section[1];
            if (child && !children.has(child)) children.set(child, p);
          }
          for (const [child, childPage] of children) {
            if (isStructural(child)) continue;
            if (!chapterFilter(child, [chapter])) continue;
            push({
              serviceId: input.serviceId,
              name: child,
              aliases: [],
              kind: kindFor(child),
              discoveredBy: "guide-chapter",
              docUrls: [childPage.url],
              evidence: makeGuideEvidence(guide, body, childPage),
            });
          }
          continue;
        }
        push({
          serviceId: input.serviceId,
          name: chapter,
          aliases: [],
          kind: kindFor(chapter),
          discoveredBy: "guide-chapter",
          docUrls: [page.url],
          evidence: makeGuideEvidence(guide, body, page),
        });
      }
    }

    // A2. When a service is documented inside another service's guide, the pages
    //     attributed to it are its own chapters.
    if (!ownsGuide && pages.length > 0) {
      const ownNames = input.serviceNames.map((n) => n.toLowerCase());
      const namesThisService = (text: string): boolean => {
        const lower = text.toLowerCase();
        return ownNames.some((n) => n.length >= 6 && lower.includes(n));
      };
      const borrowed = new Map<string, DocPage>();
      for (const page of pages) {
        // The heading that names this service is the anchor. Its child is the feature.
        const anchor = page.section.findIndex((s) => namesThisService(s));
        let label: string | undefined;
        if (anchor >= 0) label = page.section[anchor + 1] ?? page.title;
        else if (matchesNamedControl(page.title)) label = page.title;
        if (!label || isStructural(label)) continue;
        if (!borrowed.has(label)) borrowed.set(label, page);
      }
      for (const [label, page] of borrowed) {
        push({
          serviceId: input.serviceId,
          name: label,
          aliases: [],
          kind: kindFor(label),
          discoveredBy: "attributed-page",
          docUrls: [page.url],
          ...(page.description ? { summary: page.description } : {}),
          evidence: makeGuideEvidence(guide, body, page),
        });
      }
    }

    // B. Sub-sections under a Security chapter name real controls, at any tier.
    const securityChildren = new Map<string, DocPage>();
    for (const page of pages) {
      if (!/^security\b/i.test(page.section[0] ?? "")) continue;
      const child = page.section[1];
      if (child && !securityChildren.has(child)) securityChildren.set(child, page);
    }
    for (const [child, page] of securityChildren) {
      if (isStructural(child)) continue;
      push({
        serviceId: input.serviceId,
        name: child,
        aliases: [],
        kind: kindFor(child),
        discoveredBy: "security-chapter",
        docUrls: [page.url],
        evidence: makeGuideEvidence(guide, body, page),
      });
    }

    // C. Named controls anywhere in the guide, at any tier. This is how a security
    //    capability inside a non-security service is found.
    const seenNamed = new Set<string>();
    for (const page of pages) {
      const candidates: { text: string; page: DocPage }[] = [{ text: page.title, page }];
      for (const section of page.section) candidates.push({ text: section, page });
      for (const candidate of candidates) {
        const hit = matchesNamedControl(candidate.text);
        if (!hit) continue;
        const key = candidate.text.toLowerCase();
        if (seenNamed.has(key)) continue;
        seenNamed.add(key);
        push({
          serviceId: input.serviceId,
          name: candidate.text,
          aliases: [],
          kind: kindFor(candidate.text),
          discoveredBy: "named-control",
          docUrls: [candidate.page.url],
          ...(page.description ? { summary: page.description } : {}),
          evidence: makeGuideEvidence(guide, body, candidate.page),
        });
      }
    }
  }

  // D2. Shapes named like a toggleable setting. A shape called
  //     CertificateTransparencyLoggingPreference whose values are ENABLED and
  //     DISABLED names a capability the API can switch on or off.
  const apiToggle = input.apiModel;
  if (apiToggle) {
    const body = await readRawBody(apiToggle.bodySha256);
    for (const [shapeName, shape] of Object.entries(apiToggle.model.shapes)) {
      if (!TOGGLE_SHAPE.test(shapeName)) continue;
      if (!shape.enum || !shape.enum.every((v) => STATE_ENUM_VALUE.test(v))) continue;
      const label = shapeName
        .replace(TOGGLE_SHAPE, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();
      if (!label) continue;
      const name = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
      const quote = `"${shapeName}"`;
      push({
        serviceId: input.serviceId,
        name,
        aliases: [shapeName],
        kind: kindFor(name),
        discoveredBy: "api-toggle",
        docUrls: [],
        evidence:
          body && quoteAppearsIn(body, quote)
            ? [{ sourceUrl: apiToggle.url, bodySha256: apiToggle.bodySha256, retrievedAt: apiToggle.retrievedAt, quote, locator: `shapes.${shapeName}` }]
            : [],
      });
    }
  }

  // D. Enum values in the API model. The most reliable signal a service has.
  const api = input.apiModel;
  if (api) {
    const body = await readRawBody(api.bodySha256);
    for (const [shapeName, shape] of Object.entries(api.model.shapes)) {
      if (!shape.enum || !FEATURE_ENUM_SHAPE.test(shapeName)) continue;
      // A capability list is short. ApplicationPolicyType has forty values because
      // it is a taxonomy of certificate purposes, not a list of features.
      if (shape.enum.length > MAX_CAPABILITY_ENUM) continue;
      for (const value of shape.enum) {
        if (STATE_ENUM_VALUE.test(value)) continue;
        const name = value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
        const quote = `"${value}"`;
        push({
          serviceId: input.serviceId,
          name,
          aliases: [value],
          kind: kindFor(name),
          discoveredBy: "api-enum",
          docUrls: [],
          evidence:
            body && quoteAppearsIn(body, quote)
              ? [{ sourceUrl: api.url, bodySha256: api.bodySha256, retrievedAt: api.retrievedAt, quote, locator: `shapes.${shapeName}.enum` }]
              : [],
        });
      }
    }
  }

  return out;
}

export function guideKeysFor(urls: string[]): string[] {
  return [...new Set(urls.map(guideKeyFromUrl))];
}
