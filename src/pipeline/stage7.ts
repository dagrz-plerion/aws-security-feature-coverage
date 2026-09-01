import { verify } from "../cli/verify.js";
import { recordGap } from "../core/ops.js";
import type { Stage, StageResult } from "../core/runner.js";

/**
 * Check every coverage row against the page it came from. This runs on every pass, so
 * a page added today is verified the same way as one added last week, and a page that
 * quietly stops parsing is reported rather than left to rot.
 */
export const stage7: Stage = {
  id: "stage7-verify",
  title: "Check every coverage row against its source page",
  async run(ctx): Promise<StageResult> {
    const verdicts = await verify(ctx.maxAgeMs);
    const stale = verdicts.filter((v) => v.verdict === "stale-quotes");
    const empty = verdicts.filter((v) => v.verdict === "empty");
    const partial = verdicts.filter((v) => v.verdict === "partial-read");

    for (const v of [...stale, ...empty]) {
      ctx.log(`  ✗ ${v.verdict}: ${v.url}`);
      await recordGap({
        kind: "parser",
        subject: `verify:${v.url}`,
        detail:
          v.verdict === "stale-quotes"
            ? `${v.quotesMissing} of ${v.quotesChecked} sampled quotes no longer appear on the page. The page has changed under us.`
            : "The page produced no claims at all.",
        suggestedStage: "stage5-coverage",
      });
    }
    for (const v of partial) {
      ctx.log(`  ~ read ${(v.readRatio * 100).toFixed(0)}% of ${v.url.split("/").pop()}`);
      await recordGap({
        kind: "parser",
        subject: `verify:${v.url}`,
        detail: `${v.note ?? "partial read"}. Either the page holds more than this feature, or a recipe is needed.`,
        suggestedStage: "stage5-coverage",
      });
    }

    return {
      // Only a broken page fails the run. A partial read is a task, not a defect.
      status: stale.length + empty.length > 0 ? "failed" : partial.length > 0 ? "partial" : "ok",
      counts: {
        pagesChecked: verdicts.length,
        clean: verdicts.filter((v) => v.verdict === "ok").length,
        partialRead: partial.length,
        staleQuotes: stale.length,
        empty: empty.length,
      },
      ...(stale.length + empty.length > 0
        ? { notes: [...stale, ...empty].slice(0, 10).map((v) => `${v.verdict}: ${v.url}`) }
        : {}),
    };
  },
};
