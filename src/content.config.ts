import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import {
  DIFFICULTIES,
  EXAM_TYPES,
  STATUSES,
  THEORY_SECTIONS,
  TOPICS,
} from "./lib/taxonomy";

/**
 * Frontmatter contract for every .md file in content/problems/.
 * The admin panel validates against the same lists (see tools/admin/schema.mjs),
 * so a file that saves cleanly from the admin panel will always build.
 */
const problems = defineCollection({
  loader: glob({ base: "./content/problems", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** Exactly one primary topic — drives the URL /topic/<topic> and grouping. */
    topic: z.enum(TOPICS),
    /** Extra topics this problem also belongs to, for cross-listing. */
    topics: z.array(z.enum(TOPICS)).default([]),
    tags: z.array(z.string()).default([]),
    difficulty: z.enum(DIFFICULTIES),
    exam: z.enum(EXAM_TYPES).default("own"),
    /** e.g. "IMO 2019 Problem 2", "Putnam 2018 B3", "JEE Advanced 2021 Paper 2". */
    source: z.string().default(""),
    year: z.number().int().optional(),
    problemNumber: z.string().optional(),
    /** One-line "what is this really asking" — shown on cards and in search. */
    summary: z.string().default(""),
    /** The single idea that unlocks it. Your most valuable field. PLAIN TEXT. */
    keyIdea: z.string().default(""),
    /** Optional spoiler-free hints, rendered as collapsible blocks. PLAIN TEXT. */
    hints: z.array(z.string()).default([]),
    /**
     * Optional reference answer. PLAIN TEXT ONLY — frontmatter is not run
     * through KaTeX, so write "pi/4" or "n! / k!", not LaTeX.
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
  }),
});

/** Frontmatter contract for every .md file in content/theory/. */
const theory = defineCollection({
  loader: glob({ base: "./content/theory", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    topic: z.enum(TOPICS),
    topics: z.array(z.enum(TOPICS)).default([]),
    tags: z.array(z.string()).default([]),
    section: z.enum(THEORY_SECTIONS).default("notes"),
    /** Theory needs no difficulty, but a coarse level helps filtering. */
    level: z.enum(DIFFICULTIES).optional(),
    summary: z.string().default(""),
    /** "Statement → why it is true → when to reach for it". */
    statement: z.string().default(""),
    /** Free-form list of other vault slugs. */
    related: z.array(z.string()).default([]),
    references: z
      .array(z.object({ label: z.string(), url: z.string().url().optional() }))
      .default([]),
    status: z.enum(STATUSES).default("stub"),
    date: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { problems, theory };
