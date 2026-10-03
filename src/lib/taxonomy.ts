/**
 * The single source of truth for the vault's taxonomy.
 *
 * Used by BOTH the static site (src/content.config.ts) and the local admin panel
 * (tools/admin/schema.mjs). Adding a topic here means updating the same list in
 * tools/admin/schema.mjs, then restarting both processes.
 */

/**
 * Broad mathematical area. Every entry names exactly one.
 *
 * Currently a single topic, by choice: the vault is Calculus only, and depth
 * comes from subtopics. Adding a topic back is a one-line change here plus the
 * matching edit in tools/admin/schema.mjs — the rest of the site (sidebar, topic
 * pages, admin folder layout) already handles more than one.
 */
export const TOPICS = ["calculus"] as const;
export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<Topic, string> = {
  calculus: "Calculus",
};

/** Subtopics per topic. Every subtopic belongs to exactly one topic. */
export const SUBTOPICS: Record<Topic, readonly string[]> = {
  calculus: ["integrals"],
};

export type Subtopic = string;

export const SUBTOPIC_LABELS: Record<string, string> = {
  integrals: "Integrals",
};

/** Display name for a subtopic slug, falling back to a title-cased slug. */
export function subtopicLabel(subtopic: string): string {
  const known = SUBTOPIC_LABELS[subtopic];
  if (known) return known;
  return subtopic
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Subtopics that exist for a given topic (empty array for an unknown topic). */
export function subtopicsOf(topic: string): readonly string[] {
  return SUBTOPICS[topic as Topic] ?? [];
}

/** The topic a subtopic belongs to, or undefined. */
export function topicOfSubtopic(subtopic: string): Topic | undefined {
  return TOPICS.find((t) => SUBTOPICS[t].includes(subtopic));
}

/**
 * Where a problem comes from. Independent of topic/subtopic: it records the
 * contest, not the mathematics, and drives the /exam/<slug> browsing pages so
 * "IMO 2019 P2" and "IMO 2021 P6" group together.
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
