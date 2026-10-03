/** Tiny shared helpers for the vault site. No dependencies on purpose. */

/** URL-safe slug: "Cauchy–Schwarz Inequality!" -> "cauchy-schwarz-inequality". */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Title-case a slug: "number-theory" -> "Number Theory". */
export function titleize(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length <= 3 && w !== "and" ? w.toUpperCase() : w[0]?.toUpperCase() + w.slice(1)))
    .join(" ");
}

export function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "2025-02-14" for <time datetime>. */
export function isoDate(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** Rough reading time from a rendered word count. */
export function readingTime(minutes: number): string {
  return minutes <= 1 ? "1 min read" : `${minutes} min read`;
}

/**
 * Build a correct link for the site, honouring the `base` path from
 * astro.config.mjs (important for GitHub Pages project sites).
 *   href("/topic/algebra") -> "/under-the-integral-sign/topic/algebra"
 */
export function href(path: string, base = import.meta.env.BASE_URL): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "/") return `${b}/` || "/";
  return `${b}${p}`;
}

export type Kind = "problems" | "theory";

export const KIND_LABELS: Record<Kind, string> = {
  problems: "Problems",
  theory: "Theory",
};

export const KIND_SINGULAR: Record<Kind, string> = {
  problems: "Problem",
  theory: "Theory note",
};

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Irregular plurals ("entry" → "entries"). `pluralize` cannot be used when the
 * plural is not formed by appending "s", which gives "entrys".
 */
export function count(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
