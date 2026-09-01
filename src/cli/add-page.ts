import path from "node:path";
import { paths } from "../core/paths.js";
import { loadRegistry, saveRegistry, upsert } from "../coverage/registry.js";
import type { PageSource } from "../coverage/registry.js";

/**
 * Register a coverage page found by hand, by a search, or by an agent. Once
 * registered it is read on every run, so a discovery is never lost.
 *
 *   npm run add-page -- <url> --service guardduty [--feature guardduty/eks-protection]
 *                            [--source search] [--note "found by site: search"]
 */
function parse(argv: string[]) {
  const urls: string[] = [];
  let serviceId = "";
  let featureId: string | undefined;
  let source: PageSource = "manual";
  let note: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string;
    if (arg === "--service") serviceId = argv[++i] ?? "";
    else if (arg === "--feature") featureId = argv[++i];
    else if (arg === "--source") source = (argv[++i] ?? "manual") as PageSource;
    else if (arg === "--note") note = argv[++i];
    else if (!arg.startsWith("--")) urls.push(arg);
  }
  return { urls, serviceId, featureId, source, note };
}

export async function addPages(input: {
  urls: string[];
  serviceId: string;
  featureId?: string;
  source: PageSource;
  note?: string;
}): Promise<{ added: number; total: number }> {
  if (!input.serviceId) throw new Error("--service is required so the page joins to a service");
  const registry = await loadRegistry();
  let added = 0;
  for (const url of input.urls) {
    const result = upsert(registry, {
      url,
      serviceId: input.serviceId,
      source: input.source,
      ...(input.featureId ? { featureId: input.featureId } : {}),
      ...(input.note ? { note: input.note } : {}),
    });
    if (result.added) added += 1;
  }
  const total = await saveRegistry(registry);
  return { added, total };
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const args = parse(process.argv.slice(2));
  if (args.urls.length === 0) {
    console.error("usage: npm run add-page -- <url…> --service <serviceId> [--feature <id>] [--source search|manual|agent] [--note text]");
    process.exit(1);
  }
  const result = await addPages(args);
  console.log(`registered ${result.added} new page(s); the registry now holds ${result.total}`);
  console.log(`run: npm run pipeline -- --only stage5   to read them`);
}
void paths;
