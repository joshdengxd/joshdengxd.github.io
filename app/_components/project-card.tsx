import Link from "next/link";
import { projectPath, type Project } from "@/lib/projects";
import styles from "./project-card.module.css";

/** The project cards of the Projects index and of Featured repos on the home page: the same markup and data. */
export function ProjectCards({ projects, headingLevel }: { projects: readonly Project[]; headingLevel: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <ul className={styles.cards}>
      {projects.map((project) => (
        <li key={project.slug}>
          <article className={styles.card} data-project={project.slug}>
            <Heading className={styles.name}>
              <Link href={projectPath(project.slug)} className={styles.link}>
                {project.name}
              </Link>
            </Heading>
            <p className={styles.summary}>{project.summary}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}
