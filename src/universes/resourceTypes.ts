import path from "node:path";
import { paths } from "../core/paths.js";
import { writeJson } from "../core/store.js";
import { awsPaginate } from "../core/aws.js";
import { cachedFetch, readRawBody, storeSyntheticBody } from "../core/fetch.js";
import { makeEvidence } from "../core/evidence.js";
import type { FetchResult } from "../core/fetch.js";
import { recordGap } from "../core/ops.js";
import type { ResourceType } from "../core/schema.js";
import type { ServiceReferenceDoc } from "../sources/serviceReference.js";

type CfnTypeSummary = { TypeName: string; Description?: string; LastUpdated?: string };
type ReTypeSummary = { Service: string; ResourceType: string; CFNResourceTypes?: string[] };

export type ResourceTypeUniverse = {
  resourceTypes: ResourceType[];
  notes: string[];
};

/** Turn AWS::S3::Bucket into the s3 service id where possible. */
function cfnServiceHint(typeName: string): string | undefined {
  const parts = typeName.split("::");
  return parts[1]?.toLowerCase();
}

export async function buildResourceTypeUniverse(
  serviceReferenceDocs: Map<string, { doc: ServiceReferenceDoc; result: FetchResult }>,
  serviceIds: Set<string>,
): Promise<ResourceTypeUniverse> {
  const notes: string[] = [];
  const byId = new Map<string, ResourceType>();

  const ensure = (id: string): ResourceType => {
    let existing = byId.get(id);
    if (!existing) {
      existing = { id, arnFormats: [], seenIn: [], evidence: [] };
      byId.set(id, existing);
    }
    return existing;
  };

  /* ---- source 1: the CloudFormation public type registry ---- */
  const cfnTypes = await awsPaginate<CfnTypeSummary>(
    ["cloudformation", "list-types", "--visibility", "PUBLIC", "--type", "RESOURCE", "--max-results", "100"],
    (page) => (page["TypeSummaries"] as CfnTypeSummary[]) ?? [],
  );
  if (cfnTypes === undefined) {
    notes.push("CloudFormation type registry skipped: no usable AWS credentials");
    await recordGap({
      kind: "recall",
      subject: "resource type universe",
      detail: "The CloudFormation public type registry did not load, so resource types are incomplete.",
      suggestedStage: "stage1-universes",
    });
  } else {
    const listing = cfnTypes.map((t) => t.TypeName).sort().join("\n");
    const bodySha = await storeSyntheticBody(listing);
    const retrievedAt = new Date().toISOString();
    for (const type of cfnTypes) {
      const record = ensure(type.TypeName);
      record.cfnTypeName = type.TypeName;
      record.serviceId = cfnServiceHint(type.TypeName);
      if (type.Description) record.description = type.Description.slice(0, 400);
      record.seenIn.push("cloudformation-registry");
      record.evidence.push({
        sourceUrl: "https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-template-resource-type-ref.html",
        bodySha256: bodySha,
        retrievedAt,
        quote: type.TypeName,
        locator: "cloudformation list-types --visibility PUBLIC --type RESOURCE",
      });
    }
  }

  /* ---- source 2: Resource Explorer, which joins service to CFN type ---- */
  const reTypes = await awsPaginate<ReTypeSummary>(
    ["resource-explorer-2", "list-supported-resource-types", "--max-results", "100"],
    (page) => (page["ResourceTypes"] as ReTypeSummary[]) ?? [],
  );
  if (reTypes === undefined) {
    notes.push("Resource Explorer type list skipped: no usable AWS credentials");
  } else {
    const listing = reTypes.map((t) => t.ResourceType).sort().join("\n");
    const bodySha = await storeSyntheticBody(listing);
    const retrievedAt = new Date().toISOString();
    for (const type of reTypes) {
      const cfn = type.CFNResourceTypes?.[0];
      const id = cfn ?? type.ResourceType;
      const record = ensure(id);
      record.resourceExplorerType = type.ResourceType;
      record.serviceId = serviceIds.has(type.Service) ? type.Service : record.serviceId;
      if (cfn) record.cfnTypeName = cfn;
      record.seenIn.push("resource-explorer");
      record.evidence.push({
        sourceUrl: "https://docs.aws.amazon.com/resource-explorer/latest/userguide/supported-resource-types.html",
        bodySha256: bodySha,
        retrievedAt,
        quote: type.ResourceType,
        locator: "resource-explorer-2 list-supported-resource-types",
      });
    }
  }

  /* ---- source 3: ARN-shaped resources in the IAM service reference ---- */
  // The service reference names a resource "certificate-authority" under service
  // "acm-pca", which is the same thing Resource Explorer calls
  // "acm-pca:certificate-authority". Without this join the universe counts it twice
  // and every coverage denominator is inflated.
  const byExplorerType = new Map<string, string>();
  for (const record of byId.values()) {
    if (record.resourceExplorerType) byExplorerType.set(record.resourceExplorerType.toLowerCase(), record.id);
  }
  const plural = (value: string): string[] => [
    value,
    value.endsWith("s") ? value.slice(0, -1) : `${value}s`,
    value.endsWith("ies") ? `${value.slice(0, -3)}y` : value,
  ];

  // The same resource also appears as AWS::AccessAnalyzer::ArchiveRule and as
  // access-analyzer:ArchiveRule. Same service, same noun, one resource.
  const flat = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const byServiceNoun = new Map<string, string>();
  for (const record of byId.values()) {
    if (!record.cfnTypeName) continue;
    const parts = record.cfnTypeName.split("::");
    if (parts.length !== 3) continue;
    byServiceNoun.set(`${flat(parts[1] as string)}|${flat(parts[2] as string)}`, record.id);
  }

  let merged = 0;
  for (const [serviceId, entry] of serviceReferenceDocs) {
    for (const resource of entry.doc.Resources ?? []) {
      const candidates = plural(`${serviceId}:${resource.Name}`.toLowerCase());
      const noun = flat(resource.Name);
      const nounKeys = [noun, noun.endsWith("s") ? noun.slice(0, -1) : `${noun}s`];
      const existingId =
        candidates.map((c) => byExplorerType.get(c)).find(Boolean) ??
        nounKeys.map((n) => byServiceNoun.get(`${flat(serviceId)}|${n}`)).find(Boolean);
      const id = existingId ?? `${serviceId}:${resource.Name}`;
      if (existingId) merged += 1;
      const record = ensure(id);
      record.serviceId = record.serviceId ?? serviceId;
      record.serviceReferenceName = resource.Name;
      record.arnFormats = [...new Set([...record.arnFormats, ...(resource.ARNFormats ?? [])])].sort();
      record.seenIn.push("service-reference");
      record.evidence.push(
        makeEvidence(entry.result, resource.ARNFormats?.[0] ?? resource.Name, `Resources[].Name=${resource.Name}`),
      );
    }
  }

  /* ---- source 4: resource types AWS Config records ---- */
  // AWS Config records things the CloudFormation registry has no type for, because
  // you cannot create them: AWS::Config::ResourceCompliance, AWS::SSM::PatchCompliance,
  // AWS::ShieldRegional::Protection and 600-odd more. They are resource types, AWS
  // publishes them in a reference of its own, and leaving them out meant every value
  // on the Config coverage pages went unresolved and was dropped in silence.
  let fromConfig = 0;
  const configReference = "https://docs.aws.amazon.com/config/latest/developerguide/resource-config-reference.md";
  try {
    const result = await cachedFetch(configReference, { allowStatus: [404] });
    if (result.status !== 404) {
      const body = (await readRawBody(result.bodySha256)) ?? "";
      const seen = new Set<string>();
      for (const match of body.matchAll(/\bAWS::[A-Za-z0-9]+::[A-Za-z0-9]+\b/g)) {
        const typeName = match[0];
        if (seen.has(typeName)) continue;
        seen.add(typeName);
        if (byId.has(typeName)) continue;
        const record = ensure(typeName);
        record.cfnTypeName = typeName;
        record.serviceId = record.serviceId ?? cfnServiceHint(typeName);
        record.seenIn.push("config-reference");
        record.evidence.push(makeEvidence(result, typeName, "AWS Config supported resource types"));
        fromConfig += 1;
      }
    }
  } catch (error) {
    notes.push(`AWS Config resource type reference skipped: ${(error as Error).message}`);
  }
  notes.push(`${fromConfig} resource types known only to AWS Config`);

  for (const record of byId.values()) {
    record.seenIn = [...new Set(record.seenIn)].sort();
  }

  notes.push(`${merged} service reference resources joined to an existing resource type`);
  const list = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(path.join(paths.universes, "resource-types.json"), {
    generatedAt: new Date().toISOString(),
    count: list.length,
    sources: ["cloudformation-registry", "resource-explorer", "service-reference", "config-reference"],
    resourceTypes: list,
  });
  return { resourceTypes: list, notes };
}
