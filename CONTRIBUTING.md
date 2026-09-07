# Make one useful improvement

Describe the learner's problem, the change they will see, and how you will verify
it. Agent-driven contributions follow the same branch and pull-request path as
human contributions. Follow AGENTS.md; use official sources for technical claims.

Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test:starter`, `pnpm test`,
and `pnpm test:static`. Install Chromium first with
`pnpm exec playwright install --with-deps chromium` on a fresh Linux runner.
The six-file starter must fail before correction, pass after the exact change,
and reject changed protected files, extra entries, and an altered verifier.

An independent agent reviews the exact commit and records its evidence on a
separate `review/...` branch. A maintainer checks the receipt and green CI, then
uses auto-merge. The main ruleset's merge queue reruns `Quality` on the combined
merge group before landing. There is no required human approval count; independent
review remains an explicit maintainer/agent gate, not an automated model service.

Do not change a queued PR's head. Remove it from the queue before revising, then
repeat review. Never disable checks to land a failing change. After a release,
inspect the public URL and Actions result. Report bugs with the page, viewport,
steps, observed result and expected result; include the deployed version.json SHA.
