# Odin capability guide

Reviewed 3 October 2026. This is an authored public usage guide, not a live runtime report. Examples require your own configured workspace, identity and permissions. Availability varies by installed version, profile and connected services. No provider calls, organization login or task execution occur in the browser.

Open guides: https://odin-labs-ai.github.io/open-docs/#reference/capabilities

The mechanism diagram is available alongside this file as mechanism-map.svg. It describes relationships, not a connected deployment.

## Annotation and visual intent

Point at a problem and carry its evidence into a task.

Visual input keeps what you pointed at alongside what you want changed. Browser annotation can capture a selected element and its page context; screenshot annotation records labels and positions on an image.

Guide: https://odin-labs-ai.github.io/open-docs/#reference/capabilities/annotation

### Where to start

A configured browser annotation extension, or Visual Intent in a workspace that offers it.

### Before you begin

Browser annotation needs its extension and local bridge connected to a compatible agent. Screenshot editing needs the selected project, workspace access and a vision-capable service.

### In the CLI

Start odin-agent in the project you intend to change. Use the installed annotation integration to select the element; inspect the captured context before asking for an edit.

### In Code Server and your workspace

Open the intended project. If Visual Intent is offered, capture the page, mark the target and describe the change. Review the proposed file changes in that same project.

### A task to try

> The Save button is clipped at 390px. Keep its label and action. Adjust the layout, then show the mobile result and the changed files.

1. Capture the page or selected element.
2. Add the desired result and constraints.
3. Confirm the project before execution.
4. Inspect the diff and the corrected page.

### What to verify

The captured target, correct project, changed files and an observed page after the change.

### Limits to keep in view

Browser annotation, screenshot Visual Intent and feedback annotation are different mechanisms. Installing an extension does not prove its bridge is connected. This guide does not capture your browser or edit files.

## Swarm and coordination

Delegate bounded work and see how the results fit together.

Coordination separates a task into scoped pieces, hands them to workers and integrates their results. In-process agents, subprocess workers and commander teams have different isolation and communication boundaries.

Guide: https://odin-labs-ai.github.io/open-docs/#reference/capabilities/swarm

### Where to start

An agent runtime with a supported conductor and worker tools enabled for the workspace.

### Before you begin

A conductor that can dispatch workers, explicit scope for each worker, an execution budget and a safe integration boundary for shared files.

### In the CLI

In odin-agent, state the independent tasks and their file boundaries. Ask it to verify which conductor and worker tools are available before starting parallel work.

### In Code Server and your workspace

Keep the project open while work runs. Inspect worker scope, progress and returned evidence in the agent session; integrate only after checking the combined result.

### A task to try

> Have one worker inspect the parser and another inspect the renderer. Both are read-only. Combine their findings before making any change.

1. Identify genuinely independent pieces.
2. Name the conductor and each worker scope.
3. Collect results and handle failures.
4. Check the integrated outcome.

### What to verify

Worker identities and scopes, actual dispatch, returned results and a check of their combined conclusion.

### Limits to keep in view

Several workers do not automatically share memory or permissions. Loom is a dependency workflow, not a synonym for swarm. A status message about a worker is not proof that its task succeeded.

## Goals and continuity

Continue toward an explicit outcome across interruptions.

A goal defines a finish line. A session carries a conversation and its execution context. A durable run records units of work and continuation boundaries. These objects help each other but have different lifecycles.

Guide: https://odin-labs-ai.github.io/open-docs/#reference/capabilities/goals

### Where to start

The installed agent’s goal/session controls, or a configured durable-run service.

### Before you begin

An observable completion condition, persisted state and a supported resume path. Check the exact interruption boundary the runtime can recover.

### In the CLI

Start odin-agent in the intended repository. Use /goal <completion condition> to define the finish line, /goal status to inspect it and find its ID, then /goal resume <goal-id> to continue a supported goal. Keep session identity and acceptance evidence alongside the goal.

### In Code Server and your workspace

Open or return to the project-bound session. Check its project and last completed evidence, then steer the next turn with the remaining work.

### A task to try

> Fix the broken FAQ link without changing its text. Finish only after checking the destination. If interrupted, record the last check and the remaining step.

