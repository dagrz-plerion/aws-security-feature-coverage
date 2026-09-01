import path from "node:path";
import { paths } from "../core/paths.js";
import { writeJson } from "../core/store.js";
import { storeSyntheticBody } from "../core/fetch.js";
import type { DataSource } from "../core/schema.js";

/**
 * Signal inputs a security feature can read. Seeded here because no AWS list
 * enumerates them; extended by Stage 4 whenever a document names a new one.
 */
const SEED: { id: string; name: string; kind: DataSource["kind"]; aliases: string[] }[] = [
  { id: "cloudtrail-management-events", name: "CloudTrail management events", kind: "log", aliases: ["cloudtrail management event logs", "aws cloudtrail management events"] },
  { id: "cloudtrail-data-events", name: "CloudTrail data events", kind: "log", aliases: ["cloudtrail s3 data event logs", "s3 data events", "data events"] },
  { id: "cloudtrail-network-activity-events", name: "CloudTrail network activity events", kind: "log", aliases: ["network activity events"] },
  { id: "vpc-flow-logs", name: "VPC Flow Logs", kind: "log", aliases: ["vpc flow logs", "flow logs"] },
  { id: "dns-logs", name: "Route 53 Resolver DNS query logs", kind: "log", aliases: ["dns logs", "dns query logs", "resolver query logs"] },
  { id: "eks-audit-logs", name: "EKS audit logs", kind: "log", aliases: ["kubernetes audit logs", "eks audit logs"] },
  { id: "rds-login-events", name: "RDS login activity", kind: "log", aliases: ["rds login events", "rds login activity monitoring"] },
  { id: "lambda-network-logs", name: "Lambda network activity logs", kind: "log", aliases: ["lambda network logs", "lambda network activity monitoring"] },
  { id: "s3-object-contents", name: "S3 object contents", kind: "content", aliases: ["s3 objects", "objects in s3 buckets"] },
  { id: "ebs-volume-data", name: "EBS volume data", kind: "snapshot", aliases: ["ebs volumes", "ebs volume data", "ebs snapshots"] },
  { id: "runtime-agent-ec2", name: "Runtime agent on EC2", kind: "agent", aliases: ["ec2 runtime monitoring", "guardduty agent for ec2"] },
  { id: "runtime-agent-eks", name: "Runtime agent on EKS", kind: "agent", aliases: ["eks runtime monitoring", "eks add-on agent"] },
  { id: "runtime-agent-ecs", name: "Runtime agent on ECS and Fargate", kind: "agent", aliases: ["ecs runtime monitoring", "fargate runtime monitoring"] },
  { id: "ssm-agent", name: "SSM Agent inventory", kind: "agent", aliases: ["systems manager agent", "ssm agent"] },
  { id: "container-image-layers", name: "Container image layers", kind: "content", aliases: ["ecr images", "container images"] },
  { id: "lambda-code", name: "Lambda function code", kind: "content", aliases: ["lambda code scanning", "function code"] },
  { id: "config-configuration-items", name: "Config configuration items", kind: "telemetry", aliases: ["configuration items", "config recorder"] },
  { id: "resource-policies", name: "Resource-based policies", kind: "api", aliases: ["resource based policies", "resource policies"] },
  { id: "identity-policies", name: "Identity policies", kind: "api", aliases: ["iam policies", "identity based policies"] },
  { id: "network-traffic", name: "In-line network traffic", kind: "telemetry", aliases: ["network traffic", "packet inspection"] },
  { id: "http-requests", name: "HTTP requests at the edge", kind: "telemetry", aliases: ["web requests", "http requests"] },
  { id: "os-package-inventory", name: "Operating system package inventory", kind: "platform", aliases: ["operating system packages", "os packages"] },
  { id: "application-package-inventory", name: "Application dependency inventory", kind: "ecosystem", aliases: ["programming language packages", "application packages"] },
];

export async function buildDataSourceUniverse(): Promise<DataSource[]> {
  const listing = SEED.map((s) => `${s.id}\t${s.name}`).join("\n");
  const bodySha = await storeSyntheticBody(listing);
  const retrievedAt = new Date().toISOString();
  const dataSources: DataSource[] = SEED.map((seed) => ({
    ...seed,
    seenIn: ["seed"],
    evidence: [
      {
        sourceUrl: "https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_data-sources.html",
        bodySha256: bodySha,
        retrievedAt,
        quote: `${seed.id}\t${seed.name}`,
        locator: "seed list, extended by Stage 4",
      },
    ],
  }));
  await writeJson(path.join(paths.universes, "data-sources.json"), {
    generatedAt: new Date().toISOString(),
    count: dataSources.length,
    dataSources,
  });
  return dataSources;
}
