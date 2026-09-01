import type { Service, Signal } from "../core/schema.js";
import type { GuideIndex } from "../sources/guidePages.js";

/** Terms that, in a service name, almost always mean the service is a security service. */
export const STRONG_NAME_TERMS = [
  "security", "firewall", "guardduty", "shield", "waf", "web application firewall",
  "encryption", "key management", "cloudhsm", "hsm", "secrets manager", "certificate",
  "identity and access", "access analyzer", "audit manager", "detective", "inspector",
  "macie", "threat", "malware", "vulnerability", "forensic", "incident response",
  "privacy", "artifact", "verified access", "verified permissions", "payment cryptography",
  "signer", "private ca", "certificate authority", "identity center", "single sign-on",
  "security lake", "security hub", "trust", "penetration", "compliance",
];

/** Terms that make a service a candidate but never decide it on their own. */
export const WEAK_NAME_TERMS = [
  "access", "policy", "permission", "auth", "token", "directory", "key", "sign",
  "verify", "cognito", "organizations", "control tower", "config", "cloudtrail",
  "backup", "resource access", "governance", "guard", "protect", "shield", "control",
  "logging", "log", "monitor", "notification", "risk", "resilience",
];

/** Page titles that mark real security capability inside a non-security service. */
export const SECURITY_PAGE_PATTERNS = [
  /\bdata protection\b/i,
  /\bencryption at rest\b/i,
  /\bencryption in transit\b/i,
  /\bblock public access\b/i,
  /\bidentity and access management\b/i,
  /\bresource-based polic/i,
  /\bservice control polic/i,
  /\bresource control polic/i,
  /\bsecurity best practices\b/i,
  /\binfrastructure security\b/i,
  /\bcompliance validation\b/i,
  /\bvpc endpoints?\b.*\bprivatelink\b/i,
  /\baccess control\b/i,
  /\bauthentication\b/i,
  /\bauthorization\b/i,
  /\baudit\b/i,
  /\blogging and monitoring\b/i,
  /\bkey management\b/i,
  /\bcustomer managed key/i,
  /\bcredential/i,
  /\bsecurity group/i,
  /\bfirewall\b/i,
  /\bmalware\b/i,
  /\bvulnerabilit/i,
  /\bthreat\b/i,
];

const hasTerm = (haystack: string, terms: string[]): string | undefined =>
  terms.find((term) => haystack.includes(term));

export type SignalInput = {
  service: Service;
  guides: GuideIndex[];
  hasPermissionManagementActions: boolean;
  sraDomain?: string;
};

export function computeSignals(input: SignalInput): { signals: Signal[]; score: number } {
  const { service, guides } = input;
  const signals: Signal[] = [];
  const haystack = [service.productName, ...service.names, service.id].join(" | ").toLowerCase();

  if (/security/i.test(service.productCategory ?? "") && /identity/i.test(service.productCategory ?? "")) {
    signals.push({
      id: "products-security-category",
      weight: 10,
      detail: `AWS files this product under "${service.productCategory}".`,
    });
  }

  if (input.sraDomain) {
    signals.push({
      id: "sra-appendix",
      weight: 8,
      detail: `The AWS Security Reference Architecture appendix lists this under ${input.sraDomain}.`,
    });
  }

  const strong = hasTerm(haystack, STRONG_NAME_TERMS);
  if (strong) {
    signals.push({ id: "security-name-strong", weight: 5, detail: `The name contains "${strong}".` });
  } else {
    const weak = hasTerm(haystack, WEAK_NAME_TERMS);
    if (weak) signals.push({ id: "security-name-weak", weight: 2, detail: `The name contains "${weak}".` });
  }

  if (input.hasPermissionManagementActions) {
    signals.push({
      id: "permission-management-actions",
      weight: 2,
      detail: "The IAM service reference marks one or more actions as permission management.",
    });
  }

  const securityPages = guides.flatMap((guide) =>
    guide.pages.filter(
      (page) =>
        SECURITY_PAGE_PATTERNS.some((p) => p.test(page.title)) ||
        page.section.some((s) => /^security\b/i.test(s)),
    ),
  );
  if (securityPages.length > 0) {
    const weight = securityPages.length >= 12 ? 3 : securityPages.length >= 4 ? 2 : 1;
    signals.push({
      id: "security-doc-pages",
      weight,
      detail: `${securityPages.length} documentation pages describe security capability, for example "${securityPages[0]?.title}".`,
    });
  }

  const score = signals.reduce((sum, s) => sum + s.weight, 0);
  return { signals, score };
}
