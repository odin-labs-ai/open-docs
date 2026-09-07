# Public release verification

The original academy is publicly deployed at
https://odin-labs-ai.github.io/open-docs/.

## Initial release: 7 September 2026

Reviewed PR [#1](https://github.com/odin-labs-ai/open-docs/pull/1) landed as
`43d0792ce7d50508906d2ef276fa9ee32fc0d4dd`. The public `version.json` served that
exact commit during the live browser inspection. The
[independent review receipt](https://github.com/odin-labs-ai/open-docs/blob/review/pr-1/verification/reviews/pr-1.md)
was committed and pushed before landing.

[Required CI](https://github.com/odin-labs-ai/open-docs/actions/runs/34150250500)
passed strict TypeScript/build, 17 browser tests and 11 adversarial starter checks.
Nested-path verification read 18 lessons, checked 111 concept links and five
provider layouts, exercised mesh picking and context-loss fallback, and recorded
zero failed requests, external requests or page errors.

The separate live inspection used fresh browser contexts at 1440px and 390px:
prediction → run → visible result, DeepSeek object → readable code, public field
guide navigation, no horizontal overflow, no failed responses and no page errors.
[Machine-readable live observations](verification/initial-live-browser.json)
record the URL and deployed commit. Visual inspection found a fourth mobile nav
item wrapping onto an extra row; the follow-up change keeps all four destinations
together and checks 320px/390px layouts. The downloadable guide's stray reference
to a Dutch site was also removed, with its protected hash and archive regenerated. An agent-as-learner completed all five discoveries on the public release and identified reflection questions that presumed a successful branch; those prompts now ask about the mechanism across failed and corrected runs.

The initial [Pages release and deployed suite](https://github.com/odin-labs-ai/open-docs/actions/runs/34150492551) also passed: all 17 browser tests ran against the actual public URL after its commit-identity check.

## Ongoing release evidence

The [release workflow](https://github.com/odin-labs-ai/open-docs/actions/workflows/release.yml)
runs the complete browser suite against a production preview, a nested-path
static check and the starter checks. After publishing, it waits for the expected
commit at `version.json` and repeats the browser suite against the actual Pages
URL. A green publish job therefore includes deployed behavior checks. Open the
run for the main commit you are evaluating; don't substitute an older green run.

The main ruleset requires PRs, GitHub Actions' `Quality` check, and the merge queue.
It prevents force pushes and deletion, with no configured bypass. The checked-in
[configuration](.github/rulesets/main.json) records the explicitly applied rules.
The initial PR bootstrapped the workflow on main; later PRs pass through the queue.
Merge-group runs are visible in Actions and repeat the required combined-code check.
Head-bound independent AI-review receipts remain on separate `review/...` branches.
AI review happens in contributor sessions; the workflow does not call a paid model.

## Limits

The checks cover authored learning journeys, desktop/mobile layouts, keyboard
return paths, reduced motion, accessible content, WebGL fallback, provider
selection, failure/recovery and downloads. They establish tested behavior, not
human learning outcomes or the absence of every possible bug. Agent-as-learner
review is additional usability evidence, not a facilitated human study.
Real-provider agent execution is optional and is not performed by this public app
or CI. Private identity fixtures and tenant integrations are outside this build.
