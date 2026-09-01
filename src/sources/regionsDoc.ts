import { cachedFetch } from "../core/fetch.js";
import type { FetchResult } from "../core/fetch.js";
import { findColumn, parseMarkdown } from "../core/markdown.js";
import type { MdTable } from "../core/markdown.js";

export const REGIONS_DOC_MD = "https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.md";
export const REGIONS_DOC_HTML = "https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html";

export type DocRegion = {
  id: string;
  name: string;
  availabilityZones?: number;
  geography?: string;
  optIn?: "required" | "not-required";
  /** "aws" for the standard table, "aws-us-gov" and "aws-cn" for the account-type tables. */
  group: string;
  quote: string;
};

const REGION_CODE = /^[a-z]{2,4}(-[a-z]+)+-\d+$/;

function groupForSection(section: string[]): string {
  const text = section.join(" ").toLowerCase();
  if (text.includes("govcloud")) return "aws-us-gov";
  if (text.includes("china")) return "aws-cn";
  return "aws";
}

export function parseRegionTables(body: string): DocRegion[] {
  const doc = parseMarkdown(body);
  const out: DocRegion[] = [];
  const seen = new Set<string>();
  for (const table of doc.tables as MdTable[]) {
    const codeCol = findColumn(table.headers, [/^code$/i, /region code/i]);
    const nameCol = findColumn(table.headers, [/^name$/i, /region name/i]);
    if (codeCol < 0) continue;
    const azCol = findColumn(table.headers, [/^azs?$/i, /availability zone/i]);
    const geoCol = findColumn(table.headers, [/geograph/i, /location/i]);
    const optCol = findColumn(table.headers, [/opt.?in/i]);
    const group = groupForSection(table.section);
    for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
      const row = table.rows[rowIndex] as string[];
      const code = (row[codeCol] ?? "").trim();
      if (!REGION_CODE.test(code) || seen.has(code)) continue;
      seen.add(code);
      const azRaw = azCol >= 0 ? (row[azCol] ?? "") : "";
      const azMatch = /\d+/.exec(azRaw);
      const optRaw = optCol >= 0 ? (row[optCol] ?? "").toLowerCase() : "";
      out.push({
        id: code,
        name: nameCol >= 0 ? (row[nameCol] ?? "") : code,
        ...(azMatch ? { availabilityZones: Number(azMatch[0]) } : {}),
        ...(geoCol >= 0 && row[geoCol] ? { geography: row[geoCol] as string } : {}),
        ...(optRaw ? { optIn: optRaw.startsWith("not") ? ("not-required" as const) : ("required" as const) } : {}),
        group,
        quote: (table.rawRows[rowIndex] ?? row.filter(Boolean).join(" | ")).trim(),
      });
    }
  }
  return out;
}

export async function fetchRegionsDoc(maxAgeMs?: number): Promise<{ regions: DocRegion[]; result: FetchResult }> {
  const result = await cachedFetch(REGIONS_DOC_MD, { maxAgeMs });
  return { regions: parseRegionTables(result.body), result };
}
