# Calm learning: independent review and local validation

PR6 final head: `f42713248afef104e24dac89e945049c29401919`.
UI reviewed and served locally: `cb3ad2a73256b8042d78dc3c36c935b231284c8b`.
The successor changes one test text-comparison option; all source files are identical.

Independent PASS receipt: `../reviews/pr-6.json`. The reviewer authored no implementation.
Desktop/mobile screenshots and observations are in `review/`. All captures were inspected. Receipt keys `reviewer/*` map to `review/*` here;
filenames and SHA-256 hashes are unchanged.

Local checks passed: frozen Node 22 install; strict build; 11 starter integrity tests;
30 browser tests plus the final same-lesson history regression; nested-path static
checks across 18 lessons, 111 concept links and five provider layouts. No failed HTTP
responses, external requests or page errors occurred in the nested static smoke.
The history regression failed on the old behavior (deep1 reset to deep0), then passed
on corrected UI after fixing its innerText/textContent assertion mismatch.

Content protection: 16 baseline entries unchanged. Three explanation deletions and all
8 architectural import-deletion mutants correctly fail. These receipts live in the PR.
BCE evidence is manual; the content check is wired into existing test:static CI.

Initial rendered default controls: homepage 21 to 6; desktop lesson 45 to 11 (counts are
all visible buttons in the page, not user-confidence measurements). Existing concrete
example, summaries and analogies remain visible; detailed educational content is preserved.

Design detector reported only incumbent Space Grotesk declarations and the existing
selected-choice stripe. The established identity and accessible chosen-state feedback
were preserved. Existing large Three.js bundle warning remains.

PR checks `34271259218`, merge-group checks `34271793922`, and Pages release
`34272128911` all passed. All 31 browser tests passed against the public deployment.
The served version is `4996848b347a66d67ee403ac2af5b1ffcf513615`, whose complete tree
matches the reviewed head. See `release.json` and `deployed-checks.txt`.

Direct public checks at 1440×900 and 390×900 passed: fresh explanation and existing
example, optional component map, visible lesson summary and hidden inspection,
deep reading, first workshop failure then correction and successful reflection.
All 16 observed states had no page errors or horizontal overflow. Six sampled
viewport screenshots in `live/` were inspected; `live/hashes.json` binds their bytes.
`live/served-version.json` records the public version. Anonymous Chromium sessions
at desktop/mobile widths are covered; physical devices, Safari and Firefox are not claimed.

Reproduce the direct flow with Node 22 and the repo's installed dependencies:
`node verification/calm-learning/verify-live.mjs https://odin-labs-ai.github.io/open-docs /tmp/open-docs-live 4996848b347a66d67ee403ac2af5b1ffcf513615`

The temporary preview server was stopped. No open implementation or verification task remains.
AI-Delegated: Codex (OpenAI)
