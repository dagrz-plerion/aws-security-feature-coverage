import { cachedFetch, cachedJson, mapPool } from "../core/fetch.js";
import type { FetchResult } from "../core/fetch.js";

export const SERVICE_REFERENCE_INDEX = "https://servicereference.us-east-1.amazonaws.com/";

export type ServiceReferenceIndexEntry = { service: string; url: string; modified: number };

export type ServiceReferenceAction = {
  Name: string;
  Annotations?: { Properties?: { IsList?: boolean; IsPermissionManagement?: boolean; IsTaggingOnly?: boolean; IsWrite?: boolean } };
  Resources?: { Name: string }[];
  ActionConditionKeys?: string[];
};

export type ServiceReferenceResource = { Name: string; ARNFormats?: string[]; ConditionKeys?: string[] };

export type ServiceReferenceDoc = {
  Name: string;
  Version?: number;
  Actions?: ServiceReferenceAction[];
  Resources?: ServiceReferenceResource[];
  ConditionKeys?: { Name: string; Types?: string[] }[];
};

export async function fetchServiceReferenceIndex(maxAgeMs?: number): Promise<{
  entries: ServiceReferenceIndexEntry[];
  result: FetchResult;
}> {
  const { value, result } = await cachedJson<ServiceReferenceIndexEntry[]>(SERVICE_REFERENCE_INDEX, { maxAgeMs });
  return { entries: value, result };
}

export async function fetchServiceReferenceDoc(
  entry: ServiceReferenceIndexEntry,
  maxAgeMs?: number,
): Promise<{ doc: ServiceReferenceDoc; result: FetchResult }> {
  const result = await cachedFetch(entry.url, { maxAgeMs });
  return { doc: JSON.parse(result.body) as ServiceReferenceDoc, result };
}

export async function fetchAllServiceReferenceDocs(
  entries: ServiceReferenceIndexEntry[],
  maxAgeMs: number | undefined,
  concurrency = 12,
): Promise<{ entry: ServiceReferenceIndexEntry; doc?: ServiceReferenceDoc; result?: FetchResult; error?: string }[]> {
  return mapPool(entries, concurrency, async (entry) => {
    try {
      const { doc, result } = await fetchServiceReferenceDoc(entry, maxAgeMs);
      return { entry, doc, result };
    } catch (error) {
      return { entry, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
