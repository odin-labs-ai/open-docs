# Calm learning: representation without content loss

The reader should understand one useful idea, see why it matters, and know where
to go next. The existing educational depth is valuable. Present it in a readable
sequence, with interactive explanations available when the reader chooses them.
This is the acceptance contract for the representation change, based on the
accepted release `4804a34d239f47e4ae169cd059b11177f5bf5f07`.

## Business clauses

- **BC1 — Preserve the knowledge.** Retain all 18 lessons, their essential and
  deeper explanations, analogies, examples, pitfalls, questions, answers and
  sources. Retain the six simulation scenarios and their failure/correction
  behavior. The accepted curriculum and simulation source files are protected.
- **BC2 — Preserve ways to learn by doing.** Retain all five workshop discoveries,
  provider guides, provider and lesson stage definitions, and the starter project.
  Retain all six overview component explanations, examples and boundaries, with
  their sources. A simpler default must still offer a visible route to these
  resources. Imports alone establish connectivity, not a usable route.
- **BC3 — Explain before asking for interaction.** On a fresh homepage, the
  definition of an agent and harness and one concrete example are readable before
  any 3D inspection or configuration. The reader has a clear next reading action.
  Interactive inspection is an explicitly named, optional action.
- **BC4 — Reading is a complete path.** Opening a lesson exposes its title,
  summary, analogy and essential explanation before interactive machinery. The
  reader can continue to the next lesson without running an animation, selecting
  a provider, completing a simulation or passing a quiz. Deeper material and
  practice remain discoverable through clearly named controls.
- **BC5 — Opening depth must be reversible.** Optional inspection can be opened
  and closed with keyboard or touch. Its state remains coherent, focus returns
  to a useful control, and the learning position is preserved. Back/Forward and
  workshop lesson detours retain the current experiment and its evidence.
- **BC6 — Comprehension is the outcome.** A successful design helps a newcomer
  explain the distinction between model, harness, proposed action and checked
  result. Visual order and automated checks are supporting evidence. They do not
  establish confidence, understanding, or learning gains without learner feedback.

## Acceptance observations

Inspect desktop and mobile together, then make one consolidated correction pass
if needed. Use a fresh session as well as a returning learner session.

1. The initial homepage explains the model/harness relationship without an open
   interactive stage. The first reading action reaches the foundations lesson.
2. A lesson's essential text is visible without first opening a stage or answering
   a question. Optional practice, deeper explanations, examples, questions and
   sources remain reachable. Every lesson remains available through navigation.
3. Open and close optional homepage and lesson inspection. Check control labels,
   keyboard access, focus, preserved state and behavior with reduced motion or
   unavailable WebGL. No blank stage obstructs the explanatory text.
4. Complete the workshop failed and corrected paths, visit a linked lesson and
   return, and check Back/Forward. The current discovery, experiment and evidence
   survive. At completion, the next action and its heading clear mobile navigation.
5. Verify the provider guide and starter download still work, and that simulation
   controls still produce their expected failed and corrected results.
6. Review both widths for competing primary actions, unexplained terminology,
   overflow, crowded controls and hidden continuation. Record findings as observed
   usability evidence, not a measured increase in reader confidence.

## What is checked automatically

`node scripts/check-learning-content.mjs` compares 16 protected source entries
with the authored baseline manifest. Whole-file hashes preserve curriculum,
simulation, provider guides, provider/lesson stages, reference content and starter
assets. Token hashes preserve the workshop `steps` and overview `parts`/`sources`
declarations while allowing surrounding presentation and formatting to change.
The script never updates its baseline. Changing the baseline is an explicit
content-contract change for review, not a way to make a failed check green.

`pnpm test:content` exposes this check directly. `pnpm test:static` runs it before
the existing static smoke checks; the existing Quality workflow already invokes
`pnpm test:static`. This content check is on the normal CI path. Its `--self-test`
mode removes a teaching explanation in memory from each of curriculum, workshop
and overview source and verifies that each deletion is rejected.

The proposed BCE blueprint checks eight direct source imports that keep the
learning modules connected. It was validated and run using an already installed
`bce-engine@0.3.0`, with `--no-pin` to examine the actual edited worktree. The
green report records 16 scanned TypeScript files and eight evaluated constraints.
Each constraint was then refuted by removing its import in a temporary source
copy. The negative receipt lists each mutation and the corresponding violation.
No private package was added to this public repository.

Equivalent commands with a locally available BCE 0.3.0 executable:

```sh
node scripts/check-learning-content.mjs --self-test
bce validate --blueprint .ai/blueprints/calm-learning.engineering-blueprint.json
bce run --blueprint .ai/blueprints/calm-learning.engineering-blueprint.json --ct-repo . --no-pin --out verification/calm-learning/blueprint-green.json
```

## Coverage and limits

The BCE blueprint is **proposed and manually checked**; it is not installed as a
required BCE check. The content preservation script is wired into existing CI,
but the recorded local result does not claim remote CI has run on this change.
The authored business clauses above describe intent; eight import constraints
do not mechanically grade BC3–BC6.

BCE's source graph covers direct, statically named TypeScript imports. It does
not prove call-site invocation, DOM visibility, content accessibility, interaction
correctness, human understanding or transitive reachability. Its report explicitly
lists CSS imports as unresolved by this TypeScript graph; the CSS is handled by
the normal build and browser verification. Content hashes cannot prove that the
preserved content is presented to the reader. The browser acceptance observations
are required alongside source preservation and import connectivity.

The original curriculum contains time-sensitive provider source links and factual
claims; this representation-only work preserves them and does not claim to have
revalidated their currency. Public deployment and served-version verification are
separate from local acceptance and require their own release evidence.
