import { describe, expect, it } from 'vitest';
import {
  DENOMINATOR,
  resolveRegion,
  resolveResourceType,
  resolveService,
  serviceCandidates,
} from '../src/core/universe.js';

describe('denominators are the full universe', () => {
  it('matches the source files', () => {
    expect(DENOMINATOR.region).toBe(46);
    expect(DENOMINATOR.service).toBe(692);
    expect(DENOMINATOR.resourceType).toBe(3160);
  });
});

describe('resolveRegion', () => {
  it.each([
    ['us-east-1', 'us-east-1'],
    ['US East (N. Virginia)', 'us-east-1'],
    ['US East (Ohio)', 'us-east-2'],
    ['Asia Pacific (Taipei) (`ap-east-2`)', 'ap-east-2'],
    ['AWS GovCloud (US-West)', 'us-gov-west-1'],
    ['Africa (Cape Town)', 'af-south-1'],
  ])('resolves %s', (label, id) => {
    expect(resolveRegion(label)?.id).toBe(id);
  });

  it.each([
    'AWS Dedicated Local Zones',
    'the aws partition',
    'Local Zones',
    'all Regions',
  ])('refuses %s, which is not a Region', (label) => {
    expect(resolveRegion(label)).toBeUndefined();
  });
});

describe('resolveService', () => {
  it.each([
    ['Amazon EC2', 'ec2'],
    ['AWS Lambda', 'lambda'],
    ['ec2.amazonaws.com', 'ec2'],
    ['rds.us-west-2.amazonaws.com', 'rds'],
    ['Amazon Simple Storage Service', 's3'],
  ])('resolves %s', (label, id) => {
    expect(resolveService(label)?.id).toBe(id);
  });

  it.each(['kms:ViaService', 'Encrypt', 'a KMS key', 'condition key'])(
    'refuses %s, which is not a service',
    (label) => {
      expect(resolveService(label)).toBeUndefined();
    },
  );
});

describe('resolveResourceType', () => {
  it.each([
    ['AWS::EC2::Instance', 'AWS::EC2::Instance'],
    ['ec2:instance', 'AWS::EC2::Instance'],
    ['AWS::S3::Bucket', 'AWS::S3::Bucket'],
  ])('resolves %s', (label, id) => {
    expect(resolveResourceType(label)?.id).toBe(id);
  });

  it.each(['Amazon EC2', 'CloudFront distributions and more'])(
    'refuses %s, which is not a resource type',
    (label) => {
      expect(resolveResourceType(label)).toBeUndefined();
    },
  );
});

describe('resolveService ambiguity', () => {
  it('prefers a real IAM service over a catalogue entry with the same name', () => {
    expect(resolveService('Amazon Aurora')?.id).toBe('rds');
    expect(resolveService('Amazon Data Firehose')?.id).toBe('firehose');
    expect(resolveService('AWS Elemental MediaConnect')?.id).toBe('mediaconnect');
  });

  it('refuses a name two real services both publish', () => {
    expect(resolveService('AWS CloudHSM')).toBeUndefined();
    expect(resolveService('Amazon Cognito')).toBeUndefined();
    expect(resolveService('Amazon Inspector')).toBeUndefined();
  });

  it('reports what an ambiguous name could have meant', () => {
    expect(serviceCandidates('AWS CloudHSM').map((s) => s.id).sort()).toEqual([
      'cloudhsm',
      'cloudhsmv2',
    ]);
  });
});

describe('resolveService never returns a catalogue row', () => {
  it('refuses a product name that has no IAM service behind it', () => {
    expect(resolveService('AWS App2Container')).toBeUndefined();
    expect(resolveService('Amazon Lookout for Metrics')).toBeUndefined();
  });

  it('still resolves the same name when a real IAM service publishes it', () => {
    expect(resolveService('Amazon Aurora')?.id).toBe('rds');
  });
});
