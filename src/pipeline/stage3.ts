import path from "node:path";
import { paths } from "../core/paths.js";
import { readJson } from "../core/store.js";
import { adjudicateServices } from "../discovery/adjudicate.js";
import type { Stage, StageResult } from "../core/runner.js";
import type { Action, Service } from "../core/schema.js";

export const stage3: Stage = {
  id: "stage3-discovery",
  title: "Decide, for every AWS service, whether it carries security capability",
  async run(ctx): Promise<StageResult> {
    const services =
      (await readJson<{ services: Service[] }>(path.join(paths.universes, "services.json")))?.services ?? [];
    const actions =
      (await readJson<{ actions: Action[] }>(path.join(paths.universes, "actions.json")))?.actions ?? [];
    if (services.length === 0) throw new Error("service universe is empty; run stage1 first");

    const result = await adjudicateServices(services, actions, ctx.maxAgeMs);
    ctx.log(`  tier1 ${result.counts["tier1"]}, tier2 ${result.counts["tier2"]}, pending ${result.counts["pendingJudgement"]}`);
    return {
      status: result.pending.length > 0 ? "partial" : "ok",
      counts: result.counts,
      ...(result.pending.length
        ? { notes: [`${result.pending.length} services need judgement: ${result.pending.slice(0, 20).map((p) => p.serviceId).join(", ")}`] }
        : {}),
    };
  },
};
