import path from "node:path";
import { paths } from "../core/paths.js";
import { readAllJson, readJson } from "../core/store.js";
import type { Feature } from "../core/schema.js";

export type Expectation = { serviceId: string; terms: string[] };
export type RecallResult = {
  total: number;
  found: number;
  missing: Expectation[];
  matches: { expectation: Expectation; featureId: string }[];
};

export async function runRecall(fixtureFile: string): Promise<RecallResult> {
  const fixture = await readJson<{ expect: Expectation[] }>(fixtureFile);
  const expectations = fixture?.expect ?? [];
  const features = await readAllJson<Feature>(paths.features);
  const byService = new Map<string, Feature[]>();
  for (const feature of features) {
    const list = byService.get(feature.serviceId);
    if (list) list.push(feature);
    else byService.set(feature.serviceId, [feature]);
  }

  const missing: Expectation[] = [];
  const matches: { expectation: Expectation; featureId: string }[] = [];
  for (const expectation of expectations) {
    const pool = byService.get(expectation.serviceId) ?? [];
    const hit = pool.find((feature) =>
      [feature.name, ...feature.aliases]
        .some((text) => {
          const haystack = text.toLowerCase();
          return expectation.terms.every((term) => haystack.includes(term.toLowerCase()));
        }),
    );
    if (hit) matches.push({ expectation, featureId: hit.id });
    else missing.push(expectation);
  }
  return { total: expectations.length, found: matches.length, missing, matches };
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const file = process.argv[2] ?? path.join(paths.root, "tests", "fixtures", "known-features.json");
  const result = await runRecall(file);
  console.log(`recall ${result.found}/${result.total} (${((result.found / result.total) * 100).toFixed(1)}%)`);
  for (const m of result.missing) console.log(`  MISS ${m.serviceId.padEnd(20)} ${m.terms.join(" + ")}`);
}
