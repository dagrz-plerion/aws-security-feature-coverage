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

/** Connective words after which a heading usually names its subject. */
const CONNECTIVE = /\s+(?:in|with|for|on|to|from|across|against|within)\s+/gi;

/**
 * Tails of a phrase, longest first. Only used after a direct match fails, and only
 * ever accepted when a whole column or list resolves consistently.
 */
export function phraseTails(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.split(/\s+/).length < 3) return [];
  const tails: string[] = [];
  for (const match of trimmed.matchAll(CONNECTIVE)) {
    const start = (match.index ?? 0) + match[0].length;
    const tail = trimmed.slice(start).trim();
    if (tail && tail.split(/\s+/).length <= 6) tails.push(tail);
  }
  // Also try the tail with a trailing parenthetical removed.
  const extra: string[] = [];
  for (const tail of tails) {
    const bare = tail.replace(/\s*\(.*?\)\s*$/, "").trim();
    if (bare && bare !== tail) extra.push(bare);
  }
  return [...tails, ...extra];
}

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
  /** service+noun with punctuation and case removed, so the three AWS spellings meet. */
  private resourceByFlatKey = new Map<string, string>();
  /** service id -> [normalised resource noun, resource type id] */
  private resourceByServiceNoun = new Map<string, [string, string][]>();
  private serviceNamesByLength: { name: string; serviceId: string }[] = [];
  /** documentation guide path ("accounts/latest/reference") -> service id */
  private serviceByGuide = new Map<string, string>();
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
    // AWS names a service one way in prose and another in a table. What does not
    // drift is the guide it links to: "AWS Budget Service" and "AWS Budgets" both
    // point at awsaccountbilling/latest/aboutv2. Indexing the guide path lets a row
    // resolve by where it links rather than by what it is called.
    for (const service of input.services) {
      for (const guide of service.docGuides ?? []) {
        const path = guidePath(guide.url);
        if (path && !this.serviceByGuide.has(path)) this.serviceByGuide.set(path, service.id);
      }
    }
    for (const type of input.resourceTypes) {
      // AWS writes the same code both ways: "appmesh:Mesh" in the RAM tables,
      // "appmesh:mesh" in Resource Explorer. Index both.
      const ids = [type.id, type.cfnTypeName, type.resourceExplorerType].filter((v): v is string => Boolean(v));
      for (const id of ids) {
        this.resourceById.set(id, type.id);
        if (!this.resourceById.has(id.toLowerCase())) this.resourceById.set(id.toLowerCase(), type.id);
      }
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
    // AWS names a service one way in prose and another in a table. What does not
    // drift is the guide it links to: "AWS Budget Service" and "AWS Budgets" both
    // point at awsaccountbilling/latest/aboutv2. Indexing the guide path lets a row
    // resolve by where it links rather than by what it is called.
    for (const service of input.services) {
      for (const guide of service.docGuides ?? []) {
        const path = guidePath(guide.url);
        if (path && !this.serviceByGuide.has(path)) this.serviceByGuide.set(path, service.id);
      }
    }
    for (const type of input.resourceTypes) {
      const noun = type.cfnTypeName?.split("::")[2] ?? type.serviceReferenceName ?? "";
      if (noun) this.resourceNouns.add(clean(noun.replace(/([a-z0-9])([A-Z])/g, "$1 $2")));
    }
    // AWS writes the same resource three ways: AWS::EC2::CapacityReservation in
    // CloudFormation, ec2:capacity-reservation in Resource Explorer, and
    // ec2:CapacityReservation in the RAM tables. Index a form all three collapse to.
    const flatKey = (service: string, noun: string): string =>
      `${service.replace(/[^a-z0-9]/gi, "").toLowerCase()}|${noun.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
    // AWS names a service one way in prose and another in a table. What does not
    // drift is the guide it links to: "AWS Budget Service" and "AWS Budgets" both
    // point at awsaccountbilling/latest/aboutv2. Indexing the guide path lets a row
    // resolve by where it links rather than by what it is called.
    for (const service of input.services) {
      for (const guide of service.docGuides ?? []) {
        const path = guidePath(guide.url);
        if (path && !this.serviceByGuide.has(path)) this.serviceByGuide.set(path, service.id);
      }
    }
    for (const type of input.resourceTypes) {
      const parts = type.cfnTypeName?.split("::");
      const candidates: [string, string][] = [];
      if (parts?.length === 3) candidates.push([parts[1] as string, parts[2] as string]);
      if (type.serviceId && type.serviceReferenceName) candidates.push([type.serviceId, type.serviceReferenceName]);
      if (type.resourceExplorerType?.includes(":")) {
        const [svc, ...rest] = type.resourceExplorerType.split(":");
        if (svc && rest.length) candidates.push([svc, rest.join(":")]);
      }
      for (const [svc, noun] of candidates) {
        const key = flatKey(svc, noun);
        if (!this.resourceByFlatKey.has(key)) this.resourceByFlatKey.set(key, type.id);
      }
    }
    // AWS names a service one way in prose and another in a table. What does not
    // drift is the guide it links to: "AWS Budget Service" and "AWS Budgets" both
    // point at awsaccountbilling/latest/aboutv2. Indexing the guide path lets a row
    // resolve by where it links rather than by what it is called.
    for (const service of input.services) {
      for (const guide of service.docGuides ?? []) {
        const path = guidePath(guide.url);
        if (path && !this.serviceByGuide.has(path)) this.serviceByGuide.set(path, service.id);
      }
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

  /** Does a closed universe actually hold this id? */
  knows(axis: Universe, id: string): boolean {
    if (axis === "region") return this.regionById.has(id);
    if (axis === "service") return [...this.serviceByName.values()].includes(id);
    if (axis === "resourceType") return [...this.resourceById.values()].includes(id);
    if (axis === "dataSource") return [...this.dataSourceByName.values()].includes(id);
    return true;
  }

  resolve(raw: string, axis?: Universe): Resolution | undefined {
    const text = raw.trim();
    if (!text) return undefined;
    const key = clean(text);
    const aliased = this.aliases.get(key);
    if (aliased) {
      const [aliasAxis, id] = aliased.split("|");
      // An alias must not answer a question about a different axis. Returning a
      // resource type when a service was asked for put AWS::Lambda::Function on the
      // service axis.
      // An alias is a redirect, not a licence to invent a target. If it points at
      // something no universe holds, fall through and let the value go unresolved.
      if (aliasAxis && id && (axis === undefined || axis === aliasAxis) && this.knows(aliasAxis as Universe, id)) {
        return { axis: aliasAxis as Universe, targetId: id, label: text };
      }
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
      const byId = this.resourceById.get(text) ?? this.resourceById.get(text.toLowerCase());
      if (byId) return { axis: "resourceType", targetId: byId, label: text };
      // service:Noun in any of AWS's three spellings. Checked before the bare-word
      // guard, which would otherwise reject a short code like "s3:Bucket".
      const colon = /^([A-Za-z0-9-]+):(.+)$/.exec(text);
      if (colon?.[1] && colon[2]) {
        const flat = `${colon[1].replace(/[^a-z0-9]/gi, "").toLowerCase()}|${colon[2].replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
        const hit = this.resourceByFlatKey.get(flat);
        if (hit) return { axis: "resourceType", targetId: hit, label: text };
      }
      // A bare common word must not become a resource type. "Remediation" is a
      // heading in many guides and also the name of an SSM resource.
      if (!/\s/.test(key) && key.length < 14) return undefined;
      const byName = this.resourceByName.get(key) ?? this.resourceByName.get(singular(key));
      if (byName) return { axis: "resourceType", targetId: byName, label: text };
      const split = this.resolveByServicePrefix(key);
      return split ? { axis: "resourceType", targetId: split, label: text } : undefined;
    };
    const tryService = (): Resolution | undefined => {
      // The IAM services table writes the long name and the short one together:
      // "Amazon Elastic Compute Cloud (Amazon EC2)". Neither half was ever tried on
      // its own, so EC2, EBS, ECR, ECS, EFS and EKS all went unresolved. Each
      // candidate still has to be a service name we hold — this widens the query,
      // not the universe.
      const bracket = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(text);
      const candidates = [key];
      if (bracket?.[1]) candidates.push(clean(bracket[1]));
      if (bracket?.[2]) candidates.push(clean(bracket[2]));
      // Stripping the "AWS "/"Amazon " prefix on the query side was tried and
      // reverted: AWS lists "Billing and Cost Management" as a name of Budgets, so
      // "AWS Billing and Cost Management" started resolving to the wrong service.
      // Where a prefixed name needs to resolve, an alias records it one at a time.
      // A service principal names a service exactly, and AWS uses it wherever a
      // table needs an unambiguous identifier: "athena.amazonaws.com". The part
      // before the suffix is the IAM prefix in almost every case, so try it as an id
      // and as a name before giving up.
      const principal = /^([a-z0-9][a-z0-9.-]*)\.amazonaws\.com$/i.exec(text.trim());
      if (principal?.[1]) candidates.push(clean(principal[1]), clean(principal[1].split(".")[0] ?? ""));
      for (const candidate of candidates) {
        if (!candidate) continue;
        const id = this.serviceByName.get(candidate);
        if (id) return { axis: "service", targetId: id, label: text };
      }
      return undefined;
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

    // A heading often wraps the target in prose: "Detecting attack sequences in
    // Amazon EKS clusters", "How Runtime Monitoring works with Amazon EC2 instances".
    // The target is the tail after the connective word.
    for (const tail of phraseTails(text)) {
      const hit = this.resolve(tail, axis);
      if (hit) return { ...hit, label: text };
    }
    return undefined;
  }

  /**
   * "Amazon Relational Database Service DB cluster snapshots" is a service name
   * followed by a resource noun. Strip the longest service name we know, then match
   * the rest against that service's resource types, and finally against all of them.
   */
  /**
   * Resolve a service from a documentation link. The IAM services table names 440
   * services in prose we cannot always match, but every row links to that service's
   * guide, and the guide path is stable.
   */
  resolveByDocUrl(url: string): string | undefined {
    const path = guidePath(url);
    return path ? this.serviceByGuide.get(path) : undefined;
  }

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

/** "https://docs.aws.amazon.com/accounts/latest/reference/x.html" -> "accounts/latest/reference" */
function guidePath(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = /^https?:\/\/docs\.aws\.amazon\.com\/([^?#]+)/i.exec(url.trim());
  if (!match) return undefined;
  const parts = (match[1] ?? "").split("/").filter(Boolean);
  if (parts.length < 2) return undefined;
  // Drop the page itself; keep the guide it belongs to.
  const last = parts[parts.length - 1] ?? "";
  const dirs = /\.(html?|md)$/i.test(last) ? parts.slice(0, -1) : parts;
  return dirs.length >= 2 ? dirs.join("/").toLowerCase() : undefined;
}
