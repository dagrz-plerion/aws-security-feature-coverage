import type { Feature, PageBody } from './types.js';
import { DENOMINATOR, resolveService, services, universeIds } from './universe.js';

export interface Violation {
  rule: string;
  featureId: string;
  detail: string;
}

const AXIS_NOUN: Record<Feature['axis'], RegExp> = {
  region: /\bregions?\b/i,
  service: /\bservices?\b/i,
  resourceType: /\bresource types?\b/i,
};

/** Every rule one feature must obey. Returns the rules it broke. */
export const checkFeature = (f: Feature, body?: string): Violation[] => {
  const v: Violation[] = [];
  const fail = (rule: string, detail: string) => v.push({ rule, featureId: f.id, detail });
  const ids = universeIds(f.axis);

  if (f.covered.length === 0) fail('no-zero-count', 'a feature must cover at least one item');

  if (f.covered.length > DENOMINATOR[f.axis])
    fail('numerator-le-denominator', `${f.covered.length} > ${DENOMINATOR[f.axis]}`);

  const seen = new Set<string>();
  for (const item of f.covered) {
    if (!ids.has(item.id)) fail('id-in-universe', `covered id "${item.id}" is not a ${f.axis}`);
    if (seen.has(item.id)) fail('no-double-count', `covered id "${item.id}" appears twice`);
    seen.add(item.id);
    if (item.status === 'partial' && !item.note?.trim())
      fail('partial-needs-note', `"${item.id}" is partial with no note saying what is missing`);
  }

  for (const item of f.excluded) {
    if (!ids.has(item.id)) fail('id-in-universe', `excluded id "${item.id}" is not a ${f.axis}`);
    if (seen.has(item.id))
      fail('no-contradiction', `"${item.id}" is listed as both covered and excluded`);
  }

  if (!serviceIdExists(f.serviceId)) fail('service-exists', `serviceId "${f.serviceId}" is unknown`);

  if (f.scope !== 'service' && isBareServiceName(f.name))
    fail(
      'name-precision',
      `"${f.name}" is a bare service name but scope is "${f.scope}" — name the feature`,
    );

  if (!AXIS_NOUN[f.axis].test(f.whatIsCounted))
    fail(
      'says-what-is-counted',
      `whatIsCounted "${f.whatIsCounted}" never names the ${f.axis} axis`,
    );

  if (f.derivation === 'universe-minus-exclusions') {
    if (f.axis !== 'region')
      fail('derivation-region-only', 'only the region axis may be derived from exclusions');
    if (f.excluded.length === 0)
      fail('derivation-needs-exclusions', 'derived from exclusions but none are recorded');
    if (f.covered.length + f.excluded.length !== DENOMINATOR[f.axis])
      fail(
        'derivation-adds-up',
        `${f.covered.length} covered + ${f.excluded.length} excluded != ${DENOMINATOR[f.axis]}`,
      );
  }

  if (body !== undefined) {
    for (const item of [...f.covered, ...f.excluded]) {
      if (!body.includes(item.quote))
        fail('quote-is-verbatim', `quote for "${item.id}" is not in the page body`);
    }
  }

  return v;
};

const serviceIdExists = (id: string): boolean => services.some((s) => s.id === id);

/** True when the name is exactly a published name of some AWS service. */
export const isBareServiceName = (name: string): boolean => resolveService(name) !== undefined;

export const checkDataset = (features: Feature[], bodies: Map<string, PageBody>): Violation[] => {
  const v: Feature[] extends never[] ? Violation[] : Violation[] = [];
  const ids = new Set<string>();
  for (const f of features) {
    if (ids.has(f.id)) v.push({ rule: 'unique-feature-id', featureId: f.id, detail: 'duplicated' });
    ids.add(f.id);
    const page = bodies.get(f.sourceUrl);
    if (page && page.sha256 !== f.bodySha256)
      v.push({ rule: 'body-hash-current', featureId: f.id, detail: 'page changed since parsing' });
    v.push(...checkFeature(f, page?.body));
  }
  return v;
};
