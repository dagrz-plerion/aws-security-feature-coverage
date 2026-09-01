import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const exec = promisify(execFile);

export const AWS_PROFILE = process.env.COVERAGE_AWS_PROFILE ?? "sandbox";
export const AWS_REGION = process.env.COVERAGE_AWS_REGION ?? "us-east-1";

let cachedDataDir: string | null | undefined;

/** Find the service models bundled with the local AWS CLI. */
export function botocoreDataDir(): string | null {
  if (cachedDataDir !== undefined) return cachedDataDir;
  const roots = [
    "/opt/homebrew/Cellar/awscli",
    "/usr/local/Cellar/awscli",
    "/usr/local/aws-cli",
    "/opt/aws-cli",
  ];
  const candidates: string[] = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const version of fs.readdirSync(root)) {
      const libexec = path.join(root, version, "libexec", "lib");
      const direct = path.join(root, version, "dist", "awscli", "botocore", "data");
      if (fs.existsSync(direct)) candidates.push(direct);
      if (!fs.existsSync(libexec)) continue;
      for (const py of fs.readdirSync(libexec)) {
        const dir = path.join(libexec, py, "site-packages", "awscli", "botocore", "data");
        if (fs.existsSync(dir)) candidates.push(dir);
      }
    }
  }
  cachedDataDir = candidates.sort().pop() ?? null;
  return cachedDataDir;
}

export type ServiceModel = {
  version: string;
  metadata: Record<string, unknown> & {
    endpointPrefix?: string;
    serviceId?: string;
    serviceFullName?: string;
    signingName?: string;
    apiVersion?: string;
    uid?: string;
  };
  operations: Record<string, { name: string; documentation?: string; input?: unknown; output?: unknown }>;
  shapes: Record<string, { type: string; enum?: string[]; documentation?: string; members?: Record<string, unknown> }>;
};

/** All locally available API models, keyed by botocore directory name. */
export async function listLocalModels(): Promise<string[]> {
  const dir = botocoreDataDir();
  if (!dir) return [];
  const names = await fsp.readdir(dir, { withFileTypes: true });
  return names.filter((n) => n.isDirectory()).map((n) => n.name).sort();
}

export async function readLocalModel(name: string): Promise<{ model: ServiceModel; file: string } | undefined> {
  const dir = botocoreDataDir();
  if (!dir) return undefined;
  const serviceDir = path.join(dir, name);
  let versions: string[];
  try {
    versions = (await fsp.readdir(serviceDir)).filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)).sort();
  } catch {
    return undefined;
  }
  const latest = versions.at(-1);
  if (!latest) return undefined;
  const file = path.join(serviceDir, latest, "service-2.json");
  try {
    const model = JSON.parse(await fsp.readFile(file, "utf8")) as ServiceModel;
    return { model, file };
  } catch {
    return undefined;
  }
}

export async function readLocalJson<T>(relative: string): Promise<{ value: T; file: string } | undefined> {
  const dir = botocoreDataDir();
  if (!dir) return undefined;
  const file = path.join(dir, relative);
  try {
    return { value: JSON.parse(await fsp.readFile(file, "utf8")) as T, file };
  } catch {
    return undefined;
  }
}

export class AwsCliError extends Error {}

/** Run the AWS CLI and parse JSON. Returns undefined when credentials are unavailable. */
export async function awsJson<T>(args: string[], options: { profile?: string; region?: string } = {}): Promise<T | undefined> {
  const full = [
    ...args,
    "--profile",
    options.profile ?? AWS_PROFILE,
    "--region",
    options.region ?? AWS_REGION,
    "--output",
    "json",
  ];
  try {
    const { stdout } = await exec("aws", full, { maxBuffer: 256 * 1024 * 1024 });
    return JSON.parse(stdout) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/ExpiredToken|Unable to locate credentials|AccessDenied|SSOError|could not be found/i.test(message)) {
      return undefined;
    }
    throw new AwsCliError(`aws ${args.join(" ")} failed: ${message.slice(0, 400)}`);
  }
}

/** Page through an AWS CLI list call that uses NextToken. */
export async function awsPaginate<T>(
  args: string[],
  extract: (page: Record<string, unknown>) => T[],
  options: { profile?: string; region?: string; tokenArg?: string; tokenKey?: string } = {},
): Promise<T[] | undefined> {
  const tokenArg = options.tokenArg ?? "--next-token";
  const tokenKey = options.tokenKey ?? "NextToken";
  const out: T[] = [];
  let token: string | undefined;
  for (let page = 0; page < 200; page += 1) {
    const pageArgs = token ? [...args, tokenArg, token] : args;
    const result = await awsJson<Record<string, unknown>>(pageArgs, options);
    if (result === undefined) return page === 0 ? undefined : out;
    out.push(...extract(result));
    token = result[tokenKey] as string | undefined;
    if (!token) break;
  }
  return out;
}
