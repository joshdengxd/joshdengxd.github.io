---
title: Fixture post for the blog engine
date: 2026-11-15T23:30:00Z
tags:
  - engine-check
  - markdown
summary: A test post with a code block and a table, built only when BLOG_FIXTURES is 1.
---

This post exists only for tests. It is never part of the deployed site.

## A code block

```ts
export function add(a: number, b: number): number {
  return a + b; // a long line, so the block has to scroll inside itself instead of widening the page ........................................
}
```

## A table

| Part | Job |
| --- | --- |
| Loader | Reads the Markdown files |
| Pipeline | Turns Markdown into safe HTML |

A [link to the blog](/blog/) and some `inline code`.
