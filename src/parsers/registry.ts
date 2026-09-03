import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ParseResult, PageBody } from '../core/types.js';

export interface ParserModule {
  /** The page this parser reads, exactly as it appears in coverage-urls.json. */
  url: string;
  /** Stable kebab-case id. Matches the file name without .ts. */
  parserId: string;
  parse: (page: PageBody & { supplement?: string }) => ParseResult;
}

const DIR = new URL('.', import.meta.url).pathname;

/** Files that would not import. One broken parser must not hide the others. */
export const loadErrors: { file: string; message: string }[] = [];

export const loadParsers = async (): Promise<ParserModule[]> => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.ts') && f !== 'registry.ts');
  const mods: ParserModule[] = [];
  loadErrors.length = 0;
  for (const f of files.sort()) {
    try {
      const m = (await import(join(DIR, f))) as { parser?: ParserModule };
      if (m.parser) mods.push(m.parser);
      else loadErrors.push({ file: f, message: 'exports no `parser`' });
    } catch (e) {
      loadErrors.push({ file: f, message: e instanceof Error ? e.message : String(e) });
    }
  }
  return mods;
};
