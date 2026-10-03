/**
 * Site identity — the only file you need to touch to rebrand the vault.
 *
 * `url` and `base` are kept here for reference; the build reads the real values
 * from astro.config.mjs (`site`/`base`), which CI overrides per repository.
 */
export const SITE = {
  name: "Under the Integral Sign",
  /** Shown in the header next to the mark. */
  tagline: "a mathematics vault",
  description:
    "Personal vault of mathematics: olympiad and competition problems (RMO, INMO, IMO, Putnam, JEE Advanced), integration bee material, and undergraduate theory — with the key idea written down for every problem.",
  author: "the vault keeper",
  /** Change to your repository URL. */
  repo: "https://github.com/KaustubhSathe/under-the-integral-sign",
  /** Public URL, no trailing slash. Must match astro.config.mjs `site`. */
  url: "https://kaustubhsathe.github.io",
  /** Sub-path of the deployment, no trailing slash. "" for a root site. */
  base: "/under-the-integral-sign",
  locale: "en",
  /** Set to false to hide "stub" entries from the home page highlights. */
  showStubs: true,
} as const;

/** Sections shown in the sidebar "Browse" group. */
export const NAV = [
  { label: "Problems", href: "/problems/", desc: "statement-first, one key idea each" },
  { label: "Theory", href: "/theory/", desc: "lemmas, theorems, techniques" },
  { label: "Tags", href: "/tags/", desc: "everything, cross-cut" },
] as const;
