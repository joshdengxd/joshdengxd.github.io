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

## More languages

```json
{ "name": "fixture", "tags": ["a", "b"], "count": 3, "ok": true }
```

```bash
# list the files
ls -la "$HOME" | grep --color=never ".md"
```

```csharp
public class Greeter { public string Greet(string name) => $"Hello, {name}"; }
```

```brainfuck
++++++++[>++++[>++>+++<<-]<-]>>. a plain line that is long enough to scroll inside its block as well ...........................................
```

```
a block with no language, and a line that is long enough to scroll inside its block as well ...........................................
```

## A diff

```diff
- const label = 'old';
+ const label = 'new';
  const same = true;
```

## A table

| Part | Job |
| --- | --- |
| Loader | Reads the Markdown files |
| Pipeline | Turns Markdown into safe HTML |

A [link to the blog](/blog/) and some `inline code`.

## A picture

![A diagram of three boxes, One, Two and Three, joined by arrows](diagram.svg "Figure 1: three boxes in a row, drawn on a light background.")
