/**
 * Thin wrapper around the git CLI.
 *
 * Deliberately shells out to `git` rather than using a JS implementation: the
 * vault is committed to a real repository with your real credentials (SSH agent,
 * credential manager), so pushing behaves exactly as it does in your terminal.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ROOT } from "./vault.mjs";

const run = promisify(execFile);

async function git(args, { timeout = 30_000 } = {}) {
  try {
    const { stdout, stderr } = await run("git", args, {
      cwd: ROOT,
      timeout,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
      env: {
        ...process.env,
        // Never block waiting for a password in a non-interactive context.
        GIT_TERMINAL_PROMPT: "0",
      },
    });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    return {
      ok: false,
      stdout: String(err.stdout ?? "").trim(),
      stderr: String(err.stderr ?? err.message ?? "").trim(),
      code: err.code,
    };
  }
}

export async function isRepo() {
  const r = await git(["rev-parse", "--is-inside-work-tree"]);
  return r.ok && r.stdout === "true";
}

export async function status() {
  if (!(await isRepo())) {
    return { isRepo: false, initialized: false, files: [], branch: "", ahead: 0, behind: 0 };
  }

  const [branchRes, porcelain, upstream] = await Promise.all([
    git(["rev-parse", "--abbrev-ref", "HEAD"]),
    git(["status", "--porcelain=v1", "--untracked-files=all"]),
    git(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]),
  ]);

  const files = porcelain.stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const code = line.slice(0, 2);
      const file = line.slice(3).trim();
      return {
        file,
        code,
        // Porcelain v1: X = index status, Y = worktree status.
        status: describeStatus(code),
        staged: code[0] !== " " && code[0] !== "?",
      };
    });

  let ahead = 0;
  let behind = 0;
  if (upstream.ok) {
    const [a, b] = upstream.stdout.split(/\s+/).map(Number);
    ahead = Number.isFinite(a) ? a : 0;
    behind = Number.isFinite(b) ? b : 0;
  }

  let remote = "";
  const remoteRes = await git(["remote", "get-url", "origin"]);
  if (remoteRes.ok) remote = remoteRes.stdout;

  return {
    isRepo: true,
    initialized: true,
    branch: branchRes.stdout || "(detached)",
    remote,
    hasUpstream: upstream.ok,
    ahead,
    behind,
    files,
  };
}

function describeStatus(code) {
  if (code === "??") return "new";
  if (code.includes("D")) return "deleted";
  if (code.includes("R")) return "renamed";
  if (code.includes("A")) return "added";
  if (code.includes("M")) return "modified";
  return "changed";
}

/** Unified diff of unstaged + staged changes, optionally for one file. */
export async function diff(file) {
  const args = ["diff", "HEAD", "--", ...(file ? [file] : [])];
  const r = await git(args);
  if (!r.ok) return { ok: false, text: r.stderr || "git diff failed" };
  // Cap the payload: a huge diff would freeze the browser.
  const text = r.stdout.length > 200_000 ? `${r.stdout.slice(0, 200_000)}\n\n… diff truncated …` : r.stdout;
  return { ok: true, text };
}

export async function stageAll() {
  return git(["add", "-A"]);
}

export async function commit(message, { stage = true } = {}) {
  if (stage) {
    const add = await git(["add", "-A"]);
    if (!add.ok) return { ok: false, message: add.stderr || "git add failed" };
  }
  const r = await git(["commit", "-m", message], { timeout: 60_000 });
  if (!r.ok) {
    const msg = `${r.stdout}\n${r.stderr}`.trim();
    if (/nothing to commit/i.test(msg)) {
      return { ok: false, message: "Nothing to commit — the working tree is clean." };
    }
    return { ok: false, message: msg || "git commit failed" };
  }
  const hash = await git(["rev-parse", "--short", "HEAD"]);
  return { ok: true, message: `${r.stdout}\n${r.stderr}`.trim(), hash: hash.stdout };
}

export async function push() {
  const upstream = await git(["rev-parse", "--abbrev-ref", "@{upstream}"]);
  const args = upstream.ok ? ["push"] : ["push", "--set-upstream", "origin", "HEAD"];
  const r = await git(args, { timeout: 120_000 });
  if (!r.ok) {
    const msg = `${r.stderr}\n${r.stdout}`.trim();
    return {
      ok: false,
      message: /could not read Username|Authentication failed|Permission denied/i.test(msg)
        ? `${msg}\n\nHint: the admin panel cannot answer a password prompt. Push once from a terminal (git push) so your credential manager or SSH agent caches the credentials, then try again.`
        : msg || "git push failed",
    };
  }
  return { ok: true, message: `${r.stdout}\n${r.stderr}`.trim() || "Pushed." };
}

export async function log(limit = 12) {
  const r = await git([
    "log",
    `-${limit}`,
    "--date=short",
    "--pretty=format:%h\t%ad\t%s",
  ]);
  if (!r.ok) return [];
  return r.stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, date, ...rest] = line.split("\t");
      return { hash, date, subject: rest.join("\t") };
    });
}

export async function initRepo() {
  const r = await git(["init"]);
  if (!r.ok) return r;
  await git(["symbolic-ref", "HEAD", "refs/heads/main"]);
  return { ok: true, stdout: r.stdout || "Initialised an empty repository on branch main." };
}
