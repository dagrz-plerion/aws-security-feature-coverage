import path from "node:path";
import { paths } from "../core/paths.js";
import { writeJson } from "../core/store.js";
import { slug } from "../core/ids.js";
import type { Expectation } from "../pipeline/stage8.js";

/**
 * Store what an independent reader said a page should produce.
 *
 * The blind audit writes these. Once stored they are checked on every run, so a
 * finding becomes a standing rule rather than a note in a transcript that the next
 * change quietly undoes.
 *
 *   npx tsx src/cli/record-expectations.ts <file-of-specs.json>
 */
export async function recordExpectations(specs: Omit<Expectation, "recordedAt">[]): Promise<number> {
  let written = 0;
  for (const spec of specs) {
    if (!spec?.url || !Array.isArray(spec.features)) continue;
    const file = path.join(paths.expectations, `${slug(spec.url.replace(/^https:\/\/docs\.aws\.amazon\.com\//, ""))}.json`);
    await writeJson(file, { ...spec, recordedAt: new Date().toISOString() });
    written += 1;
  }
  return written;
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const source = process.argv[2];
  if (!source) {
    console.error("usage: npx tsx src/cli/record-expectations.ts <specs.json>");
    process.exit(1);
  }
  const { readFile } = await import("node:fs/promises");
  const parsed = JSON.parse(await readFile(source, "utf8")) as unknown;
  const specs = (Array.isArray(parsed) ? parsed : (parsed as { specs?: unknown[] }).specs ?? []) as Omit<Expectation, "recordedAt">[];
  const n = await recordExpectations(specs);
  console.log(`recorded ${n} expectation(s) into data/expectations/`);
  console.log("they are now checked on every run by stage8-expectations");
}
