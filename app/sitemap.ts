import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const origin = "https://joshdengxd.github.io";

// Public pages only. /design/ (the token specimen) is left out on purpose.
const paths = ["/"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `${origin}${path}` }));
}
