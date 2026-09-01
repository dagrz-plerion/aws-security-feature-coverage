import { cachedFetch } from "../core/fetch.js";
import type { FetchResult } from "../core/fetch.js";

export const REGIONAL_TABLE = "https://api.regional-table.region-services.aws.a2z.com/index.json";

export type RegionalEntry = {
  serviceKey: string;
  serviceName: string;
  serviceUrl?: string;
  region: string;
};

type RawTable = {
  metadata: Record<string, string>;
  prices: { id: string; attributes: Record<string, string> }[];
};

/** Service availability by region, as published behind the AWS regional services page. */
export async function fetchRegionalTable(
  maxAgeMs?: number,
): Promise<{ entries: RegionalEntry[]; regions: Set<string>; services: Map<string, string>; result: FetchResult }> {
  const result = await cachedFetch(REGIONAL_TABLE, { maxAgeMs });
  const raw = JSON.parse(result.body) as RawTable;
  const entries: RegionalEntry[] = [];
  const regions = new Set<string>();
  const services = new Map<string, string>();
  for (const price of raw.prices) {
    const region = price.attributes["aws:region"];
    const serviceName = price.attributes["aws:serviceName"];
    const serviceUrl = price.attributes["aws:serviceUrl"];
    const serviceKey = serviceName ?? serviceUrl;
    if (!region || !serviceKey) continue;
    regions.add(region);
    services.set(serviceKey, serviceName ?? serviceKey);
    entries.push({
      serviceKey,
      serviceName: serviceName ?? serviceKey,
      region,
      ...(serviceUrl ? { serviceUrl } : {}),
    });
  }
  return { entries, regions, services, result };
}
