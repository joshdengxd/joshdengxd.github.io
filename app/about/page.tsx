import { Placeholder } from "../_components/placeholder";
import { PageLayout, Section } from "../_components/page-layout";
import pageStyles from "../_components/page.module.css";
import { LINKEDIN_URL } from "../_shell/links";
import { GITHUB_OWNER_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About",
  description: "Who Xindong Deng (Josh) is: a software developer in Alberta, Canada, his background and how he works.",
  path: "/about/",
});

export default function Page() {
  return (
    <PageLayout title="About" lead="Who I am, what I am learning and how I work.">
      <Section title="Background">
        <Placeholder>A short account of my work as a software developer since 2018 comes here.</Placeholder>
      </Section>
      <Section title="What I am learning">
        <Placeholder>What I am learning about building software with coding agents comes here.</Placeholder>
      </Section>
      <Section title="How I work">
        <Placeholder>
          How I plan, check and ship work, with a person on every irreversible step, comes here.
        </Placeholder>
      </Section>
      <Section title="Links">
        <ul className={pageStyles.links}>
          <li>
            <a className={pageStyles.link} href={GITHUB_OWNER_URL} rel="me">
              GitHub
            </a>
          </li>
          <li>
            <a className={pageStyles.link} href={LINKEDIN_URL} rel="me">
              LinkedIn
            </a>
          </li>
        </ul>
      </Section>
    </PageLayout>
  );
}
