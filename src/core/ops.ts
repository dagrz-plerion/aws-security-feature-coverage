import path from "node:path";
import { paths } from "./paths.js";
import { readAllJson, writeJson } from "./store.js";
import { shortHash } from "./hash.js";
import { gapSchema, quarantineSchema, type Gap, type QuarantineItem } from "./schema.js";

/** Record a source we could not parse, with everything needed to write a parser for it. */
export async function quarantine(item: Omit<QuarantineItem, "id" | "createdAt" | "resolved">): Promise<QuarantineItem> {
  const id = shortHash(`${item.stage}|${item.subject}|${item.reason}|${item.sourceUrl ?? ""}`);
  const record: QuarantineItem = { ...item, id, createdAt: new Date().toISOString(), resolved: false };
  await writeJson(path.join(paths.quarantine, `${id}.json`), record);
  return record;
}

/** Record a hole in the process itself, so it becomes a task rather than a silent miss. */
export async function recordGap(gap: Omit<Gap, "id" | "createdAt" | "resolved">): Promise<Gap> {
  const id = shortHash(`${gap.kind}|${gap.subject}|${gap.detail}`);
  const record: Gap = { ...gap, id, createdAt: new Date().toISOString(), resolved: false };
  await writeJson(path.join(paths.gaps, `${id}.json`), record);
  return record;
}

export async function listQuarantine(): Promise<QuarantineItem[]> {
  return readAllJson(paths.quarantine, quarantineSchema);
}

export async function listGaps(): Promise<Gap[]> {
  return readAllJson(paths.gaps, gapSchema);
}
