#!/usr/bin/env node
/**
 * Scaffold a new entry from the command line.
 *
 *   pnpm new
 *   pnpm new --kind theory --title "Nesbitt's inequality" --topic inequalities
 *
 * Mostly useful for creating a batch of stubs quickly, or from an environment
 * where the browser-based admin panel is not what you want. The admin panel is
 * the better tool for editing an entry once it exists.
 */
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { ENTRY_KINDS, validate, toYaml, subtopicsFor } from "./admin/schema.mjs";
import { ROOT, buildEntryPath } from "./admin/vault.mjs";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const interactive = !args.title || !args.kind;

const rl = interactive ? readline.createInterface({ input: stdin, output: stdout }) : null;
const ask = async (question, fallback = "") => {
  if (!rl) return fallback;
  const answer = (await rl.question(question)).trim();
  return answer || fallback;
};

const today = new Date().toISOString().slice(0, 10);

try {
  let kind = args.kind;
  if (!kind) {
    const answer = await ask("Kind — [p]roblem or [t]heory (default p): ", "p");
    kind = answer.toLowerCase().startsWith("t") ? "theory" : "problems";
  }
  if (!ENTRY_KINDS[kind]) {
    console.error(`Unknown kind "${kind}". Use "problems" or "theory".`);
    process.exit(1);
  }

  const title = args.title || (await ask("Title: "));
  if (!title) {
    console.error("A title is required.");
    process.exit(1);
  }

  const topics = ENTRY_KINDS[kind].fields.find((f) => f.key === "topic").options;
  let topic = args.topic;
  if (!topic) {
    console.log("\nTopics:");
    topics.forEach((t, i) => console.log(`  ${String(i + 1).padStart(2)}. ${t.label} (${t.value})`));
    const answer = await ask("Topic (name or number): ");
    const byIndex = Number.parseInt(answer, 10);
    topic = Number.isInteger(byIndex) && byIndex >= 1 && byIndex <= topics.length
      ? topics[byIndex - 1].value
      : answer;
  }
  if (!topics.some((t) => t.value === topic)) {
    console.error(`Unknown topic "${topic}".`);
    process.exit(1);
  }

  const subtopics = subtopicsFor(topic);
  if (subtopics.length === 0) {
    console.error(`Topic "${topic}" has no subtopics defined — add one in tools/admin/schema.mjs.`);
    process.exit(1);
  }
  let subtopic = args.subtopic;
  if (!subtopic) {
    if (subtopics.length === 1) {
      subtopic = subtopics[0].value;
      console.log(`\nSubtopic: ${subtopics[0].label} (only one for this topic)`);
    } else {
      console.log("\nSubtopics:");
      subtopics.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s.label} (${s.value})`));
      const answer = await ask("Subtopic (name or number): ");
      const byIndex = Number.parseInt(answer, 10);
      subtopic =
        Number.isInteger(byIndex) && byIndex >= 1 && byIndex <= subtopics.length
          ? subtopics[byIndex - 1].value
          : answer;
    }
  }
  if (!subtopics.some((s) => s.value === subtopic)) {
    console.error(`Unknown subtopic "${subtopic}" for topic "${topic}".`);
    process.exit(1);
  }

  const frontmatter = {
    title,
    topic,
    subtopic,
    status: args.status || "stub",
    date: today,
    ...(kind === "problems" ? { difficulty: args.difficulty || "standard" } : { section: "notes" }),
  };

  const result = validate(kind, frontmatter);
  if (!result.ok) {
    console.error("Invalid frontmatter:");
    result.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const slug = String(args.slug || title)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  const rel = buildEntryPath(kind, topic, subtopic, slug);
  const abs = path.join(ROOT, "content", kind, rel);

  try {
    await fs.access(abs);
    console.error(`\nThat entry already exists:\n  content/${kind}/${rel}`);
    process.exit(1);
  } catch {
    /* good: the file does not exist yet */
  }

  const body =
    kind === "theory"
      ? [
          "## Statement",
          "",
          "## Proof",
          "",
          "$$",
          "",
          "$$",
          "",
          "## Why it works, and when to reach for it",
          "",
          "## Common failure modes",
          "",
          "## References",
          "",
        ].join("\n")
      : [
          "State the problem here.",
          "",
          "$$",
          "",
          "$$",
          "",
          "<details>",
          "<summary>Hint</summary>",
          "",
          "</details>",
          "",
          "## Solution",
          "",
          "## The reusable idea",
          "",
        ].join("\n");

  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, `---\n${toYaml(result.data)}\n---\n\n${body}`, "utf8");

  console.log(`\nCreated content/${kind}/${rel}\n`);
  console.log("Next:");
  console.log("  pnpm dev     # preview it");
  console.log("  pnpm admin   # edit it in the browser\n");
} finally {
  rl?.close();
}
