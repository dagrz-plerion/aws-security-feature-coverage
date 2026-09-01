import { cachedFetch } from "../core/fetch.js";
import type { FetchResult } from "../core/fetch.js";

export const DOCS_LLMS_TXT = "https://docs.aws.amazon.com/llms.txt";

export type DocGuide = {
  title: string;
  /** Landing page, as a .md URL. */
  url: string;
  description?: string;
  llmsTxt?: string;
  /** e.g. "guardduty/latest/ug" */
  guideKey: string;
};

export type DocPage = {
  title: string;
  url: string;
  description?: string;
  /** Heading path inside the guide's llms.txt, outermost first. */
  section: string[];
};

const GUIDE_LINE =
  /^-\s+\[(?<title>[^\]]+)\]\((?<url>https:\/\/docs\.aws\.amazon\.com\/[^)\s]+)\)(?::\s*(?<rest>.*))?$/;

export function guideKeyFromUrl(url: string): string {
  const match = /^https:\/\/docs\.aws\.amazon\.com\/(.+)\/[^/]+$/.exec(url);
  return match?.[1] ?? url;
}

/** Parse the global docs llms.txt into one entry per guide. */
export function parseGlobalLlmsTxt(body: string): DocGuide[] {
  const guides: DocGuide[] = [];
  const seen = new Set<string>();
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    const match = GUIDE_LINE.exec(line);
    if (!match?.groups) continue;
    const { title, url } = match.groups as { title: string; url: string; rest?: string };
    const rest = match.groups["rest"] ?? "";
    const llmsMatch = /\[llms\.txt\]\((https:\/\/[^)\s]+llms\.txt)\)/.exec(rest);
    const description = rest.replace(/\s*\[llms\.txt\]\([^)]*\)\s*$/, "").trim();
    const guideKey = guideKeyFromUrl(url);
    if (seen.has(guideKey)) continue;
    seen.add(guideKey);
    guides.push({
      title,
      url,
      guideKey,
      ...(description ? { description } : {}),
      ...(llmsMatch?.[1] ? { llmsTxt: llmsMatch[1] } : {}),
    });
  }
  return guides;
}

/** Parse a per-guide llms.txt into one entry per documentation page. */
export function parseGuideLlmsTxt(body: string): DocPage[] {
  const pages: DocPage[] = [];
  const section: string[] = [];
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trimEnd();
    const heading = /^(#{2,6})\s+(.*)$/.exec(line.trim());
    if (heading) {
      const depth = (heading[1] as string).length - 2;
      const text = (heading[2] as string).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
      section.length = depth;
      section[depth] = text;
      continue;
    }
    const match = GUIDE_LINE.exec(line.trim());
    if (!match?.groups) continue;
    const { title, url } = match.groups as { title: string; url: string };
    const description = (match.groups["rest"] ?? "").trim();
    pages.push({
      title,
      url,
      section: section.filter(Boolean).slice(),
      ...(description ? { description } : {}),
    });
  }
  return pages;
}

export async function fetchGlobalDocsIndex(maxAgeMs?: number): Promise<{ guides: DocGuide[]; result: FetchResult }> {
  const result = await cachedFetch(DOCS_LLMS_TXT, { maxAgeMs });
  return { guides: parseGlobalLlmsTxt(result.body), result };
}

export async function fetchGuidePages(
  llmsTxtUrl: string,
  maxAgeMs?: number,
): Promise<{ pages: DocPage[]; result: FetchResult }> {
  const result = await cachedFetch(llmsTxtUrl, { maxAgeMs });
  return { pages: parseGuideLlmsTxt(result.body), result };
}

/** Any docs HTML URL has a Markdown twin. Markdown is what we parse. */
export function toMarkdownUrl(url: string): string {
  return url.replace(/\.html(?=$|[?#])/, ".md");
}
