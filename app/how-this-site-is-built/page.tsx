import { PageLayout, Section } from "../_components/page-layout";
import pageStyles from "../_components/page.module.css";
import { Placeholder } from "../_components/placeholder";
import { issueUrl, PARTS, pullUrl, SKILLS_NOT_USED, WORKFLOW } from "@/lib/build-log";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "How this site is built",
  description:
    "The ticket cycle, the parts of this site with their issues and pull requests, and the shared skills it does not use.",
  path: "/how-this-site-is-built/",
});

export default function Page() {
  return (
    <PageLayout
      title="How this site is built"
      lead="Every change here goes through a ticket, checks and a pull request. The issues and PRs are the demo."
    >
      <Section title="Workflow">
        <ol className={pageStyles.rows}>
          {WORKFLOW.map(({ skill, step }) => (
            <li key={skill} className={pageStyles.row}>
              <code className={pageStyles.term}>{skill}</code>
              <span className={pageStyles.rowText}>{step}</span>
            </li>
          ))}
        </ol>
        <Placeholder>A walk through one real ticket, from refinement to the live check, comes here.</Placeholder>
      </Section>
      <Section title="Parts">
        <ul className={pageStyles.rows}>
          {PARTS.map((part) => (
            <li key={part.issue} className={`${pageStyles.row} ${pageStyles.rowWide}`} data-part={part.issue}>
              <span className={pageStyles.term}>{part.name}</span>
              <span className={pageStyles.rowText}>{part.what}</span>
              <span className={pageStyles.links}>
                <a className={pageStyles.link} href={issueUrl(part.issue)} rel="noreferrer">
                  Issue #{part.issue}
                </a>
                {part.pr === null ? (
                  <span className={pageStyles.small}>PR pending</span>
                ) : (
                  <a className={pageStyles.link} href={pullUrl(part.pr)} rel="noreferrer">
                    PR #{part.pr}
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Skills not used here">
        <p className={pageStyles.text}>
          The site is built with my shared skills. These ones from the same set do not apply to a static site.
        </p>
        <ul className={pageStyles.rows}>
          {SKILLS_NOT_USED.map(({ skill, why }) => (
            <li key={skill} className={pageStyles.row}>
              <code className={pageStyles.term}>{skill}</code>
              <span className={pageStyles.rowText}>{why}</span>
            </li>
          ))}
        </ul>
      </Section>
    </PageLayout>
  );
}
