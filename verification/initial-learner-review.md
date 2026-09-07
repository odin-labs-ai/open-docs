# Live Open Docs academy — agent learner evaluation

Date: 7 September 2026. URL: https://odin-labs-ai.github.io/open-docs/.

## Scope and provenance

The public app was immediately available. I opened its public version.json in a browser tab and read SHA **43d0792ce7d50508906d2ef276fa9ee32fc0d4dd**, builtAt **2026-09-07T18:10:16.371Z**. This report concerns that initial deployed release; later fixes reported by the parent were not independently reverified in this learner run.

I read rendered UI, selected accessible controls, inspected visible provider code objects, and downloaded/read the public exercise. I did not inspect application source, tests, answer keys, or repository content. Local filesystem access was limited to public downloaded exercise files and temporary evidence artifacts. No authenticated provider session, paid agent, external message, commit, publication, or repository edit was performed.

This is **agent-as-learner evaluation**, not a human usability study, evidence of changed model weights, or certification. I had previously evaluated a separate textual docs experience teaching similar concepts; this is a fresh traversal of this distinct academy UI, not a claim of zero prior topic knowledge.

Desktop: headless Chromium at 1440×1000. Mobile sample: 390×844. One context completed all five discoveries. A tool-kernel timeout later lost that context, so a second context was used for provider inspection, download, and mobile navigation. The second context started at zero progress as expected for separate browser storage; this is not evidence of failed progress persistence. Automation selector mistakes and a timeout while closing the browser are not counted as product defects. No app source was read to diagnose these.

## Beginner activities actually completed

The rendered UI reached **5 / 5 discoveries completed** after eight observed runs. I selected predictions before performing the activities and selected the mechanism-based reflection answer after a successful outcome.

| Discovery | Actual action | Observed evidence |
| --- | --- | --- |
| Define done | Predicted the precise request was checkable; tried it | Run 1 attached scope help.md, one typo, preserved FAQ, exact file evidence; corrected document shown; reflection advanced progress to 1/5 |
| Choose context | Predicted task file + short rules; selected help.md and Project instructions, deselected Old launch archive | Run 2 used 3/4 teaching units; file and rule fit together; original document remained visible because briefing is not an edit; reflection advanced to 2/5 |
| Control actions, denied branch | Predicted runtime refusal; ran default folder-export proposal | Run 3: export denied before execution, no export, help.md still Welcomme; explicitly “Containment worked; the requested typo repair is still incomplete”; no completion credit |
| Control actions, permitted branch | Selected the authorized typo edit and ran it | Run 4: authorized edit executed, corrected document shown; reflected on execution-boundary enforcement and reached 3/5 |
| Check evidence, damaged branch | Predicted a changed FAQ makes the task fail; checked default candidate | Run 5: heading fixed but ./missing.md shown; FAIL despite the agent's success message |
| Check evidence, correct branch | Selected only the requested typo correction, checked it, explained independent evidence | Run 6: PASS, FAQ and other characters preserved; progress 4/5 |
| Resume safely, new-operation branch | Predicted recover original ID was safer; deliberately ran default new-operation strategy to compare | Run 7: two operation records for one intended edit despite unchanged final text; instructed to restore original identity |
| Resume safely, original-operation branch | Restored checkpoint and inspected original operation; selected reconciliation explanation | Run 8 restored edit-001; receiver returned existing receipt, actual file passed, one logical operation remained; progress 5/5 |

I did not test every wrong prediction, every branch of the context exercise, audio narration, or all 18 advanced lessons. The eight runs above are the actual observed beginner evidence.

## Mechanisms in my own words

**Contract:** Choose the finish line before work begins: exactly what may change, what must survive, and how the resulting artifact will be checked. A polished “done” response cannot replace that observable finish line.

**Context:** The model needs the current file and the short rules that constrain this decision. The old archive consumes the teaching budget without helping this task. Smaller input is not universally better; relevant facts and constraints are the criterion. Outside text that requests export remains source material, not permission.

**Action boundary:** The host decides whether the proposed action is authorized before calling the side-effecting tool. A denied export is successful containment, but the heading is still misspelled. Finishing the task requires the separate permitted edit and evidence about its result. Project instruction files guide behavior; they do not alone configure runtime permissions.

**Evidence:** Inspect the actual artifact against the whole task. The damaged candidate demonstrates why a success claim and a corrected heading are insufficient when the FAQ link changed. An external trusted verifier should judge the editable working copy, with a baseline failure and negative cases showing what it can reject. Its pass is evidence about the inspected file state, not proof of every historical action or universal correctness.

**Recovery:** Lost receipt is not failed action. Repeating as a new operation can create a duplicate even when this particular final document looks unchanged. Recover the original identity, inspect the receiver's existing record and current artifact, and continue from that evidence. Stable IDs help only when the receiving system supports the corresponding idempotency contract.

## Provider code objects inspected

I selected providers in the visible “Inspect a harness” selector, then clicked named code objects. The UI explicitly said inspecting an object does not advance the event.

