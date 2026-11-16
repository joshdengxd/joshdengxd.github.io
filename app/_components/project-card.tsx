import Link from "next/link";
import { projectPath, type Project } from "@/lib/projects";
import styles from "./project-card.module.css";

/** The project cards of the Projects index. */
export function ProjectCards({ projects }: { projects: readonly Project[] }) {
  return (
    <ul className={styles.cards}>
      {projects.map((project) => (
        <li key={project.slug}>
          <article className={styles.card} data-project={project.slug}>
            <h2 className={styles.name}>
              <Link href={projectPath(project.slug)} className={styles.link}>
                {project.name}
              </Link>
            </h2>
            <p className={styles.summary}>{project.summary}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}
