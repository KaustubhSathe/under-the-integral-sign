# Under the Integral Sign

A personal mathematics vault: competition and undergraduate problems and theory
— JEE Advanced, RMO, INMO, IMO, Putnam, integration bee — written up with the
**key idea** stated for every problem.

It is a **static site**. Every page is pre-rendered HTML with mathematics
rendered to KaTeX at build time: no database, no server-side code, no MathJax
script, no login for readers. Content lives as plain Markdown files in this
repository, so the vault is fully versioned and portable.

---

## Quick start

```powershell
# 1. install dependencies
pnpm install

# 2. create your admin password (once)
Copy-Item .env.example .env
#    then edit .env and set ADMIN_PASSWORD to a long passphrase

# 3. write content — two terminals
pnpm dev      # site at http://localhost:4321  (live preview)
pnpm admin    # admin panel at http://localhost:4322
```

Open <http://localhost:4322>, sign in with your password, and start writing.
The admin panel writes `.md` files straight into `content/`; the dev server
picks them up immediately, and the preview pane shows the real rendered page.

### All commands

| Command | What it does |
|---|---|
| `pnpm dev` | Astro dev server with hot reload — <http://localhost:4321> |
| `pnpm admin` | Local admin panel — <http://localhost:4322> |
| `pnpm build` | Static build into `dist/`, then builds the search index |
| `pnpm preview` | Serve the built site, including search — <http://localhost:4321> |
| `pnpm check` | Type-check the project |
| `pnpm new` | Scaffold a new entry from the command line |

`pnpm build` is what CI runs; the extra step after `astro build` generates the
Pagefind search index, which is why search only works in `build`/`preview`, not
in `dev`.

---

## How the vault is organised

```
content/                      ← YOUR CONTENT. Everything else is machinery.
  problems/
    calculus/                 ← topic folder — becomes part of the URL
      integrals/              ← subtopic folder — becomes part of the URL
        riemann-sum-arctangent-limit.md
        tan-power-symmetry-integral.md
  theory/                     ← same two-level shape (currently empty)

src/
  content.config.ts           ← the frontmatter contract (Zod schema)
  lib/taxonomy.ts             ← topics, subtopics, difficulties
  components/  layouts/  pages/  styles/

tools/admin/                  ← the local admin panel (never deployed)
  server.mjs                  ← Express server, auth, REST API
  schema.mjs                  ← form fields + validation (mirrors content.config.ts)
  vault.mjs                   ← safe file read/write for content/
  git.mjs                     ← commit / push wrapper around the git CLI
  public/                     ← the UI (no build step)

public/images/                ← images you upload from the admin panel
.github/workflows/deploy.yml  ← builds and publishes to GitHub Pages
```

### Topic → subtopic

The taxonomy is two levels. **Topic** is the broad area; **subtopic** is the
narrower bucket inside it. Both are part of an entry's folder and its URL:

```
content/problems/calculus/integrals/riemann-sum-arctangent-limit.md
  → /problems/calculus/integrals/riemann-sum-arctangent-limit/
  → /topic/calculus/                     (the whole topic)
  → /topic/calculus/integrals/           (just this subtopic)
```

The taxonomy currently defines exactly one of each:

| Topic | Subtopics |
|---|---|
| `calculus` | `integrals` |

Add more in **two places** — `src/lib/taxonomy.ts` for the site and
`tools/admin/schema.mjs` for the admin panel — then restart both. The two lists
are kept in sync by hand because the admin panel does not import the site's
TypeScript.

Renaming a file changes its URL, so the admin panel only renames on request. A
subtopic is a real folder, so changing an entry's subtopic *moves the file*.

> **Do not put a `slug:` field in frontmatter.** Astro's glob loader treats a
> frontmatter `slug` as the entry's entire id, which collapses the entry's URL
> to `/problems/<slug>/` and loses the topic/subtopic path. The file path is the
> single source of truth for the URL, and the admin panel never writes a slug.

---

## Writing an entry

Frontmatter is validated on save, so the admin panel will not let you write a
file the site cannot build. The fields for a problem:

```yaml
---
title: "A hundredth power of tan, and why the answer is still pi/4"
topic: calculus               # exactly one; sets the first folder level
subtopic: integrals           # exactly one; must belong to the topic above
tags: [definite-integrals, symmetry, integration-bee]   # free-form
difficulty: warmup            # warmup | standard | hard | brutal | research
source: "Integration bee staple"    # free text — where it came from
year: 2019
problemNumber: "2"
summary: "One sentence shown on cards. Plain text."
keyIdea: "The one line that unlocks it. Plain text — the most valuable field."
hints:                        # plain text, rendered as collapsible hints
  - "Try the substitution x -> pi/2 - x."
answer: "pi/4"                # plain text — frontmatter is NOT run through KaTeX
related: [riemann-sum-arctangent-limit]   # slugs of other entries
sourceUrl: "https://..."      # optional, must be a full URL
status: polished              # stub | draft | polished
date: 2025-01-14
draft: false                 # true hides the entry from the build entirely
---
```

Theory entries are the same shape, but use `section`
(`notes | lemma | theorem | technique | cheatsheet | book-notes`) and
`statement` instead of `difficulty`.

