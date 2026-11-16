import { render, screen, within } from "@testing-library/react";
import { HomeView } from "@/app/_home/home-view";
import { LINKEDIN_URL } from "@/app/_shell/links";
import { GITHUB_OWNER_URL } from "@/lib/site";
import AboutPage, { metadata as aboutMeta } from "@/app/about/page";
import HowPage, { metadata as howMeta } from "@/app/how-this-site-is-built/page";
import ProjectsPage, { metadata as projectsMeta } from "@/app/projects/page";
import ProjectPage, {
  generateMetadata as projectMeta,
  generateStaticParams as projectParams,
} from "@/app/projects/[slug]/page";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import type { Post } from "@/lib/posts/loader";
import { PROJECTS } from "@/lib/projects";
import { MERGED_PRS_URL, PROJECT_BOARD_URL, SITE_REPO_URL } from "@/lib/site";
import { SKILLS } from "@/lib/skills";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  notFound: () => {
    throw new Error("not found");
  },
}));

const post = (n: number): Post => ({
  slug: `post-${n}`,
  title: `Post ${n}`,
  date: "2026-11-15T10:00:00Z",
  tags: ["a"],
  summary: `Summary ${n}.`,
  html: "",
});

const headings = (level: number) => screen.getAllByRole("heading", { level }).map((h) => h.textContent);
/** next/link applies the trailingSlash setting only in the build; the built HTML is checked in e2e. */
const slashed = (href: string | null) => href?.replace(/\/?$/, "/");

describe("home", () => {
  it("has the intro (placeholder-marked) and no 'under construction' line", () => {
    const { container } = render(<HomeView posts={[]} />);
    expect(screen.queryByText(/under construction/i)).toBeNull();
    const intro = screen.getByRole("region", { name: "Intro" });
    expect(intro.querySelector("[data-placeholder]")).not.toBeNull();
    expect(intro).toHaveTextContent("Alberta, Canada");
    expect(container.querySelectorAll("[data-placeholder]").length).toBeGreaterThanOrEqual(2);
  });

  it("has Focus, Featured repos and Latest posts below the first screen", () => {
    render(<HomeView posts={[]} />);
    expect(headings(2)).toEqual(["Focus", "Featured repos", "Latest posts"]);
  });

  it("Featured repos has the same cards as Projects, each linking to its page", () => {
    render(<HomeView posts={[]} />);
    const featured = screen.getByRole("region", { name: "Featured repos" });
    const links = within(featured)
      .getAllByRole("link")
      .map((l) => slashed(l.getAttribute("href")));
    expect(links.filter((h) => h?.startsWith("/projects/") && h !== "/projects/")).toEqual(
      PROJECTS.map((p) => `/projects/${p.slug}/`),
    );
  });

  it("with no posts: 'No posts yet' and a link to /blog/", () => {
    render(<HomeView posts={[]} />);
    const latest = screen.getByRole("region", { name: "Latest posts" });
    expect(latest).toHaveTextContent("No posts yet.");
    expect(slashed(within(latest).getByRole("link", { name: "Go to the blog" }).getAttribute("href"))).toBe("/blog/");
  });

  it("with posts: up to three, in the order given, each linked", () => {
    render(<HomeView posts={[1, 2, 3, 4].map(post)} />);
    const latest = screen.getByRole("region", { name: "Latest posts" });
    expect(latest).not.toHaveTextContent("No posts yet");
    expect(
      within(latest)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(["Post 1", "Post 2", "Post 3"]);
    expect(slashed(within(latest).getByRole("link", { name: "Post 1" }).getAttribute("href"))).toBe("/blog/post-1/");
  });
});

describe("About", () => {
  it("has its four sections, indexable metadata, and the two profile links", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: "About" })).toBeInTheDocument();
    expect(headings(2)).toEqual(["Background", "What I am learning", "How I work", "Links"]);
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", GITHUB_OWNER_URL);
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", LINKEDIN_URL);
    expect(aboutMeta.robots).toBeUndefined();
    expect(aboutMeta.title).toBe("About");
  });
});

