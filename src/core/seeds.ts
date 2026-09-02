import path from "node:path";
import { paths } from "./paths.js";
import { readJson } from "./store.js";

/**
 * Everything a human decided, kept as data rather than code. A seed file can be
 * edited, reviewed in a diff, and re-applied on every run. Nothing here is bespoke
 * to a single fix: each file is a lookup the pipeline consults every time.
 */
export type SeedFile<T> = { _comment?: string } & T;

const cache = new Map<string, unknown>();

async function load<T>(name: string, fallback: T): Promise<T> {
  if (cache.has(name)) return cache.get(name) as T;
  const value = (await readJson<T>(path.join(paths.data, "seeds", name))) ?? fallback;
  cache.set(name, value);
  return value;
}

export async function guidePrefixOverrides(): Promise<Record<string, string>> {
  const file = await load<SeedFile<{ overrides: Record<string, string> }>>("guide-prefix-overrides.json", {
    overrides: {},
  });
  return file.overrides;
}

export async function serviceNameOverrides(): Promise<Record<string, string>> {
  const file = await load<SeedFile<{ overrides: Record<string, string> }>>("service-name-overrides.json", {
    overrides: {},
  });
  return file.overrides;
}

export async function targetAliases(): Promise<Record<string, string>> {
  const file = await load<Record<string, string>>("target-aliases.json", {});
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(file)) if (!key.startsWith("_")) out[key] = value;
  return out;
}

export type FeatureAlias = { featureId: string; alias: string; note: string; sourceUrl: string };

export async function featureAliases(): Promise<FeatureAlias[]> {
  const file = await load<SeedFile<{ aliases: FeatureAlias[] }>>("feature-aliases.json", { aliases: [] });
  return file.aliases;
}

export function clearSeedCache(): void {
  cache.clear();
}

export type RecipeRule = { urlPattern: string; serviceId: string; recipes: unknown[]; note?: string };

/** Recipes that apply to any page whose URL matches a pattern. */
export async function recipeRules(): Promise<RecipeRule[]> {
  const file = await load<SeedFile<{ rules: RecipeRule[] }>>("recipes.json", { rules: [] });
  return file.rules;
}

export type AxisKind = {
  kind: "external" | "catalogue";
  label: string;
  /**
   * Name of a closed universe file. When set, the denominator is every member of that
   * universe and a member the page never mentions is unknown — never not-covered.
   * Without it the denominator is only what the page named, so a page listing five
   * Regions would read five of five.
   */
  universe?: string;
};

/** Which axes are real universes and which are a service's own inventory. */
export async function axisKinds(): Promise<Record<string, AxisKind>> {
  const file = await load<SeedFile<{ axes: Record<string, AxisKind> }>>("axes.json", { axes: {} });
  return file.axes;
}

export type HighWaterReset = { recipeId: string; from: number; reason: string; at: string };

/**
 * Deliberate lowerings of a recipe's high-water mark, each with a written reason.
 * The reset fires only while the stored best still equals `from`, so it clears once
 * and the regression guard is live again from the new number.
 */
export async function highWaterResets(): Promise<Map<string, HighWaterReset>> {
  const file = await load<SeedFile<{ resets: HighWaterReset[] }>>("highwater-resets.json", { resets: [] });
  return new Map(file.resets.map((r) => [r.recipeId, r]));
}

export type ExtraFeature = {
  id: string;
  serviceId: string;
  name: string;
  kind: string;
  summary?: string;
  sourceUrl: string;
  quote: string;
};

/** Capabilities a page names that the extractor did not pick up on its own. */
export async function extraFeatures(): Promise<ExtraFeature[]> {
  const file = await load<SeedFile<{ features: ExtraFeature[] }>>("extra-features.json", { features: [] });
  return file.features;
}

/** An axis the blind reader named differently from the map. */
export async function axisSynonyms(): Promise<Record<string, string>> {
  const file = await load<SeedFile<{ synonyms: Record<string, string> }>>("axis-synonyms.json", { synonyms: {} });
  return file.synonyms;
}
