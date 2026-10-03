/**
 * Shared field definitions for the vault.
 *
 * This is the single source of truth for
 *   (a) what the admin panel renders as form fields,
 *   (b) what the admin panel validates before writing a file,
 *   (c) what shape the YAML frontmatter must have.
 *
 * It mirrors src/content.config.ts and src/lib/taxonomy.ts. The admin panel does
 * not import the site's TypeScript, so when you change a list here, change it in
 * BOTH places:
 *   - topics + subtopics → src/lib/taxonomy.ts
 *   - fields             → src/content.config.ts
 */

/**
 * topic → subtopics. Every subtopic belongs to exactly one topic, and entry URLs
 * are /problems|theory/<topic>/<subtopic>/<slug>/.
 */
export const TAXONOMY = {
  calculus: {
    label: "Calculus",
    subtopics: [{ value: "integrals", label: "Integrals" }],
  },
};

/** Flat list of {value,label} for the topic select. */
export const TOPICS = Object.entries(TAXONOMY).map(([value, t]) => ({
  value,
  label: t.label,
}));

/** Subtopics for a topic, as {value,label}[]. */
export function subtopicsFor(topic) {
  const entry = TAXONOMY[topic];
  if (!entry) return [];
  return entry.subtopics ?? [];
}

export const DIFFICULTIES = [
  { value: "warmup", label: "Warm-up (★)" },
  { value: "standard", label: "Standard (★★)" },
  { value: "hard", label: "Hard (★★★)" },
  { value: "brutal", label: "Brutal (★★★★)" },
  { value: "research", label: "Research flavour (★★★★★)" },
];

/**
 * Where a problem came from. Orthogonal to topic/subtopic — it records the
 * contest, not the mathematics — and drives the site's /exam/<value>/ pages.
 */
export const EXAM_TYPES = [
  { value: "jee-advanced", label: "JEE Advanced" },
  { value: "jee-main", label: "JEE Main" },
  { value: "rmo", label: "RMO" },
  { value: "inmo", label: "INMO" },
  { value: "imo", label: "IMO" },
  { value: "putnam", label: "Putnam" },
  { value: "integration-bee", label: "Integration Bee" },
  { value: "undergrad", label: "Undergraduate" },
  { value: "olympiad-other", label: "Other olympiad" },
  { value: "textbook", label: "Textbook" },
  { value: "own", label: "Own problem" },
];

export const THEORY_SECTIONS = [
  { value: "notes", label: "Notes" },
  { value: "lemma", label: "Lemma" },
  { value: "theorem", label: "Theorem" },
  { value: "technique", label: "Technique" },
  { value: "cheatsheet", label: "Cheatsheet" },
  { value: "book-notes", label: "Book notes" },
];

export const STATUSES = [
  { value: "stub", label: "Stub — a placeholder, not written up yet" },
  { value: "draft", label: "Draft — written, needs checking" },
  { value: "polished", label: "Polished — finished and checked" },
];

/** Legend shown in the editor, documenting the markdown conventions. */
export const MARKDOWN_HELP = [
  {
    title: "Mathematics",
    items: [
      ["$x^2 + y^2$", "inline math"],
      ["$$ ... $$", "display math (own line, blank lines around it)"],
      ["\\frac{a}{b}, \\sqrt{x}, \\int_0^1", "standard LaTeX works"],
      ["\\begin{aligned} ... \\end{aligned}", "inside $$ for multi-line work"],
    ],
  },
  {
    title: "Structure",
    items: [
      ["## Heading", "adds an entry to the table of contents"],
      ["**bold**, *italic*, `code`", "inline formatting"],
      ["- item", "bullet list; 1. item for numbered"],
      ["| a | b |", "tables (GFM)"],
      ["> **Note.** text", "callout block; use > **Warning.** for a caveat"],
    ],
  },
  {
    title: "Collapsible solution",
    items: [
      ["<details><summary>Solution</summary>", "opens a collapsible block"],
      ["... markdown and $$math$$ ...", "contents of the block"],
      ["</details>", "closes it"],
    ],
  },
];

