import { PageLayout, Section } from "../_components/page-layout";
import pageStyles from "../_components/page.module.css";
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
        <p className={pageStyles.prose}>
          I built my first website in third grade, with Microsoft FrontPage. I liked it right away, and ever since I
          have liked building things that solve people&apos;s problems.
        </p>
        <p className={pageStyles.prose}>
          So I studied Computing Science at the University of Alberta. In my third year, in 2015, six of us, all
          friends, helped a local startup, Yardley, get started.
        </p>
        <p className={pageStyles.prose}>
          After university I worked at Origami Accounting, then at Alberta Motor Association, the College of Registered
          Nurses of Alberta, Noralta Technologies, Intellimedia and SurveyMonkey.
        </p>
        <p className={pageStyles.prose}>
          Since 2024 I have seen AI change how I build things, and I have spent a lot of time learning it.
        </p>
      </Section>
      <Section title="What I am learning">
        <p className={pageStyles.prose}>
          What fascinates me most about AI is that it can reason about a problem, not just follow a program. So a lot of
          the work of building software can be automated: debugging, reading logs, release steps, all the tedious and
          repetitive parts. I think the best result is that people spend their time on critical thinking and on design
          and engineering, not on low-value repetition.
        </p>
        <p className={pageStyles.prose}>
          What I am working on now has two parts. The first is how to say what I intend so that an AI understands the
          goal. The second is how to check an AI&apos;s work automatically, with verification and evaluation, so that
          checking does not depend on a person reading every change, and how to orchestrate that work so it reaches the
          goal more precisely.
        </p>
        <p className={pageStyles.prose}>
          I want AI-assisted development to be more automated and more reliable, in production.
        </p>
        <p className={pageStyles.prose}>
          I mostly use Claude Code. Many of my ideas and workflows come from{" "}
          <a href="https://www.aihero.dev/" rel="noreferrer">
            Matt Pocock
          </a>{" "}
          and{" "}
          <a href="https://x.com/poteto" rel="noreferrer">
            Lauren Tan
          </a>
          , along with many other people.
        </p>
      </Section>
      <Section title="How I work">
        <p className={pageStyles.prose}>
          The most important part of making anything now is breaking an idea down, step by step, into pieces an AI can
          understand.
        </p>
        <p className={pageStyles.prose}>
          I think of a workflow like a restaurant. You have to teach the AI your recipe. Cook with it once so it learns
          how you do it, or work out a better way together. Then copy that way of working to more agents. That is how it
          scales. At my last job I built agent workflows this way for ticket-to-PR and for production releases, and my
          team used them.
        </p>
        <p className={pageStyles.prose}>
          There is no one-size-fits-all. Every domain, every business and even every team has its own problems. So I
          work with the people who have the domain knowledge, find what hurts, get a workflow running that solves it,
          and then standardize it and scale it. Slowly that builds automated workflows that fit the domain and that
          people can trust.
        </p>
        <p className={pageStyles.prose}>
          Some things stay with me: critical thinking, designing the product, making the decisions, and any step that
          cannot be undone, like a production release. AI can give me ideas and data, but the decision is mine. For the
          rest I give the AI context, not control, and I do not micromanage it. With the right context, the right
          constraints and a good way to verify, AI can make production-ready software.
        </p>
      </Section>
    </PageLayout>
  );
}
