# Odin Open Docs

**[Start learning →](https://odin-labs-ai.github.io/open-docs/)**

Open, interactive harness engineering docs, powered by [Odin](https://www.odin-labs.ai).
Start with the model and the system around it. Inspect how context, skills, tools,
workflows and feedback shape an agent, then try one small task: fix a typo and
preserve a link. Predict an outcome, inspect the artifact, and explain what happened.

- **Start here:** an interactive agent map, followed by five hands-on discoveries.
- **Explore:** 18 lessons with code, checks, and interactive 3D walkthroughs.
- **Failure lab:** experiment with permissions, context, verification, and recovery.
- **Field guide:** 111 concepts and links to primary sources.
- **Take it with you:** a downloadable, independently checkable exercise for
  Codex, Claude Code, Pi, DeepSeek through Pi, and Factory Droid.

The browser exercises are deterministic teaching fixtures. They do not call an AI
provider, require a login, or contain private organization documentation. Progress
is saved on your device. Optional real-agent exercises use your own installed
agent and provider account. Written instructions and passing tests do not create
a runtime sandbox or establish human mastery.

## Run locally

Use Node 22 and pnpm 10.11.1, from this repository's root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:4329. To check a production build:

```sh
pnpm exec playwright install chromium
pnpm build
pnpm test:starter
pnpm test
pnpm test:static
```

`pnpm test` starts the production preview. The static check also tests a nested
URL, matching the way GitHub Pages serves this app. Renderer development probes
in `tests/*.mjs` other than the package scripts require `pnpm dev`.

## Contribute with an agent

Read [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md). Work in a branch,
make one concrete improvement, and open a pull request. Required CI runs for PRs
and merge groups. An independent agent must review the exact PR head before a
maintainer enables auto-merge. No paid AI API or self-hosted runner is required
by this repository's pipeline.

Main deploys to GitHub Pages only after its checks pass. The release workflow
then runs the browser suite against the actual public deployment and checks its
`version.json` commit identity. A failed deployed check turns the workflow red;
correct it with a forward-fix PR. Review runs in [Actions](https://github.com/odin-labs-ai/open-docs/actions).

## Provenance

This preserves the original Odin harness-engineering academy and adapts it for
public static hosting. [STAGE-SOURCES.md](STAGE-SOURCES.md) distinguishes authored
teaching artifacts from upstream examples. [BRAND.md](BRAND.md) records the logo
source. [VERIFICATION.md](VERIFICATION.md) records release evidence and limits.
