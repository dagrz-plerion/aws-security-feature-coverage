import { cachedFetch } from "../core/fetch.js";
import type { FetchResult } from "../core/fetch.js";

const BASE = "https://aws.amazon.com/api/dirs/items/search";

export type AwsProduct = {
  id: string;
  productName: string;
  productNameLowercase?: string;
  productCategory?: string;
  productUrl?: string;
  productSummary?: string;
  launchDate?: string;
  tags: string[];
};

type DirectoryResponse = {
  metadata: { count: number; totalHits: number };
  items: {
    item: { id: string; additionalFields: Record<string, string> };
    tags?: { id: string; name: string; tagNamespaceId: string }[];
  }[];
};

export function productsUrl(page: number, size = 100): string {
  const params = new URLSearchParams({
    "item.directoryId": "aws-products",
    sort_by: "item.additionalFields.productNameLowercase",
    sort_order: "asc",
    size: String(size),
    page: String(page),
    "item.locale": "en_US",
  });
  return `${BASE}?${params.toString()}`;
}

export async function fetchAwsProducts(
  maxAgeMs?: number,
): Promise<{ products: AwsProduct[]; results: FetchResult[] }> {
  const products: AwsProduct[] = [];
  const results: FetchResult[] = [];
  const size = 100;
  for (let page = 0; page < 20; page += 1) {
    const result = await cachedFetch(productsUrl(page, size), { maxAgeMs });
    results.push(result);
    const parsed = JSON.parse(result.body) as DirectoryResponse;
    for (const entry of parsed.items) {
      const f = entry.item.additionalFields;
      products.push({
        id: entry.item.id,
        productName: f["productName"] ?? entry.item.id,
        ...(f["productNameLowercase"] ? { productNameLowercase: f["productNameLowercase"] } : {}),
        ...(f["productCategory"] ? { productCategory: f["productCategory"] } : {}),
        ...(f["productUrl"] ? { productUrl: f["productUrl"] } : {}),
        ...(f["productSummary"] ? { productSummary: f["productSummary"] } : {}),
        ...(f["launchDate"] ? { launchDate: f["launchDate"] } : {}),
        tags: (entry.tags ?? []).map((t) => t.id),
      });
    }
    if (products.length >= parsed.metadata.totalHits || parsed.items.length === 0) break;
  }
  return { products, results };
}

export function isSecurityCategory(category: string | undefined): boolean {
  if (!category) return false;
  return /security/i.test(category) && /identity/i.test(category);
}
