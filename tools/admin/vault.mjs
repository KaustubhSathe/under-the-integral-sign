/**
 * Filesystem layer for the admin panel.
 *
 * Every path that comes from the browser is treated as untrusted: slugs are
 * sanitised and the final resolved path is checked to be inside the vault. The
 * admin panel is local-only, but a stray `../` should never be able to write
 * outside the repository.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { ENTRY_KINDS, toYaml } from "./schema.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CONTENT_DIR = path.join(ROOT, "content");
export const IMAGES_DIR = path.join(ROOT, "public", "images");
/** Must match `base` in astro.config.mjs so inline image links resolve. */
export const SITE_BASE = process.env.PUBLIC_BASE_PATH ?? "/under-the-integral-sign";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"]);

/** "Cauchy–Schwarz & Titu" -> "cauchy-schwarz-titu" */
export function slugify(input) {
  return String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Reject anything that is not a safe, slash-separated relative path. */
export function safeRelPath(rel) {
  const cleaned = String(rel ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleaned || cleaned.includes("\0")) throw new Error("Empty or invalid path.");
  const parts = cleaned.split("/");
  if (parts.some((p) => p === "" || p === "." || p === "..")) {
    throw new Error("Path may not contain '.' or '..' segments.");
  }
  if (!/\.md$/i.test(cleaned)) throw new Error("Only .md files may be written.");
  return parts.join("/");
}

/**
 * Where an entry lives: content/<kind>/<topic>/<slug>.md
 * The topic folder keeps the tree browsable on GitHub, which is the whole point
 * of storing the vault as plain files.
 */
export function buildEntryPath(kind, topic, slug) {
  if (!ENTRY_KINDS[kind]) throw new Error(`Unknown kind: ${kind}`);
  const safeTopic = slugify(topic ?? "") || "unsorted";
  const safeSlug = slugify(slug ?? "");
  if (!safeSlug) throw new Error("Empty slug.");
  return `${safeTopic}/${safeSlug}.md`;
}

/** Resolve a content-relative path and prove it stays inside `content/`. */
function resolveContentFile(kind, relPath) {
  const kindDir = path.join(CONTENT_DIR, kind);
  const safe = safeRelPath(relPath);
  const abs = path.resolve(kindDir, safe);
  const rootWithSep = path.resolve(kindDir) + path.sep;
  if (!abs.startsWith(rootWithSep)) throw new Error("Refusing to write outside the content directory.");
  return { abs, rel: safe };
}

async function walk(dir, base = "") {
  let out = [];
  let items = [];
  try {
    items = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const item of items) {
    const rel = base ? `${base}/${item.name}` : item.name;
    if (item.isDirectory()) {
      out = out.concat(await walk(path.join(dir, item.name), rel));
    } else if (item.isFile() && /\.md$/i.test(item.name) && !item.name.startsWith("_")) {
      out.push(rel);
    }
  }
  return out;
}

/** List every entry of a kind, with its frontmatter, for the sidebar. */
export async function listEntries(kind) {
  if (!ENTRY_KINDS[kind]) throw new Error(`Unknown kind: ${kind}`);
  const dir = path.join(CONTENT_DIR, kind);
  const files = await walk(dir);
  const entries = [];
  for (const rel of files) {
    const abs = path.join(dir, rel);
    try {
      const raw = await fs.readFile(abs, "utf8");
      const { data } = matter(raw);
      const stat = await fs.stat(abs);
      entries.push({
        kind,
        path: rel,
        slug: rel.replace(/\.md$/i, ""),
        title: typeof data.title === "string" ? data.title : rel.replace(/\.md$/i, ""),
        topic: data.topic ?? "",
        difficulty: data.difficulty ?? "",
        exam: data.exam ?? "",
        section: data.section ?? "",
        status: data.status ?? "",
        draft: data.draft === true,
        updated: (data.updated ?? data.date ?? stat.mtime) instanceof Date
          ? (data.updated ?? data.date ?? stat.mtime).toISOString().slice(0, 10)
          : String(data.updated ?? data.date ?? ""),
      });
    } catch (err) {
      entries.push({
        kind,
        path: rel,
        slug: rel.replace(/\.md$/i, ""),
        title: rel,
        error: `Could not read frontmatter: ${err.message}`,
      });
    }
  }
  return entries;
}

/** Read one entry: parsed frontmatter plus the markdown body. */
export async function readEntry(kind, relPath) {
  const { abs, rel } = resolveContentFile(kind, relPath);
  const raw = await fs.readFile(abs, "utf8");
  const { data, content } = matter(raw);
  return { kind, path: rel, frontmatter: data, body: content.replace(/^\s*\n/, "") };
}

/** Write (create or overwrite) an entry. Returns the path actually written. */
export async function writeEntry(kind, relPath, frontmatter, body) {
  const { abs, rel } = resolveContentFile(kind, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });

  /*
   * Strip `slug` here, at the single choke point every write goes through.
   *
   * Astro's glob loader treats a frontmatter slug as the entry's entire id, so
   * writing one collapses the URL from /problems/<topic>/<slug>/ to
   * /problems/<slug>/ and silently drops the topic segment. That has now been
   * introduced three separate times by three different call sites, so removing it
   * from the payload is more reliable than remembering not to add it.
   *
   * The file path is the only thing that says where an entry lives.
   */
  const { slug: _discarded, ...fields } = frontmatter ?? {};

  const yaml = toYaml(fields);
  const text = `---\n${yaml}\n---\n\n${String(body ?? "").trimStart()}`;
  const normalised = text.endsWith("\n") ? text : `${text}\n`;
  await fs.writeFile(abs, normalised, "utf8");
  return rel;
}

