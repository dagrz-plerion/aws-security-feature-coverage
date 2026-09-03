import { describe, expect, it } from 'vitest';
import { checkFeature } from '../src/core/validate.js';
import type { Feature } from '../src/core/types.js';

const BODY = 'Shield Advanced protects Amazon CloudFront distributions and Amazon Route 53 hosted zones. RDS Protection is not supported in Asia Pacific (Taipei).';

const base = (over: Partial<Feature> = {}): Feature => ({
  id: 'shield/protected-resource-types',
  name: 'AWS Shield Advanced resource protection',
  serviceId: 'shield',
  scope: 'feature',
  whatIsCounted: 'AWS resource types Shield Advanced can protect',
  axis: 'resourceType',
  derivation: 'enumerated',
  covered: [
    {
      id: 'AWS::CloudFront::Distribution',
      label: 'Amazon CloudFront distributions',
      status: 'full',
      quote: 'Amazon CloudFront distributions',
    },
  ],
  excluded: [],
  unresolved: [],
  sourceUrl: 'https://example.invalid/page.md',
  bodySha256: 'x',
  parserId: 'shield-ddos-by-resource-type',
  notes: [],
  ...over,
});

const rules = (f: Feature, body = BODY) => checkFeature(f, body).map((x) => x.rule);

describe('checkFeature', () => {
  it('passes a clean feature', () => {
    expect(rules(base())).toEqual([]);
  });

  it('rejects a zero count', () => {
    expect(rules(base({ covered: [] }))).toContain('no-zero-count');
  });

  it('rejects an item that is not on the axis', () => {
    const f = base({
      covered: [{ id: 'ec2', label: 'Amazon EC2', status: 'full', quote: 'Amazon CloudFront' }],
    });
    expect(rules(f)).toContain('id-in-universe');
  });

  it('rejects double counting', () => {
    const item = base().covered[0]!;
    expect(rules(base({ covered: [item, { ...item }] }))).toContain('no-double-count');
  });

  it('rejects an item that is both covered and excluded', () => {
    const item = base().covered[0]!;
    expect(rules(base({ excluded: [item] }))).toContain('no-contradiction');
  });

  it('rejects a quote that is not in the page', () => {
    const f = base({
      covered: [
        {
          id: 'AWS::CloudFront::Distribution',
          label: 'CloudFront',
          status: 'full',
          quote: 'a sentence the page never contained',
        },
      ],
    });
    expect(rules(f)).toContain('quote-is-verbatim');
  });

  it('rejects partial coverage with no note', () => {
    const f = base({
      covered: [
        {
          id: 'AWS::CloudFront::Distribution',
          label: 'CloudFront',
          status: 'partial',
          quote: 'Amazon CloudFront distributions',
        },
      ],
    });
    expect(rules(f)).toContain('partial-needs-note');
  });

  it('rejects a bare service name for a sub-feature', () => {
    expect(rules(base({ name: 'AWS Shield', scope: 'feature' }))).toContain('name-precision');
  });

  it('rejects whatIsCounted that never names the axis', () => {
    expect(rules(base({ whatIsCounted: 'things Shield protects' }))).toContain(
      'says-what-is-counted',
    );
  });

  it('rejects exclusion-derived coverage outside the region axis', () => {
    const f = base({
      derivation: 'universe-minus-exclusions',
      excluded: [
        { id: 'AWS::S3::Bucket', label: 'buckets', status: 'full', quote: 'Shield Advanced' },
      ],
    });
    expect(rules(f)).toContain('derivation-region-only');
  });

  it('rejects exclusion-derived coverage that does not add up to the universe', () => {
    const f = base({
      axis: 'region',
      whatIsCounted: 'AWS Regions where RDS Protection runs',
      derivation: 'universe-minus-exclusions',
      covered: [
        { id: 'us-east-1', label: 'US East (N. Virginia)', status: 'full', quote: 'Shield Advanced' },
      ],
      excluded: [
        {
          id: 'ap-east-2',
          label: 'Asia Pacific (Taipei)',
          status: 'full',
          quote: 'RDS Protection is not supported in Asia Pacific (Taipei).',
        },
      ],
    });
    expect(rules(f)).toContain('derivation-adds-up');
  });

  it('rejects an unknown service id', () => {
    expect(rules(base({ serviceId: 'not-a-service' }))).toContain('service-exists');
  });
});
