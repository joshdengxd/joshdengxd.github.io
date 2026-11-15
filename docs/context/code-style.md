# Code style: Prettier and ESLint

Files: `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.gitattributes`, `eslint.config.mjs`. Commands: `npm run lint`, `npm run format`, `npm run format:check`. CI (`checks`) runs lint and the format check.

## Prettier
- Defaults plus `printWidth: 120`: the code already used the defaults (double quotes, semicolons, trailing commas, 2 spaces) at about 120 columns, so this changes the fewest lines.
- Formats code, config and CSS only. `.prettierignore` skips `.claude/`, `docs/`, `*.md`, `tests/fixtures/`, `package-lock.json`, `out/`, `.next/`, `drafts/` and the design-language images and fonts: copied skills, prose and generated files are not ours to reflow.
- `.gitattributes` (`* text=auto eol=lf`) keeps every file LF, also on Windows. Without it a Windows checkout (`core.autocrlf=true`) is CRLF and `prettier --check` fails on every file. `.editorconfig` tells editors the same (LF, 2 spaces, final newline).
- No ESLint Stylistic and no layout rules in ESLint: Prettier owns layout, and it wraps lines, which ESLint Stylistic does not.

## ESLint rule groups (`eslint.config.mjs`, in this order)
1. `eslint-config-next` `core-web-vitals` and `typescript`: React, hooks, a11y, Next.js and the basic TypeScript rules.
2. `typescript-eslint` `strict` and `stylistic`, not type-checked: more bug-catching rules (non-null assertions, empty functions, useless constructs) and consistent TypeScript idioms, with no type-aware lint cost (type-checked rules add about 5 s and need every file in a tsconfig).
3. `eslint-config-prettier/flat`: switches off every rule that fights Prettier.
4. Own rules (all errors):
   - `curly: all`: a block for every `if`, `else`, `for`, `while`. A brace-less body hides a second line that looks guarded and is not.
   - `eqeqeq`, `prefer-const`, `no-var`: the usual correctness basics.
   - `no-else-return`, `no-lonely-if`, `no-nested-ternary`, `no-unneeded-ternary`: flatter, easier to read control flow.
   - `object-shorthand`, `prefer-template`: short forms over `a: a` and string concatenation.
   - `no-console`: no stray debug output in application code.
   - `@typescript-eslint/consistent-type-definitions: type`: the code uses `type`; the strict preset would flip it to `interface`.
5. Overrides: `tests/**` may use non-null assertions (`!`) on values the test just set up; `scripts/**` may use `console` (they report to the terminal). Non-null assertions and `console` stay errors in application code.
6. Ignored: `.next`, `out`, `next-env.d.ts`, `drafts`, `playwright-report`, `test-results`, `.claude`.

## The config-order trap
`eslint-config-prettier` turns `curly` off (Prettier cannot keep braces consistent on its own). The own rules therefore come AFTER it, as step 4. Move `eslintConfigPrettier` below them and `curly` is silently off, with no error. Check with `npx eslint --print-config app/layout.tsx`: `curly` must be `[2, "all"]`. Do not remove a rule without knowing why it is here (this file).

## Left out on purpose
- Import sorting, object-key and JSX-prop sorting: noisy diffs, and key sorting can change spread precedence.
- Type-checked typescript-eslint rules: cost and setup, small gain here.
- `lint-staged` and `husky`: CI gates every PR and work happens in worktrees; hooks add dependencies and get bypassed.
- ESLint 10: three plugins bundled in `eslint-config-next` (react, jsx-a11y, import) do not declare support yet; its own ticket (#29). Dependabot ignores the ESLint major.

## Rollout notes (#25)
Done in this order: `.gitattributes` and configs, `eslint --fix` (braces, template strings), `prettier --write`, then by hand: non-null assertion in `lib/posts/markdown.ts` (optional chain) and `app/design/page.tsx` (helper that throws), nested ternaries in two tests, empty functions (a comment in the body). Formatting and rule fixes only; renames and refactors are #24.
