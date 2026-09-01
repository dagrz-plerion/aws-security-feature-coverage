import path from "node:path";
import { paths } from "../core/paths.js";
import { readJson, writeJson } from "../core/store.js";
import { cachedFetch, mapPool } from "../core/fetch.js";
import { slug } from "../core/ids.js";
import { quarantine } from "../core/ops.js";
import { parseGuideLlmsTxt } from "./docsIndex.js";
import type { DocGuide, DocPage } from "./docsIndex.js";

export type GuideIndex = {
  guideKey: string;
  title: string;
  llmsTxt: string;
  description?: string;
  fetchedAt: string;
  bodySha256: string;
  pages: DocPage[];
};

type TocNode = { title: string; href?: string; contents?: TocNode[] };

/** Fallback page list for guides that publish no llms.txt. */
export function parseTocContents(body: string, baseUrl: string): DocPage[] {
  const parsed = JSON.parse(body) as { contents?: TocNode[] };
  const pages: DocPage[] = [];
  const walk = (nodes: TocNode[] | undefined, section: string[]): void => {
    for (const node of nodes ?? []) {
      if (node.href && !/^https?:/.test(node.href)) {
        pages.push({
          title: node.title,
          url: new URL(node.href.replace(/\.html$/, ".md"), baseUrl).toString(),
          section: section.slice(),
        });
      }
      if (node.contents) walk(node.contents, [...section, node.title]);
    }
  };
  walk(parsed.contents, []);
  return pages;
}

export function tocUrlFor(guide: DocGuide): string {
  return new URL("toc-contents.json", guide.url).toString();
}

export function guideFile(guideKey: string): string {
  return path.join(paths.data, "guides", `${slug(guideKey)}.json`);
}

export async function readGuideIndex(guideKey: string): Promise<GuideIndex | undefined> {
  return readJson<GuideIndex>(guideFile(guideKey));
}

/**
 * Fetch the page list for every guide. One file per guide keeps re-runs cheap
 * and makes the raw material reviewable.
 */
export async function buildGuideIndexes(
  guides: DocGuide[],
  maxAgeMs: number | undefined,
  concurrency = 10,
  onProgress?: (done: number, total: number) => void,
): Promise<{ indexes: GuideIndex[]; failed: number }> {
  const indexes: GuideIndex[] = [];
  let failed = 0;
  let done = 0;
  await mapPool(guides, concurrency, async (guide) => {
    const sourceUrl = guide.llmsTxt ?? tocUrlFor(guide);
    const viaToc = !guide.llmsTxt;
    try {
      const result = await cachedFetch(sourceUrl, { maxAgeMs });
      const pages = viaToc ? parseTocContents(result.body, guide.url) : parseGuideLlmsTxt(result.body);
      if (pages.length === 0) {
        failed += 1;
        await quarantine({
          stage: "stage2-doc-pages",
          subject: `guide:${guide.guideKey}`,
          sourceUrl,
          bodySha256: result.bodySha256,
          extractorId: viaToc ? "guide-toc-contents" : "guide-llms-txt",
          reason: "guide page index produced no pages",
        });
        return;
      }
      const index: GuideIndex = {
        guideKey: guide.guideKey,
        title: guide.title,
        llmsTxt: sourceUrl,
        ...(guide.description ? { description: guide.description } : {}),
        fetchedAt: result.retrievedAt,
        bodySha256: result.bodySha256,
        pages,
      };
      await writeJson(guideFile(guide.guideKey), index);
      indexes.push(index);
    } catch (error) {
      failed += 1;
      await quarantine({
        stage: "stage2-doc-pages",
        subject: `guide:${guide.guideKey}`,
        sourceUrl,
        extractorId: viaToc ? "guide-toc-contents" : "guide-llms-txt",
        reason: "guide page index could not be fetched",
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      done += 1;
      if (onProgress && done % 100 === 0) onProgress(done, guides.length);
    }
  });
  indexes.sort((a, b) => a.guideKey.localeCompare(b.guideKey));
  return { indexes, failed };
}

/** Pages that sit under a Security heading in the guide's own table of contents. */
export function securityPages(index: GuideIndex): DocPage[] {
  return index.pages.filter((page) => page.section.some((s) => /^security\b/i.test(s) || /\bsecurity\b/i.test(s)));
}
