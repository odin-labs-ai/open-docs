# Odin Open Docs — agent instructions

This is a public, static learning app. Use Node 22, pnpm, and strict TypeScript.
Core Odin platform logic belongs in its original packages; this repo contains
teaching fixtures, not a second implementation of the platform.

1. Start from the rendered learner problem. Preserve the original academy's
   useful interactions and accessible text alternatives.
2. Use an isolated branch or worktree. Keep private catalogs, credentials,
   organization login routes, and internal infrastructure out of this repository.
3. Make a bounded change. Keep descriptions of simulations and example code honest.
4. Run the checks in CONTRIBUTING.md. For learner-facing changes, inspect desktop
   and mobile behavior, including the failed path and the corrected result.
5. Ask a distinct agent to skeptically review the exact PR head. Resolve material
   findings. Record {pr, headSha, verdict, recordedAt} and supporting evidence in
   a durable review artifact before enabling auto-merge; never review your own
   implementation as the independent verifier. Keep receipts on a separate
   evidence branch so recording a verdict does not change the reviewed head.
6. With the user's authorization, enqueue the reviewed PR after required checks
   pass. Do not bypass branch rules. Re-review if the head changes.
7. Verify the real Pages deployment and version.json against main. A passing
   preview or merged PR alone is not deployment evidence. Fix forward.

The pipeline automates build, tests, merge-group checks, deployment and deployed
browser tests. AI authorship and independent AI review happen in the contributor's
agent session; this repository does not secretly run a paid model or claim that
CI is an AI reviewer. Do not deploy elsewhere or send messages without authority.
