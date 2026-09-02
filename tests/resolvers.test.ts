import { describe, expect, it } from "vitest";
import { TargetResolver } from "../src/coverage/resolvers.js";
import { assertsCoverage, isNavigation, neverStatesCoverage } from "../src/coverage/extractors.js";
import { isSubjectOf } from "../src/pipeline/stage5.js";
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
  { id: "ec2", names: ["Amazon Elastic Compute Cloud"], productName: "Amazon EC2", docGuides: [], regions: [], resourceNames: [], seenIn: ["t"], evidence: [] },
  { id: "athena", names: ["Amazon Athena"], productName: "Amazon Athena", docGuides: [], regions: [], resourceNames: [], seenIn: ["t"], evidence: [] },
  {
    id: "budgets", names: ["AWS Budgets"], productName: "AWS Budgets",
    docGuides: [{ title: "AWS Billing User Guide", url: "https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/budgets-managing-costs.html" }],
    regions: [], resourceNames: [], seenIn: ["t"], evidence: [],
  },
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

describe("what is not coverage", () => {
  it("refuses a quota table, however much it looks like a matrix", () => {
    expect(neverStatesCoverage("Verified Access quotas | Name | Default | Adjustable")).toBe(true);
    expect(neverStatesCoverage("Service quotas for AWS WAF")).toBe(true);
    expect(neverStatesCoverage("Pricing for Amazon Macie")).toBe(true);
    expect(neverStatesCoverage("Troubleshooting GuardDuty")).toBe(true);
  });

  it("still accepts a real coverage page", () => {
    expect(neverStatesCoverage("Supported resource types for external access")).toBe(false);
    expect(neverStatesCoverage("Supported operating systems: Amazon EC2 scanning")).toBe(false);
  });

  it("judges the page on its own title, not on the chapter above it", () => {
    // The IAM guide files this page under "Getting started with IAM Access Analyzer".
    expect(neverStatesCoverage("Supported resource types", "IAM Access Analyzer Getting started with IAM Access Analyzer")).toBe(false);
    // A page with nothing to say for itself does inherit the chapter's verdict.
    expect(neverStatesCoverage("Step 3", "Getting started with IAM Access Analyzer")).toBe(true);
  });

  it("requires a page to assert coverage before reading a list", () => {
    expect(assertsCoverage("Supported resource types")).toBe(true);
    // A page about limits is not read generically. Security Hub's regional limits
    // page carries a recipe instead, because a person judged it worth reading.
    expect(assertsCoverage("Regional limits on Security Hub CSPM controls")).toBe(false);
    expect(assertsCoverage("Related information")).toBe(false);
    expect(assertsCoverage("Document history")).toBe(false);
  });

  it("treats a table of contents as navigation", () => {
    expect(isNavigation("See also")).toBe(true);
    expect(isNavigation("Security > Topics")).toBe(true);
    expect(isNavigation("Supported resource types")).toBe(false);
  });
});

describe("which feature a heading is about", () => {
  it("accepts a heading that opens with the feature name", () => {
    expect(isSubjectOf("eks protection", "eks protection")).toBe(true);
    expect(isSubjectOf("malware protection for s3", "malware protection for s3 quotas")).toBe(true);
    expect(isSubjectOf("runtime monitoring", "configuring runtime monitoring")).toBe(true);
  });

  it("refuses a name that is only mentioned in passing", () => {
    // The heading is about dual-stack mode, not about the MySQL engine.
    expect(isSubjectOf("rds for mysql", "dual-stack mode with rds for mysql")).toBe(false);
    expect(isSubjectOf("data encryption", "security > data encryption > using ssl/tls to encrypt a connection")).toBe(false);
  });

  it("refuses a name the heading does not contain", () => {
    expect(isSubjectOf("eks protection", "s3 protection")).toBe(false);
  });
});

describe("one resource, three spellings", () => {
  it("matches the CloudFormation, Resource Explorer and RAM forms to one id", () => {
    expect(resolver.resolve("AWS::S3::Bucket", "resourceType")?.targetId).toBe("AWS::S3::Bucket");
    expect(resolver.resolve("s3:Bucket", "resourceType")?.targetId).toBe("AWS::S3::Bucket");
    expect(resolver.resolve("s3:bucket", "resourceType")?.targetId).toBe("AWS::S3::Bucket");
  });
});

describe("a service named two ways in one cell", () => {
  it("resolves the long name when the short one trails in brackets", () => {
    // "Amazon Elastic Compute Cloud (Amazon EC2)" is how the IAM services table writes
    // it, and neither half was ever tried alone. EC2, EBS, ECR, ECS, EFS and EKS all
    // went unresolved because of it.
    expect(resolver.resolve("Amazon Elastic Compute Cloud (Amazon EC2)", "service")?.targetId).toBe("ec2");
  });

  it("resolves the bracketed short name when the long one is the unknown half", () => {
    expect(resolver.resolve("Elastic Compute Cloud service (Amazon EC2)", "service")?.targetId).toBe("ec2");
  });

  it("still refuses a name no service holds", () => {
    expect(resolver.resolve("Totally Fictional Service (TFS)", "service")).toBeUndefined();
  });
});

describe("a service principal", () => {
  it("names the service exactly", () => {
    expect(resolver.resolve("athena.amazonaws.com", "service")?.targetId).toBe("athena");
  });

  it("does not invent a service for an unknown principal", () => {
    expect(resolver.resolve("cloudoptimization.amazonaws.com", "service")).toBeUndefined();
  });
});

describe("a row that links to its own guide", () => {
  it("resolves by the guide when the name is one we do not hold", () => {
    // "AWS Budget Service" is not a name AWS gives Budgets anywhere in our universe,
    // but the row links to the guide that is.
    expect(resolver.resolve("AWS Budget Service", "service")).toBeUndefined();
    expect(resolver.resolveByDocUrl("https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/budgets-managing-costs.html")).toBe("budgets");
  });

  it("ignores a link that belongs to no guide we hold", () => {
    expect(resolver.resolveByDocUrl("https://docs.aws.amazon.com/nonesuch/latest/guide/x.html")).toBeUndefined();
  });

  it("ignores a link that is not AWS documentation", () => {
    expect(resolver.resolveByDocUrl("https://aws.amazon.com/activate/faq/")).toBeUndefined();
  });
});