const field = (key, label, type, extra = {}) => ({ key, label, type, ...extra });

const SHARED_HEAD = [
  field("title", "Title", "text", {
    required: true,
    placeholder: "A hundredth power of tan, and why the answer is still pi/4",
    hint: "The problem or theorem as you would say it out loud.",
  }),
  field("topic", "Topic", "select", {
    required: true,
    options: TOPICS,
    hint: "Broad area. Together with the subtopic it decides the folder and the URL.",
  }),
  field("subtopic", "Subtopic", "select", {
    required: true,
    // Options are filled in at runtime from the chosen topic — see form.js.
    options: subtopicsFor("calculus"),
    dependsOn: "topic",
    hint: "Narrower bucket within the topic. Sets the second folder level.",
  }),
  field("tags", "Tags", "list", {
    hint: "Free-form, lowercase, hyphenated: integration-bee, symmetry, king-property.",
  }),
  field("summary", "Summary", "textarea", {
    rows: 2,
    hint: "One sentence. Shows on cards and in search results. PLAIN TEXT — no LaTeX.",
  }),
];

export const PROBLEM_FIELDS = [
  ...SHARED_HEAD,
  field("difficulty", "Difficulty", "select", {
    required: true,
    options: DIFFICULTIES,
  }),
  field("exam", "Exam source", "select", {
    options: EXAM_TYPES,
    hint: "Which contest or course it came from. Drives the site's /exam/<name>/ pages.",
  }),
  field("source", "Source line", "text", {
    placeholder: "Integration bee staple",
    hint: "Where it came from, free text. Shown under the title. PLAIN TEXT.",
  }),
  field("year", "Year", "number", { placeholder: "2013" }),
  field("problemNumber", "Problem number", "text", { placeholder: "B3" }),
  field("keyIdea", "Key idea", "textarea", {
    rows: 3,
    hint: "THE most valuable field: the one line that unlocks the problem. PLAIN TEXT.",
  }),
  field("hints", "Spoiler-free hints", "list", {
    multiline: true,
    hint: "Each line becomes one collapsible hint. PLAIN TEXT — no LaTeX.",
  }),
  field("answer", "Answer", "text", {
    placeholder: "pi/4",
    hint: "PLAIN TEXT only. Frontmatter is not run through KaTeX.",
  }),
  field("related", "Related entries", "list", {
    hint: "Slugs of other entries, e.g. tan-power-symmetry-integral.",
  }),
  field("sourceUrl", "Source URL", "text", {
    placeholder: "https://...",
    hint: "Optional link to the original statement. Must be a full URL.",
  }),
  field("status", "Status", "select", { options: STATUSES }),
  field("date", "Date added", "date"),
  field("updated", "Last updated", "date"),
  field("draft", "Hide from the site", "boolean", {
    hint: "Draft entries are excluded from the build entirely.",
  }),
];

export const THEORY_FIELDS = [
  ...SHARED_HEAD,
  field("section", "Section", "select", { options: THEORY_SECTIONS }),
  field("level", "Level", "select", {
    options: [{ value: "", label: "— none —" }, ...DIFFICULTIES],
  }),
  field("statement", "Statement", "textarea", {
    rows: 3,
    hint: "The formal statement, shown in a callout at the top. PLAIN TEXT.",
  }),
  field("related", "Related entries", "list", {
    hint: "Slugs of other entries.",
  }),
  field("status", "Status", "select", { options: STATUSES }),
  field("date", "Date added", "date"),
  field("updated", "Last updated", "date"),
  field("draft", "Hide from the site", "boolean"),
];

export const ENTRY_KINDS = {
  problems: { label: "Problem", fields: PROBLEM_FIELDS, dir: "content/problems" },
  theory: { label: "Theory note", fields: THEORY_FIELDS, dir: "content/theory" },
};

