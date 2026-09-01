import { cachedFetch } from "../core/fetch.js";
import type { FetchResult } from "../core/fetch.js";
import { parseMarkdown } from "../core/markdown.js";

export const SRA_APPENDIX_MD =
  "https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/appendix.md";
export const WA_SECURITY_PILLAR_LLMS =
  "https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/llms.txt";

export type SraService = {
  name: string;
  /** The security domain the SRA files it under. */
  domain: string;
  url?: string;
  quote: string;
};

/**
 * The SRA appendix lists AWS security, identity, and compliance services grouped
 * by security domain. It is curated by AWS and is citable, so it is a strong signal.
 */
export function parseSraAppendix(body: string): SraService[] {
  const doc = parseMarkdown(body);
  const out: SraService[] = [];
  for (const list of doc.lists) {
    const domain = domainFor(list.intro ?? "");
    for (const item of list.items) {
      const link = item.links[0];
      const name = (link?.text ?? item.text.split(/\s+[–—-]\s+/)[0] ?? "").trim();
      if (!name || name.length > 60) continue;
      if (!/^(aws|amazon|iam)\b/i.test(name) && !/\b(iam|waf|kms|ram|acm)\b/i.test(name)) continue;
      out.push({
        name,
        domain,
        ...(link?.href ? { url: link.href } : {}),
        quote: item.raw.trim(),
      });
    }
  }
  return dedupe(out);
}

/** The domain comes from the bold paragraph above the list, never from the page title. */
function domainFor(intro: string): string {
  const text = intro.toLowerCase();
  if (text.includes("data protection")) return "data-protection";
  if (text.includes("identity") || text.includes("access management")) return "identity-and-access";
  if (text.includes("network") || text.includes("application protection")) return "network-and-application-protection";
  if (text.includes("threat detection") || text.includes("continuous monitoring")) return "threat-detection";
  if (text.includes("compliance") || text.includes("data privacy")) return "compliance-and-privacy";
  if (text.includes("incident")) return "incident-response";
  return "unclassified";
}

function dedupe(items: SraService[]): SraService[] {
  const seen = new Map<string, SraService>();
  for (const item of items) {
    const key = item.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || (existing.domain === "unclassified" && item.domain !== "unclassified")) seen.set(key, item);
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchSraServices(maxAgeMs?: number): Promise<{ services: SraService[]; result: FetchResult }> {
  const result = await cachedFetch(SRA_APPENDIX_MD, { maxAgeMs });
  return { services: parseSraAppendix(result.body), result };
}
