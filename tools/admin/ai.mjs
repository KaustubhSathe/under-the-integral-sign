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
 * Parse the model's reply into an entry object.
 *
 * JSON mode usually gives clean JSON, but three things still go wrong in practice,
 * and each gets a message that says which one happened rather than a blanket
 * "not parseable":
 *
 *  1. the reply was cut off by max_tokens, so the object is incomplete;
 *  2. it is wrapped in a ```json fence despite being told not to;
 *  3. there is stray prose around the object, or a trailing comma.
 *
 * `truncated` comes from the API's finish_reason, which is far more reliable than
 * guessing from the text.
 */
export function parseEntryJson(raw, { truncated = false } = {}) {
  let text = String(raw).trim();

  // Strip a code fence, with or without a language tag.
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(text);
  if (fence) text = fence[1].trim();

  const strict = [
    ["as-is", () => JSON.parse(text)],
    // Trailing commas before a closing brace or bracket.
    ["without trailing commas", () => JSON.parse(text.replace(/,(\s*[}\]])/g, "$1"))],
    // Prose before or after the object: take the outermost braces.
    [
      "outermost braces",
      () => {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start === -1 || end <= start) throw new Error("no object");
        return JSON.parse(text.slice(start, end + 1));
      },
    ],
  ];

  // A truncated object cannot be parsed strictly, so these run last and are
  // reported as partial: the caller must tell the user the entry is incomplete.
  const salvage = [
    ["repaired truncation", () => JSON.parse(repairTruncatedJson(text, { dropKeys: false }))],
    ["repaired truncation (key dropped)", () => JSON.parse(repairTruncatedJson(text, { dropKeys: true }))],
  ];

  const failures = [];

  const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

  for (const [label, attempt] of strict) {
    try {
      const value = attempt();
      if (isObject(value)) return { entry: value, partial: false };
      failures.push(`${label}: not an object`);
    } catch (err) {
      failures.push(`${label}: ${err.message}`);
    }
  }

  for (const [label, attempt] of salvage) {
    try {
      const value = attempt();
      if (isObject(value)) return { entry: value, partial: true };
      failures.push(`${label}: not an object`);
    } catch (err) {
      failures.push(`${label}: ${err.message}`);
    }
  }

  if (truncated) {
    throw new Error(
      "The reply was cut off before it finished (the model hit its output limit) and could not be recovered. " +
        "Ask for a shorter write-up, or split the problem, then try again.",
    );
  }

  const preview = text.length > 200 ? text.slice(0, 200) + "…" : text;
  throw new Error(
    `The model's reply was not usable JSON (${failures.join("; ")}). It began: ${JSON.stringify(preview)}`,
  );
}

/**
 * Close an object that was cut off mid-flight.
 *
 * Cuts back to the last COMMA-separated boundary — a complete field, or the start
 * of an incomplete one — then closes any open string, array and object.
 *
 * `dropKeys` also removes a trailing `"key":` with no value, which is what is left
 * when the cut landed inside a value's text. Without it, a cut inside a value
 * leaves a dangling key and the result still will not parse.
 *
 * Only a salvage path, used after every strict parse has failed.
 */
function repairTruncatedJson(text, { dropKeys = false } = {}) {
  const start = text.indexOf("{");
  if (start === -1) return text;
  let s = text.slice(start);

  if (dropKeys) s = s.replace(/,\s*"[^"]*"\s*:\s*$/, "").replace(/"[^"]*"\s*:\s*$/, "");

  const cut = s.lastIndexOf(",");
  if (cut > 0) s = s.slice(0, cut);

  // Recount on the trimmed text so the closers match exactly what is open.
  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  return s + (inString ? '"' : "") + stack.reverse().join("");
}

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
 * The system instruction: who the model is and what shape the reply must take.
 *
 * Sent as a `system` message rather than folded into the user turn, because
 * instruction-following on a long, rule-heavy brief is markedly better that way.
 *
 * Explicit about the JSON keys because JSON mode guarantees valid JSON but not
 * the keys we need. The taxonomy is injected so difficulty, exam and section come
 * back as values the vault understands rather than invented ones.
 */
