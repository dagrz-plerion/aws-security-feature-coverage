import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { paths } from "../core/paths.js";
import { buildReport } from "../report/build.js";
import { validate } from "../pipeline/stage6.js";

const exec = promisify(execFile);

async function git(args: string[]): Promise<string> {
  const { stdout } = await exec("git", args, { cwd: paths.root, maxBuffer: 64 * 1024 * 1024 });
  return stdout.trim();
}

/**
 * Rebuild the page and publish it. Safe to call after every pipeline run: it does
 * nothing when the output has not changed.
 */
export async function deploy(
  message?: string,
  options: { skipValidation?: boolean } = {},
): Promise<{ published: boolean; url: string; note: string }> {
  const url = "https://dagrz-plerion.github.io/aws-security-feature-coverage/";
  // A run that broke its own rules does not get published.
  if (!options.skipValidation) {
    const { violations } = await validate(120);
    if (violations.length > 0) {
      return {
        published: false,
        url,
        note: `${violations.length} validation violations, starting with "${violations[0]?.rule}: ${violations[0]?.detail}". Fix them or pass --force.`,
      };
    }
  }
  const report = await buildReport();
  const status = await git(["status", "--porcelain"]);
  if (!status) {
    return { published: false, url, note: "nothing changed since the last publish" };
  }
  const changed = status.split("\n").length;
  await git(["add", "-A"]);
  const subject = message ?? `Update coverage map (${report.services} services, ${report.features} features)`;
  await git([
    "commit",
    "-q",
    "-m",
    `${subject}\n\nCo-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_014CDf7VqYX5X6mAr5Zm3R3K`,
  ]);
  await git(["push", "-q", "origin", "main"]);
  return { published: true, url, note: `${changed} files changed` };
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const result = await deploy(argv.filter((a) => a !== "--force").join(" ") || undefined, { skipValidation: force });
  console.log(result.published ? `published: ${result.url} (${result.note})` : `skipped: ${result.note}`);
}
