import path from "node:path";
import { paths } from "../core/paths.js";
import { pruneDir, readJson, writeJson } from "../core/store.js";
import { makeEvidence } from "../core/evidence.js";
import { storeSyntheticBody } from "../core/fetch.js";
import { recordGap } from "../core/ops.js";
import { computeSignals } from "./signals.js";
import { fetchSraServices } from "../sources/sra.js";
import { readGuideIndex } from "../sources/guidePages.js";
import type { GuideIndex } from "../sources/guidePages.js";
import { guideKeyFromUrl } from "../sources/docsIndex.js";
import type { Adjudication, Action, Evidence, SecurityTier, Service } from "../core/schema.js";

export const OVERRIDES_FILE = path.join(paths.data, "seeds", "adjudication-overrides.json");

export type Override = {
  serviceId: string;
  tier: SecurityTier;
  reason: string;
  /** Who decided. "manual" is a human; "llm" is model judgement recorded for review. */
  method: "manual" | "llm";
  sourceUrl?: string;
};

export type OverridesFile = { overrides: Override[] };

/** Score bands. Below `candidate` we rule a service out without asking for judgement. */
export const THRESHOLDS = {
  /** At or above this score a service is scanned for named security features. */
  candidate: 3,
  /** At or above this score the service is also queued for human or model judgement. */
  judgement: 5,
};

export type AdjudicationResult = {
  adjudications: Adjudication[];
  pending: Adjudication[];
  counts: Record<string, number>;
};

