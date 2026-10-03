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
    integrals/                ← the topic folder becomes part of the URL
      riemann-sum-arctangent-limit.md
      tan-power-symmetry-integral.md
  theory/                     ← same shape (currently empty)
    integrals/

src/
  content.config.ts           ← the frontmatter contract (Zod schema)
  lib/taxonomy.ts             ← the list of topics, exam types, difficulties
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

**URLs are derived from the file path plus the topic:**

```
content/problems/integrals/riemann-sum-arctangent-limit.md
  → /problems/integrals/riemann-sum-arctangent-limit/
  → /topic/integrals/
```

The taxonomy is **flat**: one level, `topic`. There is no subtopic level, by
choice — when one topic needs splitting, add topics to the list rather than
nesting them.

The vault currently defines a single topic, `integrals`, because that is what is
being studied. Adding another is a one-line change in **two** places —
`src/lib/taxonomy.ts` (`TOPICS` and `TOPIC_LABELS`) for the site and
`tools/admin/schema.mjs` (`TOPICS`) for the admin panel — then restart both. The
two lists are kept in sync by hand because the admin panel does not import the
site's TypeScript. The sidebar, topic pages and admin folder layout all already
handle several topics.

### Exam source — a separate axis

`exam` is **independent of topic**. It records *where a problem came from*, not
what it is about, so the same integral can be a JEE Advanced problem or an
integration-bee one:

```
exam: putnam          → /exam/putnam/
exam: integration-bee → /exam/integration-bee/
```

It drives its own browsing pages and the "Exam sources" section in the sidebar.
The values are fixed (`jee-advanced`, `jee-main`, `rmo`, `inmo`, `imo`, `putnam`,
`integration-bee`, `undergrad`, `olympiad-other`, `textbook`, `own`) and the
build rejects anything else. The free-text `source:` field sits alongside it for
the exact citation — `exam` is the grouping key, `source` is the label.

> **Do not put a `slug:` field in frontmatter.** Astro's glob loader treats a
> frontmatter `slug` as the entry's entire id, which collapses the URL to
> `/problems/<slug>/`. The file path is the single source of truth, and the admin
> panel never writes a slug.

Renaming a file changes its URL, so the admin panel only renames on request.

---

## Writing an entry

Frontmatter is validated on save, so the admin panel will not let you write a
file the site cannot build. The fields for a problem:

```yaml
---
title: "In an acute triangle, show sin A + sin B + sin C > 2"
topic: integrals              # exactly one; sets the folder and /topic/<x> URL
tags: [definite-integrals, symmetry, integration-bee]
difficulty: warmup           # warmup | standard | hard | brutal | research
exam: rmo                    # jee-advanced | jee-main | rmo | inmo | imo |
                             # putnam | integration-bee | undergrad |
                             # olympiad-other | textbook | own
source: "Classical; a standard RMO/INMO warm-up"   # plain text
year: 2019
problemNumber: "2"
summary: "One sentence shown on cards. Plain text."
keyIdea: "The one line that unlocks it. Plain text — the most valuable field."
hints:                       # plain text, rendered as collapsible hints
  - "Fix C and study what happens to A."
answer: "pi/4"               # plain text — frontmatter is NOT run through KaTeX
related: [cauchy-schwarz-engel-form]   # slugs of other entries
sourceUrl: "https://..."     # optional, must be a full URL
status: polished             # stub | draft | polished
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

**New** offers two ways to start an entry:

| | |
|---|---|
| **Manual entry** | Pick the kind and topic, type a title, get an empty template. |
| **AI entry** | Describe the entry (or attach a photo of a problem) and DeepSeek drafts the frontmatter and the body. |

### AI entry

Set `DEEPSEEK_API_KEY` in `.env` to enable it. The key is read by the admin
**server** and is never sent to the browser; `/api/ai-status` reports only
whether a key exists. Without a key the option still appears and says so —
manual entry is unaffected.

It uses `deepseek-flash`, which is **DeepSeek-V4.1-Flash** and the only current
DeepSeek model that accepts images. Attach a JPEG, PNG, GIF or WebP (up to 8 MB)
and the model reads the problem out of it; the photo is used for that request
only and is not saved into the vault.

Three things worth knowing:

- **The draft always opens in the editor; nothing is saved for you.** Model maths
  needs a human pass, and this is a vault of mathematics.
- **The model is asked for `title`, `summary`, `keyIdea`, `answer`, `tags`,
  `difficulty`/`section`, optionally `exam`, and the Markdown body.** Values are
  checked against the taxonomy before being filled in, and an `exam` is only
  accepted when the model is confident — a wrong competition label is worse than
  a blank one.
- **The subtopic is a folder, not a field.** The content schema has no `subtopic`
  key; an entry's topic is its folder and its URL segment. The panel derives the
  folder from the topic so the tree can be split later without a migration.

**If the preview is blank**, the Astro dev server is not running:
`pnpm dev` in another terminal. The pane now says this explicitly rather than
leaving you to guess.

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

**The taxonomy** — add a topic in `src/lib/taxonomy.ts` (`TOPICS` and
`TOPIC_LABELS`) **and** in `tools/admin/schema.mjs` (`TOPICS`), then restart both
processes. The admin panel does not import the site's TypeScript, so the two
lists are kept in sync by hand.

**Exam sources** — edit `EXAM_TYPES` / `EXAM_LABELS` in `src/lib/taxonomy.ts` and
`EXAM_TYPES` in `tools/admin/schema.mjs`.

**Site identity** — name, tagline, description, author, repo URL:
`src/lib/site.ts`.

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
