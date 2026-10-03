/** Public usage guide. These records describe mechanisms; they do not probe a runtime. */
export type OdinCapability = {
  id: string;
  title: string;
  outcome: string;
  concept: string;
  entry: string;
  prerequisites: string;
  cli: string;
  codeServer: string;
  example: string;
  steps: string[];
  evidence: string;
  limits: string;
};

export const odinCapabilities: OdinCapability[] = [
  {
    id: 'annotation', title: 'Annotation and visual intent',
    outcome: 'Point at a problem and carry its evidence into a task.',
    concept: 'Visual input keeps what you pointed at alongside what you want changed. Browser annotation can capture a selected element and its page context; screenshot annotation records labels and positions on an image.',
    entry: 'A configured browser annotation extension, or Visual Intent in a workspace that offers it.',
    prerequisites: 'Browser annotation needs its extension and local bridge connected to a compatible agent. Screenshot editing needs the selected project, workspace access and a vision-capable service.',
    cli: 'Start odin-agent in the project you intend to change. Use the installed annotation integration to select the element; inspect the captured context before asking for an edit.',
    codeServer: 'Open the intended project. If Visual Intent is offered, capture the page, mark the target and describe the change. Review the proposed file changes in that same project.',
    example: 'The Save button is clipped at 390px. Keep its label and action. Adjust the layout, then show the mobile result and the changed files.',
    steps: ['Capture the page or selected element.', 'Add the desired result and constraints.', 'Confirm the project before execution.', 'Inspect the diff and the corrected page.'],
    evidence: 'The captured target, correct project, changed files and an observed page after the change.',
    limits: 'Browser annotation, screenshot Visual Intent and feedback annotation are different mechanisms. Installing an extension does not prove its bridge is connected. This guide does not capture your browser or edit files.',
  },
  {
    id: 'swarm', title: 'Swarm and coordination',
    outcome: 'Delegate bounded work and see how the results fit together.',
    concept: 'Coordination separates a task into scoped pieces, hands them to workers and integrates their results. In-process agents, subprocess workers and commander teams have different isolation and communication boundaries.',
    entry: 'An agent runtime with a supported conductor and worker tools enabled for the workspace.',
    prerequisites: 'A conductor that can dispatch workers, explicit scope for each worker, an execution budget and a safe integration boundary for shared files.',
    cli: 'In odin-agent, state the independent tasks and their file boundaries. Ask it to verify which conductor and worker tools are available before starting parallel work.',
    codeServer: 'Keep the project open while work runs. Inspect worker scope, progress and returned evidence in the agent session; integrate only after checking the combined result.',
    example: 'Have one worker inspect the parser and another inspect the renderer. Both are read-only. Combine their findings before making any change.',
    steps: ['Identify genuinely independent pieces.', 'Name the conductor and each worker scope.', 'Collect results and handle failures.', 'Check the integrated outcome.'],
    evidence: 'Worker identities and scopes, actual dispatch, returned results and a check of their combined conclusion.',
    limits: 'Several workers do not automatically share memory or permissions. Loom is a dependency workflow, not a synonym for swarm. A status message about a worker is not proof that its task succeeded.',
  },
  {
    id: 'goals', title: 'Goals and continuity',
    outcome: 'Continue toward an explicit outcome across interruptions.',
    concept: 'A goal defines a finish line. A session carries a conversation and its execution context. A durable run records units of work and continuation boundaries. These objects help each other but have different lifecycles.',
    entry: 'The installed agent’s goal/session controls, or a configured durable-run service.',
    prerequisites: 'An observable completion condition, persisted state and a supported resume path. Check the exact interruption boundary the runtime can recover.',
    cli: 'Start odin-agent in the intended repository. Use /goal <completion condition> to define the finish line, /goal status to inspect it and find its ID, then /goal resume <goal-id> to continue a supported goal. Keep session identity and acceptance evidence alongside the goal.',
    codeServer: 'Open or return to the project-bound session. Check its project and last completed evidence, then steer the next turn with the remaining work.',
    example: 'Fix the broken FAQ link without changing its text. Finish only after checking the destination. If interrupted, record the last check and the remaining step.',
    steps: ['State the outcome and stop conditions.', 'Persist decisions and completed evidence.', 'Interrupt at a supported boundary.', 'Resume, recheck changed facts and finish.'],
    evidence: 'The same intended project, preserved decisions, remaining-work record and a check of the final state.',
    limits: 'A CLI goal is not a Loom Run or an Intelligence SystemRun. Persisting a checkpoint does not make arbitrary external side effects exactly-once. Budget exhaustion must not be labelled complete.',
  },
  {
    id: 'skills', title: 'Skills and composition',
    outcome: 'Find and reuse capabilities allowed in your workspace.',
    concept: 'A skill packages instructions and resources for a repeated job. It becomes usable only when the runtime loads it, the workspace profile allows it and an actual entry point dispatches it.',
    entry: 'The runtime’s skill discovery, or the project Skill Library and Sessions skill picker where available.',
    prerequisites: 'A supported skill format, loaded registry, allowed workspace/project profile and the arguments declared by the skill.',
    cli: 'Open odin-agent in the project. Use /skills or /skills search review to inspect loaded skills, then /help <skill-name> for a listed skill’s declared arguments. Run that supported skill with its required input.',
    codeServer: 'Use the project Skill Library or Sessions picker. Select the project first, inspect whether the skill is runnable and enter the required arguments before Run.',
    example: 'Find a permitted review skill. Ask it to inspect one file without editing, and return the checks it performed and any unresolved findings.',
    steps: ['Discover skills in the selected project.', 'Read origin, requirements and arguments.', 'Dispatch through the existing Run entry point.', 'Inspect output and the task’s acceptance evidence.'],
    evidence: 'The runtime-projected skill, supplied arguments, actual dispatch and an outcome beyond a successful toast.',
    limits: 'A skill on disk may be unloaded or excluded by a profile. Unavailable discovery differs from an empty list. A run that refuses missing arguments has not completed the job.',
  },
  {
    id: 'memory', title: 'Memory and grounding',
    outcome: 'Find trusted context and understand where it came from.',
    concept: 'Governed memory preserves decisions, rationale, ownership and provenance. Retrieval brings relevant records into reasoning. Odin’s legacy Brain integration and Next’s Mnemosyne integration are distinct stores and entry points.',
    entry: 'Configured agent Brain tools, Brain search, or Odin Intelligence Ask and Teach.',
    prerequisites: 'A reachable configured store, verified caller identity and allowed records. Semantic retrieval needs embeddings; grounded Ask also needs a model service.',
    cli: 'In odin-agent, /memory shows the project MEMORY.md when that extension is available. /remember <text> appends a note under the workspace’s write policy. For governed retrieval, ask available Brain tools for existing decisions with source and scope; do not assume a Mnemosyne connection.',
    codeServer: 'Keep project context explicit. Where Odin Intelligence is enabled, teach one non-sensitive decision, then ask a question whose answer should cite that decision.',
    example: 'Find the recorded reason we kept this API field optional. Show the source, any conflicting decision and what you could not verify.',
    steps: ['Identify the store and caller scope.', 'Ingest permitted material with provenance.', 'Retrieve and inspect the supporting records.', 'Distinguish supported answers from missing evidence.'],
    evidence: 'The named store, allowed records, provenance/citations and refusal of out-of-scope retrieval.',
    limits: 'A row’s author is not the same as its visibility. Bounded semantic results are not a complete memory census. An empty answer can mean missing context, configuration or access; a health response alone cannot tell you which.',
  },
  {
    id: 'odin-next', title: 'Odin Next and grounded action',
    outcome: 'Turn grounded reasoning into governed, durable work.',
    concept: 'Next combines governed memory, premise checks, Loom dependency workflows, action turns and durable Runs. A premise check asks whether work is still justified before an action is proposed and executed.',
    entry: 'Odin Intelligence for Ask and proposals; a separately configured Next action runtime for execution.',
    prerequisites: 'Authenticated access, populated memory, real model/embedding services and an action harness with an isolated working directory. Empirical premise checks require a configured probe.',
    cli: 'Use the existing configured agent harness when a Next workflow hands off work. There is no universal Next slash command to infer from this guide; check the service’s supported execution entry point.',
    codeServer: 'Use Odin Intelligence where enabled to inspect a grounded answer or proposed turn. Record a human verdict through its existing controls; check whether execution is configured separately.',
    example: 'Check whether the FAQ link is still broken. If it is, propose a scoped correction and its verification. If the symptom cannot be checked, record it as unverifiable.',
    steps: ['Ground the premise: live, gone or unverifiable.', 'Validate dependency order and approval boundaries.', 'Execute through the configured isolated harness.', 'Persist the turn outcome and Run boundary.'],
    evidence: 'The premise observation, scoped plan, approval where required, actual execution and persisted outcome.',
    limits: 'My Odin is a workspace surface, not another name for Next. Ask working does not establish an action runtime. A prose-based premise heuristic is not empirical proof, and an accepted proposal is not an executed action.',
  },
  {
    id: 'intelligence-systems', title: 'Intelligence Systems and outcome learning',
    outcome: 'Observe sources and improve recommendations from verified outcomes.',
    concept: 'A System binds sources, a lens, schedule and governance. Its runs collect context, detect signals, explain recommendations and record outcomes. Lessons need supported outcome evidence before they can be reinforced.',
    entry: 'An owned System in Odin Intelligence, backed by a configured real source and execution runtime.',
    prerequisites: 'A persisted System definition, permitted connected sources, operational active state and real runtime dependencies. Scheduled runs additionally need an enabled scheduler and persisted leases.',
    cli: 'Use the configured service’s System/run entry point. An ordinary odin-agent conversation is not a recurring System; inspect the recorded definition and run identity instead of treating a prompt as activation.',
    codeServer: 'Where Systems are available, discover your owned definition, inspect its source/lens and open the recorded run, signals and recommendation explanation.',
    example: 'Observe a permitted repository-quality source. Explain a new warning, record the chosen action and inspect the later outcome before promoting a lesson.',
    steps: ['Connect a permitted source and choose a lens.', 'Inspect definition and operational state.', 'Run and trace the signal to its source.', 'Record action, feedback and supported outcome.'],
    evidence: 'Source provenance, System/run/signal identities, recommendation rationale and separately verified outcome evidence.',
    limits: 'A deployed definition and an operationally active System are different states. A registered adapter may be unavailable. Feedback annotation is not proof of effective learning or causation; mock outcome views must stay identified.',
  },
  {
    id: 'media', title: 'Media and artifacts',
    outcome: 'Bring visual evidence into work and carry usable results out.',
    concept: 'Media can supply task context; artifacts persist results in usable formats. A file and its metadata are different from a printed path. Rendering support and storage must both be checked before promising a format.',
    entry: 'Configured visual-input tools and the agent’s artifact commands or a workspace artifact consumer.',
    prerequisites: 'Read permission for inputs, a supported model/tool, artifact storage and any required renderer. Check the actual output format when optional renderers are absent.',
    cli: 'In odin-agent, use /renderers to inspect available renderers and /artifacts to inspect stored outputs. /report can provide an instruction to run a report skill; it does not itself guarantee dispatch.',
    codeServer: 'Open the produced artifact in the intended project or artifact consumer. Inspect its content and actual extension; keep source input and output receipt together.',
    example: 'Produce a small Mermaid mechanism diagram and a Markdown report. Verify both files can be reopened, then state which formats were actually produced.',
    steps: ['Inspect input permissions and renderer readiness.', 'Generate the bounded output.', 'Persist content with its metadata.', 'Reopen it in the intended consumer.'],
    evidence: 'A readable artifact, actual format, stored content/metadata and successful reopening.',
    limits: 'A renderer may fall back to Markdown when a tool is missing. A claimed file path is not a delivered file. This page’s downloadable report and diagram are authored guide assets, not outputs of a live agent run.',
  },
];

