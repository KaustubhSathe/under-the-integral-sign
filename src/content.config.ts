import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import {
  DIFFICULTIES,
  STATUSES,
  SUBTOPICS,
  THEORY_SECTIONS,
  TOPICS,
  subtopicsOf,
} from "./lib/taxonomy";

/**
 * A subtopic only makes sense inside its own topic, so this is checked with a
 * lookup rather than a plain enum. Zod 4's `.refine` takes an options object
 * (not a formatter callback), so the message goes through `ctx.addIssue`. The
 * context parameter is typed structurally because `z` is a value here, not an
 * importable namespace.
 */
const subtopicBelongsToTopic = (
  data: { topic: string; subtopic: string },
  ctx: { addIssue: (issue: { code: "custom"; path: string[]; message: string }) => void },
) => {
  const known = subtopicsOf(data.topic);
  if (!known.includes(data.subtopic)) {
    ctx.addIssue({
      code: "custom",
      path: ["subtopic"],
      message: `"${data.subtopic}" is not a subtopic of "${data.topic}" (known: ${
        known.join(", ") || "none"
      })`,
    });
  }
};

/** Frontmatter contract for every .md file in content/problems/.
 * The admin panel validates against the same lists (see tools/admin/schema.mjs),
 * so a file that saves cleanly from the admin panel will always build.
 *
 * `topic` + `subtopic` together determine the entry's folder on disk and its URL:
 *   content/problems/calculus/integrals/foo.md -> /problems/calculus/integrals/foo/
 */
const problems = defineCollection({
  loader: glob({ base: "./content/problems", pattern: "**/*.md" }),
  schema: z
    .object({
      title: z.string(),
      /** Broad area. Exactly one. */
      topic: z.enum(TOPICS),
      /** Narrower bucket within the topic. Exactly one. */
      subtopic: z.string(),
      tags: z.array(z.string()).default([]),
      difficulty: z.enum(DIFFICULTIES),
      /** e.g. "Putnam 2013, B3", "JEE Advanced 2021 Paper 2". Free text. */
      source: z.string().default(""),
      year: z.number().int().optional(),
      problemNumber: z.string().optional(),
      /** One-line "what is this really asking" — shown on cards and in search. */
      summary: z.string().default(""),
      /** The single idea that unlocks it. Your most valuable field. PLAIN TEXT. */
      keyIdea: z.string().default(""),
      /** Optional spoiler-free hints. PLAIN TEXT — frontmatter is not run through KaTeX. */
      hints: z.array(z.string()).default([]),
      /**
       * Optional reference answer. PLAIN TEXT ONLY, so write "pi/4", not LaTeX.
       */
      answer: z.string().default(""),
      /** Free-form list of other vault slugs, e.g. ["cauchy-schwarz-master-lemma"]. */
      related: z.array(z.string()).default([]),
      /** External link to the original statement, if any. */
      sourceUrl: z.string().url().optional(),
      status: z.enum(STATUSES).default("stub"),
      date: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
    })
    .superRefine(subtopicBelongsToTopic),
});

/**
 * Frontmatter contract for every .md file in content/theory/.
 *
 * This collection is currently empty, so the build logs "The collection
 * 'theory' does not exist or is empty" once per page. That is expected and
 * harmless — it clears as soon as the first theory note exists. An empty
 * collection is kept rather than deleted so the site's /theory pages and the
 * admin panel's "Theory note" kind keep working.
 */
const theory = defineCollection({
  loader: glob({ base: "./content/theory", pattern: "**/*.md" }),
  schema: z
    .object({
      title: z.string(),
      topic: z.enum(TOPICS),
      subtopic: z.string(),
      tags: z.array(z.string()).default([]),
      section: z.enum(THEORY_SECTIONS).default("notes"),
      /** Theory needs no difficulty, but a coarse level helps filtering. */
      level: z.enum(DIFFICULTIES).optional(),
      summary: z.string().default(""),
      /** "Statement → why it is true → when to reach for it". PLAIN TEXT. */
      statement: z.string().default(""),
      related: z.array(z.string()).default([]),
      references: z
        .array(z.object({ label: z.string(), url: z.string().url().optional() }))
        .default([]),
      status: z.enum(STATUSES).default("stub"),
      date: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
    })
    .superRefine(subtopicBelongsToTopic),
});

export const collections = { problems, theory };
