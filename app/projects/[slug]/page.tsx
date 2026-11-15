import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "../../_components/placeholder";
import { PageLayout, Section } from "../../_components/page-layout";
import pageStyles from "../../_components/page.module.css";
import { findProject, PROJECTS, projectPath } from "@/lib/projects";
import { pageMetadata } from "@/lib/metadata";

// Only the projects in the list exist; any other URL is the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = findProject((await params).slug);
  if (!project) {
    return {};
  }
  return pageMetadata({ title: project.name, description: project.summary, path: projectPath(project.slug) });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const project = findProject((await params).slug);
  if (!project) {
    notFound();
  }
  return (
    <PageLayout title={project.name} lead={project.summary} longTitle>
      <Section title="Repository">
        <p>
          <a className={pageStyles.link} href={project.repoUrl} rel="noreferrer">
            {project.name} on GitHub
          </a>
        </p>
      </Section>
      <Section title="What it does">
        <Placeholder>What this project does, in a few plain paragraphs, comes here.</Placeholder>
      </Section>
      <Section title="Why it exists">
        <Placeholder>The problem it came from and what I learned building it comes here.</Placeholder>
      </Section>
      <p>
        <Link className={pageStyles.link} href="/projects/">
          All projects
        </Link>
      </p>
    </PageLayout>
  );
}
