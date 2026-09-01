import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { ZodType } from "zod";

/** Recursively sort object keys so re-runs produce byte-identical files. */
export function stableSort<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stableSort) as unknown as T;
  if (value && typeof value === "object" && value.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = stableSort((value as Record<string, unknown>)[key]);
    }
    return out as unknown as T;
  }
  return value;
}

export function serialize(value: unknown): string {
  return JSON.stringify(stableSort(value), null, 2) + "\n";
}

export async function ensureDir(dir: string): Promise<void> {
  await fsp.mkdir(dir, { recursive: true });
}

/** Atomic write. Skips the write when content is unchanged, keeping mtimes stable. */
export async function writeJson(filePath: string, value: unknown): Promise<boolean> {
  const text = serialize(value);
  await ensureDir(path.dirname(filePath));
  try {
    if ((await fsp.readFile(filePath, "utf8")) === text) return false;
  } catch {
    /* file does not exist yet */
  }
  const tmp = `${filePath}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, text, "utf8");
  await fsp.rename(tmp, filePath);
  return true;
}

export async function writeText(filePath: string, text: string): Promise<boolean> {
  await ensureDir(path.dirname(filePath));
  try {
    if ((await fsp.readFile(filePath, "utf8")) === text) return false;
  } catch {
    /* new file */
  }
  const tmp = `${filePath}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, text, "utf8");
  await fsp.rename(tmp, filePath);
  return true;
}

export async function readJson<T>(filePath: string, schema?: ZodType<T>): Promise<T | undefined> {
  let text: string;
  try {
    text = await fsp.readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
  const parsed = JSON.parse(text) as unknown;
  return schema ? schema.parse(parsed) : (parsed as T);
}

export async function readJsonOrThrow<T>(filePath: string, schema?: ZodType<T>): Promise<T> {
  const value = await readJson<T>(filePath, schema);
  if (value === undefined) throw new Error(`missing required data file: ${filePath}`);
  return value;
}

export function existsSync(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export async function listJson(dir: string): Promise<string[]> {
  try {
    const names = await fsp.readdir(dir);
    return names.filter((n) => n.endsWith(".json")).sort();
  } catch {
    return [];
  }
}

/** Read every .json file in a directory. */
export async function readAllJson<T>(dir: string, schema?: ZodType<T>): Promise<T[]> {
  const names = await listJson(dir);
  const out: T[] = [];
  for (const name of names) {
    const value = await readJson<T>(path.join(dir, name), schema);
    if (value !== undefined) out.push(value);
  }
  return out;
}

/**
 * Delete records a run no longer produces. Without this, a renamed or removed
 * entity would linger and quietly pollute later runs.
 */
export async function pruneDir(dir: string, keepFilenames: Set<string>): Promise<string[]> {
  const removed: string[] = [];
  for (const name of await listJson(dir)) {
    if (keepFilenames.has(name)) continue;
    await fsp.rm(path.join(dir, name), { force: true });
    removed.push(name);
  }
  return removed;
}
