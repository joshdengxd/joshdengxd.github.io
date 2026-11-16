# joshdengxd.github.io

My personal website: about me, what I am learning, what my public repos do, and a blog. It is live at [joshdengxd.github.io](https://joshdengxd.github.io).

It is a static site built with Next.js and TypeScript and hosted on GitHub Pages. Changes use the workflow in [josh-shared-skills](https://github.com/joshdengxd/josh-shared-skills): approved tickets, implementation, independent verification, pull request checks, authorized landing and a live-site check. Starting an unattended run authorizes its merges and landing steps; step by step, I review the pull request and ask for landing. Every machine gate must pass in either mode. Dependabot patch and minor updates can auto-merge after checks pass.

## Repository guide

- [Design language](design-language/README.md): the visual decisions, shared tokens and local fonts.
- [Documentation index](docs/context/INDEX.md): current architecture, page and blog conventions, code style and operational notes.
- [Product requirements](docs/prd/README.md): PRD means Product Requirements Document. These files record approved requirements; use the context documentation for the current implementation.
- [Workflow skills](.claude/skills/): the agent workflow skills copied into this repository.
- [Skill source and update policy](docs/context/skills-source.md): the shared upstream repository, copied version and why skill changes start upstream.
- [Agent project instructions](AGENTS.md): project commands, constraints and ticket workflow settings.

## Delivery record

The [issues](https://github.com/joshdengxd/joshdengxd.github.io/issues), [merged pull requests](https://github.com/joshdengxd/joshdengxd.github.io/pulls?q=is%3Apr+is%3Amerged) and [project board](https://github.com/users/joshdengxd/projects/1) show the work and its state. [How this site is built](https://joshdengxd.github.io/how-this-site-is-built/) explains the workflow.

## License

Code: MIT. Blog posts and other writing: all rights reserved.
