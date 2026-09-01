import path from "node:path";
import { paths } from "./paths.js";
import { writeJson } from "./store.js";
import { fetchStats } from "./fetch.js";
import type { RunManifest } from "./schema.js";

export type StageResult = {
  status: "ok" | "partial" | "failed" | "skipped";
  counts?: Record<string, number>;
  notes?: string[];
};

export type Stage = {
  id: string;
  title: string;
  run: (ctx: StageContext) => Promise<StageResult>;
};

export type StageContext = {
  force: boolean;
  maxAgeMs: number;
  only?: string[];
  log: (message: string) => void;
};

const manifest: RunManifest = { startedAt: new Date().toISOString(), stages: [] };

export async function runStages(stages: Stage[], ctx: StageContext): Promise<RunManifest> {
  for (const stage of stages) {
    const startedAt = new Date().toISOString();
    ctx.log(`\n▶ ${stage.id} — ${stage.title}`);
    let result: StageResult;
    try {
      result = await stage.run(ctx);
    } catch (error) {
      result = { status: "failed", notes: [error instanceof Error ? error.stack ?? error.message : String(error)] };
    }
    const entry = {
      id: stage.id,
      status: result.status,
      startedAt,
      finishedAt: new Date().toISOString(),
      ...(result.counts ? { counts: result.counts } : {}),
      ...(result.notes ? { notes: result.notes } : {}),
    };
    manifest.stages.push(entry);
    const summary = result.counts
      ? Object.entries(result.counts)
          .map(([k, v]) => `${k}=${v}`)
          .join(" ")
      : "";
    ctx.log(`  ${result.status === "ok" ? "✓" : result.status === "failed" ? "✗" : "~"} ${stage.id} ${summary}`);
    if (result.notes?.length && result.status === "failed") {
      for (const note of result.notes) ctx.log(`    ${note.split("\n")[0]}`);
    }
    manifest.finishedAt = new Date().toISOString();
    manifest.fetch = { ...fetchStats };
    await writeJson(path.join(paths.state, "run-manifest.json"), manifest);
  }
  return manifest;
}

export function getManifest(): RunManifest {
  return manifest;
}
