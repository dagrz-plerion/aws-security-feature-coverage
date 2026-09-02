import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DATA = path.join(ROOT, "data");
export const DOCS = path.join(ROOT, "docs");

export const paths = {
  root: ROOT,
  data: DATA,
  cache: path.join(DATA, "cache"),
  raw: path.join(DATA, "raw"),
  universes: path.join(DATA, "universes"),
  services: path.join(DATA, "services"),
  features: path.join(DATA, "features"),
  coverage: path.join(DATA, "coverage"),
  axes: path.join(DATA, "axes"),
  quarantine: path.join(DATA, "quarantine"),
  conflicts: path.join(DATA, "conflicts"),
  gaps: path.join(DATA, "gaps"),
  history: path.join(DATA, "history"),
  state: path.join(DATA, "state"),
  expectations: path.join(DATA, "expectations"),
  docs: DOCS,
};

export function dataPath(...parts: string[]): string {
  return path.join(DATA, ...parts);
}
