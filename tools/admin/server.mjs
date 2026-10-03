/**
 * Local admin panel for the vault.
 *
 * RUNS ON YOUR MACHINE ONLY. It is never deployed: the public site is static
 * HTML with no server-side code, so there is nothing to log into and nothing to
 * attack. This process binds to 127.0.0.1 and writes Markdown files into the
 * content/ directory, then can commit and push them.
 *
 * Auth: a single password from ADMIN_PASSWORD (or .env), exchanged for an
 * HMAC-signed HttpOnly cookie. There is no user table because there is exactly
 * one user.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import {
  ENTRY_KINDS,
  MARKDOWN_HELP,
  TOPICS,
  SUBTOPICS,
  DIFFICULTIES,
  EXAM_TYPES,
  THEORY_SECTIONS,
  STATUSES,
  subtopicsFor,
  validate,
} from "./schema.mjs";
import {
  ROOT,
  buildEntryPath,
  deleteEntry,
  listEntries,
  listImages,
  moveEntry,
  pathExists,
  readEntry,
  saveImage,
  slugify,
  writeEntry,
} from "./vault.mjs";
import { aiConfigured, aiModel, generateEntry } from "./ai.mjs";
import * as git from "./git.mjs";

/* ------------------------------------------------------------------- config -- */

/** Minimal .env loader: KEY=value lines, # comments. Avoids a dependency. */
async function loadEnvFile() {
  try {
    const text = await fs.readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* no .env file is fine */
  }
}

await loadEnvFile();

const PORT = Number(process.env.ADMIN_PORT ?? 4322);
const HOST = process.env.ADMIN_HOST ?? "127.0.0.1";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS ?? 12);
const ASTRO_PORT = Number(process.env.ASTRO_PORT ?? 4321);
const SESSION_COOKIE = "vault_admin";

/*
 * The dev server serves the site UNDER its base path, because astro.config.mjs
 * sets `base` to "/<repo>" for GitHub Pages. So a preview URL must be
 * http://localhost:4321/<base>/problems/<...>/ — without the base you get Astro's
 * 404 page (served with HTTP 200, which is why this is easy to miss).
 *
 * PUBLIC_BASE_PATH is the same variable the build reads, so setting it in .env
 * keeps the two in step. The default matches astro.config.mjs.
 */
const BASE_PATH = (() => {
  const raw = process.env.PUBLIC_BASE_PATH ?? "/under-the-integral-sign";
  if (!raw || raw === "/") return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
})();

