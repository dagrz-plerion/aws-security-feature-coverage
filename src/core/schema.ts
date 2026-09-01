import { z } from "zod";

export const evidenceSchema = z.object({
  sourceUrl: z.string().url(),
  bodySha256: z.string().regex(/^[0-9a-f]{64}$/),
  retrievedAt: z.string(),
  /** Must appear verbatim in the cached body. Enforced by tests/validate. */
  quote: z.string().min(1),
  locator: z.string().optional(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const sourceRefSchema = z.object({
  sourceId: z.string(),
  sourceUrl: z.string(),
  bodySha256: z.string().optional(),
  retrievedAt: z.string().optional(),
});
export type SourceRef = z.infer<typeof sourceRefSchema>;

/* ------------------------------------------------------------------ universes */

export const partitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  dnsSuffix: z.string(),
  regionRegex: z.string(),
  regions: z.array(z.string()),
  evidence: z.array(evidenceSchema).min(1),
});
export type Partition = z.infer<typeof partitionSchema>;

export const regionSchema = z.object({
  id: z.string(),
  longName: z.string().optional(),
  partition: z.string(),
  geolocationCountry: z.string().optional(),
  geolocationRegion: z.string().optional(),
  domain: z.string().optional(),
  seenIn: z.array(z.string()).min(1),
  evidence: z.array(evidenceSchema).min(1),
});
export type Region = z.infer<typeof regionSchema>;

export const serviceSchema = z.object({
  /** IAM service prefix where one exists, otherwise a slug. */
  id: z.string(),
  names: z.array(z.string()),
  iamPrefix: z.string().optional(),
  productName: z.string().optional(),
  productCategory: z.string().optional(),
  productUrl: z.string().optional(),
  docGuides: z.array(
    z.object({ title: z.string(), url: z.string(), llmsTxt: z.string().optional(), description: z.string().optional() }),
  ),
  regionalTableId: z.string().optional(),
  regions: z.array(z.string()),
  actionCount: z.number().int().optional(),
  resourceNames: z.array(z.string()),
  seenIn: z.array(z.string()).min(1),
  evidence: z.array(evidenceSchema),
});
export type Service = z.infer<typeof serviceSchema>;

export const resourceTypeSchema = z.object({
  /** Canonical id: the CloudFormation type name when known, otherwise service:type. */
  id: z.string(),
  serviceId: z.string().optional(),
  cfnTypeName: z.string().optional(),
  resourceExplorerType: z.string().optional(),
  serviceReferenceName: z.string().optional(),
  arnFormats: z.array(z.string()),
  description: z.string().optional(),
  seenIn: z.array(z.string()).min(1),
  evidence: z.array(evidenceSchema),
});
export type ResourceType = z.infer<typeof resourceTypeSchema>;

export const actionSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  name: z.string(),
  isWrite: z.boolean().optional(),
  isList: z.boolean().optional(),
  isPermissionManagement: z.boolean().optional(),
  isTaggingOnly: z.boolean().optional(),
  resources: z.array(z.string()),
});
export type Action = z.infer<typeof actionSchema>;

export const dataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["log", "telemetry", "agent", "snapshot", "content", "platform", "ecosystem", "api", "other"]),
  aliases: z.array(z.string()),
  description: z.string().optional(),
  seenIn: z.array(z.string()).min(1),
  evidence: z.array(evidenceSchema),
});
export type DataSource = z.infer<typeof dataSourceSchema>;

/* ------------------------------------------------------------------ discovery */

export const securityTier = z.enum(["tier1", "tier2", "not-security"]);
export type SecurityTier = z.infer<typeof securityTier>;

export const signalSchema = z.object({
  id: z.string(),
  weight: z.number(),
  detail: z.string(),
  evidence: z.array(evidenceSchema).optional(),
});
export type Signal = z.infer<typeof signalSchema>;

