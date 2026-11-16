import { blogMetadata, hiddenMetadata } from "@/app/blog/_components/metadata";
import { metadata as rootMetadata } from "@/app/layout";
import { pageMetadata } from "@/lib/metadata";

// next/font only works inside the Next build; the layout is imported here for its metadata alone.
vi.mock("next/font/local", () => ({ default: () => ({ variable: "", className: "" }) }));

type Image = { url: string; width: number; height: number; alt: string };
const firstImage = (images: unknown) => (images as Image[])[0];
const og = (m: ReturnType<typeof pageMetadata>) => m.openGraph as { title: string; images: Image[] };
const twitter = (m: ReturnType<typeof pageMetadata>) => m.twitter as { images: Image[] };

describe("root metadata", () => {
  it("has the title template with the site name, and a base URL for absolute links", () => {
    expect(rootMetadata.title).toEqual({ default: "Xindong Deng (Josh)", template: "%s · Xindong Deng (Josh)" });
    expect(String(rootMetadata.metadataBase)).toBe("https://joshdengxd.github.io/");
  });
});

describe("pageMetadata", () => {
  it("gives a page its title (the template adds the site name), description, trailing-slash canonical, Open Graph and Twitter card", () => {
    const m = pageMetadata({ title: "About", description: "About me.", path: "/about/" });
    expect(m.title).toBe("About");
    expect(m.description).toBe("About me.");
    expect(m.alternates?.canonical).toBe("/about/");
    expect(m.openGraph).toMatchObject({
      type: "website",
      siteName: "Xindong Deng (Josh)",
      title: "About · Xindong Deng (Josh)",
      description: "About me.",
      url: "/about/",
    });
    expect(m.twitter).toMatchObject({
      card: "summary_large_image",
      title: "About · Xindong Deng (Josh)",
      description: "About me.",
    });
  });

  it("carries the social image in both cards, 1200x630 with its alt text (a page's own openGraph would drop the inherited one)", () => {
    const m = pageMetadata({ title: "About", description: "d", path: "/about/" });
    for (const images of [og(m).images, twitter(m).images]) {
      expect(firstImage(images)).toMatchObject({ url: "/opengraph-image.png", width: 1200, height: 630 });
      expect(firstImage(images).alt.length).toBeGreaterThan(10);
    }
  });

  it("keeps the bare site name for the home page instead of repeating it", () => {
    const m = pageMetadata({ title: "Xindong Deng (Josh)", description: "d", path: "/" });
    expect(m.title).toEqual({ absolute: "Xindong Deng (Josh)" });
    expect(og(m).title).toBe("Xindong Deng (Josh)");
  });
});

describe("blog metadata", () => {
  it("keeps the canonical, page description and social-card fields", () => {
    const m = blogMetadata("Blog", "Learning notes.", "/blog/");
    expect(m).toMatchObject({
      title: "Blog",
      description: "Learning notes.",
      alternates: { canonical: "/blog/" },
      openGraph: {
        type: "website",
        siteName: "Xindong Deng (Josh)",
        title: "Blog · Xindong Deng (Josh)",
        description: "Learning notes.",
        url: "/blog/",
      },
      twitter: {
        card: "summary_large_image",
        title: "Blog · Xindong Deng (Josh)",
        description: "Learning notes.",
      },
    });
    expect(firstImage(og(m).images)).toMatchObject({ url: "/opengraph-image.png", width: 1200, height: 630 });
    expect(twitter(m).images).toEqual(og(m).images);
  });

  it("keeps hidden routes out of indexing without a canonical override", () => {
    expect(hiddenMetadata).toEqual({ title: "Page not found", robots: { index: false, follow: false } });
  });
});
