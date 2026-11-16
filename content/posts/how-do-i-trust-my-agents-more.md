---
title: How do I trust my agents more?
date: 2026-11-15T18:00:00Z
tags: [agents, verification, learning]
summary: "Notes on Lauren Tan's talk about trusting coding agents, and where it matches what I have seen: clean code, fewer documents, and agents that verify their own work."
---

I watched [All Code Is Slop (Except Mine)](https://www.youtube.com/watch?v=O_zcc6Xl12g), a talk by [Lauren Tan](https://x.com/poteto). It is about one question: how do you trust your agents more? I agree with most of it. Here is what I took from it, and where it matches what I have seen myself.

## Trust is something you build

Her point is that the job now is to raise your output a lot without lowering the quality of the code. That takes trust, but not blind trust. It means investing in the environment your agents work in.

She draws it as an upside-down pyramid, from cheap and certain at the top to expensive at the bottom: the codebase itself (API design, architecture), static analysis (lint rules, types, tests, CI), verification (at runtime and formal), then prose (rules, skills, AGENTS.md), and last, human review. The first two layers are deterministic. They make the agent do the right thing by default.

![A slide titled "how do i trust my agents more?" showing an upside-down pyramid. From top to bottom: codebase, static analysis, verification, prose, human review. An arrow on the left shows that cost grows downwards.](trust-pyramid.png)

*The "poteto pyramid", a slide from Lauren Tan's talk.*

I like it because it says where to spend effort. When I correct an agent, the best fix is usually not another line of instructions. It is a check that runs by itself.

## The codebase is a garden

Agents copy what they see. A workaround or an anti-pattern in your code looks like the established way to do things, so the next agent copies it, and it spreads like weeds. Her advice is to keep the code as clean as you can, so the agents copy the good parts.

I have seen this. When I refactored my code into a cleaner structure and removed the bad patterns, my agents became more accurate.

Two of her examples stayed with me. Her team banned `useEffect` in product code, because it takes a lot of nuance to use well and agents do not use it well. And they split the code into folders so that a forbidden import is obvious and a lint rule catches it. She also bans most code comments: they go stale, nothing enforces them, and agents use them to justify a shortcut. She prefers a lint rule with an error message that tells the agent to fix the root cause.

## Documents should say what code cannot

This part is my own view, not from the talk. I used to write a lot of documents to describe how my code worked, and that became hard to maintain. When I changed the code, the AI often forgot to update the documents, so the two disagreed, and the AI did not know which one to follow. Later, as AI got smarter, I deleted most of the documents, and things got better.

Since Opus 5.5 came out this year, I think a document that explains what the code does matters much less. The agent reads the code and understands it. A document is still worth writing for what code cannot tell you: the history behind a decision, or a business rule.

## Verification was my AI moment

In May or June this year, at an engineering all-hands at work, a QA team showed how they used Chrome DevTools with an agent. I tried it myself. The agent could change request headers and check my changes in the browser on its own. It helped a lot with testing my accessibility epic, and the testing became very automated. That was my AI moment. It showed me that an agent can verify its own work, and that this can be reliable.

So I do not think every ticket needs a person to verify it. Lauren says much the same: review has become mostly looking at what verification produces, such as videos, screenshots and diagrams, and most of her tokens go into verification. She also tries formal verification and property-based testing for UIs, as more layers and not as a silver bullet. In the month she describes, her team shipped 11,000 pull requests to production, and the share that had to be reverted stayed around half a percent.

## What I am taking from it

- Turn every correction into a check, not another rule in a prompt.
- Keep the code clean, because it is the biggest input an agent has.
- Write documents for the why, not the what.
- Invest in verification, and let the agent run the thing itself.
