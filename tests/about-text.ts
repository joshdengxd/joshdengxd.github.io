// The owner's approved text of the three About sections, word for word (tickets #34, #35, #36). Tests compare the
// rendered paragraphs with these strings; changing the text on the page means changing it here on purpose.
export const ABOUT_TEXT = {
  Background: [
    "I built my first website in third grade, with Microsoft FrontPage. I liked it right away, and ever since I have liked building things that solve people's problems.",
    "So I studied Computing Science at the University of Alberta. In my third year, in 2015, six of us, all friends, helped a local startup called SnowTapp get started. It later became Yardly and was acquired in 2022.",
    "After university I worked at Origami Accounting, then at Alberta Motor Association, the College of Registered Nurses of Alberta, Noralta Technologies, Intellimedia and SurveyMonkey.",
    "Since 2024 I have seen AI change how I build things, and I have spent a lot of time learning it.",
  ],
  "What I am learning": [
    "What fascinates me most about AI is that it can reason about a problem, not just follow a program. So a lot of the work of building software can be automated: debugging, reading logs, release steps, all the tedious and repetitive parts. I think the best result is that people spend their time on critical thinking and on design and engineering, not on low-value repetition.",
    "What I am working on now has two parts. The first is how to say what I intend so that an AI understands the goal. The second is how to check an AI's work automatically, with verification and evaluation, so that checking does not depend on a person reading every change, and how to orchestrate that work so it reaches the goal more precisely.",
    "I want AI-assisted development to be more automated and more reliable, in production.",
    "I mostly use Claude Code. Many of my ideas and workflows come from Matt Pocock and Lauren Tan, along with many other people.",
  ],
  "How I work": [
    "The most important part of making anything now is breaking an idea down, step by step, into pieces an AI can understand.",
    "I think of a workflow like a restaurant. You have to teach the AI your recipe. Cook with it once so it learns how you do it, or work out a better way together. Then copy that way of working to more agents. That is how it scales. At my last job I built agent workflows this way for ticket-to-PR and for production releases, and my team used them.",
    "There is no one-size-fits-all. Every domain, every business and even every team has its own problems. So I work with the people who have the domain knowledge, find what hurts, get a workflow running that solves it, and then standardize it and scale it. Slowly that builds automated workflows that fit the domain and that people can trust.",
    "Some things stay with me: critical thinking, designing the product, making the decisions, and any step that cannot be undone, like a production release. AI can give me ideas and data, but the decision is mine. For the rest I give the AI context, not control, and I do not micromanage it. With the right context, the right constraints and a good way to verify, AI can make production-ready software.",
  ],
} as const;

export const ABOUT_LINKS = [
  { name: "Matt Pocock", href: "https://www.aihero.dev/" },
  { name: "Lauren Tan", href: "https://x.com/poteto" },
] as const;
