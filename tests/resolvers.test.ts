import { describe, expect, it } from "vitest";
import { TargetResolver } from "../src/coverage/resolvers.js";
import type { DataSource, Region, ResourceType, Service } from "../src/core/schema.js";

const evidence = [{ sourceUrl: "https://example.test/x", bodySha256: "a".repeat(64), retrievedAt: "2026-01-01T00:00:00Z", quote: "x" }];

const regions: Region[] = [
  { id: "ap-east-1", longName: "Asia Pacific (Hong Kong)", partition: "aws", seenIn: ["t"], evidence },
  { id: "ap-northeast-1", longName: "Asia Pacific (Tokyo)", partition: "aws", seenIn: ["t"], evidence },
  { id: "ap-southeast-7", longName: "Asia Pacific (Thailand)", partition: "aws", seenIn: ["t"], evidence },
  { id: "us-east-1", longName: "US East (N. Virginia)", partition: "aws", seenIn: ["t"], evidence },
  { id: "sa-east-1", longName: "South America (São Paulo)", partition: "aws", seenIn: ["t"], evidence },
];

const services: Service[] = [
  { id: "s3", names: ["Amazon Simple Storage Service", "Amazon S3"], productName: "Amazon S3", docGuides: [], regions: [], resourceNames: [], seenIn: ["t"], evidence: [] },
  { id: "kms", names: ["AWS Key Management Service (KMS)"], productName: "AWS Key Management Service (KMS)", docGuides: [], regions: [], resourceNames: [], seenIn: ["t"], evidence: [] },
  { id: "ssm", names: ["AWS Systems Manager"], productName: "AWS Systems Manager", docGuides: [], regions: [], resourceNames: [], seenIn: ["t"], evidence: [] },
];

const resourceTypes: ResourceType[] = [
  { id: "AWS::S3::Bucket", serviceId: "s3", cfnTypeName: "AWS::S3::Bucket", arnFormats: [], seenIn: ["t"], evidence: [] },
  { id: "AWS::KMS::Key", serviceId: "kms", cfnTypeName: "AWS::KMS::Key", arnFormats: [], seenIn: ["t"], evidence: [] },
  { id: "ssm:remediation", serviceId: "ssm", serviceReferenceName: "remediation", arnFormats: [], seenIn: ["t"], evidence: [] },
];

const dataSources: DataSource[] = [
  { id: "vpc-flow-logs", name: "VPC Flow Logs", kind: "log", aliases: ["flow logs"], seenIn: ["t"], evidence: [] },
];

const resolver = new TargetResolver({ regions, services, resourceTypes, dataSources });

describe("region resolution", () => {
  it("keeps the city that tells two regions apart", () => {
    expect(resolver.resolve("Asia Pacific (Hong Kong)")?.targetId).toBe("ap-east-1");
    expect(resolver.resolve("Asia Pacific (Tokyo)")?.targetId).toBe("ap-northeast-1");
    expect(resolver.resolve("Asia Pacific (Thailand)")?.targetId).toBe("ap-southeast-7");
  });

  it("accepts a trailing Region word", () => {
    expect(resolver.resolve("Europe (Zurich) Region")).toBeUndefined();
    expect(resolver.resolve("Asia Pacific (Tokyo) Region")?.targetId).toBe("ap-northeast-1");
  });

  it("accepts a region code", () => {
    expect(resolver.resolve("us-east-1")?.targetId).toBe("us-east-1");
  });

  it("handles accented names", () => {
    expect(resolver.resolve("South America (Sao Paulo)")?.targetId).toBe("sa-east-1");
    expect(resolver.resolve("South America (São Paulo)")?.targetId).toBe("sa-east-1");
  });

  it("refuses a region it does not know", () => {
    expect(resolver.resolve("Atlantis (Deep)")).toBeUndefined();
  });
});

describe("resource type resolution", () => {
  it("resolves a CloudFormation type name", () => {
    expect(resolver.resolve("AWS::S3::Bucket")?.targetId).toBe("AWS::S3::Bucket");
  });

  it("resolves a human name", () => {
    expect(resolver.resolve("Amazon S3 buckets", "resourceType")?.targetId).toBe("AWS::S3::Bucket");
    expect(resolver.resolve("Amazon Simple Storage Service buckets", "resourceType")?.targetId).toBe("AWS::S3::Bucket");
  });

  it("does not turn a bare common word into a resource type", () => {
    expect(resolver.resolve("Remediation")).toBeUndefined();
    expect(resolver.resolve("See also")).toBeUndefined();
  });
});

describe("service resolution", () => {
  it("matches with and without a bracketed abbreviation", () => {
    expect(resolver.resolve("AWS Key Management Service (KMS)", "service")?.targetId).toBe("kms");
    expect(resolver.resolve("AWS Key Management Service", "service")?.targetId).toBe("kms");
  });
});

describe("data source resolution", () => {
  it("matches a documented alias", () => {
    expect(resolver.resolve("flow logs", "dataSource")?.targetId).toBe("vpc-flow-logs");
  });
});

describe("column selection", () => {
  it("reports the share of values that resolve", () => {
    const { rate } = resolver.rate(["Asia Pacific (Tokyo)", "US East (N. Virginia)", "Nowhere"], "region");
    expect(rate).toBeCloseTo(2 / 3, 5);
  });
});

describe("phrase tails", () => {
  it("finds the target a heading wraps in prose", () => {
    expect(resolver.resolve("Detecting attack sequences in Amazon S3 buckets", "resourceType")?.targetId).toBe("AWS::S3::Bucket");
    expect(resolver.resolve("How Runtime Monitoring works with Amazon S3 buckets", "resourceType")?.targetId).toBe("AWS::S3::Bucket");
  });

  it("keeps the original wording as the label", () => {
    const hit = resolver.resolve("Encrypting data in Amazon S3 buckets", "resourceType");
    expect(hit?.label).toBe("Encrypting data in Amazon S3 buckets");
  });

  it("does not reach past a short phrase", () => {
    expect(resolver.resolve("in nothing")).toBeUndefined();
  });
});
