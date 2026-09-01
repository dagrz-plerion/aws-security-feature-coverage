import path from "node:path";
import { paths } from "../core/paths.js";
import { readAllJson, readJson } from "../core/store.js";
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
  };
}