const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export const capabilityRoute = (id?: string) => `reference/capabilities${id ? `/${id}` : ''}`;

export function mountOdinCapabilities(host: HTMLElement, openGuide: (id?: string) => void) {
  const asset = (path: string) => `${import.meta.env.BASE_URL}capabilities/${path}`;
  host.innerHTML = `<section class="odin-capabilities" aria-labelledby="capabilities-title">
    <div class="capabilities-lead"><h2 id="capabilities-title" tabindex="-1">What can you do with Odin?</h2>
      <p>Eight capabilities, with their entry points, prerequisites and evidence. Use these guides to choose a workflow and check what your workspace actually supports.</p>
      <p class="capabilities-notice">Usage guide · no runtime connection or live agent calls. Examples are tasks to try in a configured workspace, not a promise that every feature is enabled.</p>
      <div class="capability-downloads"><a href="${asset('odin-capability-guide.md')}" download>Download the capability guide</a><a href="${asset('mechanism-map.svg')}" download>Download the mechanism diagram</a></div>
    </div>
    <div class="capability-workspace"><nav class="capability-list" aria-label="Odin capability guides">${odinCapabilities.map(c => `<a class="capability-card" href="#${capabilityRoute(c.id)}" data-capability="${c.id}" aria-controls="capability-detail"><strong>${c.title}</strong><span>${c.outcome}</span></a>`).join('')}</nav>
    <article id="capability-detail" class="capability-detail" hidden></article></div>
    <details class="capability-mechanism"><summary>See how the mechanisms fit together</summary><img src="${asset('mechanism-map.svg')}" alt="Visual input and governed memory inform an agent session. Skills and worker coordination support execution; Next adds premise checks and durable workflows, while Systems observe sources and learn from supported outcomes. Artifacts carry results to verification." width="960" height="560"/><p>A conceptual relationship map. These are distinct mechanisms; this image does not show a connected deployment.</p></details>
  </section>`;
  host.querySelectorAll<HTMLAnchorElement>('[data-capability]').forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); openGuide(link.dataset.capability);
  }));
  const detail = host.querySelector<HTMLElement>('#capability-detail')!;
  function show(id?: string) {
    const c = odinCapabilities.find(item => item.id === id);
    host.querySelectorAll<HTMLElement>('[data-capability]').forEach(link => {
      if (link.dataset.capability === c?.id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    detail.hidden = id === undefined;
    if (id === undefined) { detail.innerHTML = ''; return; }
    if (!c) {
      detail.innerHTML = '<h3 id="capability-detail-title" tabindex="-1">Guide not found</h3><p>This capability link is unavailable. Choose a guide from the list.</p><button class="text-button" id="capability-back">See all capability guides</button>';
    } else {
      detail.innerHTML = `<h3 id="capability-detail-title" tabindex="-1">${escape(c.title)}</h3><p class="capability-outcome">${escape(c.outcome)}</p><p>${escape(c.concept)}</p>
        <h4>Where to start</h4><p>${escape(c.entry)}</p><h4>Before you begin</h4><p>${escape(c.prerequisites)}</p>
        <h4>In the CLI</h4><p>${escape(c.cli)}</p><h4>In Code Server and your workspace</h4><p>${escape(c.codeServer)}</p>
        <h4>A task to try</h4><blockquote>${escape(c.example)}</blockquote><ol>${c.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol>
        <h4>What to verify</h4><p>${escape(c.evidence)}</p><h4>Limits to keep in view</h4><p class="capability-limits">${escape(c.limits)}</p>
        <button class="text-button" id="capability-back">See all capability guides</button>`;
    }
    detail.querySelector<HTMLButtonElement>('#capability-back')!.onclick = () => openGuide();
  }
  function reveal() {
    const heading = host.querySelector<HTMLElement>(detail.hidden ? '#capabilities-title' : '#capability-detail-title')!;
    heading.scrollIntoView({ block: 'start', behavior: 'instant' }); heading.focus({ preventScroll: true });
  }
  return { show, reveal };
}
