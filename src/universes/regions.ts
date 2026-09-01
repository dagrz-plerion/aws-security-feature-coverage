import path from "node:path";
import { paths } from "../core/paths.js";
import { writeJson } from "../core/store.js";
import { storeSyntheticBody } from "../core/fetch.js";
import { makeEvidence } from "../core/evidence.js";
import { awsPaginate, readLocalJson } from "../core/aws.js";
import { recordGap } from "../core/ops.js";
import { fetchRegionsDoc, REGIONS_DOC_HTML } from "../sources/regionsDoc.js";
import type { Evidence, Partition, Region } from "../core/schema.js";

type EndpointsJson = {
  partitions: {
    partition: string;
    partitionName: string;
    dnsSuffix: string;
    regionRegex: string;
    regions: Record<string, { description?: string }>;
  }[];
};

export type RegionUniverse = {
  regions: Region[];
  partitions: Partition[];
  notes: string[];
  disagreements: string[];
};

/**
 * Three independent sources. Each region records which of them saw it, so a
 * disagreement is visible in the data rather than resolved away.
 */
export async function buildRegionUniverse(maxAgeMs?: number): Promise<RegionUniverse> {
  const notes: string[] = [];
  const disagreements: string[] = [];
  const regions = new Map<string, Region>();
  const partitions: Partition[] = [];

  const addSource = (id: string, source: string, evidence: Evidence, base?: Partial<Region>): void => {
    const existing = regions.get(id);
    if (existing) {
      existing.seenIn = [...new Set([...existing.seenIn, source])].sort();
      existing.evidence.push(evidence);
      Object.assign(existing, { ...base, ...stripEmpty(existing) });
      return;
    }
    regions.set(id, {
      id,
      partition: base?.partition ?? "aws",
      ...base,
      seenIn: [source],
      evidence: [evidence],
    } as Region);
  };

  /* ---- source 1: the Regions and Availability Zones guide ---- */
  const { regions: docRegions, result: docResult } = await fetchRegionsDoc(maxAgeMs);
  for (const region of docRegions) {
    addSource(region.id, "regions-guide", makeEvidence(docResult, region.quote, `${REGIONS_DOC_HTML}#available-regions`), {
      partition: region.group,
      longName: region.name,
      ...(region.geography ? { geolocationCountry: region.geography } : {}),
    });
  }
  if (docRegions.length === 0) {
    await recordGap({
      kind: "parser",
      subject: "regions guide table",
      detail: "The AWS Regions guide parsed to zero regions. The table shape has probably changed.",
      suggestedStage: "stage1-universes",
    });
  }

  /* ---- source 2: endpoints.json, which is the only source covering every partition ---- */
  const local = await readLocalJson<EndpointsJson>("endpoints.json");
  if (!local) {
    notes.push("endpoints.json not found in the local AWS CLI install; partitions are unknown");
    await recordGap({
      kind: "recall",
      subject: "partition universe",
      detail: "endpoints.json was not readable, so partitions and gov/cn/iso regions are missing.",
      suggestedStage: "stage1-universes",
    });
  } else {
    const endpointsBody = JSON.stringify(local.value, null, 1);
    const bodySha = await storeSyntheticBody(endpointsBody);
    const retrievedAt = new Date().toISOString();
    const fileUrl = `file://${local.file}`;
    const evidenceFor = (quote: string, locator: string): Evidence => ({
      sourceUrl: fileUrl,
      bodySha256: bodySha,
      retrievedAt,
      quote,
      locator,
    });
    for (const part of local.value.partitions) {
      const regionIds = Object.keys(part.regions).sort();
      if (!endpointsBody.includes(part.partitionName)) notes.push(`endpoints.json quote miss: ${part.partitionName}`);
      partitions.push({
        id: part.partition,
        name: part.partitionName,
        dnsSuffix: part.dnsSuffix,
        regionRegex: part.regionRegex,
        regions: regionIds,
        evidence: [evidenceFor(part.partitionName, `partitions[].partition=${part.partition}`)],
      });
      for (const [id, meta] of Object.entries(part.regions)) {
        addSource(id, "botocore-endpoints", evidenceFor(meta.description ?? id, `partitions.${part.partition}.regions.${id}`), {
          partition: part.partition,
          ...(meta.description ? { longName: meta.description } : {}),
          domain: part.dnsSuffix,
        });
      }
    }
  }

  /* ---- source 3: the live SSM global infrastructure parameters ---- */
  const ssm = await awsPaginate<{ Value?: string }>(
    ["ssm", "get-parameters-by-path", "--path", "/aws/service/global-infrastructure/regions", "--max-items", "1000"],
    (page) => (page["Parameters"] as { Value?: string }[]) ?? [],
  );
  if (ssm === undefined) {
    notes.push("SSM cross-check skipped: no usable AWS credentials");
    await recordGap({
      kind: "recall",
      subject: "region universe",
      detail: "The SSM global-infrastructure cross-check did not run, so region currency is unverified.",
      suggestedStage: "stage1-universes",
    });
  } else {
    const ssmIds = [...new Set(ssm.map((p) => p.Value).filter((v): v is string => Boolean(v)))].sort();
    const listing = ssmIds.join("\n");
    const ssmSha = await storeSyntheticBody(listing);
    const ssmEvidence = (id: string): Evidence => ({
      sourceUrl: "https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-public-parameters-global-infrastructure.html",
      bodySha256: ssmSha,
      retrievedAt: new Date().toISOString(),
      quote: id,
      locator: `ssm:/aws/service/global-infrastructure/regions/${id}`,
    });
    for (const id of ssmIds) addSource(id, "ssm-global-infrastructure", ssmEvidence(id), {});
    for (const region of regions.values()) {
      if (region.partition !== "aws") continue;
      if (!ssmIds.includes(region.id) && region.seenIn.includes("regions-guide")) {
        disagreements.push(`${region.id}: in the Regions guide but not in SSM`);
      }
      if (ssmIds.includes(region.id) && !region.seenIn.includes("regions-guide")) {
        disagreements.push(`${region.id}: in SSM but not in the Regions guide`);
      }
    }
  }

  for (const disagreement of disagreements) {
    await recordGap({
      kind: "recall",
      subject: "region source disagreement",
      detail: disagreement,
      suggestedStage: "stage1-universes",
    });
  }

  const list = [...regions.values()].sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(path.join(paths.universes, "regions.json"), {
    generatedAt: new Date().toISOString(),
    count: list.length,
    sources: ["regions-guide", "botocore-endpoints", "ssm-global-infrastructure"],
    regions: list,
  });
  await writeJson(path.join(paths.universes, "partitions.json"), {
    generatedAt: new Date().toISOString(),
    count: partitions.length,
    partitions,
  });
  return { regions: list, partitions, notes, disagreements };
}

function stripEmpty(region: Region): Partial<Region> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(region)) {
    if (value !== undefined && value !== null && value !== "") out[key] = value;
  }
  return out as Partial<Region>;
}
