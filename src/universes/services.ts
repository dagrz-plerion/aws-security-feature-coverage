import path from "node:path";
import { paths } from "../core/paths.js";
import { guidePrefixOverrides, serviceNameOverrides } from "../core/seeds.js";
import { writeJson } from "../core/store.js";
import { makeEvidence } from "../core/evidence.js";
import { slug } from "../core/ids.js";
import { quarantine, recordGap } from "../core/ops.js";
import { listLocalModels, readLocalModel } from "../core/aws.js";
import { fetchAllServiceReferenceDocs, fetchServiceReferenceIndex } from "../sources/serviceReference.js";
import type { ServiceReferenceDoc } from "../sources/serviceReference.js";
import type { FetchResult } from "../core/fetch.js";
import { fetchGlobalDocsIndex } from "../sources/docsIndex.js";
import type { DocGuide } from "../sources/docsIndex.js";
import { fetchAwsProducts } from "../sources/productsDirectory.js";
import type { AwsProduct } from "../sources/productsDirectory.js";
import { fetchRegionalTable } from "../sources/regionalTable.js";
import { fetchAllServiceEndpoints, fetchEndpointPages } from "../sources/generalReference.js";
import { storeSyntheticBody } from "../core/fetch.js";
import { readLocalJson } from "../core/aws.js";
import type { Action, Service } from "../core/schema.js";

export type ServiceUniverse = {
  services: Service[];
  actions: Action[];
  serviceReferenceDocs: Map<string, { doc: ServiceReferenceDoc; result: FetchResult }>;
  guides: DocGuide[];
  products: AwsProduct[];
  notes: string[];
};

/**
 * Overrides for joins that name matching cannot make. Each entry exists because a
 * deterministic match failed, and the failure was recorded as a gap first.
 */


const STOP_SUFFIXES =
  /\s+(user guide|developer guide|administration guide|admin guide|api reference|cli reference|getting started guide|reference guide|release notes|best practices|management guide|user guide for .*|guide)$/i;

