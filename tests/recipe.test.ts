import { describe, expect, it } from "vitest";
import { runRecipe, sentencesIn, stripBoilerplate } from "../src/coverage/recipe.js";
import { TargetResolver } from "../src/coverage/resolvers.js";
import type { Region, Service } from "../src/core/schema.js";

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

const ev = [{ sourceUrl: "https://example.test/x", bodySha256: "a".repeat(64), retrievedAt: "2026-01-01T00:00:00Z", quote: "x" }];
const svc = (id: string, name: string): Service => ({
  id, names: [name], productName: name, docGuides: [], regions: [], resourceNames: [], seenIn: ["t"], evidence: [],
});
const resolver = new TargetResolver({
  regions: [{ id: "us-east-1", longName: "US East (N. Virginia)", partition: "aws", seenIn: ["t"], evidence: ev }] as Region[],
  services: [
    svc("billing", "AWS Billing"),
    // AWS lists both of these names against the one IAM prefix, which is why the
    // table's two rows land on the same service.
    { ...svc("autoscaling", "AWS Auto Scaling"), names: ["AWS Auto Scaling", "Amazon EC2 Auto Scaling"] },
    svc("s3", "Amazon S3"),
  ],
  resourceTypes: [],
  dataSources: [],
});

describe("one service named on several rows", () => {
  const recipe = {
    id: "t-merge",
    blocks: "whole-page" as const,
    select: { from: "table-column" as const, headerMatches: "Service" },
    axis: "service",
    status: "from-column" as const,
    statusColumn: "Supported",
    featureId: "t/f",
  };

  it("reads them as partial when the rows disagree", () => {
    // AWS gives Auto Scaling two rows in the IAM services table and they differ.
    // Keeping whichever came first published a coin flip.
    const body = [
      "| Service | Supported |",
      "| --- | --- |",
      "| AWS Auto Scaling | No |",
      "| Amazon EC2 Auto Scaling | Yes |",
    ].join("\n");
    const out = runRecipe(recipe as never, body, "", resolver);
    const hit = out.claims.find((c) => c.targetId === "autoscaling");
    expect(hit?.status).toBe("partial");
    expect(hit?.qualifier).toMatch(/disagree/);
  });

  it("keeps the plain status when the rows agree", () => {
    const body = [
      "| Service | Supported |",
      "| --- | --- |",
      "| AWS Auto Scaling | Yes |",
      "| Amazon EC2 Auto Scaling | Yes |",
    ].join("\n");
    const out = runRecipe(recipe as never, body, "", resolver);
    const hit = out.claims.find((c) => c.targetId === "autoscaling");
    expect(hit?.status).toBe("covered");
    expect(hit?.qualifier).toBeUndefined();
  });

  it("keeps the quote verbatim, so the evidence check still passes", () => {
    const body = [
      "| Service | Supported |",
      "| --- | --- |",
      "| AWS Auto Scaling | No |",
      "| Amazon EC2 Auto Scaling | Yes |",
    ].join("\n");
    const out = runRecipe(recipe as never, body, "", resolver);
    for (const claim of out.claims) expect(body).toContain(claim.quote);
  });
});

describe("a short line that is the whole value", () => {
  it("is read when the recipe lowers the sentence floor", () => {
    // "Linux", "macOS" and "Windows" each sit on a bold line of their own, all under
    // the 20-character default that keeps prose and drops fragments.
    const body = "The generator supports these platforms.\n\n**Linux**\n\n**macOS**\n";
    expect(sentencesIn(body).map((s) => s.text)).toEqual(["The generator supports these platforms."]);
    expect(sentencesIn(body, 3).map((s) => s.text)).toContain("Linux");
  });
});
