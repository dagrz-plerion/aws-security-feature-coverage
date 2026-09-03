import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { PageBody } from './types.js';

const ROOT = new URL('../../', import.meta.url).pathname;
export const PAGE_DIR = join(ROOT, 'data/pages');

export const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

/** A URL becomes a stable file name. */
export const slugFor = (url: string): string =>
  url.replace(/^https:\/\/docs\.aws\.amazon\.com\//, '').replace(/\//g, '__');

export interface StoredPage extends PageBody {
  slug: string;
  /**
   * Text the Markdown rendering dropped, recovered from the HTML page.
   * Quotes may come from here as well as from body.
   */
  supplement?: string;
}

export const loadPage = (url: string): StoredPage => {
  const slug = slugFor(url);
  const body = readFileSync(join(PAGE_DIR, slug), 'utf8');
  const supplementPath = join(PAGE_DIR, `${slug}.supplement.txt`);
  const supplement = readdirSync(PAGE_DIR).includes(`${slug}.supplement.txt`)
    ? readFileSync(supplementPath, 'utf8')
    : undefined;
  return { url, slug, body, sha256: sha256(body), supplement };
};

/** What a quote is checked against: the page plus anything recovered from HTML. */
export const quotableText = (page: StoredPage): string =>
  page.supplement ? `${page.body}\n${page.supplement}` : page.body;
