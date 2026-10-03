import { getCollection, type CollectionEntry } from "astro:content";
import { DIFFICULTY_STARS, TOPICS, type Topic } from "./taxonomy";
import type { Kind } from "./utils";

export type ProblemEntry = CollectionEntry<"problems">;
export type TheoryEntry = CollectionEntry<"theory">;
export type VaultEntry = ProblemEntry | TheoryEntry;

export interface EntryRef {
  /** e.g. "problems/cauchy-schwarz" — stable key used for related links. */
  id: string;
  kind: Kind;
  /** Just the filename slug, e.g. "cauchy-schwarz". */
  slug: string;
  /**
   * The URL path segment, which keeps content subdirectories:
   * "number-theory/divisors-of-2m-plus-1". Entry URLs are
   * /problems/<path>/ and /theory/<path>/.
   */
  path: string;
  href: string;
  title: string;
  summary: string;
  topic: Topic;
  /** Narrower bucket within the topic, e.g. "integrals". */
  subtopic: string;
  tags: string[];
  exam?: string;
  source?: string;
  year?: number;
  difficulty?: string;
  section?: string;
  status: string;
  date?: Date;
  updated?: Date;
  keyIdea?: string;
  stars: number;
}

/** Only an explicit `draft: true` hides an entry. `status: stub` still publishes. */
const isDraft = (entry: VaultEntry) => entry.data.draft === true;

function toRef(entry: ProblemEntry | TheoryEntry, kind: Kind): EntryRef {
  const d = entry.data;
  const slug = entry.id.includes("/") ? entry.id.slice(entry.id.lastIndexOf("/") + 1) : entry.id;
  const isProblem = entry.collection === "problems";
  return {
    id: `${kind}/${entry.id}`,
    kind,
    slug,
    path: entry.id,
    href: `/${kind}/${entry.id}/`,
    title: d.title,
    summary: d.summary,
    topic: d.topic,
    subtopic: d.subtopic,
    tags: d.tags ?? [],
    exam: isProblem ? entry.data.exam : undefined,
    source: isProblem ? entry.data.source : undefined,
    year: isProblem ? entry.data.year : undefined,
    difficulty: isProblem ? entry.data.difficulty : undefined,
    section: isProblem ? undefined : entry.data.section,
    status: d.status,
    date: d.date,
    updated: d.updated,
    keyIdea: isProblem ? entry.data.keyIdea : undefined,
    stars: isProblem ? (DIFFICULTY_STARS[entry.data.difficulty] ?? 0) : 0,
  };
}

/** Newest first, then alphabetical — stable ordering everywhere. */
export function byRecency(a: EntryRef, b: EntryRef): number {
  const at = (a.updated ?? a.date)?.getTime() ?? 0;
  const bt = (b.updated ?? b.date)?.getTime() ?? 0;
  if (bt !== at) return bt - at;
  return a.title.localeCompare(b.title);
}

export function byTitle(a: { title: string }, b: { title: string }): number {
  return a.title.localeCompare(b.title);
}

/** Load every published entry, normalised into EntryRef, newest first. */
export async function allEntries(): Promise<EntryRef[]> {
  const [problems, theory] = await Promise.all([
    getCollection("problems", (e) => !isDraft(e)),
    getCollection("theory", (e) => !isDraft(e)),
  ]);
  const refs: EntryRef[] = [];
  for (const e of [...problems, ...theory]) {
    // Defensive: skip anything the loader hands back without data rather than
    // throwing deep inside a render.
    if (!e || !e.data || typeof e.id !== "string") continue;
    refs.push(toRef(e, e.collection));
  }
  return refs.sort(byRecency);
}

export interface Counted {
  key: string;
  count: number;
}

/** Count entries per taxonomy bucket, dropping empty buckets. */
export function countBy(entries: EntryRef[], pick: (e: EntryRef) => string[]): Counted[] {
  const map = new Map<string, number>();
  for (const entry of entries) {
    for (const key of new Set(pick(entry))) {
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export interface VaultStats {
  problems: number;
  theory: number;
  topics: Counted[];
  subtopics: Counted[];
  exams: Counted[];
  tags: Counted[];
  byDifficulty: Counted[];
  solved: number;
}

export async function stats(): Promise<VaultStats> {
  const entries = await allEntries();
  const problems = entries.filter((e) => e.kind === "problems");
  return {
    problems: problems.length,
    theory: entries.length - problems.length,
    topics: countBy(entries, (e) => [e.topic]),
    subtopics: countBy(entries, (e) => [e.subtopic]),
    exams: countBy(problems, (e) => (e.exam ? [e.exam] : [])),
    tags: countBy(entries, (e) => e.tags),
    byDifficulty: countBy(problems, (e) => (e.difficulty ? [e.difficulty] : [])),
    solved: problems.filter((e) => e.status === "polished").length,
  };
}

/** Topics that actually have content, in taxonomy order. */
export function topicsWithContent(entries: EntryRef[]): Topic[] {
  const present = new Set(entries.map((e) => e.topic));
  return TOPICS.filter((t) => present.has(t));
}

/**
 * Simple related-entries resolver.
 * Explicit frontmatter `related: ["problems/foo"]` wins; otherwise score by
 * shared topic/tag overlap so every entry links somewhere useful.
 */
export function relatedTo(
  entry: EntryRef,
  pool: EntryRef[],
  limit = 5,
  explicitIds: string[] = [],
): EntryRef[] {
  const candidates = pool.filter((c): c is EntryRef => Boolean(c) && c.id !== entry.id);

  // 1. Explicit frontmatter references win, in the order written.
  //    Accept either "problems/some-slug" (full id) or a bare slug.
  const explicit: EntryRef[] = [];
  for (const wanted of explicitIds) {
    const found = candidates.find((c) => c.id === wanted || c.slug === wanted);
    if (found && !explicit.includes(found)) explicit.push(found);
  }

  // 2. Otherwise score by shared topics and tags.
  const scored = candidates
    .filter((c) => !explicit.includes(c))
    .map((c) => {
      let score = 0;
      if (c.subtopic === entry.subtopic) score += 3;
      else if (c.topic === entry.topic) score += 1;
      score += c.tags.filter((t) => entry.tags.includes(t)).length * 2;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || byTitle(a.c, b.c))
    .map((x) => x.c);

  const room = Math.max(0, limit - explicit.length);
  return [...explicit.slice(0, limit), ...scored.slice(0, room)];
}
