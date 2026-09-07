# Independent adversarial review — open-docs PR 1

```json
{
  "pr": "https://github.com/odin-labs-ai/open-docs/pull/1",
  "headSha": "f8592636565c1cdde010b89db2aec943e255ef5b",
  "verdict": "SHIP",
  "recordedAt": "2026-09-07T18:07:25Z"
}
```

Independent reviewer: the distinct `open_docs_public_review` agent, instructed to refute the implementation. Reviewed source, documentation, tests and release workflow in the isolated release checkout; both local git and live GitHub PR metadata confirmed the exact head above and base `547cd31f22f9c25a0a9967f893e1e9751049319b`. No repository files or GitHub state were changed by this reviewer.

## Verdict and material findings

**SHIP. No material release-blocking finding remains in this exact diff.** This is the independent code/content-review verdict. It does not waive green required checks, repository rules, merge-group validation, or the post-deployment evaluation.

The earlier three findings are resolved:

- Static hosting: the organization adapter and its private catalog stages are absent; all visible navigation is public; the old `#workspace` route maps to the public field guide. There is no remaining app auth/tenant fetch or Control Tower login route. The public test asserts no identity requests and checks nested deployment-relative asset URLs.
- Verifier fidelity: the external trusted script checks exact corrected help bytes, protected-file hashes, the complete six-file inventory, regular-file type and working verifier equality. Instructions distinguish the agent's editable local check from the learner's external final authority, require the original outside writable scope, and state the observation/time/sandbox limits. The bundled archive matches all six original files byte-for-byte. Browser-generated ZIPs use those same public files; flat archive entries are consistent with the on-page instruction to extract into `harness-starter`.
- Standalone instructions: root installation/build/test commands, pnpm version and local port are consistent with package and Vite configuration. Private monorepo deployment requirements are removed.

## Evidence examined and executed

- Compared original academy `main.ts`, `workshop.ts`, `provider-stages.ts`, lesson-stage content and relevant browser tests with the migrated versions. Public lesson and exercise logic is preserved; changes are predominantly branding, removed private integration, trusted starter guidance and deployment-relative browser URLs. The original five-discovery/18-lesson/111-concept journeys and failure-path checks remain.
- Ran `node (v22) --test tests/starter.test.mjs`: **11 passed, 0 failed**. This covers unchanged baseline, exact correction, broken link, changed FAQ/instructions, extra file/directory, altered verifier, missing file, symlink and archive fidelity.
- Ran `node (v22) node_modules/typescript/bin/tsc --noEmit`: **exit 0**.
- Read workflow permissions and trigger/job conditions: PR and merge-group checks run with `contents: read`; Pages write/OIDC permissions exist only in the main-only publish job; publish depends on successful quality checks; actions use full commit SHA pins; main executions are serialized without cancelling the active release. There is no `pull_request_target` execution or paid model credential path.
- The workflow runs production-preview browser tests and the nested static check before uploading `dist`. Deployment verification requires `version.json` to match the workflow's commit, then runs the browser suite against the returned Pages URL. The Playwright configuration disables its local server when that public URL is supplied.
- Read AGENTS/CONTRIBUTING: independent AI review is accurately described as a contributor/maintainer gate with a durable exact-head receipt, not a deterministic CI check falsely labeled as AI review. The queue workflow supports `merge_group` explicitly.

## Remaining release gates and review limits

- At the live metadata read during this review, GitHub `Quality` was still **IN_PROGRESS**, run `34150250500`, job `101830841141`. Do not interpret this verdict as a claim that CI passed. Require its successful exact-head result before landing.
- Queue enablement and actual merge-group operation are a bootstrap/operator verification step after the workflow exists on main. They have not been proven by this source review. Do not claim that the queue has already executed.
- No competing full browser suite was run by this reviewer. The parent/CI owns exact-head full-suite results and the deployed learner review. Brand source provenance was inspected in BRAND.md; a fresh independent website-logo visual comparison was not performed here.
- No public deployment is claimed in this verdict. Require main SHA versus deployed `version.json`, successful deployed browser checks, and the parent’s real learner-flow inspection after publishing.
- Persist this receipt on the separate review evidence branch before arming auto-merge. Any PR-head change before arming invalidates this exact-head receipt and requires re-review.
