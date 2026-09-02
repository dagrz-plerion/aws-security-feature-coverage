import { describe, expect, it } from "vitest";
import { measuredCatalogue, scopeCollapse } from "../src/pipeline/rules.js";

const KINDS = {
  conditionKey: { kind: "catalogue" },
  control: { kind: "catalogue" },
  configRule: { kind: "catalogue" },
  region: { kind: "external" },
  service: { kind: "external" },
  operatingSystem: { kind: "external" },
};

const claim = (axis: string, targetId: string, scope?: { axis: string; targetId: string }) => ({
  axis, targetId, ...(scope ? { scope } : {}),
});

describe("a row named after the parent of what it measures", () => {
  it("catches the KMS shape: every service scoped to one condition key", () => {
    const broken = [{
      featureId: "kms/condition-keys",
      claims: Array.from({ length: 92 }, (_, i) =>
        claim("service", `svc-${i}`, { axis: "conditionKey", targetId: "kms:ViaService" })),
    }];
    expect(scopeCollapse(broken, KINDS)).toHaveLength(1);
    expect(scopeCollapse(broken, KINDS)[0]).toContain("kms:ViaService");
  });

  it("accepts the fixed shape: the condition key is its own feature", () => {
    const fixed = [{
      featureId: "kms/kms-viaservice-condition-key",
      claims: Array.from({ length: 92 }, (_, i) => claim("service", `svc-${i}`)),
    }];
    expect(scopeCollapse(fixed, KINDS)).toEqual([]);
  });

  it("leaves a single external scope alone: that is a qualifier, not a mis-naming", () => {
    const one = [{
      featureId: "inspector2/automated-scans",
      claims: [claim("operatingSystem", "AL2023", { axis: "region", targetId: "us-east-1" })],
    }];
    expect(scopeCollapse(one, KINDS)).toEqual([]);
  });
});

describe("a catalogue is counted, not measured", () => {
  it("catches the Security Hub shape: 589 controls each carrying Region coverage", () => {
    const broken = [{
      featureId: "securityhub/aws-security-hub-cspm",
      claims: Array.from({ length: 589 }, (_, i) =>
        claim("control", `Control.${i}`, { axis: "region", targetId: "af-south-1" })),
    }];
    const found = measuredCatalogue(broken, KINDS);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("589 control members");
  });

  it("accepts the fixed shape: one claim per Region, controls merely counted", () => {
    const fixed = [{
      featureId: "securityhub/aws-security-hub-cspm",
      claims: [
        ...Array.from({ length: 589 }, (_, i) => claim("control", `Control.${i}`)),
        ...Array.from({ length: 38 }, (_, i) => claim("region", `region-${i}`)),
      ],
    }];
    expect(measuredCatalogue(fixed, KINDS)).toEqual([]);
  });

  it("leaves an external axis alone however it is scoped", () => {
    const external = [{
      featureId: "guardduty/runtime-monitoring",
      claims: Array.from({ length: 200 }, (_, i) =>
        claim("service", `svc-${i}`, { axis: "region", targetId: "us-east-1" })),
    }];
    expect(measuredCatalogue(external, KINDS)).toEqual([]);
  });

  it("tolerates a handful of members: a short list is not a catalogue claim", () => {
    const few = [{
      featureId: "macie/managed-data-identifiers",
      claims: Array.from({ length: 5 }, (_, i) =>
        claim("configRule", `rule-${i}`, { axis: "region", targetId: "us-east-1" })),
    }];
    expect(measuredCatalogue(few, KINDS)).toEqual([]);
  });
});