export function canonicalName(name: string): string {
  return name
    .replace(STOP_SUFFIXES, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function flatten(name: string): string {
  return canonicalName(name)
    .replace(/^(amazon|aws)\s+/, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Qualifiers that name a variant of a service, not a different service. */
const VARIANT_WORDS = new Set([
  "advanced", "classic", "cspm", "v2", "2", "serverless", "standard", "enterprise",
  "essentials", "plus", "pro", "core", "edition", "for", "aws", "amazon", "the",
]);

/** Index of every known alias to a service id, so later sources join deterministically. */
export class ServiceIndex {
  private byAlias = new Map<string, string>();
  constructor(private readonly nameOverrides: Record<string, string> = {}) {}

  add(id: string, alias: string): void {
    const canonical = canonicalName(alias);
    if (!canonical) return;
    if (!this.byAlias.has(canonical)) this.byAlias.set(canonical, id);
    const flat = flatten(alias);
    if (flat && !this.byAlias.has(flat)) this.byAlias.set(flat, id);
  }

  lookup(name: string): string | undefined {
    if (!name) return undefined;
    const canonical = canonicalName(name);
    const override = this.nameOverrides[canonical];
    if (override) return override;
    return this.byAlias.get(canonical) ?? this.byAlias.get(flatten(name));
  }

  /**
   * Match names like "AWS Shield Advanced" or "AWS Identity and Access Management
   * (IAM) Access Analyzer" by finding the longest leading run of words that names a
   * known service. Returns the id plus the words left over, which name the variant.
   */
  lookupPrefix(name: string): { id: string; remainder: string } | undefined {
    const words = canonicalName(name).split(/\s+/).filter(Boolean);
    for (let take = words.length; take >= 1; take -= 1) {
      const head = words.slice(0, take).join(" ");
      const id = this.nameOverrides[head] ?? this.byAlias.get(head) ?? this.byAlias.get(flatten(head));
      if (!id) continue;
      const remainder = words.slice(take);
      if (take === words.length) return { id, remainder: "" };
      // Guide titles often repeat the service name ("AWS Backup AWS Backup Developer Guide").
      if (remainder.join(" ") === head) return { id, remainder: "" };
      // Otherwise accept a partial match only when the leftover words label a variant.
      if (remainder.every((w) => VARIANT_WORDS.has(w))) return { id, remainder: remainder.join(" ") };
    }
    return undefined;
  }

  /** Longest match anywhere in the name, used only as a last resort. */
  lookupContained(name: string): { id: string; matched: string } | undefined {
    const words = canonicalName(name).split(/\s+/).filter(Boolean);
    let best: { id: string; matched: string; length: number } | undefined;
    for (let start = 0; start < words.length; start += 1) {
      for (let end = words.length; end > start + 1; end -= 1) {
        const phrase = words.slice(start, end).join(" ");
        const id = this.nameOverrides[phrase] ?? this.byAlias.get(phrase) ?? this.byAlias.get(flatten(phrase));
        if (id && (!best || end - start > best.length)) best = { id, matched: phrase, length: end - start };
      }
    }
    return best ? { id: best.id, matched: best.matched } : undefined;
  }

  resolve(name: string): string | undefined {
    return this.lookup(name) ?? this.lookupPrefix(name)?.id ?? this.lookupContained(name)?.id;
  }
}

export async function buildServiceUniverse(maxAgeMs?: number): Promise<ServiceUniverse> {
  const notes: string[] = [];
  const services = new Map<string, Service>();
  const nameOverrides = await serviceNameOverrides();
  const guideOverrides = await guidePrefixOverrides();
  const index = new ServiceIndex(nameOverrides);

  const ensure = (id: string): Service => {
    let existing = services.get(id);
    if (!existing) {
      existing = { id, names: [], docGuides: [], regions: [], resourceNames: [], seenIn: [], evidence: [] };
      services.set(id, existing);
    }
    return existing;
  };

  /* ---- source 1: IAM service reference. This defines the id space. ---- */
  const { entries } = await fetchServiceReferenceIndex(maxAgeMs);
  const docs = await fetchAllServiceReferenceDocs(entries, maxAgeMs);
  const serviceReferenceDocs = new Map<string, { doc: ServiceReferenceDoc; result: FetchResult }>();
  const actions: Action[] = [];

  for (const item of docs) {
    if (!item.doc || !item.result) {
      await quarantine({
        stage: "stage1-universes",
        subject: `service-reference:${item.entry.service}`,
        sourceUrl: item.entry.url,
        reason: "service reference document could not be fetched or parsed",
        detail: item.error ?? "unknown",
      });
      notes.push(`service reference fetch failed: ${item.entry.service}`);
      continue;
    }
    const id = item.entry.service;
    serviceReferenceDocs.set(id, { doc: item.doc, result: item.result });
    const service = ensure(id);
    service.iamPrefix = id;
    service.seenIn.push("service-reference");
    service.actionCount = item.doc.Actions?.length ?? 0;
    service.resourceNames = (item.doc.Resources ?? []).map((r) => r.Name).sort();
    service.evidence.push(makeEvidence(item.result, item.doc.Name, `${id}.json .Name`));
    index.add(id, id);
    for (const action of item.doc.Actions ?? []) {
      const props = action.Annotations?.Properties ?? {};
      actions.push({
        id: `${id}:${action.Name}`,
        serviceId: id,
        name: action.Name,
        ...(props.IsWrite !== undefined ? { isWrite: props.IsWrite } : {}),
        ...(props.IsList !== undefined ? { isList: props.IsList } : {}),
        ...(props.IsPermissionManagement !== undefined ? { isPermissionManagement: props.IsPermissionManagement } : {}),
        ...(props.IsTaggingOnly !== undefined ? { isTaggingOnly: props.IsTaggingOnly } : {}),
        resources: (action.Resources ?? []).map((r) => r.Name).sort(),
      });
    }
  }

  /* ---- source 2: local API models. These bridge endpoint prefix to display name. ---- */
  for (const modelName of await listLocalModels()) {
    const loaded = await readLocalModel(modelName);
    if (!loaded) continue;
    const meta = loaded.model.metadata;
    const prefix = meta.endpointPrefix ?? meta.signingName ?? modelName;
    const id = services.has(prefix) ? prefix : (services.has(modelName) ? modelName : prefix);
    const service = ensure(id);
    service.seenIn.push("api-model");
    for (const candidate of [meta.serviceFullName, meta.serviceId, meta.serviceAbbreviation]) {
      if (typeof candidate === "string" && candidate) {
        service.names.push(candidate);
        index.add(id, candidate);
      }
    }
    index.add(id, modelName);
  }

  /* ---- source 3: the AWS products directory ---- */
  const { products, results: productResults } = await fetchAwsProducts(maxAgeMs);
  for (const product of products) {
    const matched = index.resolve(product.productName);
    const id = matched ?? `product:${slug(product.productName)}`;
    if (!matched) {
      notes.push(`product not matched to a service prefix: ${product.productName}`);
    }
    const service = ensure(id);
    service.seenIn.push("products-directory");
    service.productName = product.productName;
    if (product.productCategory) service.productCategory = product.productCategory;
    if (product.productUrl) service.productUrl = product.productUrl;
    service.names.push(product.productName);
    index.add(id, product.productName);
    const evidenceSource = productResults.find((r) => r.body.includes(product.productName));
    if (evidenceSource) {
      service.evidence.push(makeEvidence(evidenceSource, product.productName, "aws-products directory item"));
    }
  }

  /* ---- source 4: every documentation guide ---- */
  const { guides, result: guidesResult } = await fetchGlobalDocsIndex(maxAgeMs);
  let unmatchedGuides = 0;
  for (const guide of guides) {
    const prefix = guide.guideKey.split("/")[0] ?? guide.guideKey;
    const id =
      guideOverrides[prefix] ??
      (services.has(prefix.toLowerCase()) ? prefix.toLowerCase() : undefined) ??
      index.resolve(guide.title) ??
      index.lookup(prefix) ??
      `doc:${slug(prefix)}`;
    if (id.startsWith("doc:")) unmatchedGuides += 1;
    const service = ensure(id);
    service.seenIn.push("docs-index");
    service.docGuides.push({
      title: guide.title,
      url: guide.url,
      ...(guide.llmsTxt ? { llmsTxt: guide.llmsTxt } : {}),
      ...(guide.description ? { description: guide.description } : {}),
    });
    // Only a guide that joined by its own prefix contributes a name. A guide matched
    // loosely (a tutorial, an exam guide, an architecture diagram) names a document,
    // not a service, and letting it through pollutes every later name match.
    const joinedByPrefix = guideOverrides[prefix] !== undefined || services.has(prefix.toLowerCase());
    if (joinedByPrefix) service.names.push(guide.title.replace(STOP_SUFFIXES, "").trim());
    if (service.evidence.length < 8) {
      service.evidence.push(makeEvidence(guidesResult, guide.title, `docs llms.txt guide ${guide.guideKey}`));
    }
  }
  if (unmatchedGuides > 0) {
    await recordGap({
      kind: "alias",
      subject: "docs guide to service join",
      detail: `${unmatchedGuides} documentation guides did not join to an IAM service prefix and are held under doc: ids.`,
      suggestedStage: "stage1-universes",
    });
  }

  /* ---- source 5: the regional services table ---- */
  const { entries: regionalEntries, result: regionalResult } = await fetchRegionalTable(maxAgeMs);
  const byService = new Map<string, { name: string; url?: string; regions: Set<string> }>();
  for (const entry of regionalEntries) {
    let bucket = byService.get(entry.serviceKey);
    if (!bucket) {
      bucket = { name: entry.serviceName, ...(entry.serviceUrl ? { url: entry.serviceUrl } : {}), regions: new Set() };
      byService.set(entry.serviceKey, bucket);
    }
    bucket.regions.add(entry.region);
  }
  for (const [key, bucket] of byService) {
    const viaDocs = bucket.url ? guidePrefixToServiceId(bucket.url, services, index, guideOverrides) : undefined;
    const id = index.resolve(bucket.name) ?? viaDocs ?? `regional:${slug(key)}`;
    const service = ensure(id);
    service.seenIn.push("regional-table");
    service.regionalTableId = key;
    service.names.push(bucket.name);
    service.regions = [...new Set([...service.regions, ...bucket.regions])].sort();
    if (service.evidence.length < 10) {
      service.evidence.push(makeEvidence(regionalResult, bucket.name, "regional services table"));
    }
  }

  /* ---- source 6: the General Reference endpoints pages ---- */
  const { pages: endpointPages } = await fetchEndpointPages(maxAgeMs);
  const { ok: endpointDocs, failed: endpointFailures } = await fetchAllServiceEndpoints(endpointPages, maxAgeMs);
  for (const doc of endpointDocs) {
    const id =
      doc.endpointPrefixes.find((prefix) => services.has(prefix)) ??
      index.resolve(doc.page.title) ??
      doc.endpointPrefixes[0];
    if (!id) continue;
    const service = ensure(id);
    service.seenIn.push("general-reference-endpoints");
    service.regions = [...new Set([...service.regions, ...doc.regions.map((r) => r.id)])].sort();
    service.names.push(doc.page.title);
    const first = doc.regions[0];
    if (first) {
      service.evidence.push(
        makeEvidence(doc.result, first.quote, `${doc.page.url.replace(/\.md$/, ".html")} service endpoints`),
      );
    }
  }
  for (const failure of endpointFailures) {
    await quarantine({
      stage: "stage1-universes",
      subject: `general-reference:${failure.page.title}`,
      sourceUrl: failure.page.url,
      extractorId: "general-reference-endpoints",
      reason: "endpoints page has no parseable region table",
      detail: failure.error,
    });
  }

  /* ---- source 7: per-service region lists inside endpoints.json ---- */
  const endpointsJson = await readLocalJson<{
    partitions: { partition: string; services: Record<string, { endpoints?: Record<string, unknown> }> }[];
  }>("endpoints.json");
  if (endpointsJson) {
    const bodySha = await storeSyntheticBody(JSON.stringify(endpointsJson.value, null, 1));
    const retrievedAt = new Date().toISOString();
    for (const part of endpointsJson.value.partitions) {
      for (const [prefix, entry] of Object.entries(part.services)) {
        const id = services.has(prefix) ? prefix : index.lookup(prefix);
        if (!id) continue;
        const service = ensure(id);
        service.seenIn.push("botocore-endpoints");
        const regionIds = Object.keys(entry.endpoints ?? {}).filter((r) => /^[a-z]{2,4}(-[a-z]+)+-\d+$/.test(r));
        service.regions = [...new Set([...service.regions, ...regionIds])].sort();
        if (service.evidence.length < 12 && regionIds.length > 0) {
          service.evidence.push({
            sourceUrl: `file://${endpointsJson.file}`,
            bodySha256: bodySha,
            retrievedAt,
            quote: prefix,
            locator: `partitions.${part.partition}.services.${prefix}`,
          });
        }
      }
    }
  }

  for (const service of services.values()) {
    service.names = [...new Set(service.names.filter(Boolean))].sort();
    service.seenIn = [...new Set(service.seenIn)].sort();
    service.docGuides.sort((a, b) => a.url.localeCompare(b.url));
  }

  const list = [...services.values()].sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(path.join(paths.universes, "services.json"), {
    generatedAt: new Date().toISOString(),
    count: list.length,
    services: list,
  });
  await writeJson(path.join(paths.universes, "actions.json"), {
    generatedAt: new Date().toISOString(),
    count: actions.length,
    actions,
  });

  return { services: list, actions, serviceReferenceDocs, guides, products, notes };
}

function guidePrefixToServiceId(
  docUrl: string,
  services: Map<string, Service>,
  index: ServiceIndex,
  guideOverrides: Record<string, string>,
): string | undefined {
  const match = /^https?:\/\/docs\.aws\.amazon\.com\/([^/]+)\//.exec(docUrl);
  const prefix = match?.[1];
  if (!prefix) return undefined;
  const override = guideOverrides[prefix];
  if (override && services.has(override)) return override;
  if (services.has(prefix.toLowerCase())) return prefix.toLowerCase();
  return index.lookup(prefix);
}
