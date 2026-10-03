/**
 * DeepSeek client for the admin panel's "AI entry" workflow.
 *
 * Runs on the SERVER only, because the API key must never reach the browser. The
 * panel is local-only, but it is still served over HTTP and anything handed to
 * the client is readable in devtools.
 *
 * Model: `deepseek-flash`, which is DeepSeek-V4.1-Flash. It is the only current
 * model with vision support (deepseek-v4-pro explicitly does not accept images),
 * so it also handles text-only requests — no reason to route those elsewhere when
 * the price is the same and the code stays single-path.
 *
 * API shape (OpenAI-compatible):
 *   POST https://api.deepseek.com/chat/completions
 *   Authorization: Bearer <key>
 *   { model, messages: [{ role: "user", content: [ {type:"text"}, {type:"image_url"} ] }],
 *     response_format: { type: "json_object" } }
 *
 * Images go in as a base64 `data:` URL. Limits from the docs: 48 MiB request
 * body, 32 MiB per inline image, JPEG/PNG/GIF/WebP only.
 */

const API_BASE = process.env.DEEPSEEK_API_BASE ?? "https://api.deepseek.com";
const MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-flash";

/** Inline images count toward a 48 MiB request body; stay well under it. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const str = (v) => (v === null || v === undefined ? "" : String(v).trim());

/**
 * JSON mode sometimes comes back with empty content — the docs call this out as a
 * known issue — so one silent retry is worth it before surfacing an error.
 */
const EMPTY_REPLY_RETRIES = 1;

export const aiConfigured = () => Boolean(process.env.DEEPSEEK_API_KEY);

export const aiModel = () => MODEL;

/**
 * Split a `data:` URL into its mime type and base64 payload.
 * Returns null when the string is not a usable inline image.
 */
export function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) return { error: `Unsupported image type ${mime}. Use JPEG, PNG, GIF or WebP.` };
  const base64 = m[2].replace(/\s+/g, "");
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) {
    return { error: `Image is ${(bytes / 1048576).toFixed(1)} MB; keep it under ${MAX_IMAGE_BYTES / 1048576} MB.` };
  }
  return { mime, base64, bytes };
}

/**
 * The instruction sent to the model. Deliberately explicit about the JSON shape:
 * JSON mode guarantees valid JSON but not the *keys* we need, so they are spelled
 * out. The taxonomy is injected so tags and difficulty come back usable rather
 * than invented.
 */
export function buildPrompt({ kind, prompt, topics, difficulties, exams, theorySections }) {
  const isProblem = kind === "problems";

  return `You are helping write an entry for a personal mathematics vault. The vault is a
static site where each entry is one Markdown file with YAML frontmatter, and the
body is rendered with KaTeX, so inline maths must be $...$ and display maths $$...$$.

The user's request:
"""
${prompt}
"""

If an image is attached, read the mathematics from it — transcribe the statement
exactly, including any given conditions, and solve it.

Reply with a single JSON object and nothing else, with these keys:

- "title": string. The problem or theorem, stated in one line.
- "summary": string. One sentence, plain text, NO LaTeX, describing what is
  really being asked.
- "keyIdea": string. PLAIN TEXT, no LaTeX. The single insight that unlocks it,
  in one or two sentences. This is the most valuable field in the vault.
- "answer": string. PLAIN TEXT, no LaTeX. For example "pi/4", "1/2", "n! / k!".
  Empty string if the result is not a simple closed form.
- "tags": array of 2-6 lowercase hyphenated strings, e.g. ["definite-integrals",
  "symmetry", "king-property"].
${isProblem ? `- "difficulty": one of ${difficulties.map((d) => `"${d}"`).join(", ")}.
- "exam": where the problem came from, one of ${exams.map((e) => `"${e}"`).join(", ")}.
  Use "own" unless the source is actually evident — from the prompt, or from a
  contest heading visible in the image. Do not guess a competition.` : `- "section": one of ${theorySections.map((s) => `"${s}"`).join(", ")}.`}
- "body": string. The Markdown body, WITHOUT the frontmatter block.

Write the body${
    isProblem
      ? ` in exactly these sections:

## Problem
The statement, self-contained.

## Solution
A complete, rigorous worked solution. Do not skip algebra. Show why each step is
valid. Use display maths for anything long enough to deserve its own line.

## Key idea
Restate the key idea and say when this trick applies more generally.`
      : ` in exactly these sections:

## Statement
The precise statement.

## Proof
A complete proof, with no gaps.

## When to use it
The situations this tool is for, and where it fails.`
  }

Requirements:
- Be mathematically correct. If you are unsure of a step, say so in the body
  rather than inventing it.
- Do not wrap the JSON in a Markdown code fence.
- Do not add commentary outside the JSON object.

Available tags in this vault for reference (reuse these where they fit, and add
new ones only if needed): integrals, definite-integrals, riemann-sums, symmetry,
king-property, trigonometric-substitution, telescoping, limits, integration-bee.`;
}

