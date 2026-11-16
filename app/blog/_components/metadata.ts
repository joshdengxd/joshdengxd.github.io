import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

/** The metadata every page has (see lib/metadata.ts) for a blog page. */
export function blogMetadata(title: string, description: string, path: string): Metadata {
  return pageMetadata({ title, description, path });
}

/** The hidden `_none` page that keeps the static export valid when a route has nothing to generate. */
export const hiddenMetadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};
