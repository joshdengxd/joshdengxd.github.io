import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { SITE_NAME } from "./site";

/** The one social image (app/opengraph-image.png) with the alt text from its .alt.txt file, for every page. */
const SOCIAL_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: readFileSync(join(process.cwd(), "app", "opengraph-image.alt.txt"), "utf8").trim(),
};

type PageMetadataInput = {
  /** The page title, without the site name; the root layout's template adds it. The site name itself stays as it is. */
  title: string;
  description: string;
  /** The page path with its trailing slash, the same form as in the sitemap. */
  path: string;
};

/**
 * Description, canonical URL, Open Graph and Twitter card for one page. metadataBase (root layout) makes the URLs
 * absolute. A page's `openGraph` replaces the layout's as a whole (shallow merge), and the image of the file
 * convention only reaches the pages of its own segment, so everything a page needs, the image included, is set here.
 */
export function pageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const isSiteName = title === SITE_NAME;
  const fullTitle = isSiteName ? SITE_NAME : `${title} · ${SITE_NAME}`;
  return {
    title: isSiteName ? { absolute: SITE_NAME } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: path,
      images: [SOCIAL_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [SOCIAL_IMAGE] },
  };
}
