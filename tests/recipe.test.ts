import { describe, expect, it } from "vitest";
import { sentencesIn, stripBoilerplate } from "../src/coverage/recipe.js";

describe("reading prose", () => {
  it("splits a paragraph into sentences and drops the markup", () => {
    const body = "Macie analyzes objects.\n\nMacie doesn't analyze S3 objects that use other classes, such as **S3 Glacier Deep Archive** or S3 Express One Zone.\n\n+ a bullet\n| a | table |\n";
    const found = sentencesIn(body);
    expect(found.some((s) => s.includes("S3 Glacier Deep Archive"))).toBe(true);
    expect(found.some((s) => s.includes("a bullet"))).toBe(false);
    expect(found.some((s) => s.includes("**"))).toBe(false);
  });

  it("cuts the See also boilerplate every AWS page now carries", () => {
    const body = "# Page\n\n+ real item\n\n## See also\n\n+ Skills for AI coding assistants (optional).\n";
    expect(stripBoilerplate(body)).not.toContain("Skills for AI coding assistants");
    expect(stripBoilerplate(body)).toContain("real item");
  });
});
