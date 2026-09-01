import { cachedFetch, mapPool } from "../core/fetch.js";
import type { FetchResult } from "../core/fetch.js";
import { findColumn, parseMarkdown } from "../core/markdown.js";
import { parseGuideLlmsTxt } from "./docsIndex.js";

export const GENERAL_REFERENCE_LLMS = "https://docs.aws.amazon.com/general/latest/gr/llms.txt";

export type EndpointPage = {
  title: string;
  url: string;
};

export type ServiceEndpoints = {
  page: EndpointPage;
  /** Endpoint prefixes seen in the hostnames, e.g. "guardduty". Joins to the IAM prefix. */
  endpointPrefixes: string[];
  regions: { id: string; name?: string; quote: string }[];
  result: FetchResult;
};

const REGION_CODE = /^[a-z]{2,4}(-[a-z]+)+-\d+$/;
const HOSTNAME = /\b([a-z0-9][a-z0-9.-]*)\.(?:[a-z0-9-]+\.)?amazonaws\.com(?:\.cn)?\b/g;

export async function fetchEndpointPages(maxAgeMs?: number): Promise<{ pages: EndpointPage[]; result: FetchResult }> {
  const result = await cachedFetch(GENERAL_REFERENCE_LLMS, { maxAgeMs });
  const pages = parseGuideLlmsTxt(result.body)
    .filter((page) => /\/general\/latest\/gr\//.test(page.url))
    .filter((page) => !/^(rande|aws_service_limits|glos-chap|doc-history|welcome)/.test(page.url.split("/").pop() ?? ""))
    .map((page) => ({ title: page.title, url: page.url }));
  return { pages, result };
}

/** Pull the region table and the endpoint prefixes out of one endpoints-and-quotas page. */
export function parseEndpointPage(body: string): { endpointPrefixes: string[]; regions: { id: string; name?: string; quote: string }[] } {
  const doc = parseMarkdown(body);
  const regions: { id: string; name?: string; quote: string }[] = [];
  const prefixes = new Set<string>();
  const seen = new Set<string>();

  for (const table of doc.tables) {
    const regionCol = findColumn(table.headers, [/^region$/i, /region code/i]);
    const nameCol = findColumn(table.headers, [/region name/i, /^name$/i]);
    const endpointCol = findColumn(table.headers, [/endpoint/i]);
    if (regionCol < 0) continue;
    for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
      const row = table.rows[rowIndex] as string[];
      const id = (row[regionCol] ?? "").trim();
      if (!REGION_CODE.test(id)) continue;
      if (endpointCol >= 0) {
        for (const match of (row[endpointCol] ?? "").matchAll(HOSTNAME)) {
          const host = match[1] ?? "";
          const label = host.split(".")[0] ?? "";
          const prefix = label.replace(/-fips$/, "").replace(new RegExp(`-${id}$`), "");
          if (prefix && !REGION_CODE.test(prefix)) prefixes.add(prefix);
        }
      }
      if (seen.has(id)) continue;
      seen.add(id);
      regions.push({
        id,
        ...(nameCol >= 0 && row[nameCol] ? { name: row[nameCol] as string } : {}),
        quote: (table.rawRows[rowIndex] ?? row.filter(Boolean).join(" | ")).trim(),
      });
    }
  }
  return { endpointPrefixes: [...prefixes].sort(), regions };
}

export async function fetchAllServiceEndpoints(
  pages: EndpointPage[],
  maxAgeMs?: number,
  concurrency = 8,
): Promise<{ ok: ServiceEndpoints[]; failed: { page: EndpointPage; error: string }[] }> {
  const ok: ServiceEndpoints[] = [];
  const failed: { page: EndpointPage; error: string }[] = [];
  await mapPool(pages, concurrency, async (page) => {
    try {
      const result = await cachedFetch(page.url, { maxAgeMs });
      const parsed = parseEndpointPage(result.body);
      if (parsed.regions.length === 0) {
        failed.push({ page, error: "no region table found" });
        return;
      }
      ok.push({ page, ...parsed, result });
    } catch (error) {
      failed.push({ page, error: error instanceof Error ? error.message : String(error) });
    }
  });
  ok.sort((a, b) => a.page.url.localeCompare(b.page.url));
  failed.sort((a, b) => a.page.url.localeCompare(b.page.url));
  return { ok, failed };
}
