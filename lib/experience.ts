type Dated = { startDate: Date; endDate: Date | null };

const time = (d: Date) => d.getTime();

/** Newest start first; ties keep their original (admin) order. */
function byStartDesc<T extends Dated>(list: readonly T[]): T[] {
  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => time(b.item.startDate) - time(a.item.startDate) || a.index - b.index)
    .map(({ item }) => item);
}

/**
 * Featured role = the current one (no end date). With several current roles, or none,
 * the most recent by start date. Everything else is "earlier", newest first.
 */
export function splitExperience<T extends Dated>(
  list: readonly T[],
): { featured: T | null; earlier: T[] } {
  if (list.length === 0) return { featured: null, earlier: [] };
  const sorted = byStartDesc(list);
  const featured = sorted.find((e) => e.endDate === null) ?? sorted[0];
  return { featured, earlier: sorted.filter((e) => e !== featured) };
}

/** Up to two initials from a company name, for the logo fallback. */
export function companyInitials(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters =
    words.length === 1
      ? Array.from(words[0]).slice(0, 2)
      : [words[0], words[1]].map((w) => Array.from(w)[0]);
  return letters.join("").toUpperCase();
}
