import type { DataSource, Region, ResourceType, Service } from "../core/schema.js";

export type Universe = "region" | "partition" | "service" | "resourceType" | "dataSource";

export type Resolution = { axis: Universe; targetId: string; label: string };

export type ResolverInput = {
  regions: Region[];
  services: Service[];
  resourceTypes: ResourceType[];
  dataSources: DataSource[];
  /** Learned aliases from earlier runs, so a resolved name stays resolved. */
  aliases?: Record<string, string>;
};

/**
 * Normalise for comparison while keeping every word. Parenthesised text is kept,
 * because it is the only thing that tells "Asia Pacific (Hong Kong)" apart from
 * "Asia Pacific (Tokyo)". Dropping it silently merges different regions.
 */
const clean = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9:.\-\s()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Service names carry an abbreviation in brackets; regions carry a city. */
const withoutBrackets = (value: string): string => clean(value.replace(/\(.*?\)/g, " "));

/** Region names appear as "Europe (Zurich)" and as "Europe (Zurich) Region". */
const regionKey = (value: string): string =>
  clean(value)
    .replace(/\s*\bregion\b\s*$/, "")
    .replace(/^the\s+/, "")
    .trim();

const singular = (value: string): string => value.replace(/(ies)$/, "y").replace(/([^s])s$/, "$1");

const REGION_CODE = /^[a-z]{2,4}(-[a-z]+)+-\d+$/;
const CFN_TYPE = /^[A-Za-z0-9]+::[A-Za-z0-9]+::[A-Za-z0-9]+$/;

/**
 * Turns the words used in documentation into universe ids. Every resolver is exact
 * or near-exact; nothing is guessed, so an unresolved name becomes a recorded gap
 * rather than a wrong claim.
 */
export class TargetResolver {
  private regionById = new Map<string, string>();
  private regionByName = new Map<string, string>();
  private serviceByName = new Map<string, string>();
  private resourceById = new Map<string, string>();
  private resourceByName = new Map<string, string>();
  private dataSourceByName = new Map<string, string>();
  private resourceNouns = new Set<string>();
  /** service id -> [normalised resource noun, resource type id] */
  private resourceByServiceNoun = new Map<string, [string, string][]>();
  private serviceNamesByLength: { name: string; serviceId: string }[] = [];
  private aliases: Map<string, string>;

