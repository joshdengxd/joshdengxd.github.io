import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const rssLink = { "application/rss+xml": "/rss.xml" };

/** Title (with the site name), description, canonical URL and the feed's alternate link for a blog page. */
export function blogMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: `${title} · ${SITE_NAME}`,
    description,
    alternates: { canonical: path, types: rssLink },
  };
}

/** The hidden `_none` page that keeps the static export valid when a route has nothing to generate. */
export const hiddenMetadata: Metadata = {
  title: `Page not found · ${SITE_NAME}`,
  robots: { index: false, follow: false },
};
