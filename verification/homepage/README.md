# Homepage delivery verification

The model-and-harness opening is deployed at https://odin-labs-ai.github.io/open-docs/. The existing workshop and lessons remain reachable. Component controls announce explanations, while workshop stages retain their code/event labels.

| Gate | Evidence |
| --- | --- |
| Independent exact-head review | [SHIP receipt](../reviews/pr-4.json), recorded 2026-09-07T23:09:15.406629Z for `30d9ee1ce005ed95f5b8cbe7ce979655476f8251` |
| Receipt durable before queue entry | Receipt commit `20a5b7971831f616f763ea4a61a5caf22a482889`; queue entry 2026-09-07T23:10:26Z |
| PR checks | [Run 34168760250](https://github.com/odin-labs-ai/open-docs/actions/runs/34168760250): Quality passed, including 24 browser and 11 starter tests |
| Merge queue | [Run 34169149515](https://github.com/odin-labs-ai/open-docs/actions/runs/34169149515): passed before [PR 4](https://github.com/odin-labs-ai/open-docs/pull/4) merged at 2026-09-07T23:14:31Z |
| Reviewed content preserved | Feature and merged commits share tree `fff1ef1dfedc585a3dbc468f4b2223a430e11a76` |
| Main release and live browser suite | [Run 34169362884](https://github.com/odin-labs-ai/open-docs/actions/runs/34169362884): Quality and Publish and verify live both passed; 24 browser tests passed against the public deployment |
| Deployment identity | Both main and public `version.json` resolve to `947ffb07683b3ea40916c58d4ea46de61ea7ad31` |
| Observed public journeys | [Live observations](live-verification.json): all six components, keyboard selection, accessible names, lesson navigation, workshop focus and corrected result at 1440px and 390px; no horizontal overflow, page errors or HTTP failures |

The accessibility regression was reproduced before correction: the Model control announced “Model: current event. Inspect code” instead of a component explanation. The corrected label passed on desktop, mobile and the public deployment.

Animation evidence includes committed normal-motion pixel-change/settling checks and the independent reviewer's stronger multi-frame sampling and reduced-motion stability probes. These exercise a representative workshop replay at desktop and mobile sizes; the overview is a conceptual component map, not an agent execution timeline. Verification used Chromium, not physical devices or every browser/GPU combination.

Live screenshots were inspected after publication:

- [Desktop homepage](homepage-1440.png)
- [Mobile homepage](homepage-390.png)
- [Mobile workshop result](workshop-390.png)

AI-Delegated: Codex (OpenAI)
