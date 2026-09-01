import { describe, expect, it } from "vitest";
import { sentencesIn, stripBoilerplate } from "../src/coverage/recipe.js";

describe("reading prose", () => {
  it("splits a paragraph into sentences and drops the markup", () => {
    const body = "Macie analyzes objects.\n\nMacie doesn't analyze S3 objects that use other classes, such as **S3 Glacier Deep Archive** or S3 Express One Zone.\n\n+ a bullet\n| a | table |\n";
    const found = sentencesIn(body);
    expect(found.some((s) => s.text.includes("S3 Glacier Deep Archive"))).toBe(true);
    expect(found.some((s) => s.text.includes("a bullet"))).toBe(false);
    expect(found.some((s) => s.text.includes("**"))).toBe(false);
    // The quote must be a line from the page, so it can be checked against it.
    expect(found.every((s) => body.includes(s.raw))).toBe(true);
  });

  it("cuts the See also boilerplate every AWS page now carries", () => {
    const body = "# Page\n\n+ real item\n\n## See also\n\n+ Skills for AI coding assistants (optional).\n";
    expect(stripBoilerplate(body)).not.toContain("Skills for AI coding assistants");
    expect(stripBoilerplate(body)).toContain("real item");
  });
});