/** Allowed values per field, for validation. */
export function allowedValues(kind) {
  const map = {};
  for (const f of ENTRY_KINDS[kind].fields) {
    if (f.options) map[f.key] = f.options.map((o) => o.value);
  }
  return map;
}

/**
 * Validate a frontmatter object for `kind`.
 * Returns { ok: true, data } or { ok: false, errors: [...] }.
 */
export function validate(kind, input) {
  const errors = [];
  const out = {};
  const allowed = allowedValues(kind);

  for (const f of ENTRY_KINDS[kind].fields) {
    const raw = input[f.key];

    switch (f.type) {
      case "boolean":
        out[f.key] = raw === true || raw === "true";
        break;

      case "number": {
        if (raw === "" || raw === null || raw === undefined) break;
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          errors.push(`${f.label} must be a number.`);
          break;
        }
        out[f.key] = n;
        break;
      }

      case "list": {
        const list = Array.isArray(raw)
          ? raw
          : String(raw ?? "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
        if (list.length > 0) out[f.key] = list;
        break;
      }

      case "multiselect": {
        const list = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
        if (allowed[f.key]) {
          for (const v of list) {
            if (!allowed[f.key].includes(v)) {
              errors.push(`${f.label}: "${v}" is not a known value.`);
            }
          }
        }
        if (list.length > 0) out[f.key] = [...new Set(list)];
        break;
      }

      case "select": {
        const v = raw === null || raw === undefined ? "" : String(raw);
        if (!v) {
          if (f.required) errors.push(`${f.label} is required.`);
          break;
        }
        // The subtopic list is not fixed: it depends on the chosen topic.
        if (f.key === "subtopic") {
          const valid = subtopicsFor(out.topic ?? input.topic).map((s) => s.value);
          if (valid.length === 0) {
            errors.push(`Topic "${out.topic ?? input.topic}" has no subtopics defined.`);
            break;
          }
          if (!valid.includes(v)) {
            errors.push(`"${v}" is not a subtopic of "${out.topic ?? input.topic}".`);
            break;
          }
        } else if (allowed[f.key] && !allowed[f.key].includes(v)) {
          errors.push(`${f.label}: "${v}" is not one of the allowed values.`);
          break;
        }
        out[f.key] = v;
        break;
      }

      case "date": {
        const v = String(raw ?? "").trim();
        if (!v) break;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
          errors.push(`${f.label} must look like 2025-01-31.`);
          break;
        }
        out[f.key] = v;
        break;
      }

      default: {
        const v = String(raw ?? "").trim();
        if (!v) {
          if (f.required) errors.push(`${f.label} is required.`);
          break;
        }
        if (f.key === "sourceUrl" && !/^https?:\/\/\S+$/.test(v)) {
          errors.push(`${f.label} must be a full URL starting with http:// or https://.`);
          break;
        }
        out[f.key] = v;
      }
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, data: out };
}

/**
 * Serialise validated frontmatter to YAML text.
 * Written by hand rather than via a yaml library: the values are all strings,
 * numbers, booleans or lists of those, so quoting is simple and predictable.
 */
export function toYaml(data) {
  const needsQuotes = (s) =>
    s === "" ||
    /^[\s&*?|>!%@`{}[\]",#-]/.test(s) ||
    /:\s/.test(s) ||
    /\s#/.test(s) ||
    /[\n\r\t]/.test(s) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(s) ||
    /^[-+]?\d+(\.\d+)?$/.test(s) ||
    /:/.test(s);

  const scalar = (v) => {
    if (typeof v === "boolean" || typeof v === "number") return String(v);
    const s = String(v);
    if (!needsQuotes(s)) return s;
    // Double-quoted YAML: escape backslash and double quote.
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  };

  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${scalar(item)}`);
    } else if (typeof value === "object") {
      continue; // nested objects are not used by the vault frontmatter
    } else {
      lines.push(`${key}: ${scalar(value)}`);
    }
  }
  return lines.join("\n");
}
