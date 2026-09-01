import { describe, expect, it } from "vitest";
import { parseMarkdown } from "../src/core/markdown.js";

describe("section bodies", () => {
  it("does not repeat the first line of a list", () => {
    const doc = parseMarkdown("# T\n\n## S\n\n+ alpha\n+ beta\n+ gamma\n");
    const section = doc.sections.find((s) => s.title === "S");
    const items = parseMarkdown(section!.body).lists[0]!.items.map((i) => i.text);
    expect(items).toEqual(["alpha", "beta", "gamma"]);
  });

  it("does not repeat the first row of a table", () => {
    const doc = parseMarkdown("# T\n\n## S\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n");
    const section = doc.sections.find((s) => s.title === "S");
    const table = parseMarkdown(section!.body).tables[0]!;
    expect(table.headers).toEqual(["A", "B"]);
    expect(table.rows).toEqual([["1", "2"], ["3", "4"]]);
  });
});