- **Codex → Execution sandbox:** visible TOML used workspace-write, on-request approvals, and network_access=false. The description separated runtime configuration from task prose.
- **Claude Code → PreToolUse seam:** .claude/settings.json example showed an Edit|Write matcher calling a scope-check script. The adjacent explanation explicitly said the script must be implemented and is not supplied in the starter.
- **Pi → Three Pi package layers:** mapped model API, agent runtime, and CLI/sessions/extensions to distinct packages. The role map was marked as authored and not a dependency installation instruction.
- **Pi → before_agent_start extension:** optional TypeScript context-appending example. The UI said it does not install an extension.
- **DeepSeek + Pi → DeepSeek tool proposal:** displayed string-encoded JSON tool arguments in an illustrative wire payload. Its prose said the provider does not edit the local file.
- **DeepSeek + Pi → Pi local dispatch:** conceptual sequence validates the proposed tool, applies installed controls, executes a permitted operation, and associates the observation with the tool-call ID. This made model proposal versus host execution concrete.
- **Factory Droid → PreToolUse hook stage:** .factory/hooks.json example used a top-level event map and Edit|Create|ApplyPatch. It too explicitly said the scope script is not supplied.

I treated these as instructional examples, not executed provider integrations or independent validation of every provider API. Labels distinguishing workshop files, documented examples, wire payloads, and illustrative pseudocode were useful.

## Download and real-file transfer

Clicked “Download the starter project.” Browser download filename: **odin-first-harness.zip**. Saved ZIP: /tmp/open-docs-live-learner-starter.zip.

The archive contained exactly six root files: help.md, faq.md, AGENTS.md, CLAUDE.md, verify.mjs, README.md. Extracted them into /tmp/open-docs-live-learner-exercise/harness-starter. Read every file, including README and verifier, before executing anything. The already-known Dutch-site reference was present in this initial README; the parent had a correction prepared, so it is not a new unresolved finding.

Copied all files to sibling harness-work. Using Node 22.22.2, ran the trusted original verifier against the work folder:

- Baseline: **exit 1**, requested typo correction missing.
- Confirmed original help.md exactly matched the fixture, then replaced Welcomme with Welcome once, preserving other bytes/files: **exit 0**, “Exact typo correction; protected files and verifier unchanged; no extra files.”
- Separate disposable broken-link copy changed ./faq.md to ./missing.md: **exit 1**, exact contract violation.

Command used the absolute equivalent of the instructed `node ../harness-starter/verify.mjs .`. Actual command, cwd, exit codes and output are recorded in learner-evidence/verification-log.txt.

I performed the scoped local edit directly with tooling, without launching another provider. The trusted original was preserved by workflow outside the work folder; this run did not demonstrate a sandbox enforcing that separation. The downloaded verifier was read-only and required no package installation.

## Mobile and field-guide navigation

At 390×844, the academy introduction, runtime selector and prediction card were readable. The fourth header item, Field guide, wrapped onto a second row. This matched the parent's previously identified layout issue and is evidenced in the screenshot; it did not prevent navigation.

Clicked Field guide and reached #reference. The field guide was a readable single-column concept list with a visible search field. Measured document scrollWidth=390 at viewport width=390: no horizontal page overflow in that sampled view.

Searched **Idempotency** using the visible concept search, clicked “Idempotency / Recover without repeating harm,” and reached **#recovery**, Lesson 10 of 18. The lesson explained ambiguous timeout outcomes, receiver-supported stable keys, bounded retries, and the receipt-printer analogy. Its visible pseudocode maintained operation.id and payload_hash, used receiver.lookup_or_apply_atomically, and reconciled current state. This correctly extended the beginner discovery. The last return-to-field-guide/close call timed out in the automation runtime; return navigation is not claimed as verified.

## Concrete findings and reproduction

**No learner-blocking product defect found** in the five discoveries, selected provider objects, download, or mobile field-guide path.

1. **Recovery reflection wording contradicted the failed branch.** Reproduction on initial SHA: reach discovery 5; run “Start a new operation after the timeout.” Observed result says two operation records exist, while reflection asks “Why did only one operation remain?” This is a wording mismatch, not an erroneous simulation or completion gate. Parent reports a prepared correction to ask what keeps recovery to one logical operation; I did not retest the follow-up release.
2. **Action reflection referred to the export after an authorized edit.** Reproduction: discovery 3, deny export, then select “Edit the one authorized typo” and run. Corrected artifact is shown, but question remains “Where did the export stop?” The question still tests a relevant mechanism from the preceding branch, but is poorly tied to the latest run. Parent reports a prepared branch-neutral correction; not reverified here.
3. **Known mobile header wrap at 390px.** Field guide appears on row two. Navigation still works. Parent already prepared a one-row layout correction; not reverified here.

No speculative defects were inferred from hidden DOM content, automation timeouts, or untested provider integrations. This report does not duplicate the parent's automated test suite results as learner evidence.

## Evidence artifacts

- learner-evidence/open-docs-learner-completed.png — desktop screenshot captured after 5/5 completion (viewport screenshot, not a complete activity log).
- learner-evidence/open-docs-learner-mobile-start.png — 390px introduction and known header wrap.
- learner-evidence/open-docs-learner-mobile-guide.png — 390px field guide and concept search.
- learner-evidence/open-docs-learner-mobile-recovery.png — concept navigation destination.
- learner-evidence/verification-log.txt — actual local verifier output.

The strongest result is successful traversal and explanation of all five mechanisms, plus transfer from a downloaded public fixture to real local file-state evidence. That supports usability for this agent reader; it does not establish human learning effectiveness or production readiness.