export function buildSystemPrompt({ kind, difficulties, exams, theorySections }) {
  const isProblem = kind === "problems";

  return `You are the writing assistant for a personal mathematics vault. The vault is a
static site: each entry is one Markdown file with YAML frontmatter, and only the
Markdown body is rendered through KaTeX.

Your job is to produce ONE complete, publication-ready vault entry: a correct full
solution, plus every frontmatter field, filled properly. Nothing is left as a
placeholder for the author to finish.

## Mathematics first

- Solve the problem completely. A reader should be able to follow every step
  without filling a gap themselves.
- Never skip algebra because it seems routine. Show substitutions, show the
  limits being taken, show the integration by parts.
- Justify each non-obvious step — why a swap is legal, why a series converges,
  why a substitution is valid on the interval.
- State any theorem you invoke by name and check its hypotheses.
- If a photograph or statement is ambiguous, solve the most reasonable reading
  and say in the body which reading you took. Never silently invent a condition.
- If you genuinely cannot complete a step, say so plainly in the body at that
  point. A flagged gap is useful; a fabricated step is not.

## Frontmatter rules

EVERY field except "body" is PLAIN TEXT. Those values are shown as literal
strings in cards, listings and navigation, and are NEVER rendered as maths, so
"$...$" in one of them reaches the reader as raw LaTeX. Write mathematics in
those fields with Unicode and words: π/4, ∫₀¹, x², √2, θ, n! / k!.

## Reply format

Reply with a single JSON object and nothing else. No prose before or after, no
Markdown code fence.

{
  "title": string,      // one line, plain text, states the problem. Mention the
                        // striking feature when there is one: "A hundredth power
                        // of tan, and why the answer is still π/4"
  "summary": string,    // ONE sentence, plain text, no LaTeX. What is this
                        // really asking?
  "keyIdea": string,    // PLAIN TEXT, no LaTeX. The single insight that unlocks
                        // it, one or two sentences. The most valuable field here.
  "answer": string,     // PLAIN TEXT, no LaTeX: "pi/4", "1/2", "n!/k!". Empty
                        // string only if there is no closed form.
  "tags": string[],     // 3-6 lowercase hyphenated tags describing the
                        // MATHEMATICS: the technique and the object. Prefer the
                        // vault's existing tags listed below.
${isProblem
      ? `  "difficulty": string, // exactly one of ${difficulties.map((d) => `"${d}"`).join(", ")}
  "exam": string,       // where it came from, exactly one of
                        // ${exams.map((e) => `"${e}"`).join(", ")}
                        // Use "own" unless the source is genuinely evident from
                        // the prompt or a contest heading in the image. Never
                        // guess a competition.`
      : `  "section": string,    // exactly one of ${theorySections.map((s) => `"${s}"`).join(", ")}`}
  "body": string        // the Markdown body described below. This is the ONLY
                        // field rendered as maths, so use $...$ inline and
                        // $$...$$ for display.
}

Every field is required. Never return null, never omit a key, never leave a
string empty unless this brief explicitly allows it.

## Body

${isProblem
      ? `Use exactly these three headings, in this order:

## Problem
The statement, fully self-contained: every condition, domain and quantifier. A
reader who has not seen the original must be able to attempt it from this alone.

## Solution
The complete worked solution. Use display maths ($$...$$) for anything that
deserves its own line, and inline maths ($...$) inside sentences. Break long
arguments into short paragraphs. Name the technique at the point you use it.

## Key idea
Restate the key idea in a sentence or two, then say where else this trick applies
and what its limits are.`
      : `Use exactly these three headings, in this order:

## Statement
The precise statement, with every hypothesis.

## Proof
A complete proof, no gaps. Name each result you invoke.

## When to use it
The situations this tool is for, worked as a rule of thumb, and where it fails.`}

## Reference: tags already used in this vault

integrals, definite-integrals, riemann-sums, symmetry, king-property,
trigonometric-substitution, telescoping, limits, integration-bee,
substitution, integration-by-parts, improper-integrals, reduction-formula.

Reuse these where they genuinely fit; add a new lowercase-hyphenated tag when the
mathematics needs it.`;
}

/** The user turn: the actual request, plus the photo when one is attached. */
export function buildUserPrompt(prompt) {
  return `Write the vault entry for this:

"""
${prompt}
"""

If a photograph is attached, read the mathematics from it: transcribe the
statement exactly, including every given condition, then solve it. If any symbol
or condition is unclear, say which reading you took in the body.`;
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

  // The brief goes in a system message; only the request itself is the user turn.
  // DeepSeek rejects images in system messages, so the photo has to go here.
  const userContent = [{ type: "text", text: buildUserPrompt(effectivePrompt) }];

  if (image) {
    const parsed = parseDataUrl(image);
    if (!parsed || parsed.error) throw new Error(parsed?.error ?? "That image could not be read.");
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${parsed.mime};base64,${parsed.base64}` },
    });
  }

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt({ kind, difficulties, exams, theorySections }) },
      { role: "user", content: userContent },
    ],
    // JSON mode guarantees syntactically valid JSON; the prompt pins the keys.
    // It also requires the word "json" somewhere in the messages, which it is.
    response_format: { type: "json_object" },
    temperature: 0.2,
    /*
     * A full worked solution plus frontmatter runs long. At 8192 a thorough
     * answer could be cut off mid-JSON, and a truncated object is unparseable —
     * which surfaced to the user as "not parseable as JSON". Flash allows far
     * more than this, so the ceiling is raised well clear of a long entry.
     */
    max_tokens: 32768,
  };

  let payload = null;
  let lastEmpty = false;
  let lastTruncated = false;

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

    const choice = parsed?.choices?.[0];
    const content = choice?.message?.content;
    if (content) {
      payload = parsed;
      // "length" means the reply hit max_tokens, so the JSON is almost certainly
      // cut off. Worth knowing before trying to parse it.
      lastTruncated = choice?.finish_reason === "length";
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

  const { entry, partial } = parseEntryJson(raw, { truncated: lastTruncated });

  const usage = payload.usage ?? {};
  return {
    // `partial` means the reply was cut off and salvaged: the entry is usable but
    // incomplete, and the caller must say so rather than pass it off as finished.
    partial,
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
