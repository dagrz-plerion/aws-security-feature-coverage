import { slug } from "../core/ids.js";
import type { FeatureCandidate } from "./extract.js";
import type { Feature, SecurityTier } from "../core/schema.js";

/** Sources ranked by how much we trust the name they produce. */
const SOURCE_RANK: Record<string, number> = {
  "api-enum": 4,
  "api-toggle": 3,
  "guide-chapter": 3,
  "guide-subchapter": 3,
  "security-chapter": 2,
  "attributed-page": 2,
  "named-control": 1,
  "product-directory": 1,
};

function mergeKey(name: string): string {
  return slug(
    name
      .toLowerCase()
      .replace(/\b(amazon|aws|the|a|an|of|for|in|with|your|using)\b/g, " ")
      .replace(/\b(plans?|types?|settings?|options?|features?)\b/g, " ")
      .replace(/s\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim(),
  );
}

/**
 * Collapse candidates that name the same capability. Two candidates merge when
 * their normalised names match; the best-ranked source supplies the display name.
 */
export function mergeCandidates(candidates: FeatureCandidate[], tier: SecurityTier): Feature[] {
  const groups = new Map<string, FeatureCandidate[]>();
  for (const candidate of candidates) {
    const normalised = mergeKey(candidate.name);
    if (!normalised) continue;
    const key = `${candidate.serviceId}::${normalised}`;
    const group = groups.get(key);
    if (group) group.push(candidate);
    else groups.set(key, [candidate]);
  }

  const features: Feature[] = [];
  for (const group of groups.values()) {
    const ranked = group.slice().sort((a, b) => (SOURCE_RANK[b.discoveredBy] ?? 0) - (SOURCE_RANK[a.discoveredBy] ?? 0));
    const best = ranked[0] as FeatureCandidate;
    const evidence = dedupeEvidence(group.flatMap((c) => c.evidence));
    if (evidence.length === 0) continue; // no evidence, no feature
    const discoveredBy = [...new Set(group.map((c) => c.discoveredBy))].sort();
    const aliases = [...new Set(group.flatMap((c) => [c.name, ...c.aliases]).filter((n) => n !== best.name))].sort();
    features.push({
      id: best.id,
      serviceId: best.serviceId,
      name: best.name,
      aliases,
      kind: best.kind,
      tier,
      ...(group.find((c) => c.summary)?.summary ? { summary: group.find((c) => c.summary)?.summary as string } : {}),
      docUrls: [...new Set(group.flatMap((c) => c.docUrls))].sort(),
      method: "deterministic",
      confidence: confidenceFor(discoveredBy),
      discoveredBy,
      evidence: evidence.slice(0, 5),
    });
  }
  return foldSiblingsIntoParent(features).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * A guide gives one capability a page per aspect: "Runtime Monitoring", then
 * "Runtime Monitoring issues", "Runtime Monitoring finding types". Only the first is
 * a feature; the rest describe it. They fold in as aliases so the words stay
 * searchable without pretending to be separate capabilities.
 */
const ASPECT_SUFFIX =
  /^(quotas?|limits?|limitations?|issues?|errors?|finding types?|considerations?|prerequisites?|configuration|settings?|status|troubleshooting|examples?|reference|concepts?|overview|faq|best practices|architecture|permissions?)$/i;

export function foldSiblingsIntoParent(features: Feature[]): Feature[] {
  const byService = new Map<string, Feature[]>();
  for (const feature of features) {
    const list = byService.get(feature.serviceId);
    if (list) list.push(feature);
    else byService.set(feature.serviceId, [feature]);
  }
  const dropped = new Set<string>();
  for (const list of byService.values()) {
    const sorted = list.slice().sort((a, b) => a.name.length - b.name.length);
    for (const child of sorted) {
      if (dropped.has(child.id)) continue;
      for (const parent of sorted) {
        if (parent.id === child.id || dropped.has(parent.id)) continue;
        const parentName = parent.name.toLowerCase();
        const childName = child.name.toLowerCase();
        if (parentName.length >= childName.length) continue;
        if (!childName.startsWith(`${parentName} `)) continue;
        const remainder = childName.slice(parentName.length).trim();
        if (!ASPECT_SUFFIX.test(remainder)) continue;
        parent.aliases = [...new Set([...parent.aliases, child.name])].sort();
        parent.docUrls = [...new Set([...parent.docUrls, ...child.docUrls])].sort();
        dropped.add(child.id);
        break;
      }
    }
  }
  return features.filter((f) => !dropped.has(f.id));
}

function confidenceFor(sources: string[]): number {
  if (sources.includes("api-enum")) return 0.95;
  if (sources.includes("guide-chapter")) return 0.85;
  if (sources.length > 1) return 0.75;
  if (sources.includes("security-chapter")) return 0.7;
  return 0.6;
}

function dedupeEvidence(list: Feature["evidence"]): Feature["evidence"] {
  const seen = new Set<string>();
  const out: Feature["evidence"] = [];
  for (const item of list) {
    const key = `${item.bodySha256}|${item.quote}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