describe("Projects", () => {
  it("has one card per project, each linking to its page; indexable", () => {
    render(<ProjectsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(PROJECTS.length);
    PROJECTS.forEach((p, i) => {
      const link = within(cards[i]).getByRole("link", { name: p.name });
      expect(slashed(link.getAttribute("href"))).toBe(`/projects/${p.slug}/`);
      expect(cards[i]).toHaveTextContent(p.summary);
    });
    expect(projectsMeta.robots).toBeUndefined();
  });
});

describe("a project page", () => {
  it("is generated for every project and only those", () => {
    expect(projectParams()).toEqual(PROJECTS.map((p) => ({ slug: p.slug })));
  });

  it.each(PROJECTS)("$slug links its GitHub repo and has its text or placeholders and its own metadata", async (p) => {
    const { container } = render(await ProjectPage({ params: Promise.resolve({ slug: p.slug }) }));
    expect(screen.getByRole("heading", { level: 1, name: p.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `${p.name} on GitHub` })).toHaveAttribute("href", p.repoUrl);
    const written = (p.whatItDoes ? 1 : 0) + (p.whyItExists ? 1 : 0);
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(2 - written);
    for (const text of [...(p.whatItDoes ?? []), ...(p.whyItExists ?? [])]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    const meta = await projectMeta({ params: Promise.resolve({ slug: p.slug }) });
    expect(meta.title).toBe(p.name);
    expect(meta.description).toBe(p.summary);
    expect(meta.alternates?.canonical).toBe(`/projects/${p.slug}/`);
  });

  it("an unknown slug is a 404", async () => {
    await expect(ProjectPage({ params: Promise.resolve({ slug: "nope" }) })).rejects.toThrow("not found");
  });
});

describe("How this site is built", () => {
  it("has Workflow, Skills used, What it is made of and The record", () => {
    render(<HowPage />);
    expect(headings(2)).toEqual(["Workflow", "Skills used", "What it is made of", "The record"]);
    expect(headings(3)).toEqual(["The ticket cycle", "Supporting skills"]);
    expect(howMeta.robots).toBeUndefined();
  });

  it("lists exactly the skills in lib/skills", () => {
    const { container } = render(<HowPage />);
    const listed = [...container.querySelectorAll("[data-skill-group] code")].map((c) => c.textContent);
    expect(listed.sort()).toEqual(Object.keys(SKILLS).sort());
  });

  it("has no issue or PR numbers, no Parts and no unused skills", () => {
    const { container } = render(<HowPage />);
    expect(container.querySelector("[data-part]")).toBeNull();
    expect(container.textContent).not.toMatch(/#\d+|Parts|not used/);
    for (const a of container.querySelectorAll("a")) {
      expect(a.getAttribute("href")).not.toMatch(/\/(issues|pull)\/\d+/);
    }
  });

  it("links the board, the merged pull requests and the repository", () => {
    render(<HowPage />);
    expect(screen.getByRole("link", { name: "Project board" })).toHaveAttribute("href", PROJECT_BOARD_URL);
    expect(screen.getByRole("link", { name: "Merged pull requests" })).toHaveAttribute("href", MERGED_PRS_URL);
    expect(screen.getByRole("link", { name: "Repository" })).toHaveAttribute("href", SITE_REPO_URL);
  });

  it("What it is made of has 3 to 5 lines and no version or PR numbers", () => {
    render(<HowPage />);
    const section = screen.getByRole("region", { name: "What it is made of" });
    const items = within(section).getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.length).toBeLessThanOrEqual(5);
    expect(section.textContent).not.toMatch(/\d/);
  });
});

describe("sitemap and robots", () => {
  it("lists every public route and never /design/ or a _none page", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const path of [
      "/",
      "/about/",
      "/projects/",
      "/how-this-site-is-built/",
      "/blog/",
      ...PROJECTS.map((p) => `/projects/${p.slug}/`),
    ]) {
      expect(urls).toContain(`https://joshdengxd.github.io${path}`);
    }
    expect(urls.join("\n")).not.toMatch(/design|_none/);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("robots allow everything (not /design/) and point at the absolute sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://joshdengxd.github.io/sitemap.xml",
    });
  });
});
