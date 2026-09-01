import fsp from "node:fs/promises";
import path from "node:path";
import { paths } from "./paths.js";
import { sha256 } from "./hash.js";
import { ensureDir, readJson, writeJson } from "./store.js";

export type CacheEntry = {
  url: string;
  status: number;
  etag?: string;
  lastModified?: string;
  contentType?: string;
  fetchedAt: string;
  bodySha256: string;
  bytes: number;
};

export type FetchResult = {
  url: string;
  body: string;
  bodySha256: string;
  status: number;
  retrievedAt: string;
  /** true when no network request was made at all */
  fromCache: boolean;
  /** true when a conditional request returned 304 */
  revalidated: boolean;
};

export type FetchOptions = {
  /** Skip the network entirely when the cached copy is younger than this. */
  maxAgeMs?: number;
  /** Force a network request even if the cache is fresh. */
  force?: boolean;
  /** Accept non-2xx without throwing; the body is still stored. */
  allowStatus?: number[];
  headers?: Record<string, string>;
};

const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000;
const USER_AGENT = "aws-security-feature-coverage/0.1 (research tooling)";

export const fetchStats = { network: 0, revalidated: 0, cacheHit: 0, failed: 0 };

function cachePath(url: string): string {
  return path.join(paths.cache, `${sha256(url)}.json`);
}

function rawPath(bodySha: string): string {
  return path.join(paths.raw, bodySha.slice(0, 2), `${bodySha}.body`);
}

export async function readRawBody(bodySha256: string): Promise<string | undefined> {
  try {
    return await fsp.readFile(rawPath(bodySha256), "utf8");
  } catch {
    return undefined;
  }
}

/**
 * Store a body that did not come from HTTP (an AWS API listing, a local file) so
 * its evidence can be re-verified exactly like a fetched page.
 */
export async function storeSyntheticBody(body: string): Promise<string> {
  return storeBody(body);
}

async function storeBody(body: string): Promise<string> {
  const hash = sha256(body);
  const file = rawPath(hash);
  await ensureDir(path.dirname(file));
  try {
    await fsp.access(file);
  } catch {
    await fsp.writeFile(file, body, "utf8");
  }
  return hash;
}

/**
 * Cached HTTP GET. Re-runs revalidate with If-None-Match / If-Modified-Since,
 * so an unchanged upstream costs one 304 and produces an identical bodySha256.
 */
export async function cachedFetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  const maxAge = options.maxAgeMs ?? DEFAULT_MAX_AGE;
  const entryFile = cachePath(url);
  const entry = await readJson<CacheEntry>(entryFile);

  if (entry && !options.force) {
    const age = Date.now() - Date.parse(entry.fetchedAt);
    if (age < maxAge) {
      const body = await readRawBody(entry.bodySha256);
      if (body !== undefined) {
        fetchStats.cacheHit += 1;
        return {
          url,
          body,
          bodySha256: entry.bodySha256,
          status: entry.status,
          retrievedAt: entry.fetchedAt,
          fromCache: true,
          revalidated: false,
        };
      }
    }
  }

  const headers: Record<string, string> = { "user-agent": USER_AGENT, ...options.headers };
  if (entry?.etag) headers["if-none-match"] = entry.etag;
  if (entry?.lastModified) headers["if-modified-since"] = entry.lastModified;

  const response = await fetchWithRetry(url, headers);

  if (response.status === 304 && entry) {
    const body = await readRawBody(entry.bodySha256);
    if (body !== undefined) {
      fetchStats.revalidated += 1;
      const refreshed: CacheEntry = { ...entry, fetchedAt: new Date().toISOString() };
      await writeJson(entryFile, refreshed);
      return {
        url,
        body,
        bodySha256: entry.bodySha256,
        status: entry.status,
        retrievedAt: refreshed.fetchedAt,
        fromCache: false,
        revalidated: true,
      };
    }
  }

  const allowed = options.allowStatus ?? [];
  if (!response.ok && !allowed.includes(response.status)) {
    fetchStats.failed += 1;
    throw new HttpError(url, response.status);
  }

  const body = await response.text();
  const bodySha = await storeBody(body);
  const fetchedAt = new Date().toISOString();
  const next: CacheEntry = {
    url,
    status: response.status,
    etag: response.headers.get("etag") ?? undefined,
    lastModified: response.headers.get("last-modified") ?? undefined,
    contentType: response.headers.get("content-type") ?? undefined,
    fetchedAt,
    bodySha256: bodySha,
    bytes: Buffer.byteLength(body),
  };
  await writeJson(entryFile, next);
  fetchStats.network += 1;
  return {
    url,
    body,
    bodySha256: bodySha,
    status: response.status,
    retrievedAt: fetchedAt,
    fromCache: false,
    revalidated: false,
  };
}

export class HttpError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
  }
}

async function fetchWithRetry(url: string, headers: Record<string, string>, attempts = 4): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers, redirect: "follow" });
      if (response.status === 429 || response.status >= 500) {
        if (attempt < attempts - 1) {
          await delay(500 * 2 ** attempt);
          continue;
        }
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await delay(500 * 2 ** attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`fetch failed for ${url}`);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function cachedJson<T>(url: string, options: FetchOptions = {}): Promise<{ value: T; result: FetchResult }> {
  const result = await cachedFetch(url, options);
  return { value: JSON.parse(result.body) as T, result };
}

/** Bounded-concurrency map. Keeps us polite to docs.aws.amazon.com. */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index] as T, index);
    }
  });
  await Promise.all(runners);
  return results;
}
