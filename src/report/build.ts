import path from "node:path";
import { paths } from "../core/paths.js";
import { writeJson, writeText } from "../core/store.js";
import { loadReportData } from "./data.js";
import type { ReportData } from "./data.js";
import { renderPage } from "./template.js";

/** Compact view of the dataset for the browser. Full records stay in data/. */
export function toBrowserModel(data: ReportData) {
  const catalogueAxes = new Set(
    Object.entries(data.axisKinds).filter(([, v]) => v.kind === "catalogue").map(([k]) => k),
  );
  // Denominators come from the universe, not from how many rows a page happened to
  // list. A feature that documents 12 regions covers 12 of 46, not 12 of 12.
  const universeSizes: Record<string, number> = {
    region: data.regions.length,
    partition: data.partitions.length,
    service: data.services.filter((s) => !s.id.includes(":")).length,
    resourceType: data.resourceTypes.length,
    dataSource: data.dataSources.length,
  };
  // An open axis is as big as the catalog AWS publishes for it.
  for (const open of data.openAxes) universeSizes[open.axis] = open.count;

  const coverageByFeature = new Map(data.coverage.map((c) => [c.featureId, c]));
  const adjudicationById = new Map(data.adjudications.map((a) => [a.serviceId, a]));
  const serviceById = new Map(data.services.map((s) => [s.id, s]));

  const inScope = data.adjudications.filter((a) => a.tier !== "not-security");

  const features = data.features.map((feature) => {
    const coverage = coverageByFeature.get(feature.id);
    const claims = coverage?.claims ?? [];
    // Counted per distinct target. A control excluded in forty Regions is one
    // control with forty regional exclusions, not forty controls.
    const perAxis = new Map<string, Map<string, Set<string>>>();
    const scoped: Record<string, number> = {};
    for (const claim of claims) {
      if (claim.scope) scoped[claim.axis] = (scoped[claim.axis] ?? 0) + 1;
      const axis = perAxis.get(claim.axis) ?? new Map<string, Set<string>>();
      const bucket = axis.get(claim.status) ?? new Set<string>();
      bucket.add(claim.targetId);
      axis.set(claim.status, bucket);
      perAxis.set(claim.axis, axis);
    }
    const byAxis: Record<string, { covered: number; notCovered: number; partial: number; unknown: number; total: number; scoped: number; count?: number }> = {};
    for (const [axis, statuses] of perAxis) {
      const all = new Set<string>();
      for (const set of statuses.values()) for (const value of set) all.add(value);
      // A catalogue is an inventory, not a measurement. Security Hub publishes 591
      // controls; how many are available where is a fact about each control, and each
      // control would have to be its own row to state it. We are not doing that, so we
      // do not report a covered/not-covered split we cannot stand behind.
      if (catalogueAxes.has(axis)) {
        byAxis[axis] = { covered: 0, notCovered: 0, partial: 0, unknown: 0, total: all.size, scoped: 0, count: all.size };
        continue;
      }
      const covered = statuses.get("covered")?.size ?? 0;
      const notCovered = statuses.get("not-covered")?.size ?? 0;
      const partial = statuses.get("partial")?.size ?? 0;
      const stated = statuses.get("unknown")?.size ?? 0;
      const universe = universeSizes[axis];
      const total = universe && universe > all.size ? universe : all.size;
      byAxis[axis] = {
        covered,
        notCovered,
        partial,
        unknown: stated + (total - all.size),
        total,
        scoped: scoped[axis] ?? 0,
      };
    }
    const targets: Record<string, string[]> = {};
    for (const claim of claims) {
      const list = (targets[claim.axis] ??= []);
      if (!list.includes(claim.targetId)) list.push(claim.targetId);
    }
    return {
      id: feature.id,
      serviceId: feature.serviceId,
      serviceName: serviceById.get(feature.serviceId)?.productName ?? feature.serviceId,
      name: feature.name,
      kind: feature.kind,
      tier: feature.tier,
      summary: (feature.summary ?? "").slice(0, 180),
      method: feature.method,
      confidence: feature.confidence,
      discoveredBy: feature.discoveredBy,
      docUrls: feature.docUrls.slice(0, 3),
      axes: byAxis,
      targets,
      claimCount: claims.length,
      llmClaims: claims.filter((c) => c.method === "llm").length,
      unresolved: coverage?.unresolvedTargets.length ?? 0,
    };
  });

  const services = inScope.map((adj) => {
    const service = serviceById.get(adj.serviceId);
    const own = features.filter((f) => f.serviceId === adj.serviceId);
    return {
      id: adj.serviceId,
      name: service?.productName ?? service?.names[0] ?? adj.serviceId,
      tier: adj.tier,
      reason: adj.reason,
      method: adj.method,
      confidence: adj.confidence,
      score: adj.score,
      signals: adj.signals.map((s) => s.id),
      category: service?.productCategory ?? "",
      regions: service?.regions.length ?? 0,
      // A service with no Region evidence anywhere is unknown, not absent. Rendering
      // it as "0 / 46" says it runs nowhere, which is never what the sources mean.
      global: service?.global ?? false,
      regionsKnown: (service?.regions.length ?? 0) > 0 || (service?.global ?? false),
      actionCount: service?.actionCount ?? 0,
      docGuides: service?.docGuides.slice(0, 4) ?? [],
      featureCount: own.length,
      claimCount: own.reduce((sum, f) => sum + f.claimCount, 0),
    };
  });


  return {
    generatedAt: data.generatedAt,
    manifest: data.manifest ?? null,
    universeSizes,
    universes: {
      regions: data.regions.length,
      partitions: data.partitions.length,
      services: data.services.length,
      resourceTypes: data.resourceTypes.length,
      dataSources: data.dataSources.length,
      adjudicated: data.adjudications.length,
    },
    regions: data.regions.map((r) => ({ id: r.id, name: r.longName ?? r.id, partition: r.partition, seenIn: r.seenIn })),
    services,
    outOfScope: data.adjudications
      .filter((a) => a.tier === "not-security")
      .map((a) => ({ id: a.serviceId, reason: a.reason, score: a.score, method: a.method })),
    features,
    sources: data.sources,
    axisKinds: data.axisKinds,
    gaps: data.gaps.map((g) => ({ id: g.id, kind: g.kind, subject: g.subject, detail: g.detail, stage: g.suggestedStage })),
    quarantine: data.quarantine.map((q) => ({
      id: q.id,
      stage: q.stage,
      subject: q.subject,
      reason: q.reason,
      sourceUrl: q.sourceUrl ?? "",
    })),
    conflicts: data.conflicts.map((c) => ({
      id: c.id,
      featureId: c.featureId,
      axis: c.axis,
      targetId: c.targetId,
      statuses: c.claims.map((x) => `${x.status} (${x.extractorId})`),
      sources: c.claims.flatMap((x) => x.evidence.map((e) => e.sourceUrl)),
    })),
  };
}

