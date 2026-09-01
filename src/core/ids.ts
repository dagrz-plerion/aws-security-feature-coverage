/** Stable, URL-safe, lowercase identifiers. Same input always gives the same id. */
export function slug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function featureId(serviceId: string, name: string): string {
  return `${serviceId}/${slug(name)}`;
}

/** Filesystem-safe form of an id that may contain slashes. */
export function idToFilename(id: string): string {
  return id.replace(/\//g, "__");
}

export function filenameToId(name: string): string {
  return name.replace(/\.json$/, "").replace(/__/g, "/");
}
