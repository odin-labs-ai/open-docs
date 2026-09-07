import './engineering-stage.css';
import type { StageSpec, StageRenderer, StageCode } from './stage-types';

export type EngineeringStage = { update(spec: StageSpec, frame?: number): void; setFrame(frame: number): void; pause(paused: boolean): void; capture(): string | null; dispose(): void };
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => { const node = document.createElement(tag); node.className = className; node.textContent = text; return node; };
const safeUrl = (value?: string) => { if (!value) return null; try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } };

/** One stage owns the scene, its readable code and a finite event timeline. */
export function mountEngineeringStage(host: HTMLElement, initial: StageSpec, light = false, followTrace = false): EngineeringStage {
  let spec = initial, index = 0, selected = '', renderer: StageRenderer | undefined, disposed = false, unavailable = false;
  let timer: ReturnType<typeof setTimeout> | undefined, suspended = false, playing = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = el('section', 'engineering-stage'); root.dataset.light = String(light); root.setAttribute('aria-label', 'Code and runtime stage');
  const header = el('header', 'engineering-stage-header'), title = el('h2'), subtitle = el('p'); header.append(title, subtitle);
  const grid = el('div', 'engineering-stage-grid'), viewportColumn = el('div', 'engineering-scene-column'), viewport = el('div', 'engineering-viewport');
  const fallback = el('div', 'engineering-fallback'); fallback.hidden = true; viewportColumn.append(viewport, fallback);
  const objects = el('nav', 'engineering-objects'); objects.setAttribute('aria-label', 'Inspect runtime objects'); viewportColumn.append(objects);
  const inspector = el('aside', 'engineering-code'); inspector.tabIndex = -1; inspector.setAttribute('aria-label', 'Selected code and runtime boundary');
  const inspectionStatus = el('p', 'engineering-inspection-status'); inspectionStatus.setAttribute('role', 'status');
  const objectTitle = el('h3'), detail = el('p', 'engineering-object-detail'), file = el('div', 'engineering-file'), provenance = el('p', 'engineering-provenance');
  const pre = el('pre'), code = el('code'); pre.tabIndex = 0; pre.setAttribute('aria-label', 'Selected code excerpt'); pre.append(code); const source = el('a', 'engineering-code-source', 'Open source documentation'); source.target = '_blank'; source.rel = 'noopener noreferrer';
  const returnToScene = el('button', 'engineering-return', 'Back to 3D objects'); returnToScene.type = 'button'; returnToScene.addEventListener('click', () => { viewportColumn.scrollIntoView({ block: 'start', behavior: 'instant' }); objects.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus({ preventScroll: true }); });
  inspector.append(inspectionStatus, objectTitle, detail, file, provenance, pre, source, returnToScene); grid.append(viewportColumn, inspector);
  const controls = el('div', 'engineering-controls');
  const button = (text: string, action: () => void) => { const b = el('button', '', text); b.type = 'button'; b.addEventListener('click', action); return b; };
  const previous = button('Previous event', () => go(index - 1)), play = button('Play sequence', () => { if (playing) stop(); else { suspended = false; renderer?.pause(reduced.matches); playing = true; if (index === spec.frames.length - 1) { index = 0; selected = ''; paint(); } else { play.textContent = 'Pause sequence'; play.setAttribute('aria-pressed', 'true'); } schedule(); } }), next = button('Next event', () => go(index + 1)), replay = button('Replay event', () => { renderer?.update(spec, index, selected); inspectionStatus.textContent = reduced.matches || unavailable ? 'Current event shown without motion. Use Next event to follow the sequence.' : 'Replaying the current event.'; }), reset = button('Reset camera', () => renderer?.reset());
  const count = el('span', 'engineering-count'); controls.append(previous, play, next, count, replay, reset);
  const timeline = el('nav', 'engineering-timeline'); timeline.setAttribute('aria-label', 'Runtime event timeline');
  const narrative = el('div', 'engineering-narrative'), eventTitle = el('h3'), explanation = el('p'); explanation.setAttribute('aria-live', 'polite'); narrative.append(eventTitle, explanation);
  const note = el('p', 'engineering-note'), sources = el('div', 'engineering-sources');
  const sequence = el('details', 'engineering-sequence'), sequenceSummary = el('summary', '', 'Choose an event'); sequence.append(sequenceSummary, timeline);
  const references = el('details', 'engineering-references'), referencesSummary = el('summary', '', 'Sources and example boundaries'); references.append(referencesSummary, note, sources);
  const hint = el('p', 'engineering-hint', 'Select a numbered object to inspect its code. Next event advances the execution story.');
  if (followTrace) { previous.hidden = true; play.hidden = true; next.hidden = true; replay.hidden = true; sequence.hidden = true; hint.textContent = 'This stage follows the observed trace. Use Run experiment or Step in the experiment controls to advance it.'; }
  root.append(header, controls, narrative, sequence, hint, grid, references); host.append(root);
  function stop() { if (timer) clearTimeout(timer); timer = undefined; playing = false; play.textContent = 'Play sequence'; play.setAttribute('aria-pressed', 'false'); }
  function schedule() { if (timer) clearTimeout(timer); if (!playing || suspended || document.hidden || disposed) return; timer = setTimeout(() => { if (index < spec.frames.length - 1) { index++; selected = ''; if (index === spec.frames.length - 1) stop(); paint(); schedule(); } else stop(); }, 2600); }
  function go(value: number) { stop(); index = Math.max(0, Math.min(value, spec.frames.length - 1)); selected = ''; paint(); reveal(narrative); }
  function reveal(target: HTMLElement) { const box = target.getBoundingClientRect(), headerBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0; if (box.top < headerBottom || box.bottom > innerHeight) target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  function showCode(value: StageCode) {
    file.textContent = value.file; provenance.textContent = `${value.provenance} · ${value.language}`; code.replaceChildren();
    value.text.split('\n').forEach((line, i) => { const row = el('span', `engineering-code-line${value.highlight?.includes(i + 1) ? ' highlighted' : ''}`); row.dataset.line = String(i + 1); const number = el('span', 'engineering-line-number', String(i + 1)); number.setAttribute('aria-hidden', 'true'); row.append(number, document.createTextNode(line || ' ')); code.append(row); });
    const url = safeUrl(value.sourceUrl); source.hidden = !url; if (url) source.href = url;
  }
  function paint() {
    if (disposed) return;
    const frame = spec.frames[index]; if (!frame) return;
    selected ||= frame.focus[0] || spec.nodes[0]?.id || '';
    const object = spec.nodes.find(node => node.id === selected) || spec.nodes[0];
    root.dataset.stage = spec.id; root.dataset.layout = spec.layout; root.dataset.provider = spec.provider || ''; root.dataset.frame = frame.id;
    title.textContent = spec.title; subtitle.textContent = spec.subtitle; eventTitle.textContent = frame.title; explanation.textContent = frame.explanation;
    note.textContent = spec.note; count.textContent = `${index + 1} / ${spec.frames.length}`;
    inspectionStatus.textContent = ''; sequenceSummary.textContent = `Choose an event · ${index + 1} of ${spec.frames.length}`;
    previous.disabled = index === 0; next.disabled = index === spec.frames.length - 1; play.disabled = spec.frames.length < 2; play.textContent = playing ? 'Pause sequence' : 'Play sequence'; play.setAttribute('aria-pressed', String(playing));
    if (object) { objectTitle.textContent = object.label; detail.textContent = object.detail; showCode(selected === frame.focus[0] && frame.code ? frame.code : object.code); }
    const focusedObject = objects.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.stageNode : undefined;
    objects.replaceChildren(); spec.nodes.forEach((node, nodeIndex) => { const b = button('', () => pick(node.id)); b.setAttribute('aria-label', node.label); b.dataset.stageLabel = node.label; const number = el('span', 'engineering-object-number', String(nodeIndex + 1)); number.setAttribute('aria-hidden', 'true'); const label = el('span', '', node.label); b.append(number, label); b.dataset.stageNode = node.id; b.dataset.asset = node.asset; b.dataset.state = frame.states?.[node.id] || (frame.focus.includes(node.id) ? 'active' : 'ready'); const state = b.dataset.state; const stateText = el('small', 'engineering-object-state', state === 'blocked' ? 'Blocked before action' : state === 'passed' ? 'Passed' : state === 'active' ? 'Current event' : 'Inspect code'); b.append(stateText); b.setAttribute('aria-pressed', String(node.id === selected)); objects.append(b); });
    if (focusedObject) objects.querySelector<HTMLElement>(`[data-stage-node="${CSS.escape(focusedObject)}"]`)?.focus({ preventScroll: true });
    const focusedFrame = timeline.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.stageFrame : undefined;
    timeline.replaceChildren(); spec.frames.forEach((item, i) => { const b = button(`${i + 1}. ${item.title}`, () => go(i)); b.dataset.stageFrame = String(i); b.setAttribute('aria-current', i === index ? 'step' : 'false'); timeline.append(b); });
    if (focusedFrame) timeline.querySelector<HTMLElement>(`[data-stage-frame="${focusedFrame}"]`)?.focus({ preventScroll: true });
    sources.replaceChildren(); spec.sources.forEach(item => { const url = safeUrl(item.url); if (!url) return; const link = el('a', '', item.title); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; sources.append(link); });
    if (unavailable) renderFallback(); renderer?.update(spec, index, selected);
  }
  function pick(id: string) {
    stop();
    if (id === selected) { inspectionStatus.textContent = `Inspecting ${objectTitle.textContent}. The event has not advanced.`; reveal(inspector); return; }
    const object = spec.nodes.find(node => node.id === id);
    if (!object) return;
    selected = id;
    const frame = spec.frames[index];
    objectTitle.textContent = object.label; detail.textContent = object.detail;
    showCode(id === frame.focus[0] && frame.code ? frame.code : object.code);
    objects.querySelectorAll<HTMLButtonElement>('button').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.stageNode === id)));
    renderer?.update(spec, index, selected);
    inspectionStatus.textContent = `Inspecting ${object.label}. The event has not advanced.`;
    reveal(inspector);
  }
  function renderFallback() {
    host.dataset.engine = 'fallback'; root.dataset.engine = 'fallback'; viewport.hidden = true; fallback.hidden = false; fallback.replaceChildren();
    reset.disabled = true; replay.disabled = true;
    fallback.append(el('h3', '', 'Read the runtime path'), el('p', '', '3D is unavailable. The same objects, code and event sequence remain inspectable.'));
    const list = el('ol'); for (const id of spec.frames[index].route) { const node = spec.nodes.find(item => item.id === id); if (node) list.append(el('li', '', node.label)); } fallback.append(list);
    const edges = el('p', '', spec.links.map(link => `${spec.nodes.find(n => n.id === link.from)?.label || link.from} → ${link.label} → ${spec.nodes.find(n => n.id === link.to)?.label || link.to}`).join('\n')); edges.style.whiteSpace = 'pre-line'; fallback.append(edges);
  }
  paint();
  void import('./stage-renderer').then(module => { if (disposed) return; try { renderer = module.createStageRenderer(viewport, spec, index, selected, pick, () => { unavailable = true; renderFallback(); }, light); if (!unavailable) { host.dataset.engine = 'three'; root.dataset.engine = 'three'; } renderer?.pause(suspended || reduced.matches); } catch { unavailable = true; renderFallback(); } }).catch(() => { if (!disposed) { unavailable = true; renderFallback(); } });
  const visibility = () => { if (document.hidden) { stop(); renderer?.pause(true); } else renderer?.pause(suspended || reduced.matches); };
  const motion = () => { stop(); renderer?.pause(suspended || reduced.matches); };
  document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', motion);
  const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); }); observer.observe(root);
  return { update(value, frame = 0) { stop(); spec = value; index = Math.max(0, Math.min(frame, spec.frames.length - 1)); selected = ''; paint(); }, setFrame: go, pause(value) { suspended = value; if (value) stop(); renderer?.pause(value || reduced.matches); }, capture: () => renderer?.capture() || null, dispose() { if (disposed) return; disposed = true; stop(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motion); renderer?.dispose(); root.remove(); } };
}
