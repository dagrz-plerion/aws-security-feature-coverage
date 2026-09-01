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

export type RecipeRule = { urlPattern: string; serviceId: string; recipe: unknown; note?: string };

/** Recipes that apply to any page whose URL matches a pattern. */
export async function recipeRules(): Promise<RecipeRule[]> {
  const file = await load<SeedFile<{ rules: RecipeRule[] }>>("recipes.json", { rules: [] });
  return file.rules;
}
