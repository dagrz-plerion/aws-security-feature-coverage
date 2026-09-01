import { runStages } from "../core/runner.js";
import type { Stage } from "../core/runner.js";
import { stage1 } from "../pipeline/stage1.js";
import { stage2 } from "../pipeline/stage2.js";
import { stage3 } from "../pipeline/stage3.js";
import { stage4 } from "../pipeline/stage4.js";
import { stage5 } from "../pipeline/stage5.js";
import { buildReport } from "../report/build.js";
import { fetchStats } from "../core/fetch.js";

const ALL: Stage[] = [stage1, stage2, stage3, stage4, stage5];

function parseArgs(argv: string[]) {
  const only: string[] = [];
  let force = false;
  let maxAgeHours = 24;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") force = true;
    else if (arg === "--max-age-hours") maxAgeHours = Number(argv[++i] ?? 24);
    else if (arg === "--only") only.push(...String(argv[++i] ?? "").split(","));
    else if (arg?.startsWith("--")) throw new Error(`unknown flag ${arg}`);
  }
  return { only, force, maxAgeMs: maxAgeHours * 3600_000 };
}

const args = parseArgs(process.argv.slice(2));
const stages = args.only.length ? ALL.filter((s) => args.only.some((o) => s.id.includes(o))) : ALL;

const reportStage: Stage = {
  id: "report",
  title: "Render the page and the query index",
  async run() {
    const result = await buildReport();
    return { status: "ok", counts: { services: result.services, features: result.features } };
  },
};

const manifest = await runStages([...stages, reportStage], {
  force: args.force,
  maxAgeMs: args.force ? 0 : args.maxAgeMs,
  ...(args.only.length ? { only: args.only } : {}),
  log: (m) => console.log(m),
});

console.log(`\nfetch: ${JSON.stringify(fetchStats)}`);
const failed = manifest.stages.filter((s) => s.status === "failed");
if (failed.length) {
  console.error(`\n${failed.length} stage(s) failed: ${failed.map((s) => s.id).join(", ")}`);
  process.exitCode = 1;
}