export async function adjudicateServices(
  services: Service[],
  actions: Action[],
  maxAgeMs?: number,
): Promise<AdjudicationResult> {
  const { services: sraServices, result: sraResult } = await fetchSraServices(maxAgeMs);
  const overrides = (await readJson<OverridesFile>(OVERRIDES_FILE))?.overrides ?? [];
  const overrideById = new Map(overrides.map((o) => [o.serviceId, o]));

  const permissionManagement = new Set(
    actions.filter((a) => a.isPermissionManagement).map((a) => a.serviceId),
  );

  // Join the SRA list onto services by name.
  const sraByServiceId = new Map<string, { domain: string; quote: string }>();
  for (const sra of sraServices) {
    const target = matchByName(sra.name, services);
    if (target) {
      sraByServiceId.set(target.id, { domain: sra.domain, quote: sra.quote });
    } else {
      await recordGap({
        kind: "alias",
        subject: `sra:${sra.name}`,
        detail: `The AWS SRA appendix lists "${sra.name}" but it did not join to any service id.`,
        suggestedStage: "stage3-discovery",
      });
    }
  }

  const guideCache = new Map<string, GuideIndex | undefined>();
  const loadGuides = async (service: Service): Promise<GuideIndex[]> => {
    const out: GuideIndex[] = [];
    for (const guide of service.docGuides) {
      const key = guideKeyFromUrl(guide.url);
      if (!guideCache.has(key)) guideCache.set(key, await readGuideIndex(key));
      const index = guideCache.get(key);
      if (index) out.push(index);
    }
    return out;
  };

  const adjudications: Adjudication[] = [];
  const pending: Adjudication[] = [];
  const decidedAt = new Date().toISOString();

  for (const service of services) {
    const guides = await loadGuides(service);
    const sra = sraByServiceId.get(service.id);
    const { signals, score } = computeSignals({
      service,
      guides,
      hasPermissionManagementActions: permissionManagement.has(service.id),
      ...(sra ? { sraDomain: sra.domain } : {}),
    });

    const evidence: Evidence[] = [];
    if (sra) evidence.push(makeEvidence(sraResult, sra.quote, "AWS SRA appendix"));
    evidence.push(...service.evidence.slice(0, 2));

    const override = overrideById.get(service.id);
    const synthetic = /^(product|regional|doc):/.test(service.id);
    const hasCategory = signals.some((s) => s.id === "products-security-category");
    const strongName = signals.some((s) => s.id === "security-name-strong");

    let tier: SecurityTier;
    let reason: string;
    let method: Adjudication["method"];
    let confidence: number;
    let candidate: boolean;

    if (override) {
      tier = override.tier;
      reason = override.reason;
      method = override.method;
      confidence = override.method === "manual" ? 1 : 0.85;
      candidate = tier !== "not-security";
    } else if (synthetic) {
      // An id we could not join to a real service. Never classified; always surfaced.
      tier = "not-security";
      reason = "This entry did not join to an AWS service id, so it is held for alias review rather than classified.";
      method = "deterministic";
      confidence = 0.2;
      candidate = false;
      await recordGap({
        kind: "alias",
        subject: `unresolved:${service.id}`,
        detail: `"${service.productName ?? service.names[0] ?? service.id}" did not join to a service prefix. Score ${score}, signals ${signals.map((x) => x.id).join(",") || "none"}.`,
        suggestedStage: "stage1-universes",
      });
    } else if (hasCategory) {
      tier = "tier1";
      reason = `AWS files this product under "${service.productCategory}".`;
      method = "deterministic";
      confidence = 1;
      candidate = true;
    } else if (sra && strongName) {
      tier = "tier1";
      reason = `The AWS Security Reference Architecture lists this as a ${sra.domain} service and the name states a security purpose.`;
      method = "deterministic";
      confidence = 0.85;
      candidate = true;
    } else if (sra) {
      tier = "not-security";
      reason = `The AWS Security Reference Architecture lists this under ${sra.domain}, but its primary purpose is not security. Scanning for named security features.`;
      method = "deterministic";
      confidence = 0.5;
      candidate = true;
    } else if (score >= THRESHOLDS.candidate) {
      tier = "not-security";
      reason = `Security signals present (score ${score}: ${signals.map((x) => x.id).join(", ")}). Scanning for a named security feature before any tier is given.`;
      method = "deterministic";
      confidence = 0.4;
      candidate = true;
    } else if (score > 0) {
      tier = "not-security";
      reason = `Weak security signal only (score ${score}: ${signals.map((x) => x.id).join(", ")}). Scanned at low priority.`;
      method = "deterministic";
      confidence = 0.6;
      candidate = true;
    } else {
      tier = "not-security";
      reason = "No security signal of any kind in the name, the IAM actions, or the documentation.";
      method = "deterministic";
      confidence = 0.9;
      candidate = false;
    }

    const record: Adjudication = {
      serviceId: service.id,
      tier,
      candidate,
      ...(synthetic ? { synthetic: true } : {}),
      reason,
      method,
      confidence,
      score,
      signals,
      decidedAt,
      evidence: evidence.slice(0, 4),
    };
    adjudications.push(record);
    if (!override && !synthetic && candidate && tier === "not-security" && score >= THRESHOLDS.judgement) {
      pending.push(record);
    }
  }

  const written = new Set<string>();
  for (const record of adjudications) {
    const filename = `${record.serviceId.replace(/[/:.]/g, "__")}.json`;
    written.add(filename);
    await writeJson(path.join(paths.services, filename), record);
  }
  const pruned = await pruneDir(paths.services, written);

  // The judgement queue. Everything in it is visible, never silently dropped.
  const listing = pending
    .map((p) => `${p.serviceId}\t${p.score}\t${p.signals.map((s) => s.id).join(",")}`)
    .join("\n");
  await storeSyntheticBody(listing);
  await writeJson(path.join(paths.data, "state", "adjudication-pending.json"), {
    generatedAt: decidedAt,
    thresholds: THRESHOLDS,
    count: pending.length,
    pending: pending.map((p) => ({
      serviceId: p.serviceId,
      score: p.score,
      signals: p.signals,
    })),
  });
  if (pending.length > 0) {
    await recordGap({
      kind: "recall",
      subject: "adjudication judgement band",
      detail: `${pending.length} services score at or above ${THRESHOLDS.judgement} without an automatic tier and need judgement. See data/state/adjudication-pending.json.`,
      suggestedStage: "stage3-discovery",
    });
  }

  const counts: Record<string, number> = {
    adjudicated: adjudications.length,
    tier1: adjudications.filter((a) => a.tier === "tier1").length,
    tier2: adjudications.filter((a) => a.tier === "tier2").length,
    candidates: adjudications.filter((a) => a.candidate).length,
    notSecurity: adjudications.filter((a) => a.tier === "not-security" && !a.candidate).length,
    synthetic: adjudications.filter((a) => a.synthetic).length,
    pendingJudgement: pending.length,
    overridesApplied: adjudications.filter((a) => a.method !== "deterministic").length,
    sraMatched: sraByServiceId.size,
    prunedStaleRecords: pruned.length,
  };
  return { adjudications, pending, counts };
}

function matchByName(name: string, services: Service[]): Service | undefined {
  const flat = (value: string): string =>
    value
      .toLowerCase()
      .replace(/^(amazon|aws)\s+/, "")
      .replace(/[^a-z0-9]/g, "");
  const target = flat(name);
  return (
    services.find((s) => s.productName && flat(s.productName) === target) ??
    services.find((s) => s.names.some((n) => flat(n) === target)) ??
    services.find((s) => flat(s.id) === target)
  );
}
