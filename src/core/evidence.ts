import type { FetchResult } from "./fetch.js";
import { readRawBody } from "./fetch.js";
import type { Evidence } from "./schema.js";

export class EvidenceError extends Error {}

function normaliseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Build an evidence record. The quote must appear in the fetched body, so every
 * claim in the dataset is checkable against a stored byte-exact source.
 */
export function makeEvidence(result: FetchResult, quote: string, locator?: string): Evidence {
  const trimmed = quote.trim();
  if (!trimmed) throw new EvidenceError(`empty quote for ${result.url}`);
  if (!quoteAppearsIn(result.body, trimmed)) {
    throw new EvidenceError(`quote not found in body of ${result.url}: ${JSON.stringify(trimmed.slice(0, 120))}`);
  }
  return {
    sourceUrl: result.url,
    bodySha256: result.bodySha256,
    retrievedAt: result.retrievedAt,
    quote: trimmed.length > 600 ? `${trimmed.slice(0, 600)}…` : trimmed,
    ...(locator ? { locator } : {}),
  };
}

/** Tolerates whitespace differences only. Never tolerates changed words. */
export function quoteAppearsIn(body: string, quote: string): boolean {
  const q = quote.endsWith("…") ? quote.slice(0, -1) : quote;
  if (body.includes(q)) return true;
  return normaliseWhitespace(body).includes(normaliseWhitespace(q));
}

/** Re-check an evidence record against its stored body. Used by validate and audit. */
export async function verifyEvidence(evidence: Evidence): Promise<{ ok: boolean; reason?: string }> {
  const body = await readRawBody(evidence.bodySha256);
  if (body === undefined) return { ok: false, reason: "cached body missing" };
  if (!quoteAppearsIn(body, evidence.quote)) return { ok: false, reason: "quote not present in body" };
  return { ok: true };
}
