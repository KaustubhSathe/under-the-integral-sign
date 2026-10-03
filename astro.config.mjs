// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/*
 * IMPORTANT for GitHub Pages:
 *  - `site` must be your final public URL.
 *  - `base` must be "/<repo-name>" for a project page (https://user.github.io/repo/)
 *    and should be removed (set to "/") for a user/organisation page
 *    (https://user.github.io/) or a custom domain.
 * PUBLIC_SITE_URL / PUBLIC_BASE_PATH let CI override these without editing this
 * file. See README.md → "Publishing".
 */
const SITE = process.env.PUBLIC_SITE_URL ?? "https://example.github.io";
const BASE = process.env.PUBLIC_BASE_PATH ?? "/under-the-integral-sign";

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "ignore",
  // Every page is pre-rendered HTML. No server, no database, no login.
  output: "static",
  build: {
    format: "directory",
  },
  integrations: [
    sitemap(),
    /*
     * This integration builds the search index as part of `astro build`, so
     * there is no separate pagefind CLI step. Entries mark their content with
     * data-pagefind-body, and listings opt out with data-pagefind-ignore.
     */
    pagefind({
      indexConfig: {
        // `rootSelector` is only a fallback; data-pagefind-body does the real work.
        // KaTeX emits a great many presentational svg-free spans, so excluding
        // decorative SVG keeps the index clean. data-pagefind-ignore is honoured
        // by Pagefind natively and needs no entry here.
        excludeSelectors: ["svg"],
      },
    }),
  ],
  markdown: {
    /*
     * Astro 7 defaults to the new "Sätteri" Markdown processor, which does not
     * run remark/rehype plugins. This vault depends on remark-math + rehype-katex
     * for LaTeX, so we explicitly select the unified (remark/rehype) pipeline.
     * GFM tables, task lists and smart punctuation are on by default.
     */
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { throwOnError: false, strict: false, trust: true }]],
    }),
    syntaxHighlight: "shiki",
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      wrap: true,
    },
  },
  vite: {
    build: {
      // KaTeX ships fonts and CSS; silence the noisy size warning.
      chunkSizeWarningLimit: 1200,
    },
  },
});
