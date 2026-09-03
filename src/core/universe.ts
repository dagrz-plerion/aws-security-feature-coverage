import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Axis } from './types.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const load = <T>(f: string): T => JSON.parse(readFileSync(join(ROOT, f), 'utf8')) as T;

export interface Region {
  id: string;
  name: string;
  partition: string;
  country: string;
}
export interface Service {
  id: string;
  names: string[];
  iamPrefix?: string;
  regions?: string[];
}
export interface ResourceType {
  id: string;
  serviceId: string;
  cloudFormationType?: string;
  resourceExplorerType?: string;
  serviceReferenceName?: string;
}

export const regions: Region[] = load<{ regions: Region[] }>('regions.json').regions;
export const services: Service[] = load<{ services: Service[] }>('services.json').services;
export const resourceTypes: ResourceType[] = load<{ resourceTypes: ResourceType[] }>(
  'resource-types.json',
).resourceTypes;

export const DENOMINATOR: Record<Axis, number> = {
  region: regions.length,
  service: services.length,
  resourceType: resourceTypes.length,
};

const norm = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Every row a name could mean. Ambiguity is kept, not silently resolved. */
const index = <T>(rows: T[], keysOf: (row: T) => string[]): Map<string, T[]> => {
  const m = new Map<string, T[]>();
  for (const row of rows) {
    for (const raw of keysOf(row)) {
      const k = norm(raw);
      if (!k) continue;
      const list = m.get(k) ?? [];
      if (!list.includes(row)) list.push(row);
      m.set(k, list);
    }
  }
  return m;
};

/**
 * One row, or nothing. A name two rows share resolves only when `prefer` leaves
 * exactly one standing — never by guessing.
 */
const pick = <T>(cands: T[] | undefined, prefer?: (row: T) => boolean): T | undefined => {
  if (!cands?.length) return undefined;
  if (cands.length === 1) return cands[0];
  if (!prefer) return undefined;
  const strong = cands.filter(prefer);
  return strong.length === 1 ? strong[0] : undefined;
};

/** A real IAM service beats a catalogue row publishing the same name. */
const isIamService = (s: Service): boolean => !s.id.includes(':');

/** An exact canonical id always wins over an alias that two rows share. */
const byId = <T extends { id: string }>(rows: T[]): Map<string, T> =>
  new Map(rows.map((r) => [norm(r.id), r]));

const regionById = byId(regions);
const serviceById = byId(services);
const resourceById = byId(resourceTypes);

const regionIndex = index(regions, (r) => [r.id, r.name, r.name.replace(/[()]/g, '')]);
const serviceIndex = index(services, (s) => [s.id, ...s.names]);
const resourceIndex = index(resourceTypes, (t) =>
  [t.id, t.cloudFormationType, t.resourceExplorerType].filter((x): x is string => !!x),
);

/** Pull an explicit region code out of wording such as "Asia Pacific (Taipei) (`ap-east-2`)". */
const REGION_CODE = /\b([a-z]{2}(?:-gov)?(?:-iso[a-z]?)?-(?:north|south|east|west|central|northeast|northwest|southeast|southwest)-\d)\b/;

export const resolveRegion = (label: string): Region | undefined => {
  const code = REGION_CODE.exec(label.toLowerCase());
  if (code?.[1]) {
    const byCode = regions.find((r) => r.id === code[1]);
    if (byCode) return byCode;
  }
  const k = norm(label);
  return regionById.get(k) ?? pick(regionIndex.get(k));
};

/**
 * services.json carries synthetic catalogue rows keyed `product:`, `regional:` and
 * `doc:` beside the real IAM services. The contract forbids counting a product name
 * with no IAM prefix, so they never resolve — a page naming only such a row leaves
 * the value unresolved, which is the honest answer.
 */
const isCountable = (s: Service): boolean => !s.id.includes(':');

export const resolveService = (label: string): Service | undefined => {
  const trimmed = label.trim();
  // Service principals such as "ec2.amazonaws.com" or "ec2.us-west-2.amazonaws.com".
  const principal = /^([a-z0-9-]+)\.(?:[a-z0-9-]+\.)?amazonaws\.com(?:\.cn)?$/.exec(
    trimmed.toLowerCase(),
  );
  if (principal?.[1]) {
    const byPrefix = services.find((s) => s.id === principal[1]);
    if (byPrefix) return byPrefix;
  }
  const k = norm(trimmed);
  const hit = serviceById.get(k) ?? pick(serviceIndex.get(k), isIamService);
  return hit && isCountable(hit) ? hit : undefined;
};

export const resolveResourceType = (label: string): ResourceType | undefined => {
  const k = norm(label);
  return resourceById.get(k) ?? pick(resourceIndex.get(k));
};

export const resolve = (axis: Axis, label: string): { id: string } | undefined => {
  if (axis === 'region') return resolveRegion(label);
  if (axis === 'service') return resolveService(label);
  return resolveResourceType(label);
};

export const regionIds = new Set(regions.map((r) => r.id));
export const serviceIds = new Set(services.map((s) => s.id));
export const resourceTypeIds = new Set(resourceTypes.map((t) => t.id));

export const universeIds = (axis: Axis): Set<string> =>
  axis === 'region' ? regionIds : axis === 'service' ? serviceIds : resourceTypeIds;

/** Every service a name could mean, so a parser can say why it stayed unresolved. */
export const serviceCandidates = (label: string): Service[] =>
  serviceIndex.get(norm(label)) ?? [];