> **Plain text vs. Markdown.** Frontmatter fields are *plain text*: they are
> never passed through KaTeX. So write `pi/4` and `x^2 + y^2`, not `$\frac{\pi}{4}$`.
> LaTeX belongs in the body, where it renders properly.

### Markdown conventions in the body

````markdown
Inline math like $x^2 + y^2$ works anywhere.

$$
\int_0^1 \frac{dx}{1+x^2} = \frac{\pi}{4}
$$

## Headings become the table of contents

<details>
<summary>Solution</summary>

Anything here — markdown, $$display math$$ — is hidden until clicked.

</details>

> **Note.** A callout. Use `> **Warning.**` for a caveat.
````

The `<details>` block is how solutions stay hidden — it renders as a native
collapsible section with no JavaScript, and it prints expanded.

### Images

Upload from the admin panel (button, drag-and-drop, or paste straight into the
editor). Files land in `public/images/` and the URL is inserted for you.

---

## The admin panel

**It is local-only and never deployed.** The public site is static HTML, so
there is nothing for a reader to log into; the admin panel is a separate
process bound to `127.0.0.1` on your machine.

- **One user, one password.** `ADMIN_PASSWORD` from `.env` (git-ignored).
  Exchanged for an HMAC-signed `HttpOnly` cookie; the password itself is never
  stored in the browser.
- **Live preview** of the real rendered page, side by side with the editor.
- **Validated saves.** The panel checks every field against the same taxonomy
  the site uses, so a saved file always builds.
- **Conflict detection.** If a file changed on disk since you opened it, you are
  asked before it is overwritten.
- **Git built in.** See changed files, view a diff, commit, and push. The panel
  shells out to your real `git`, so your existing credentials (SSH agent or
  credential manager) are used.

**If the preview is blank**, the Astro dev server is not running:
`pnpm dev` in another terminal.

**If push fails with an authentication error**, the panel cannot answer a
password prompt. Run `git push` once in a terminal so Windows Credential
Manager or your SSH agent caches the credentials, then use the panel.

### Why not a hosted admin?

A hosted login needs a server to hold a GitHub OAuth client secret — which
means a backend, a third-party service, and a secret to manage. Since writing
happens on your own machine anyway, a local panel is strictly simpler and has
no attack surface. If you later want to edit from another device, the natural
addition is Decap CMS plus a small OAuth relay; the content layout here already
suits it.

---

## Publishing

1. **Create the GitHub repository** (public, for free Pages hosting) and push:

   ```powershell
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. **Enable Pages:** repository → *Settings* → *Pages* → **Source: GitHub
   Actions**. The included workflow handles everything else.

3. **Push to publish.** Every push to `main` rebuilds the site and deploys it.
   The admin panel's Commit + Push buttons do exactly this.

The workflow derives `site` and `base` from the repository itself
(`https://<owner>.github.io/<repo>/`), so **you do not need to edit
`astro.config.mjs`** when the repository name changes.

### If you use a custom domain or a user page

Set these in `astro.config.mjs` (or as environment variables in CI):

```js
const SITE = process.env.PUBLIC_SITE_URL ?? "https://math.example.com";
const BASE = process.env.PUBLIC_BASE_PATH ?? "/";   // "/" for a root domain
```

`base` is the sub-path the site is served from. A project page lives at
`/<repo>/`; a custom domain or `<user>.github.io` repository lives at `/`. Get
this wrong and every internal link 404s.

---

## Customising

**The taxonomy** — add a topic or subtopic in `src/lib/taxonomy.ts` (`TOPICS`,
`SUBTOPICS`, and a label) **and** in `tools/admin/schema.mjs` (`TAXONOMY`), then
restart both processes. The admin panel does not import the site's TypeScript,
so the two lists are kept in sync by hand. A subtopic must be listed under the
topic it belongs to — the build rejects an entry whose `subtopic` is not a
subtopic of its `topic`.

**Site identity** — name, tagline, description, author, repo URL:
`src/lib/site.ts`.

**Reading width** — three coupled values in `src/styles/global.css`:
`--sidebar-w`, `--toc-width` and `--prose-max`, plus the `min-width` on the TOC
grid. The breakpoint is derived from them, so if you widen the sidebar, raise the
breakpoint to match or the prose starts shrinking as the window grows.

**Look and feel** — one stylesheet, `src/styles/global.css`, with all colours
declared as custom properties at the top and a dark theme driven by
`prefers-color-scheme` plus a manual toggle.

**Adding a field to the schema** — three places: `src/content.config.ts` (Zod),
`tools/admin/schema.mjs` (form field), and, if it should be displayed,
`src/components/EntryHeader.astro` or the entry page.

---

## Notes on the build

- **Markdown pipeline.** Astro 7 defaults to a new Markdown processor
  ("Sätteri") that does not run remark/rehype plugins, and it mangles display
  math. `astro.config.mjs` therefore explicitly selects the unified pipeline
  (`@astrojs/markdown-remark`) with `remark-math` + `rehype-katex`. **Do not
  remove that `processor: unified({...})` block** — the mathematics depends on it.
- **Search** is a static Pagefind index generated from the built HTML. It is
  therefore unavailable in `pnpm dev`; the search dialog says so instead of
  failing silently.
- **Drafts.** `draft: true` removes an entry from the build entirely. Note that
  a draft is still visible in the public git history — never put anything
  private in this repository.
