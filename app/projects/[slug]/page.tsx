import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink } from "../../_components/external-link";
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
          <ExternalLink className={pageStyles.link} href={project.repoUrl}>
            {project.name} on GitHub
          </ExternalLink>
        </p>
      </Section>
      <Section title="What it does">
        {project.whatItDoes.map((text) => (
          <p className={pageStyles.projectText} key={text}>
            {text}
          </p>
        ))}
      </Section>
      <Section title="How it works">
        {project.diagram && (
          <figure className={pageStyles.diagram}>
            <Image
              className={pageStyles.diagramImage}
              src={project.diagram.src}
              width={project.diagram.width}
              height={project.diagram.height}
              alt={project.diagram.alt}
            />
            <figcaption className={pageStyles.projectText}>
              {project.diagram.caption}{" "}
              <a className={pageStyles.link} href={project.diagram.src}>
                Open full-size diagram
              </a>
              .
            </figcaption>
          </figure>
        )}
        {project.howItWorks.map((text) => (
          <p className={pageStyles.projectText} key={text}>
            {text}
          </p>
        ))}
        <ul className={pageStyles.list}>
          {project.guideLinks.map(({ label, href }) => (
            <li key={href}>
              {href.startsWith("/") ? (
                <Link className={pageStyles.link} href={href}>
                  {label}
                </Link>
              ) : (
                <ExternalLink className={pageStyles.link} href={href}>
                  {label}
                </ExternalLink>
              )}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Why it exists">
        {project.whyItExists.map((text) => (
          <p className={pageStyles.projectText} key={text}>
            {text}
          </p>
        ))}
      </Section>
      <p>
        <Link className={pageStyles.link} href="/projects/">
          All projects
        </Link>
      </p>
    </PageLayout>
  );
}
