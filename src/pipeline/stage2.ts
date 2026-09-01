import path from "node:path";
import { paths } from "../core/paths.js";
import { readJson, writeJson } from "../core/store.js";
import { fetchGlobalDocsIndex } from "../sources/docsIndex.js";
import { buildGuideIndexes } from "../sources/guidePages.js";
import type { Stage, StageResult } from "../core/runner.js";

export const stage2: Stage = {
  id: "stage2-doc-pages",
  title: "Index every page of every AWS documentation guide",
  async run(ctx): Promise<StageResult> {
    const { guides } = await fetchGlobalDocsIndex(ctx.maxAgeMs);
    const { indexes, failed } = await buildGuideIndexes(guides, ctx.maxAgeMs, 10, (done, total) =>
      ctx.log(`  ${done}/${total} guides indexed`),
    );
    const pages = indexes.reduce((sum, index) => sum + index.pages.length, 0);
    await writeJson(path.join(paths.data, "guides", "_index.json"), {
      generatedAt: new Date().toISOString(),
      guides: indexes.map((i) => ({ guideKey: i.guideKey, title: i.title, pages: i.pages.length, llmsTxt: i.llmsTxt })),
    });
    return {
      status: failed > 0 ? "partial" : "ok",
      counts: { guides: guides.length, indexed: indexes.length, pages, failed },
    };
  },
};

export async function listGuideIndexKeys(): Promise<string[]> {
  const index = await readJson<{ guides: { guideKey: string }[] }>(path.join(paths.data, "guides", "_index.json"));
  return (index?.guides ?? []).map((g) => g.guideKey);
}