1. State the outcome and stop conditions.
2. Persist decisions and completed evidence.
3. Interrupt at a supported boundary.
4. Resume, recheck changed facts and finish.

### What to verify

The same intended project, preserved decisions, remaining-work record and a check of the final state.

### Limits to keep in view

A CLI goal is not a Loom Run or an Intelligence SystemRun. Persisting a checkpoint does not make arbitrary external side effects exactly-once. Budget exhaustion must not be labelled complete.

## Skills and composition

Find and reuse capabilities allowed in your workspace.

A skill packages instructions and resources for a repeated job. It becomes usable only when the runtime loads it, the workspace profile allows it and an actual entry point dispatches it.

Guide: https://odin-labs-ai.github.io/open-docs/#reference/capabilities/skills

### Where to start

The runtime’s skill discovery, or the project Skill Library and Sessions skill picker where available.

### Before you begin

A supported skill format, loaded registry, allowed workspace/project profile and the arguments declared by the skill.

### In the CLI

Open odin-agent in the project. Use /skills or /skills search review to inspect loaded skills, then /help <skill-name> for a listed skill’s declared arguments. Run that supported skill with its required input.

### In Code Server and your workspace

Use the project Skill Library or Sessions picker. Select the project first, inspect whether the skill is runnable and enter the required arguments before Run.

### A task to try

> Find a permitted review skill. Ask it to inspect one file without editing, and return the checks it performed and any unresolved findings.

1. Discover skills in the selected project.
2. Read origin, requirements and arguments.
3. Dispatch through the existing Run entry point.
4. Inspect output and the task’s acceptance evidence.

### What to verify

The runtime-projected skill, supplied arguments, actual dispatch and an outcome beyond a successful toast.

### Limits to keep in view

A skill on disk may be unloaded or excluded by a profile. Unavailable discovery differs from an empty list. A run that refuses missing arguments has not completed the job.

## Memory and grounding

Find trusted context and understand where it came from.

Governed memory preserves decisions, rationale, ownership and provenance. Retrieval brings relevant records into reasoning. Odin’s legacy Brain integration and Next’s Mnemosyne integration are distinct stores and entry points.

Guide: https://odin-labs-ai.github.io/open-docs/#reference/capabilities/memory

### Where to start

Configured agent Brain tools, Brain search, or Odin Intelligence Ask and Teach.

### Before you begin

A reachable configured store, verified caller identity and allowed records. Semantic retrieval needs embeddings; grounded Ask also needs a model service.

### In the CLI

In odin-agent, /memory shows the project MEMORY.md when that extension is available. /remember <text> appends a note under the workspace’s write policy. For governed retrieval, ask available Brain tools for existing decisions with source and scope; do not assume a Mnemosyne connection.

### In Code Server and your workspace

Keep project context explicit. Where Odin Intelligence is enabled, teach one non-sensitive decision, then ask a question whose answer should cite that decision.

### A task to try

> Find the recorded reason we kept this API field optional. Show the source, any conflicting decision and what you could not verify.

1. Identify the store and caller scope.
2. Ingest permitted material with provenance.
3. Retrieve and inspect the supporting records.
4. Distinguish supported answers from missing evidence.

### What to verify

The named store, allowed records, provenance/citations and refusal of out-of-scope retrieval.

### Limits to keep in view

A row’s author is not the same as its visibility. Bounded semantic results are not a complete memory census. An empty answer can mean missing context, configuration or access; a health response alone cannot tell you which.

## Odin Next and grounded action

Turn grounded reasoning into governed, durable work.

Next combines governed memory, premise checks, Loom dependency workflows, action turns and durable Runs. A premise check asks whether work is still justified before an action is proposed and executed.

Guide: https://odin-labs-ai.github.io/open-docs/#reference/capabilities/odin-next

### Where to start

Odin Intelligence for Ask and proposals; a separately configured Next action runtime for execution.

### Before you begin

Authenticated access, populated memory, real model/embedding services and an action harness with an isolated working directory. Empirical premise checks require a configured probe.

### In the CLI

