import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadParsers, loadErrors } from '../parsers/registry.js';
import { loadPage, quotableText } from '../core/pages.js';
import { checkDataset } from '../core/validate.js';
import { DENOMINATOR, regions, services } from '../core/universe.js';
import type { Feature, PageBody } from '../core/types.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = join(ROOT, 'docs');

const urls = (JSON.parse(
  await import('node:fs').then((fs) => fs.readFileSync(join(ROOT, 'coverage-urls.json'), 'utf8')),
) as { urls: { url: string; axes: string[] }[] }).urls;

const parsers = await loadParsers();
if (loadErrors.length) {
  console.error('parsers that would not load:', loadErrors);
  process.exit(1);
}

const features: Feature[] = [];
const bodies = new Map<string, PageBody>();
const pages: {
  url: string;
  parserId: string | null;
  declaredAxes: string[];
  featureCount: number;
  noCoverageReason?: string;
}[] = [];

for (const { url, axes } of urls) {
  const parser = parsers.find((p) => p.url === url);
  if (!parser) {
    pages.push({ url, parserId: null, declaredAxes: axes, featureCount: 0 });
    continue;
  }
  const page = loadPage(url);
  bodies.set(url, { url, body: quotableText(page), sha256: page.sha256 });
  const result = parser.parse(page);
  features.push(...result.features);
  pages.push({
    url,
    parserId: parser.parserId,
    declaredAxes: axes,
    featureCount: result.features.length,
    ...(result.noCoverageReason ? { noCoverageReason: result.noCoverageReason } : {}),
  });
}

const violations = checkDataset(features, bodies);
if (violations.length) {
  console.error(`${violations.length} rule violations — refusing to publish:`);
  for (const v of violations.slice(0, 40)) console.error(`  ${v.rule} [${v.featureId}] ${v.detail}`);
  process.exit(1);
}

const serviceName = new Map(services.map((s) => [s.id, s.names[0] ?? s.id]));

const data = {
  generatedAt: new Date().toISOString(),
  denominators: DENOMINATOR,
  counts: {
    pages: urls.length,
    pagesParsed: pages.filter((p) => p.parserId).length,
    pagesWithNoCoverage: pages.filter((p) => p.parserId && p.featureCount === 0).length,
    features: features.length,
    evidenceItems: features.reduce((n, f) => n + f.covered.length + f.excluded.length, 0),
  },
  regions: regions.map((r) => ({ id: r.id, name: r.name, partition: r.partition })),
  serviceNames: Object.fromEntries(
    [...new Set(features.map((f) => f.serviceId))].map((id) => [id, serviceName.get(id) ?? id]),
  ),
  pages,
  features: features
    .slice()
    .sort((a, b) => a.serviceId.localeCompare(b.serviceId) || a.name.localeCompare(b.name)),
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'data.json'), JSON.stringify(data));
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(
  `${data.counts.features} features from ${data.counts.pagesParsed}/${urls.length} pages, ` +
    `${data.counts.evidenceItems} evidence items, 0 violations`,
);