/**
 * Call DeepSeek and return the parsed entry object.
 *
 * Throws an Error whose message is safe to show in the UI.
 */
export async function generateEntry({ kind, prompt, image, topics, difficulties, exams, theorySections }) {
  // Validate what the user can fix before complaining about configuration, or a
  // blank prompt gets blamed on a missing key.
  if (!prompt?.trim() && !image) throw new Error("Describe the entry, or attach a photo.");

  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set. Add it to .env and restart the admin panel.");

  // A photo alone is a valid request; the model can read the problem from it.
  const effectivePrompt = prompt?.trim() || "Read the mathematics in the attached image and write it up.";

  const content = [
    { type: "text", text: buildPrompt({ kind, prompt: effectivePrompt, topics, difficulties, exams, theorySections }) },
  ];

  if (image) {
    const parsed = parseDataUrl(image);
    if (!parsed || parsed.error) throw new Error(parsed?.error ?? "That image could not be read.");
    content.push({
      type: "image_url",
      image_url: { url: `data:${parsed.mime};base64,${parsed.base64}` },
    });
  }

  const body = {
    model: MODEL,
    messages: [{ role: "user", content }],
    // JSON mode guarantees syntactically valid JSON; the prompt pins the keys.
    // It also requires the word "json" to appear in the prompt, which it does.
    response_format: { type: "json_object" },
    temperature: 0.2,
    // Generous, because the docs warn that a truncated JSON string is unusable.
    max_tokens: 8192,
  };

  let payload = null;
  let lastEmpty = false;

  for (let attempt = 0; attempt <= EMPTY_REPLY_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch(`${API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`Could not reach ${API_BASE}: ${err.message}`);
    }

    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Unexpected non-JSON reply from DeepSeek (HTTP ${res.status}).`);
    }

    if (!res.ok) {
      const detail = parsed?.error?.message ?? text.slice(0, 300);
      if (res.status === 401) throw new Error("DeepSeek rejected the API key. Check DEEPSEEK_API_KEY.");
      if (res.status === 402) throw new Error("DeepSeek says the account has insufficient balance.");
      if (res.status === 429) throw new Error("Rate limited by DeepSeek. Wait a moment and retry.");
      throw new Error(`DeepSeek error (HTTP ${res.status}): ${detail}`);
    }

    const content = parsed?.choices?.[0]?.message?.content;
    if (content) {
      payload = parsed;
      break;
    }
    // Known JSON-mode quirk: an empty completion. Retry once before giving up.
    lastEmpty = true;
  }

  if (!payload) {
    throw new Error(
      lastEmpty
        ? "DeepSeek returned an empty reply (a known JSON-mode quirk). Press Generate again."
        : "DeepSeek returned an empty response.",
    );
  }

  const raw = payload.choices[0].message.content;

  // JSON mode should make this clean, but a stray code fence is cheap to survive.
  const cleaned = String(raw).trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();

  let entry;
  try {
    entry = JSON.parse(cleaned);
  } catch {
    throw new Error("The model's reply was not parseable as JSON. Try again, or simplify the prompt.");
  }

  const usage = payload.usage ?? {};
  return {
    entry: {
      title: str(entry.title),
      summary: str(entry.summary),
      keyIdea: str(entry.keyIdea),
      answer: str(entry.answer),
      tags: Array.isArray(entry.tags) ? entry.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
      difficulty: str(entry.difficulty),
      exam: str(entry.exam),
      section: str(entry.section),
      body: typeof entry.body === "string" ? entry.body.trim() : "",
    },
    usage: {
      model: payload.model ?? MODEL,
      inputTokens: usage.prompt_tokens ?? null,
      outputTokens: usage.completion_tokens ?? null,
    },
  };
}