/**
 * Evidence is two thirds of the payload and is only read when a row is opened, so
 * it is served separately. The page stays small and still cites every claim.
 */
export function buildDetail(data: ReportData) {
  const detail: Record<string, unknown> = {};
  for (const feature of data.features) {
    detail[feature.id] = { evidence: feature.evidence.slice(0, 4), docUrls: feature.docUrls };
  }
  for (const adjudication of data.adjudications) {
    if (adjudication.tier === "not-security" && !adjudication.candidate) continue;
    detail[`service:${adjudication.serviceId}`] = { evidence: adjudication.evidence.slice(0, 3) };
  }
  // A scoped record can hold twenty thousand claims — every Config rule in every
  // Region. Sending them all made the detail file 59 MB. One claim per distinct
  // target is enough to show what a feature covers and what it cites.
  const PER_FEATURE = 400;
  for (const coverage of data.coverage) {
    const seen = new Set<string>();
    const shown: typeof coverage.claims = [];
    for (const claim of coverage.claims) {
      const key = `${claim.axis}|${claim.targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      shown.push(claim);
      if (shown.length >= PER_FEATURE) break;
    }
    detail[`coverage:${coverage.featureId}`] = {
      total: coverage.claims.length,
      shown: shown.length,
      claims: shown.map((c) => ({
        axis: c.axis, targetId: c.targetId, targetLabel: c.targetLabel, status: c.status,
        ...(c.scope ? { scope: c.scope } : {}),
        qualifier: c.qualifier ?? "", extractorId: c.extractorId, method: c.method,
        evidence: c.evidence.slice(0, 1),
      })),
      unresolved: coverage.unresolvedTargets.slice(0, 40),
    };
  }
  return detail;
}

export async function buildReport(): Promise<{ features: number; services: number; file: string }> {
  const data = await loadReportData();
  const model = toBrowserModel(data);
  await writeJson(path.join(paths.data, "index.json"), model);
  await writeJson(path.join(paths.docs, "data.json"), model);
  await writeJson(path.join(paths.docs, "detail.json"), buildDetail(data));
  const file = path.join(paths.docs, "index.html");
  await writeText(file, renderPage(model));
  return { features: model.features.length, services: model.services.length, file };
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const result = await buildReport();
  console.log(`report written: ${result.file} (${result.services} services, ${result.features} features)`);
}
