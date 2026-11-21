---
title: How My Agents Learn the Way I Work
date: 2026-11-21T19:00:00Z
tags: [agents, learning, verification]
summary: "How I use /wrap-up to carry successful ways of working from one agent session into the next, from design exploration to independent review."
---

Have you ever corrected an agent, opened a fresh session, and had to explain the same thing again? The agent may understand the task and still have to guess how you want it to propose ideas, handle feedback, and check whether the result is right.

I used to ask agents to update their memory or a skill after giving feedback. I still had to remember to ask and decide where each lesson belonged. I built `/wrap-up` to make saving what worked part of finishing a task. That way, the next session can use the feedback I already gave.

## Five ideas, then five more

When I was designing this site, I asked my agent for five homepage ideas. I picked the one that made my name the focus and asked for five variations on that idea. We did two more rounds for color and the two-tone treatment you see today. The [original ticket](https://github.com/joshdengxd/joshdengxd.github.io/issues/4#issuecomment-6886752160) has the full sequence.

![Five early homepage mockups and the final design, with the selected direction and final design outlined in green.](website-design-directions.webp "The first five homepage directions and the final design, D5.")

I got the idea for `/wrap-up` from a creator who ended his sessions by asking the agent to update what needed updating, archive what needed archiving, and commit what was ready. I added a step to capture how we got a result I liked. For the homepage, the guidance I wanted the next session to have was simple:

> When I ask for a design and the direction is open, show me five distinct ideas. Wait for me to pick a direction, then show me five variations on it.

On a later design task, the agent offered to work that way before I asked. That’s how I knew we’d saved something useful. The next session knew when to bring me options and when to wait for a decision.

What I save depends on what we learned. A personal preference can go in memory, a team-wide requirement in the project instructions, and a repeatable procedure in a skill. I try to leave enough detail for the next agent to know when to use it, what to do, and how to check the result.

For `/wrap-up` to work well on a project, the agent needs a place to find what we already know. On this site, a [Markdown index](https://github.com/joshdengxd/joshdengxd.github.io/blob/main/docs/context/INDEX.md) points to focused documents and tells the agent when to read each one. The same setup can work in a shared wiki the agent reads through MCP. At the end of a session, the index helps the agent find the right document and update the guidance already there. In a fresh session, it helps the next agent find that guidance when the task calls for it.

![A hand-drawn loop on notebook paper showing four steps: try the task, review the work, run wrap-up, and reuse the steps in a fresh session.](wrap-up-notebook.webp "Save a way of working while the details are still fresh.")

Sometimes I need to see the options before I can give a precise answer. When I was making a particle effect, the motion around a magic circle felt too fast. The agent put six work durations side by side in one animated grid: 4, 7.5, 11, 15, 18, and 22 seconds. The preview showed rates from 10 to 1.87 particles per second, with the peak shown as 40 in every cell. Seeing those variants together gave me a way to narrow down what “slower” meant before asking for another adjustment.

![Six synchronized previews of a pink particle effect above a magic circle, labeled with work durations of 4, 7.5, 11, 15, 18, and 22 seconds.](particle-grid-web.webp "Six work durations with a peak of 40 in every preview.")

## Give the reviewer the ticket

For verification, I start a new subagent with the ticket’s acceptance criteria and the finished work, leaving out the implementation conversation. I ask it to check each criterion and show the evidence before I do my own review.

In [ticket #61](https://github.com/joshdengxd/joshdengxd.github.io/issues/61#issuecomment-6904551171), I wanted to remove duplicate GitHub and LinkedIn links from the homepage’s first screen, keep them in the footer, and preserve the layout. The [pull request](https://github.com/joshdengxd/joshdengxd.github.io/pull/63) records what the fresh verifier checked, including screenshots at three widths and a design inspection with zero failures and warnings. It also records a separate code review.

Once I’d walked the agent through that handoff, I made it a project rule. The workflow now says when to bring in a reviewer, what to give it, and what evidence I expect back.

## What retrospectives taught me about onboarding agents

I later found [Matt Pocock’s `/retro`](https://github.com/mattpocock/skills/blob/main/skills/engineering/retro/SKILL.md). It reviews a coding session and suggests changes for future runs. When an error can be detected mechanically, it looks for an automated check. That’s one way to make a lesson from a single session useful the next time around.

When I was a Scrum Master, it took a new team a few sprints to learn how to work together. People had different habits around decisions, feedback, and what counted as done. In a retro, we could look back at a real sprint and agree on one change to try in the next.

I give agents the same room to learn how I work. The first few tasks surface preferences I haven’t put into words yet. A good wrap-up makes one of those preferences usable in the next session. When the agent offers the options or brings in a reviewer on its own, I can spend my time on the decisions that are actually new.