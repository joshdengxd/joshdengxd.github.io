import { PageLayout } from "../_components/page-layout";
import { ProjectCards } from "../_components/project-card";
import { PROJECTS } from "@/lib/projects";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Projects",
  description: "The public GitHub repos behind this site: shared agent skills, a job-search skill set, and the site itself.",
  path: "/projects/",
});

export default function Page() {
  return (
    <PageLayout title="Projects" lead="My public repositories and what each one does.">
      <ProjectCards projects={PROJECTS} headingLevel={2} />
    </PageLayout>
  );
}
