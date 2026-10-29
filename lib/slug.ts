/** Lowercase, ASCII-only, dash-separated slugs, e.g. "Pet Nest!" -> "pet-nest". */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 80;

export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
  return slug || "project";
}

/**
 * Return `base` or `base-2`, `base-3`, ... — the first candidate for which `isTaken` is false.
 * This mirrors the backfill in the project_slug migration.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = base;
  for (let n = 2; await isTaken(candidate); n++) {
    const suffix = `-${n}`;
    candidate = `${base.slice(0, SLUG_MAX_LENGTH - suffix.length).replace(/-+$/g, "")}${suffix}`;
  }
  return candidate;
}
