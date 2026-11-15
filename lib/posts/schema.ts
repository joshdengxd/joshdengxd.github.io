import { z } from "zod";

/** Slugs and tags: lower-case words joined by single hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Slugs that would clash with a route under /blog/ (`tags` holds the tag pages). `_none` never matches the pattern. */
export const RESERVED_SLUGS = ["tags"];

const slug = z.string().regex(SLUG_PATTERN, "must be lower-case words joined by hyphens (a-z, 0-9, -)");

/** A full UTC timestamp (z.iso.datetime also rejects dates that do not exist, like 2026-02-31): `2026-11-15T18:00:00Z`. A date alone, or a time with an offset, is refused. */
const utcTimestamp = z.iso.datetime({ message: "must be a full UTC timestamp ending in Z, like 2026-11-15T18:00:00Z" });

/** The front matter of a post: these four keys, all required, nothing else. */
export const frontMatterSchema = z.strictObject({
  title: z.string().trim().min(1, "must not be empty").max(120, "must be at most 120 characters"),
  date: utcTimestamp,
  tags: z
    .array(slug)
    .min(1, "needs at least one tag")
    .max(5, "allows at most 5 tags")
    .refine((tags) => new Set(tags).size === tags.length, "lists a tag twice"),
  summary: z.string().trim().min(1, "must not be empty").max(300, "must be at most 300 characters"),
});

export type FrontMatter = z.infer<typeof frontMatterSchema>;
