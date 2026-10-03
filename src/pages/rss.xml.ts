import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { allEntries } from "../lib/entries";
import { SITE } from "../lib/site";

export async function GET(context: APIContext) {
  const entries = await allEntries();

  return rss({
    title: SITE.name,
    description: SITE.description,
    // `context.site` comes from astro.config.mjs and already includes the base path.
    site: context.site ?? SITE.url,
    items: entries.map((entry) => ({
      title: entry.title,
      description:
        entry.summary ||
        entry.keyIdea ||
        `${entry.kind === "problems" ? "Problem" : "Theory note"} from the vault.`,
      link: entry.href,
      pubDate: entry.updated ?? entry.date ?? new Date(),
      categories: [entry.topic, ...entry.topics.slice(1), ...entry.tags],
    })),
    customData: `<language>${SITE.locale}</language>`,
  });
}
