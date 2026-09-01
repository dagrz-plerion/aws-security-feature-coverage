import path from "node:path";
import { paths } from "../core/paths.js";
import { readAllJson, readJson } from "../core/store.js";
import { axisKinds } from "../core/seeds.js";
import type {
  Adjudication,
  Conflict,
  DataSource,
  Feature,
  FeatureCoverage,
  Gap,
  Partition,
  QuarantineItem,
  Region,
  ResourceType,
  RunManifest,
  Service,
} from "../core/schema.js";

export type ReportData = {
  generatedAt: string;
  manifest?: RunManifest;
  regions: Region[];
  partitions: Partition[];
  services: Service[];
  resourceTypes: ResourceType[];
  dataSources: DataSource[];
  adjudications: Adjudication[];
  features: Feature[];
  coverage: FeatureCoverage[];
  quarantine: QuarantineItem[];
  gaps: Gap[];
  conflicts: Conflict[];
  openAxes: { axis: string; count: number }[];
  axisKinds: Record<string, { kind: string; label: string }>;
  sources: {
    url: string;
    serviceId: string;
    source: string;
    note?: string;
    recipes: number;
    claims: number;
    readRatio?: number;
    verdict?: string;
    dropped?: number;
  }[];
};

async function wrapped<T>(file: string, key: string): Promise<T[]> {
  const value = await readJson<Record<string, T[]>>(file);
  return (value?.[key] as T[] | undefined) ?? [];
}

export async function loadReportData(): Promise<ReportData> {
  const u = paths.universes;
  return {
    generatedAt: new Date().toISOString(),
    manifest: await readJson<RunManifest>(path.join(paths.state, "run-manifest.json")),
    regions: await wrapped<Region>(path.join(u, "regions.json"), "regions"),
    partitions: await wrapped<Partition>(path.join(u, "partitions.json"), "partitions"),
    services: await wrapped<Service>(path.join(u, "services.json"), "services"),
    resourceTypes: await wrapped<ResourceType>(path.join(u, "resource-types.json"), "resourceTypes"),
    dataSources: await wrapped<DataSource>(path.join(u, "data-sources.json"), "dataSources"),
    adjudications: await readAllJson<Adjudication>(paths.services),
    features: await readAllJson<Feature>(paths.features),
    coverage: await readAllJson<FeatureCoverage>(paths.coverage),
    quarantine: await readAllJson<QuarantineItem>(paths.quarantine),
    gaps: await readAllJson<Gap>(paths.gaps),
    conflicts: await readAllJson<Conflict>(paths.conflicts),
    openAxes:
      (await readJson<{ axes: { axis: string; count: number }[] }>(path.join(u, "open-axes.json")))?.axes ?? [],
    sources: await loadSources(),
    axisKinds: await axisKinds(),
  };
}

type RegistryFile = {
  serviceId: string;
  pages: {
    url: string;
    source: string;
    note?: string;
    recipes?: unknown[];
    lastResult?: { claims: number; dropped?: number };
    verified?: { readRatio: number; verdict: string };
  }[];
};

/** Every page the map reads, with what the last verification pass made of it. */
async function loadSources(): Promise<ReportData["sources"]> {
  const files = await readAllJson<RegistryFile>(path.join(paths.data, "coverage-pages"));
  const out: ReportData["sources"] = [];
  for (const file of files) {
    for (const page of file.pages) {
      if (!page.lastResult?.claims) continue;
      out.push({
        url: page.url,
        serviceId: file.serviceId,
        source: page.source,
        ...(page.note ? { note: page.note } : {}),
        recipes: page.recipes?.length ?? 0,
        claims: page.lastResult.claims,
        ...(page.lastResult.dropped ? { dropped: page.lastResult.dropped } : {}),
        ...(page.verified ? { readRatio: page.verified.readRatio, verdict: page.verified.verdict } : {}),
      });
    }
  }
  return out.sort((a, b) => (a.readRatio ?? 1) - (b.readRatio ?? 1) || b.claims - a.claims);
}
