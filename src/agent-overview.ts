import type { StageSpec, StageRenderer, StageAsset } from './stage-types';
import './agent-overview.css';

type Part = { id: string; label: string; title: string; description: string; example: string; boundary: string; lesson: string; asset: StageAsset; position: [number, number, number] };
const parts: Part[] = [
  { id: 'model', label: 'Model', title: 'The model supplies the intelligence.', description: 'It interprets the context, proposes a next step and produces a response. The harness calls the model, executes permitted tool requests and brings the results back.', example: 'A model proposes: read the project instructions, inspect the file, then make a scoped edit.', boundary: 'Changing the model changes the reasoning engine. It does not automatically change the available tools or permissions.', lesson: 'loop', asset: 'model-chip', position: [0, 0.4, 0] },
  { id: 'knowledge', label: 'Context & skills', title: 'Give the agent the knowledge for this job.', description: 'Project instructions describe local conventions. Context supplies relevant files and facts. Skills package reusable instructions and resources for particular tasks.', example: 'Project instructions: preserve existing links. Editing skill: inspect the file, make the smallest change, then verify.', boundary: 'Guidance shapes behavior. The runtime must enforce access and execution boundaries separately.', lesson: 'context', asset: 'context-stack', position: [-3.7, 0, -1.8] },
  { id: 'tools', label: 'Tools & permissions', title: 'Connect reasoning to permitted actions.', description: 'Tools let the agent read files, edit code or call a service. The harness checks what is allowed, executes the operation and returns its result to the model.', example: 'Read and edit this workshop folder. Refuse a request to export unrelated files.', boundary: 'A proposed tool call is not an executed action. A denied action is not a completed task.', lesson: 'tools', asset: 'permission-gate', position: [3.7, 0, -1.8] },
  { id: 'work', label: 'Workflows & work orders', title: 'Give the work a shape and a finish line.', description: 'A workflow coordinates steps, handoffs and checks. A work order describes one job: its objective, scope, constraints and acceptance evidence. The model can make decisions within that structure.', example: 'Work order: fix one typo and preserve its link. Workflow: inspect → edit → check → review.', boundary: 'A work order is a task contract; a workflow is how work is organized. Their formats depend on the harness.', lesson: 'intent', asset: 'queue', position: [0, 0, -4] },
  { id: 'feedback', label: 'Telemetry & checks', title: 'See what happened. Check what it produced.', description: 'Telemetry records events, timing, cost and failures. Tests and evaluations check results against expectations. The harness can use that feedback to stop, retry or ask for help.', example: 'Trace: one edit ran. Check: the typo is fixed and the FAQ link still works. Record the evidence with the result.', boundary: 'A clean trace helps explain a run. A separate artifact check establishes whether this task met its contract.', lesson: 'observability', asset: 'test-rig', position: [3.5, 0, 2.4] },
  { id: 'plugins', label: 'Plugins', title: 'Package extensions so they can be reused.', description: 'Plugins can bundle skills, tools, hooks or integrations for a host harness. They are a way to deliver capabilities; they do not make every capability the same kind of thing.', example: 'A project plugin might supply an editing skill, a repository tool and a hook that runs a check.', boundary: 'Loading an extension does not automatically make it trustworthy or grant it unrestricted access. Plugin formats vary by host.', lesson: 'repository', asset: 'extension-rack', position: [-3.5, 0, 2.4] },
];
const sources = [
  { title: 'Agent systems and workflows · Anthropic', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
  { title: 'What skills contain · Agent Skills', url: 'https://agentskills.io/what-are-skills' },
  { title: 'A plugin implementation · Claude Code', url: 'https://code.claude.com/docs/en/plugins' },
  { title: 'Telemetry signals · OpenTelemetry', url: 'https://opentelemetry.io/docs/concepts/signals/' },
];
const spec: StageSpec = {
  id: 'agent-overview', title: 'The model inside its harness', subtitle: 'Inspect the parts of a working agent.', layout: 'contract-desk', inspectionMode: 'component',
  nodes: parts.map(part => ({ id: part.id, label: part.label, detail: part.description, asset: part.asset, position: part.position, code: { file: part.label, language: 'text', text: part.example, provenance: 'Illustrative pseudocode' } })),
  links: [
    { from: 'work', to: 'knowledge', label: 'Task context', kind: 'context' },
    { from: 'knowledge', to: 'model', label: 'Instructions and facts', kind: 'context' },
    { from: 'plugins', to: 'knowledge', label: 'Reusable guidance', kind: 'context' },
    { from: 'model', to: 'tools', label: 'Proposed action', kind: 'proposal' },
    { from: 'tools', to: 'feedback', label: 'Observed result', kind: 'result' },
    { from: 'feedback', to: 'model', label: 'Feedback', kind: 'result' },
  ],
  frames: [{ id: 'overview', title: 'One model, a system around it', explanation: 'Select a component to see its role.', focus: ['model'], route: [], packet: 'The model inside the harness' }],
  sources, note: 'A conceptual map of common responsibilities. Real harnesses organize these parts differently. This diagram does not run an agent.',
};

export function mountAgentOverview(host: HTMLElement, openLesson: (id: string) => void, beginWorkshop: () => void) {
  let renderer: StageRenderer | undefined, selected = 'model', disposed = false, paused = false;
  let mapVisible = false, loading = false, mapFailed = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  host.innerHTML = `
    <section class="agent-overview" aria-labelledby="agent-overview-title">
      <div class="agent-overview-lead">
        <div class="agent-overview-intro">
          <h1 id="agent-overview-title" tabindex="-1">The model reasons.<br><span>The harness makes it work.</span></h1>
          <p class="agent-overview-definition">An AI agent combines a <strong>model</strong> with a <strong>harness</strong>: the software that gives it context, runs its tools, manages work and brings back evidence.</p>
          <p class="agent-overview-purpose">The same model can do different jobs when you change the instructions, skills and capabilities around it.</p>
          <p class="agent-overview-example">${parts[0].example}</p>
          <div class="agent-overview-actions"><button class="workshop-primary" id="overview-foundations">Read the foundations</button><button class="workshop-link" id="overview-workshop">Try the hands-on workshop</button></div>
        </div>
      </div>
      <details id="overview-details" class="agent-overview-exploration">
        <summary>Explore the parts of an agent<span class="agent-overview-disclosure-note">Select a component to see its role.</span></summary>
        <div class="agent-overview-parts">
          <div class="agent-part-picker" role="group" aria-label="Inspect agent components">${parts.map(part => `<button data-agent-part="${part.id}" aria-pressed="${part.id === selected}" aria-controls="agent-part-detail">${part.label}</button>`).join('')}</div>
          <div id="agent-part-detail" class="agent-part-detail" role="region" aria-label="Selected agent component" aria-live="polite"></div>
        </div>
        <button class="workshop-link agent-map-toggle" id="overview-map-toggle" aria-expanded="false" aria-controls="overview-map">Show 3D map</button>
        <figure class="agent-overview-figure" id="overview-map" hidden>
          <div class="agent-map-heading"><h2>The model inside its harness</h2><button class="workshop-link" id="overview-reset">Reset view</button></div>
          <div id="agent-overview-scene" aria-label="Interactive agent component map"></div>
          <p id="overview-map-loading" role="status" hidden>Loading the map…</p>
          <p id="overview-fallback" hidden>3D is unavailable. The component buttons above explain every part.</p>
          <figcaption>Each numbered object has a role. Conceptual map · no live model calls</figcaption>
        </figure>
        <div class="agent-overview-sources"><h2>How to read this map · sources</h2><p>${spec.note}</p><p>“Harness” names the surrounding runtime and its configured extensions here. A work order is a task contract in this guide, not a universal provider file format.</p><ul>${sources.map(source => `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title} ↗</a></li>`).join('')}</ul></div>
      </details>
    </section>`;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => host.querySelector<T>(selector)!;
  function select(id: string) {
    const part = parts.find(item => item.id === id);
    if (!part || disposed) return;
    selected = id;
    get('#agent-part-detail').innerHTML = `<h3>${part.title}</h3><p>${part.description}</p><div class="agent-part-example"><h4>Example</h4><p>${part.example}</p><h4>Boundaries</h4><p class="agent-part-boundary">${part.boundary}</p></div><div class="agent-part-actions"><button class="workshop-link" id="overview-part-workshop">Try it in the workshop →</button><button class="workshop-link" id="overview-part-lesson">Explore this in the lessons →</button></div>`;
    get('#overview-part-workshop').onclick = beginWorkshop;
    get('#overview-part-lesson').onclick = () => openLesson(part.lesson);
    host.querySelectorAll<HTMLElement>('[data-agent-part]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.agentPart === id)));
    const frame = { ...spec.frames[0], focus: [id], packet: part.label };
    renderer?.update({ ...spec, frames: [frame] }, 0, id);
  }
  host.querySelectorAll<HTMLButtonElement>('[data-agent-part]').forEach(button => button.onclick = () => select(button.dataset.agentPart!));
  get('#overview-workshop').onclick = beginWorkshop;
  get('#overview-foundations').onclick = () => openLesson('foundations');
  get('#overview-reset').onclick = () => renderer?.reset();
  const exploration = get<HTMLDetailsElement>('#overview-details');
  const canShowMap = () => !disposed && !paused && exploration.open && mapVisible;
  function fallback() {
    if (disposed) return;
    mapFailed = true;
    get('#overview-fallback').hidden = false;
    get('#agent-overview-scene').hidden = true;
    get<HTMLButtonElement>('#overview-reset').disabled = true;
  }
  async function syncMap() {
    renderer?.pause(!canShowMap() || reduced.matches);
    if (!canShowMap() || renderer || loading || mapFailed) return;
    loading = true;
    get('#overview-map-loading').hidden = false;
    try {
      const module = await import('./stage-renderer');
      if (!canShowMap()) return;
      renderer = module.createStageRenderer(get('#agent-overview-scene'), spec, 0, selected, id => {
        select(id);
        get('#agent-part-detail h3').scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }, fallback, true);
      select(selected);
      renderer.pause(!canShowMap() || reduced.matches);
    } catch { fallback(); }
    finally {
      loading = false;
      if (!disposed) get('#overview-map-loading').hidden = true;
    }
  }
  exploration.addEventListener('toggle', syncMap);
  get('#overview-map-toggle').onclick = () => {
    mapVisible = !mapVisible;
    get('#overview-map').hidden = !mapVisible;
    get('#overview-map-toggle').setAttribute('aria-expanded', String(mapVisible));
    get('#overview-map-toggle').textContent = mapVisible ? 'Hide 3D map' : 'Show 3D map';
    void syncMap();
  };
  select(selected);
  const motionChanged = () => renderer?.pause(!canShowMap() || reduced.matches);
  reduced.addEventListener('change', motionChanged);
  return {
    pause(value: boolean) { paused = value; void syncMap(); },
    dispose() {
      disposed = true;
      exploration.removeEventListener('toggle', syncMap);
      reduced.removeEventListener('change', motionChanged);
      renderer?.dispose();
    },
  };
}
