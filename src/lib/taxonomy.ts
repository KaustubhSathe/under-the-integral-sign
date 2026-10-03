/**
 * The single source of truth for the vault's taxonomy.
 *
 * Used by BOTH the static site (src/content.config.ts) and the local admin panel
 * (tools/admin/schema.mjs). If you change a list here, make the matching change
 * in tools/admin/schema.mjs and restart both processes.
 */

/**
 * Topics. Every entry names exactly one, and the topic is both its folder and its
 * URL segment: content/problems/integrals/foo.md -> /problems/integrals/foo/
 *
 * One topic for now — Integrals — because that is what is being studied. Adding
 * another is a one-line change here plus the matching edit in
 * tools/admin/schema.mjs; the sidebar, topic pages and admin folder layout all
 * already handle several.
 */
export const TOPICS = ["integrals"] as const;

export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<Topic, string> = {
  integrals: "Integrals",
};

/**
 * Where the problem comes from. `contest` is the umbrella used for the
 * /exam/<slug> browsing pages, so "IMO 2019 P2" and "IMO 2021 P6" group
 * together while still recording the exact year and problem number.
 */
export const EXAM_TYPES = [
  "jee-advanced",
  "jee-main",
  "rmo",
  "inmo",
  "imo",
  "putnam",
  "integration-bee",
  "undergrad",
  "olympiad-other",
  "textbook",
  "own",
] as const;

export type ExamType = (typeof EXAM_TYPES)[number];

export const EXAM_LABELS: Record<ExamType, string> = {
  "jee-advanced": "JEE Advanced",
  "jee-main": "JEE Main",
  rmo: "RMO",
  inmo: "INMO",
  imo: "IMO",
  putnam: "Putnam",
  "integration-bee": "Integration Bee",
  undergrad: "Undergraduate",
  "olympiad-other": "Other Olympiad",
  textbook: "Textbook",
  own: "Own Problem",
};

export const DIFFICULTIES = ["warmup", "standard", "hard", "brutal", "research"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  warmup: "Warm-up",
  standard: "Standard",
  hard: "Hard",
  brutal: "Brutal",
  research: "Research flavour",
};

/** Rough star rating shown on cards. */
export const DIFFICULTY_STARS: Record<Difficulty, number> = {
  warmup: 1,
  standard: 2,
  hard: 3,
  brutal: 4,
  research: 5,
};

export const STATUSES = ["stub", "draft", "polished"] as const;
export type Status = (typeof STATUSES)[number];

export const THEORY_SECTIONS = [
  "notes",
  "lemma",
  "theorem",
  "technique",
  "cheatsheet",
  "book-notes",
] as const;

export type TheorySection = (typeof THEORY_SECTIONS)[number];

export const THEORY_SECTION_LABELS: Record<TheorySection, string> = {
  notes: "Notes",
  lemma: "Lemma",
  theorem: "Theorem",
  technique: "Technique",
  cheatsheet: "Cheatsheet",
  "book-notes": "Book notes",
};

/** Helpers shared by the admin panel's validation and the site's display code. */
export const isTopic = (v: unknown): v is Topic => TOPICS.includes(v as Topic);
export const isExamType = (v: unknown): v is ExamType => EXAM_TYPES.includes(v as ExamType);
export const isDifficulty = (v: unknown): v is Difficulty =>
  DIFFICULTIES.includes(v as Difficulty);