export const adjudicationSchema = z.object({
  serviceId: z.string(),
  tier: securityTier,
  /** True when the service must be scanned for named security features in stage 4. */
  candidate: z.boolean(),
  /** Set by stage 4 when a named security feature is actually found. */
  promoted: z.boolean().optional(),
  synthetic: z.boolean().optional(),
  reason: z.string().min(1),
  method: z.enum(["deterministic", "llm", "manual"]),
  confidence: z.number().min(0).max(1),
  score: z.number(),
  signals: z.array(signalSchema),
  decidedAt: z.string(),
  evidence: z.array(evidenceSchema),
});
export type Adjudication = z.infer<typeof adjudicationSchema>;

/* ------------------------------------------------------------------ features */

export const featureKind = z.enum([
  "protection-plan",
  "detection-capability",
  "analyzer",
  "control-set",
  "policy-type",
  "encryption",
  "logging",
  "network-control",
  "identity-control",
  "integration",
  "configuration",
  "scan-type",
  "response",
  "other",
]);

export const featureSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  kind: featureKind,
  tier: securityTier,
  summary: z.string().optional(),
  docUrls: z.array(z.string()),
  method: z.enum(["deterministic", "llm", "manual"]),
  confidence: z.number().min(0).max(1),
  discoveredBy: z.array(z.string()).min(1),
  evidence: z.array(evidenceSchema).min(1),
});
export type Feature = z.infer<typeof featureSchema>;

/* ------------------------------------------------------------------ coverage */

export const coverageStatus = z.enum(["covered", "not-covered", "partial", "unknown"]);
export type CoverageStatus = z.infer<typeof coverageStatus>;

export const claimSchema = z.object({
  id: z.string(),
  featureId: z.string(),
  axis: z.string(),
  targetId: z.string(),
  targetLabel: z.string().optional(),
  status: coverageStatus,
  qualifier: z.string().optional(),
  method: z.enum(["deterministic", "llm", "manual"]),
  extractorId: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceSchema).min(1),
});
export type CoverageClaim = z.infer<typeof claimSchema>;

export const featureCoverageSchema = z.object({
  featureId: z.string(),
  serviceId: z.string(),
  axes: z.array(z.string()),
  claims: z.array(claimSchema),
  unresolvedTargets: z.array(z.object({ axis: z.string(), raw: z.string(), sourceUrl: z.string() })),
  generatedAt: z.string(),
});
export type FeatureCoverage = z.infer<typeof featureCoverageSchema>;

export const axisSchema = z.object({
  id: z.string(),
  name: z.string(),
  universe: z.enum(["region", "partition", "service", "resourceType", "dataSource", "action", "open"]),
  description: z.string(),
  status: z.enum(["active", "proposed"]),
  evidence: z.array(evidenceSchema).optional(),
});
export type Axis = z.infer<typeof axisSchema>;

/* ------------------------------------------------------------------ operations */

export const quarantineSchema = z.object({
  id: z.string(),
  stage: z.string(),
  subject: z.string(),
  sourceUrl: z.string().optional(),
  bodySha256: z.string().optional(),
  extractorId: z.string().optional(),
  reason: z.string(),
  detail: z.string().optional(),
  createdAt: z.string(),
  resolved: z.boolean(),
});
export type QuarantineItem = z.infer<typeof quarantineSchema>;

export const gapSchema = z.object({
  id: z.string(),
  kind: z.enum(["parser", "challenge", "recall", "axis", "alias"]),
  subject: z.string(),
  detail: z.string(),
  suggestedStage: z.string(),
  createdAt: z.string(),
  resolved: z.boolean(),
});
export type Gap = z.infer<typeof gapSchema>;

export const conflictSchema = z.object({
  id: z.string(),
  featureId: z.string(),
  axis: z.string(),
  targetId: z.string(),
  claims: z.array(claimSchema),
  detectedAt: z.string(),
});
export type Conflict = z.infer<typeof conflictSchema>;

export const runManifestSchema = z.object({
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  stages: z.array(
    z.object({
      id: z.string(),
      status: z.enum(["ok", "partial", "failed", "skipped"]),
      startedAt: z.string(),
      finishedAt: z.string(),
      counts: z.record(z.number()).optional(),
      notes: z.array(z.string()).optional(),
    }),
  ),
  fetch: z.record(z.number()).optional(),
});
export type RunManifest = z.infer<typeof runManifestSchema>;
