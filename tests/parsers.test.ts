import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadErrors, loadParsers } from '../src/parsers/registry.js';
import { loadPage, quotableText } from '../src/core/pages.js';
import { checkFeature } from '../src/core/validate.js';
import { DENOMINATOR } from '../src/core/universe.js';
import type { Feature } from '../src/core/types.js';

const URLS = (JSON.parse(readFileSync(new URL('../coverage-urls.json', import.meta.url).pathname, 'utf8')) as { urls: { url: string }[] }).urls;

const EXPECTED_DIR = new URL('./expected/', import.meta.url).pathname;

interface Expected {
  /** Why a page yields nothing, when it yields nothing. */
  noCoverageReason?: string;
  features?: {
    id: string;
    name: string;
    axis: Feature['axis'];
    scope: Feature['scope'];
    serviceId: string;
    derivation: Feature['derivation'];
    numerator: number;
    coveredIds: string[];
    excludedIds: string[];
    partialIds?: string[];
  }[];
}

const parsers = await loadParsers();

describe('every parser', () => {
  it('is registered', () => {
    expect(parsers.length).toBeGreaterThan(0);
  });

  it('imports without error', () => {
    expect(loadErrors).toEqual([]);
  });

  it('has a parserId matching its file name and a url from coverage-urls.json', () => {
    const known = new Set(URLS.map((u) => u.url));
    for (const p of parsers) expect(known).toContain(p.url);
    expect(new Set(parsers.map((p) => p.parserId)).size).toBe(parsers.length);
  });

  for (const p of parsers) {
    describe(p.parserId, () => {
      const page = loadPage(p.url);
      const result = p.parse(page);
      const expectedPath = join(EXPECTED_DIR, `${p.parserId}.json`);

      it('has an expectation file written before it', () => {
        expect(existsSync(expectedPath)).toBe(true);
      });

      const expected = existsSync(expectedPath)
        ? (JSON.parse(readFileSync(expectedPath, 'utf8')) as Expected)
        : { features: [] };

      it('reads the page it was registered for', () => {
        expect(result.sourceUrl).toBe(p.url);
        expect(result.parserId).toBe(p.parserId);
      });

      it('states a reason when it finds nothing', () => {
        if (result.features.length === 0) expect(result.noCoverageReason?.length ?? 0).toBeGreaterThan(0);
        else expect(result.noCoverageReason).toBeUndefined();
      });

      it('breaks no invariant', () => {
        const body = quotableText(page);
        const violations = result.features.flatMap((f) => checkFeature(f, body));
        expect(violations).toEqual([]);
      });

      it('carries the current page hash', () => {
        for (const f of result.features) expect(f.bodySha256).toBe(page.sha256);
      });

      it('matches the expectation recorded by hand', () => {
        const actual = result.features.map((f) => ({
          id: f.id,
          name: f.name,
          axis: f.axis,
          scope: f.scope,
          serviceId: f.serviceId,
          derivation: f.derivation,
          numerator: f.covered.length,
          coveredIds: f.covered.map((c) => c.id).sort(),
          excludedIds: f.excluded.map((c) => c.id).sort(),
          partialIds: f.covered.filter((c) => c.status === 'partial').map((c) => c.id).sort(),
        }));
        const want = (expected.features ?? []).map((f) => ({
          ...f,
          coveredIds: [...f.coveredIds].sort(),
          excludedIds: [...f.excludedIds].sort(),
          partialIds: [...(f.partialIds ?? [])].sort(),
        }));
        expect(actual).toEqual(want);
        if (expected.noCoverageReason) expect(result.noCoverageReason).toBe(expected.noCoverageReason);
      });

      it('never counts past the universe', () => {
        for (const f of result.features)
          expect(f.covered.length).toBeLessThanOrEqual(DENOMINATOR[f.axis]);
      });
    });
  }
});