Use the existing configured agent harness when a Next workflow hands off work. There is no universal Next slash command to infer from this guide; check the service’s supported execution entry point.

### In Code Server and your workspace

Use Odin Intelligence where enabled to inspect a grounded answer or proposed turn. Record a human verdict through its existing controls; check whether execution is configured separately.

### A task to try

> Check whether the FAQ link is still broken. If it is, propose a scoped correction and its verification. If the symptom cannot be checked, record it as unverifiable.

1. Ground the premise: live, gone or unverifiable.
2. Validate dependency order and approval boundaries.
3. Execute through the configured isolated harness.
4. Persist the turn outcome and Run boundary.

### What to verify

The premise observation, scoped plan, approval where required, actual execution and persisted outcome.

### Limits to keep in view

My Odin is a workspace surface, not another name for Next. Ask working does not establish an action runtime. A prose-based premise heuristic is not empirical proof, and an accepted proposal is not an executed action.

## Intelligence Systems and outcome learning

Observe sources and improve recommendations from verified outcomes.

A System binds sources, a lens, schedule and governance. Its runs collect context, detect signals, explain recommendations and record outcomes. Lessons need supported outcome evidence before they can be reinforced.

Guide: https://odin-labs-ai.github.io/open-docs/#reference/capabilities/intelligence-systems

### Where to start

An owned System in Odin Intelligence, backed by a configured real source and execution runtime.

### Before you begin

A persisted System definition, permitted connected sources, operational active state and real runtime dependencies. Scheduled runs additionally need an enabled scheduler and persisted leases.

### In the CLI

Use the configured service’s System/run entry point. An ordinary odin-agent conversation is not a recurring System; inspect the recorded definition and run identity instead of treating a prompt as activation.

### In Code Server and your workspace

Where Systems are available, discover your owned definition, inspect its source/lens and open the recorded run, signals and recommendation explanation.

### A task to try

> Observe a permitted repository-quality source. Explain a new warning, record the chosen action and inspect the later outcome before promoting a lesson.

1. Connect a permitted source and choose a lens.
2. Inspect definition and operational state.
3. Run and trace the signal to its source.
4. Record action, feedback and supported outcome.

### What to verify

Source provenance, System/run/signal identities, recommendation rationale and separately verified outcome evidence.

### Limits to keep in view

A deployed definition and an operationally active System are different states. A registered adapter may be unavailable. Feedback annotation is not proof of effective learning or causation; mock outcome views must stay identified.

## Media and artifacts

Bring visual evidence into work and carry usable results out.

Media can supply task context; artifacts persist results in usable formats. A file and its metadata are different from a printed path. Rendering support and storage must both be checked before promising a format.

Guide: https://odin-labs-ai.github.io/open-docs/#reference/capabilities/media

### Where to start

Configured visual-input tools and the agent’s artifact commands or a workspace artifact consumer.

### Before you begin

Read permission for inputs, a supported model/tool, artifact storage and any required renderer. Check the actual output format when optional renderers are absent.

### In the CLI

In odin-agent, use /renderers to inspect available renderers and /artifacts to inspect stored outputs. /report can provide an instruction to run a report skill; it does not itself guarantee dispatch.

### In Code Server and your workspace

Open the produced artifact in the intended project or artifact consumer. Inspect its content and actual extension; keep source input and output receipt together.

### A task to try

> Produce a small Mermaid mechanism diagram and a Markdown report. Verify both files can be reopened, then state which formats were actually produced.

1. Inspect input permissions and renderer readiness.
2. Generate the bounded output.
3. Persist content with its metadata.
4. Reopen it in the intended consumer.

### What to verify

A readable artifact, actual format, stored content/metadata and successful reopening.

### Limits to keep in view

A renderer may fall back to Markdown when a tool is missing. A claimed file path is not a delivered file. This page’s downloadable report and diagram are authored guide assets, not outputs of a live agent run.

## Shared control boundary

Check identity, project, policy, budget and outcome evidence at the actual runtime. Guidance is not authorization. Keep source-present, configured, executed and outcome-verified claims separate. Use the existing supported controls; never bypass a refusal to reproduce an example.