export async function deleteEntry(kind, relPath) {
  const { abs, rel } = resolveContentFile(kind, relPath);
  await fs.unlink(abs);
  // Remove now-empty topic directories so the tree does not fill with husks.
  let dir = path.dirname(abs);
  const kindDir = path.resolve(path.join(CONTENT_DIR, kind));
  while (dir.startsWith(kindDir + path.sep)) {
    const remaining = await fs.readdir(dir);
    if (remaining.length > 0) break;
    await fs.rmdir(dir);
    dir = path.dirname(dir);
  }
  return rel;
}

/** Move an entry (used when the topic — and therefore the folder — changes). */
export async function moveEntry(kind, fromPath, toPath) {
  const from = resolveContentFile(kind, fromPath);
  const to = resolveContentFile(kind, toPath);
  if (from.abs === to.abs) return to.rel;
  await fs.mkdir(path.dirname(to.abs), { recursive: true });
  await fs.rename(from.abs, to.abs);
  return to.rel;
}

export async function pathExists(kind, relPath) {
  try {
    const { abs } = resolveContentFile(kind, relPath);
    await fs.access(abs);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ images -- */

export async function listImages() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  const items = await fs.readdir(IMAGES_DIR, { withFileTypes: true });
  const out = [];
  for (const item of items) {
    if (!item.isFile()) continue;
    if (!IMAGE_EXTENSIONS.has(path.extname(item.name).toLowerCase())) continue;
    const stat = await fs.stat(path.join(IMAGES_DIR, item.name));
    out.push({
      name: item.name,
      size: stat.size,
      url: `${SITE_BASE}/images/${encodeURIComponent(item.name)}`,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Save an uploaded image. Returns the public URL to paste into markdown.
 * `dataUrl` is a base64 data URL from the browser (works for paste and drop).
 */
export async function saveImage(name, dataUrl) {
  const match = /^data:([a-z0-9.+/-]+);base64,(.+)$/i.exec(String(dataUrl ?? ""));
  if (!match) throw new Error("Expected a base64 data URL.");
  const [, mime, b64] = match;

  const extByMime = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
  };
  const ext = extByMime[mime.toLowerCase()] ?? path.extname(String(name)).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) throw new Error(`Unsupported image type: ${mime}`);

  const base = slugify(path.basename(String(name ?? "image"), path.extname(String(name ?? "")))) || "image";
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  let candidate = `${base}${ext}`;
  let n = 1;
  while (await fileExists(path.join(IMAGES_DIR, candidate))) {
    candidate = `${base}-${n}${ext}`;
    n += 1;
  }

  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > 8 * 1024 * 1024) throw new Error("Image is larger than 8 MB.");
  await fs.writeFile(path.join(IMAGES_DIR, candidate), buffer);
  return { name: candidate, url: `${SITE_BASE}/images/${encodeURIComponent(candidate)}` };
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