if (!PASSWORD) {
  console.error(
    [
      "",
      "  ┌─────────────────────────────────────────────────────────────────────┐",
      "  │  ADMIN_PASSWORD is not set, so the admin panel will not start.      │",
      "  └─────────────────────────────────────────────────────────────────────┘",
      "",
      "  Create a file named .env in this folder:",
      "",
      `      ${ROOT}${path.sep}.env`,
      "",
      "  …containing one line:",
      "",
      "      ADMIN_PASSWORD=your-long-passphrase-here",
      "",
      "  Or write one in a single command:",
      "",
      "      bash/zsh:    printf 'ADMIN_PASSWORD=%s\\n' \"$(openssl rand -base64 24)\" > .env",
      "      PowerShell:  \"ADMIN_PASSWORD=$(openssl rand -base64 24)\" | Set-Content .env",
      "",
      "  (The PowerShell form needs openssl; otherwise just create .env by hand",
      "   and paste in a long passphrase of your own.)",
      "",
      "  .env is git-ignored, so the password is never committed or published.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

if (PASSWORD.length < 12) {
  console.warn(
    "  [warn] ADMIN_PASSWORD is shorter than 12 characters. This panel can write files, so use a long passphrase.",
  );
}

/* --------------------------------------------------------------------- auth -- */

const SESSION_SECRET = crypto.createHash("sha256").update(`vault-admin:${PASSWORD}`).digest();

function signSession(expiresAt) {
  const payload = String(expiresAt);
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifySession(token) {
  if (typeof token !== "string") return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function passwordMatches(candidate) {
  const a = Buffer.from(crypto.createHash("sha256").update(String(candidate)).digest());
  const b = Buffer.from(crypto.createHash("sha256").update(PASSWORD).digest());
  return crypto.timingSafeEqual(a, b);
}

/** Simple in-memory throttle on the login endpoint. */
const attempts = { count: 0, until: 0 };
function throttle() {
  const now = Date.now();
  if (attempts.until > now) {
    return Math.ceil((attempts.until - now) / 1000);
  }
  return 0;
}
function noteFailure() {
  attempts.count += 1;
  if (attempts.count >= 5) {
    // Exponential-ish backoff, capped at a minute.
    const wait = Math.min(60_000, 2 ** (attempts.count - 4) * 1000);
    attempts.until = Date.now() + wait;
  }
}
function clearFailures() {
  attempts.count = 0;
  attempts.until = 0;
}

/* ------------------------------------------------------------------- server -- */

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());

function requireAuth(req, res, next) {
  if (verifySession(req.cookies?.[SESSION_COOKIE])) return next();
  return res.status(401).json({ error: "Not signed in." });
}

app.get("/api/auth", (req, res) => {
  res.json({ authenticated: verifySession(req.cookies?.[SESSION_COOKIE]) });
});

app.post("/api/login", (req, res) => {
  const wait = throttle();
  if (wait > 0) {
    return res.status(429).json({ error: `Too many attempts. Try again in ${wait}s.` });
  }
  if (!passwordMatches(req.body?.password ?? "")) {
    noteFailure();
    return res.status(401).json({ error: "Wrong password." });
  }
  clearFailures();
  const expiresAt = Date.now() + SESSION_HOURS * 3600 * 1000;
  res.cookie(SESSION_COOKIE, signSession(expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // localhost over http
    maxAge: SESSION_HOURS * 3600 * 1000,
    path: "/",
  });
  res.json({ ok: true, expiresAt });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

/* ---------------------------------------------------------------- metadata -- */

app.get("/api/bootstrap", requireAuth, async (_req, res) => {
  const [problems, theory, images, gitStatus, recent] = await Promise.all([
    listEntries("problems"),
    listEntries("theory"),
    listImages(),
    git.status(),
    git.log(10),
  ]);
  res.json({
    entries: { problems, theory },
    images,
    git: gitStatus,
    recentCommits: recent,
    schema: {
      kinds: Object.fromEntries(
        Object.entries(ENTRY_KINDS).map(([k, v]) => [
          k,
          { label: v.label, dir: v.dir, fields: v.fields },
        ]),
      ),
      topics: TOPICS,
      /** topic → folder names, so the client can place a new file. Not frontmatter. */
      subtopicsByTopic: SUBTOPICS,
      difficulties: DIFFICULTIES,
      examTypes: EXAM_TYPES,
      theorySections: THEORY_SECTIONS,
      statuses: STATUSES,
      markdownHelp: MARKDOWN_HELP,
    },
    config: {
      astroPort: ASTRO_PORT,
      /*
       * Includes the base path, so the client can append /<kind>/<entry>/ and get
       * a URL the dev server actually serves.
       */
      devUrl: `http://localhost:${ASTRO_PORT}${BASE_PATH}`,
      basePath: BASE_PATH,
      repoRoot: ROOT,
    },
  });
});

app.get("/api/entry", requireAuth, async (req, res) => {
  try {
    const { kind, path: relPath } = req.query;
    if (!ENTRY_KINDS[kind]) return res.status(400).json({ error: "Unknown kind." });
    const entry = await readEntry(kind, String(relPath));
    const stat = await fs.stat(path.join(ROOT, ENTRY_KINDS[kind].dir, entry.path));
    res.json({ ...entry, mtime: stat.mtimeMs });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/* --------------------------------------------------------------------- ai -- */

app.get("/api/ai-status", requireAuth, (_req, res) => {
  // The key itself is never sent to the client, only whether one is present.
  res.json({ configured: aiConfigured(), model: aiModel() });
});

app.post("/api/generate", requireAuth, async (req, res) => {
  const { kind, prompt, image } = req.body ?? {};
  if (!ENTRY_KINDS[kind]) return res.status(400).json({ error: "Unknown kind." });
  try {
    const result = await generateEntry({
      kind,
      prompt: String(prompt ?? ""),
      image: image ? String(image) : null,
      topics: TOPICS.map((t) => t.value),
      difficulties: DIFFICULTIES.map((d) => d.value),
      exams: EXAM_TYPES.map((e) => e.value),
      theorySections: THEORY_SECTIONS.map((s) => s.value),
    });
    res.json(result);
  } catch (err) {
    // The message is written for a human, so it is safe to show as-is.
    res.status(502).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ writing -- */

app.post("/api/validate", requireAuth, (req, res) => {
  const { kind, frontmatter } = req.body ?? {};
  if (!ENTRY_KINDS[kind]) return res.status(400).json({ error: "Unknown kind." });
  res.json(validate(kind, frontmatter ?? {}));
});

app.post("/api/save", requireAuth, async (req, res) => {
  const { kind, path: originalPath, frontmatter, body, expectedMtime } = req.body ?? {};
  if (!ENTRY_KINDS[kind]) return res.status(400).json({ error: "Unknown kind." });

  const result = validate(kind, frontmatter ?? {});
  if (!result.ok) return res.status(422).json({ error: "Invalid frontmatter.", errors: result.errors });

  const data = result.data;

  // Where should this live? <topic>/<slug>.md, unless an explicit path is given.
  let slug = slugify(data.slug || data.title || "");
  if (!slug) return res.status(422).json({ error: "Could not derive a filename slug from the title." });

  // Keep the existing filename when editing, so that changing a title does not
  // silently move the file (and break incoming links) unless asked to.
  const keepSlug = Boolean(originalPath) && !req.body.renameFile;
  if (keepSlug) {
    const base = originalPath.slice(originalPath.lastIndexOf("/") + 1).replace(/\.md$/i, "");
    if (base) slug = base;
  }

  const targetPath = buildEntryPath(kind, data.topic, slug);

  try {
    // Optimistic concurrency: if the file changed since it was loaded, make the
    // user confirm rather than silently clobbering an edit from another editor.
    if (originalPath && expectedMtime && !req.body.force) {
      try {
        const stat = await fs.stat(path.join(ROOT, ENTRY_KINDS[kind].dir, originalPath));
        if (stat.mtimeMs > Number(expectedMtime) + 1) {
          return res.status(409).json({
            error: "This file changed on disk since you opened it. Reload it, or save again to overwrite.",
            conflict: true,
          });
        }
      } catch {
        /* file vanished; treat as a fresh write */
      }
    }

    if (targetPath !== originalPath && (await pathExists(kind, targetPath))) {
      return res.status(409).json({
        error: `An entry already exists at ${targetPath}. Rename the title, or delete the other entry first.`,
        conflict: true,
      });
    }

    const written = await writeEntry(kind, targetPath, { ...data, slug }, body);

    // A topic change moves the file between folders.
    if (originalPath && originalPath !== written) {
      await deleteEntry(kind, originalPath);
    }

    const stat = await fs.stat(path.join(ROOT, ENTRY_KINDS[kind].dir, written));
    res.json({ ok: true, path: written, mtime: stat.mtimeMs, frontmatter: { ...data, slug } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/delete", requireAuth, async (req, res) => {
  const { kind, path: relPath } = req.body ?? {};
  if (!ENTRY_KINDS[kind]) return res.status(400).json({ error: "Unknown kind." });
  try {
    const removed = await deleteEntry(kind, relPath);
    res.json({ ok: true, path: removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/rename", requireAuth, async (req, res) => {
  const { kind, path: from, newSlug } = req.body ?? {};
  if (!ENTRY_KINDS[kind]) return res.status(400).json({ error: "Unknown kind." });
  try {
    const slug = slugify(newSlug);
    if (!slug) return res.status(422).json({ error: "That is not a usable slug." });
    const entry = await readEntry(kind, from);
    const to = buildEntryPath(kind, entry.frontmatter.topic, slug);
    if (await pathExists(kind, to)) {
      return res.status(409).json({ error: `An entry already exists at ${to}.` });
    }
    await moveEntry(kind, from, to);
    res.json({ ok: true, path: to });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------- images -- */

app.get("/api/images", requireAuth, async (_req, res) => {
  res.json({ images: await listImages() });
});

app.post("/api/images", requireAuth, async (req, res) => {
  const { name, dataUrl } = req.body ?? {};
  try {
    res.json(await saveImage(name, dataUrl));
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

/* ---------------------------------------------------------------------- git -- */

app.get("/api/git/status", requireAuth, async (_req, res) => {
  const [status, recent] = await Promise.all([git.status(), git.log(10)]);
  res.json({ ...status, recentCommits: recent });
});

app.get("/api/git/diff", requireAuth, async (req, res) => {
  res.json(await git.diff(req.query.file ? String(req.query.file) : undefined));
});

app.post("/api/git/commit", requireAuth, async (req, res) => {
  const message = String(req.body?.message ?? "").trim();
  if (!message) return res.status(422).json({ error: "A commit message is required." });
  res.json(await git.commit(message, { stage: req.body?.stage !== false }));
});

app.post("/api/git/push", requireAuth, async (_req, res) => {
  res.json(await git.push());
});

app.post("/api/git/init", requireAuth, async (_req, res) => {
  res.json(await git.initRepo());
});

/* ------------------------------------------------------------------- static -- */

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
app.use(express.static(publicDir, { index: "index.html", extensions: ["html"] }));

app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "No such endpoint." });
  res.status(404).sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, HOST, () => {
  // Show the base path: "Site preview http://localhost:4321" alone is misleading,
  // since that URL is the 404 page rather than the site.
  const devUp = `http://localhost:${ASTRO_PORT}${BASE_PATH}`;
  console.log(
    [
      "",
      "  Vault admin panel",
      `  ─────────────────────────────────────────────`,
      `  Admin panel   http://${HOST}:${PORT}`,
      `  Site preview  ${devUp}   (run: pnpm dev)`,
      "",
      `  Repository    ${ROOT}`,
      `  Auth          password from ADMIN_PASSWORD, session lasts ${SESSION_HOURS}h`,
      "",
      "  Press Ctrl+C to stop.",
      "",
    ].join("\n"),
  );
});