  constructor(input: ResolverInput) {
    for (const region of input.regions) {
      this.regionById.set(region.id, region.id);
      if (region.longName) this.regionByName.set(regionKey(region.longName), region.id);
    }
    for (const service of input.services) {
      this.serviceByName.set(clean(service.id), service.id);
      for (const name of [service.productName, ...service.names]) {
        if (!name) continue;
        for (const key of [clean(name), withoutBrackets(name)]) {
          if (!key) continue;
          if (!this.serviceByName.has(key)) this.serviceByName.set(key, service.id);
          const stripped = key.replace(/^(amazon|aws)\s+/, "").trim();
          if (stripped && !this.serviceByName.has(stripped)) this.serviceByName.set(stripped, service.id);
        }
      }
    }
    for (const type of input.resourceTypes) {
      this.resourceById.set(type.id, type.id);
      if (type.cfnTypeName) this.resourceById.set(type.cfnTypeName, type.id);
      if (type.resourceExplorerType) this.resourceById.set(type.resourceExplorerType, type.id);
      for (const name of this.humanNamesFor(type, input.services)) {
        for (const key of [clean(name), withoutBrackets(name)]) {
          if (!key) continue;
          if (!this.resourceByName.has(key)) this.resourceByName.set(key, type.id);
          const one = singular(key);
          if (one && !this.resourceByName.has(one)) this.resourceByName.set(one, type.id);
        }
      }
    }
    for (const source of input.dataSources) {
      this.dataSourceByName.set(clean(source.id), source.id);
      this.dataSourceByName.set(clean(source.name), source.id);
      for (const alias of source.aliases) this.dataSourceByName.set(clean(alias), source.id);
    }
    for (const type of input.resourceTypes) {
      const noun = type.cfnTypeName?.split("::")[2] ?? type.serviceReferenceName ?? "";
      if (noun) this.resourceNouns.add(clean(noun.replace(/([a-z0-9])([A-Z])/g, "$1 $2")));
    }
    for (const type of input.resourceTypes) {
      if (!type.serviceId) continue;
      const noun = type.cfnTypeName?.split("::")[2] ?? type.serviceReferenceName;
      if (!noun) continue;
      const spaced = clean(noun.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
      const list = this.resourceByServiceNoun.get(type.serviceId);
      if (list) list.push([spaced, type.id]);
      else this.resourceByServiceNoun.set(type.serviceId, [[spaced, type.id]]);
    }
    this.serviceNamesByLength = [...this.serviceByName.entries()]
      .map(([name, serviceId]) => ({ name, serviceId }))
      .sort((a, b) => b.name.length - a.name.length);
    this.aliases = new Map(Object.entries(input.aliases ?? {}));
  }

  /** "AWS::S3::Bucket" also reads as "Amazon S3 buckets" or "S3 bucket". */
  private humanNamesFor(type: ResourceType, services: Service[]): string[] {
    const out: string[] = [];
    const parts = type.cfnTypeName?.split("::");
    const noun = parts?.[2] ?? type.serviceReferenceName;
    if (!noun) return out;
    const spacedNoun = noun.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    const service = services.find((s) => s.id === type.serviceId);
    const serviceNames = new Set<string>();
    if (service) {
      for (const name of [service.productName, ...service.names, service.id]) {
        if (!name) continue;
        serviceNames.add(name);
        serviceNames.add(name.replace(/^(Amazon|AWS)\s+/i, ""));
      }
    } else if (parts?.[1]) {
      serviceNames.add(parts[1]);
    }
    for (const serviceName of serviceNames) {
      out.push(`${serviceName} ${spacedNoun}`);
      out.push(`${serviceName} ${spacedNoun}s`);
    }
    out.push(spacedNoun, `${spacedNoun}s`);
    return out;
  }

  resolve(raw: string, axis?: Universe): Resolution | undefined {
    const text = raw.trim();
    if (!text) return undefined;
    const key = clean(text);
    const aliased = this.aliases.get(key);
    if (aliased) {
      const [aliasAxis, id] = aliased.split("|");
      if (aliasAxis && id) return { axis: aliasAxis as Universe, targetId: id, label: text };
    }

    const tryRegion = (): Resolution | undefined => {
      if (REGION_CODE.test(text) && this.regionById.has(text)) return { axis: "region", targetId: text, label: text };
      const byName = this.regionByName.get(regionKey(text));
      return byName ? { axis: "region", targetId: byName, label: text } : undefined;
    };
    const tryResource = (): Resolution | undefined => {
      if (CFN_TYPE.test(text)) {
        const direct = this.resourceById.get(text);
        if (direct) return { axis: "resourceType", targetId: direct, label: text };
      }
      const byId = this.resourceById.get(text);
      if (byId) return { axis: "resourceType", targetId: byId, label: text };
      // A bare common word must not become a resource type. "Remediation" is a
      // heading in many guides and also the name of an SSM resource.
      if (!/\s/.test(key) && key.length < 14) return undefined;
      const byName = this.resourceByName.get(key) ?? this.resourceByName.get(singular(key));
      if (byName) return { axis: "resourceType", targetId: byName, label: text };
      const split = this.resolveByServicePrefix(key);
      return split ? { axis: "resourceType", targetId: split, label: text } : undefined;
    };
    const tryService = (): Resolution | undefined => {
      const id = this.serviceByName.get(key);
      return id ? { axis: "service", targetId: id, label: text } : undefined;
    };
    const tryDataSource = (): Resolution | undefined => {
      const id = this.dataSourceByName.get(key);
      return id ? { axis: "dataSource", targetId: id, label: text } : undefined;
    };

    const order: (() => Resolution | undefined)[] =
      axis === "region" ? [tryRegion]
      : axis === "resourceType" ? [tryResource]
      : axis === "service" ? [tryService]
      : axis === "dataSource" ? [tryDataSource]
      : [tryRegion, tryResource, tryDataSource, tryService];

    for (const attempt of order) {
      const hit = attempt();
      if (hit) return hit;
    }
    return undefined;
  }

  /**
   * "Amazon Relational Database Service DB cluster snapshots" is a service name
   * followed by a resource noun. Strip the longest service name we know, then match
   * the rest against that service's resource types, and finally against all of them.
   */
  private resolveByServicePrefix(key: string): string | undefined {
    for (const { name, serviceId } of this.serviceNamesByLength) {
      if (name.length < 4 || !key.startsWith(`${name} `)) continue;
      const remainder = singular(key.slice(name.length + 1).trim());
      if (!remainder) continue;
      const nouns = this.resourceByServiceNoun.get(serviceId) ?? [];
      const exact = nouns.find(([noun]) => noun === remainder);
      if (exact) return exact[1];
      // A suffix match is only safe when the noun is specific. "directory bucket"
      // ends with "bucket", and treating that as a plain bucket would be wrong.
      const suffixes = nouns.filter(([noun]) => noun.includes(" ") && remainder.endsWith(noun));
      if (suffixes.length === 1) return (suffixes[0] as [string, string])[1];
      const global = this.resourceByName.get(remainder) ?? this.resourceByName.get(`${remainder}s`);
      if (global) return global;
    }
    return undefined;
  }

  /** Share of values that resolve on a given axis. Used to pick the right column. */
  rate(values: string[], axis: Universe): { rate: number; resolved: Resolution[] } {
    const resolved: Resolution[] = [];
    for (const value of values) {
      const hit = this.resolve(value, axis);
      if (hit) resolved.push(hit);
    }
    return { rate: values.length ? resolved.length / values.length : 0, resolved };
  }
}
