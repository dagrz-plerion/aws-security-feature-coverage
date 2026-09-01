import path from "node:path";
import { paths } from "../core/paths.js";
import { listJson, readJson, writeJson } from "../core/store.js";
import { toMarkdownUrl } from "../sources/docsIndex.js";
import type { Recipe } from "./recipe.js";

/**
 * Every page we have ever decided documents coverage, kept as data.
 *
 * Discovery is allowed to be ad hoc — a title pattern, a sweep of a guide, a web
 * search, a person pasting a URL. What must not be ad hoc is keeping it. Once a page
 * is in the registry it is re-read on every run, so tightening a discovery rule can
 * never silently lose a page that was already found.
 */
export type PageSource = "title-match" | "tier1-sweep" | "search" | "manual" | "agent";

export type CoveragePage = {
  /** Always the Markdown form, which is what we parse. */
  url: string;
  serviceId: string;
  /** Pin the page to one feature. Left unset, the heading decides each run. */
  featureId?: string;
  source: PageSource;
  note?: string;
  /**
   * How to read this page, when the generic reader cannot. Reference metadata.
   * A page can carry several: Inspector's support page states operating systems,
   * languages, runtimes and CIS benchmark versions, each on its own axis.
   */
  recipes?: Recipe[];
  firstSeen: string;
  lastCheckedAt?: string;
  lastResult?: {
    claims: number;
    axes: string[];
    status: "ok" | "empty" | "failed";
    detail?: string;
    /** Values a recipe read but could not resolve to a known id. */
    dropped?: number;
  };
  enabled: boolean;
};

export type Registry = Map<string, Map<string, CoveragePage>>;

const DIR = path.join(paths.data, "coverage-pages");

function fileFor(serviceId: string): string {
  return path.join(DIR, `${serviceId.replace(/[/:.]/g, "__")}.json`);
}

export async function loadRegistry(): Promise<Registry> {
  const registry: Registry = new Map();
  for (const name of await listJson(DIR)) {
    const file = await readJson<{ serviceId: string; pages: CoveragePage[] }>(path.join(DIR, name));
    if (!file) continue;
    registry.set(file.serviceId, new Map(file.pages.map((p) => [p.url, p])));
  }
  return registry;
}

/** Add a page, or refresh what we know about one already registered. */
export function upsert(
  registry: Registry,
  entry: {
    url: string;
    serviceId: string;
    source: PageSource;
    featureId?: string;
    note?: string;
    recipes?: Recipe[];
  },
): { page: CoveragePage; added: boolean } {
  const url = toMarkdownUrl(entry.url);
  const forService = registry.get(entry.serviceId) ?? new Map<string, CoveragePage>();
  registry.set(entry.serviceId, forService);
  const existing = forService.get(url);
  if (existing) {
    // A page found by hand keeps that provenance even when a rule later finds it too.
    if (existing.source === "title-match" || existing.source === "tier1-sweep") {
      if (entry.source === "manual" || entry.source === "search" || entry.source === "agent") {
        existing.source = entry.source;
        if (entry.note) existing.note = entry.note;
      }
    }
    if (entry.featureId) existing.featureId = entry.featureId;
    if (entry.recipes) existing.recipes = entry.recipes;
    return { page: existing, added: false };
  }
  const page: CoveragePage = {
    url,
    serviceId: entry.serviceId,
    ...(entry.featureId ? { featureId: entry.featureId } : {}),
    source: entry.source,
    ...(entry.note ? { note: entry.note } : {}),
    ...(entry.recipes ? { recipes: entry.recipes } : {}),
    firstSeen: new Date().toISOString(),
    enabled: true,
  };
  forService.set(url, page);
  return { page, added: true };
}

export function recordResult(
  page: CoveragePage,
  result: { claims: number; axes: string[]; status: "ok" | "empty" | "failed"; detail?: string; dropped?: number },
): void {
  page.lastCheckedAt = new Date().toISOString();
  page.lastResult = result;
}

export async function saveRegistry(registry: Registry): Promise<number> {
  let written = 0;
  for (const [serviceId, pages] of registry) {
    if (pages.size === 0) continue;
    const sorted = [...pages.values()].sort((a, b) => a.url.localeCompare(b.url));
    await writeJson(fileFor(serviceId), { serviceId, count: sorted.length, pages: sorted });
    written += sorted.length;
  }
  return written;
}

export function allPages(registry: Registry): CoveragePage[] {
  return [...registry.values()].flatMap((m) => [...m.values()]);
}

export function summarise(registry: Registry): Record<string, number> {
  const pages = allPages(registry);
  const bySource: Record<string, number> = {};
  for (const page of pages) bySource[`from_${page.source}`] = (bySource[`from_${page.source}`] ?? 0) + 1;
  return {
    registered: pages.length,
    withRecipe: pages.filter((p) => p.recipes?.length).length,
    recipes: pages.reduce((sum, p) => sum + (p.recipes?.length ?? 0), 0),
    enabled: pages.filter((p) => p.enabled).length,
    yielding: pages.filter((p) => p.lastResult?.status === "ok").length,
    empty: pages.filter((p) => p.lastResult?.status === "empty").length,
    ...bySource,
  };
}
