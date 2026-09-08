# Learner journey correction

The live baseline was Pages SHA `947ffb07683b3ea40916c58d4ea46de61ea7ad31`.
Two independent rendered assessments at desktop and mobile widths found:

- Browser Back left the app because internal navigation only replaced history.
- A workshop lesson detour returned to the overview instead of the experiment.
- Failed runs exposed a success reflection while correction controls sat above
  the viewport; mobile reflection feedback and Next discovery could sit below it.
- The first step repeated its request choice in a second selector, and optional
  runtime inspection and provider setup occupied the initial linear journey.

PR #5 gives the workshop a separate route, preserves navigation context, and
uses progressive disclosure for optional material. The first request choice is
its input. Failed results offer a direct correction path; passed results expose
reflection and reveal the next discovery. The overview retains the six-component
3D map and keyboard alternatives, with adjacent text and expandable examples.

The preview images here were captured from the production build of the feature
source tree before its commit. They show the mobile entry, failed result,
corrected reflection/continuation, and desktop overview. They are not deployment
proof. Head-bound independent review is in `../reviews/pr-5.json`. Live evidence
will be added after the reviewed change lands and Pages serves its merged SHA.

Local validation: Node 22 production build; 11 starter integrity tests; 27 browser
tests; nested-path production check reading 18 lessons, 111 concept links and all
five provider layouts with no external requests, bad responses or page errors.
The browser suite covers history/lesson-section restoration, skip links, retained
experiment state, missing graphics, keyboard access, failed/corrected exercises,
optional inspection state, accessibility scans and representative raster motion
that settles. Rendered review used Chromium, not physical mobile/Safari/Firefox.
