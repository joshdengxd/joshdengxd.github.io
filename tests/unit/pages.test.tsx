import { render, screen, within } from "@testing-library/react";
import { HomeView } from "@/app/_home/home-view";
import AboutPage, { metadata as aboutMeta } from "@/app/about/page";
import HowPage, { metadata as howMeta } from "@/app/how-this-site-is-built/page";
import ProjectsPage, { metadata as projectsMeta } from "@/app/projects/page";
import ProjectPage, {
  generateMetadata as projectMeta,
  generateStaticParams as projectParams,
} from "@/app/projects/[slug]/page";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { PROJECTS } from "@/lib/projects";
import { ABOUT_LINKS, ABOUT_TEXT } from "../about-text";
import { MERGED_PRS_URL, PROJECT_BOARD_URL, SITE_REPO_URL } from "@/lib/site";
import { SKILLS } from "@/lib/skills";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  notFound: () => {
    throw new Error("not found");
  },
}));

const headings = (level: number) => screen.getAllByRole("heading", { level }).map((h) => h.textContent);
/** next/link applies the trailingSlash setting only in the build; the built HTML is checked in e2e. */
const slashed = (href: string | null) => href?.replace(/\/?$/, "/");

describe("home", () => {
  it("has the intro (placeholder-marked) and no 'under construction' line", () => {
    const { container } = render(<HomeView />);
    expect(screen.queryByText(/under construction/i)).toBeNull();
    const intro = screen.getByRole("region", { name: "Intro" });
    expect(intro.querySelector("[data-placeholder]")).not.toBeNull();
    expect(intro).toHaveTextContent("Alberta, Canada");
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(1);
  });

  it("is its first screen only: no heading but the name, and no Focus, Featured repos or Latest posts", () => {
    const { container } = render(<HomeView />);
    expect(screen.getAllByRole("heading").map((h) => h.tagName)).toEqual(["H1"]);
    expect(screen.queryAllByRole("heading", { level: 2 })).toEqual([]);
    expect(container.querySelector("article")).toBeNull();
    expect(container.textContent).not.toMatch(/Focus|Featured repos|Latest posts|All projects|All posts/);
  });
});

describe("About", () => {
  it("has its three sections, indexable metadata, and no links section", () => {
    const { container } = render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: "About" })).toBeInTheDocument();
    expect(headings(2)).toEqual(["Background", "What I am learning", "How I work"]);
    expect(Array.from(container.querySelectorAll("a"), (a) => a.textContent)).toEqual(["Matt Pocock", "Lauren Tan"]);
    expect(aboutMeta.robots).toBeUndefined();
    expect(aboutMeta.title).toBe("About");
  });
});

describe("About text", () => {
  it.each(Object.entries(ABOUT_TEXT))(
    "%s shows the approved text word for word and no placeholder",
    (title, expected) => {
      const { container } = render(<AboutPage />);
      const section = screen.getByRole("region", { name: title });
      expect(Array.from(section.querySelectorAll("p"), (p) => p.textContent)).toEqual(expected);
      expect(container.querySelector("[data-placeholder]")).toBeNull();
    },
  );

  it("links the two names to their own pages", () => {
    render(<AboutPage />);
    for (const { name, href } of ABOUT_LINKS) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
      expect(screen.getByRole("link", { name })).toHaveAttribute("rel", "noreferrer");
    }
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
