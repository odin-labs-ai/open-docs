import { mountAgentOverview } from './agent-overview';
import './style.css';
import './workshop.css';
import { components, lessons, sources, type Component, type Lesson } from './curriculum';
import { defaults, scenarios, simulate, type Controls } from './simulation';
import type { HarnessScene } from './scene';
import { mountWorkshop } from './workshop';
import { mountLessonTheater, mountTraceTheater } from './lesson-theater';

const icon = (name: string, size = 18) => {
  const paths: Record<string, string> = {
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', play: '<path d="m8 5 11 7-11 7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>', check: '<path d="m5 12 4 4L19 6"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5M3 17l9 5 9-5"/>', reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    book: '<path d="M12 5v16M3 3c4-1 6 0 9 2 3-2 5-3 9-2v16c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>', lab: '<path d="M9 3h6m-5 0v6L4 19q-1 2 2 2h12q3 0 2-2L14 9V3M7 15h10"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', chevron: '<path d="m9 5 7 7-7 7"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
};
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => { const node = document.querySelector<T>(selector); if (!node) throw new Error(`Missing element: ${selector}`); return node; };
const storageKey = 'odin-harness-course-v1';
type Progress = { visited: Record<string, string[]>; answers: Record<string, number[]>; labs: Record<string, string[]> };
let progress: Progress = { visited: {}, answers: {}, labs: {} };
let storageAvailable = true;
try {
  const raw: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (raw && typeof raw === 'object') {
    const candidate = raw as Partial<Progress>;
    for (const lesson of lessons) {
      const visited = candidate.visited?.[lesson.id];
      if (Array.isArray(visited)) progress.visited[lesson.id] = visited.filter(v => v === 'essentials' || v === 'deep');
      const answers = candidate.answers?.[lesson.id];
      if (Array.isArray(answers)) progress.answers[lesson.id] = lesson.questions.map((question, i) => Number.isInteger(answers[i]) && answers[i] >= 0 && answers[i] < question.options.length ? answers[i] : -1);
    }
    for (const scenario of scenarios) {
      const runs = candidate.labs?.[scenario.id];
      if (Array.isArray(runs)) progress.labs[scenario.id] = runs.filter(v => v === 'contained' || v === 'failed');
    }
  }
} catch { storageAvailable = false; }
let current = lessons.find(lesson => lesson.id === location.hash.slice(1)) || lessons[0];
let mode = 'explore';
let tab = 'essentials';
type JourneyPoint = { scrollY: number; focusId?: string };
type JourneyState = JourneyPoint & { odin: true; documentId: string; tab: string; workshopReturn?: JourneyPoint };
const journeyDocument = crypto.randomUUID();
let destination = '';
let restoringJourney = false;
let workshopReturn: JourneyPoint | undefined;
history.scrollRestoration = 'manual';
let scene: HarnessScene | undefined;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let expanded = true;
let runTimer: ReturnType<typeof setInterval> | undefined;
let activeScenario = scenarios[0].id;
let lastResult: ReturnType<typeof simulate> | undefined;
let runIndex = 0;
let runSnapshot: Controls | undefined;
let controls: Controls = { ...defaults, policy: false };

const app = $('#app');
app.innerHTML = `
  <a class="skip-link" href="#lesson-reader">Skip to lesson</a>
  <header class="topbar">
    <a class="brand" href="#learn" aria-label="Odin Open Docs, start learning"><img src="${import.meta.env.BASE_URL}odin-logo.svg" width="31" height="34" alt="" /><span>Odin <strong>Open Docs</strong></span></a>
    <span class="header-divider"></span><span class="academy-label">Harness engineering</span>
    <nav class="mode-nav" aria-label="Experience views">
      <button data-mode="learn" aria-pressed="false">${icon('play')}<span>Start here</span></button>
      <button class="active" data-mode="explore" aria-pressed="true">${icon('layers')}<span>Explore</span></button>
      <button data-mode="lab" aria-pressed="false">${icon('lab')}<span>Failure lab</span></button>
      <button data-mode="reference" aria-pressed="false">${icon('book')}<span>Field guide</span></button>
</nav>
    <span class="local-badge"><span></span>Local learning space</span>
  </header>
  <div class="app-layout">
    <aside class="sidebar">
      <details id="curriculum-disclosure" open>
        <summary>Learning path <span>18 lessons</span></summary>
        <div class="sidebar-inner">
          <label class="search-box">${icon('search')}<input id="lesson-search" type="search" placeholder="Find a concept…" aria-label="Search lessons and concepts" /></label>
          <nav id="curriculum" aria-label="Course lessons"></nav>
          <p id="search-empty" hidden>No matching lessons. Try “memory”, “tools”, or “evals”.</p>
        </div>
      </details>
      <div class="progress-panel">
        <div><strong>Your progress</strong><span id="progress-count">0 / 18</span></div>
        <progress id="course-progress" max="18" value="0" aria-label="Completed lessons"></progress>
        <p id="progress-note">Open both sections and pass each lesson’s two checks.</p>
        <button class="text-button" id="export-progress">${icon('download', 16)}Export learning record</button>
        <button class="text-button quiet" id="reset-progress">Reset progress</button>
      </div>
    </aside>
    <main id="main-content">
      <section id="learn-view" hidden aria-label="Understand agents and try the workshop"><div id="agent-overview-host"></div><div id="workshop-host"></div></section>
      <section class="intro">
        <div><h1>Harness engineering<span class="title-period">.</span></h1><p>Explore the system around the intelligence.<br class="desktop-break" /> Build the judgment to make agents work reliably.</p></div>
        <div class="course-facts"><span>Foundations to production</span><strong>18 lessons <i>/</i> 6 experiments</strong><span>Learn at your own pace</span></div>
      </section>
      <section id="explore-view">
        <div id="lesson-theater"></div>
        <details class="architecture-disclosure"><summary>Inspect the full harness architecture</summary><div class="observatory">
          <div class="scene-column">
            <div class="scene-topline"><span>${icon('layers', 16)}The anatomy of a harness</span><span id="engine-state">Loading 3D engine</span></div>
            <div id="scene-host"><div id="scene-loading">Preparing the interactive assembly…</div></div>
            <div id="scene-fallback" hidden><h2>Explore the component map</h2><p>3D rendering is unavailable in this browser. Every lesson and experiment still works. Select a component below.</p><div class="fallback-components"></div></div>
            <div class="scene-bottom"><span class="orbit-hint">Drag to orbit. Select a layer to investigate.</span><div class="scene-tools">
              <button id="toggle-motion" title="Toggle animation" aria-label="${paused ? 'Play animation' : 'Pause animation'}">${icon(paused ? 'play' : 'pause')}</button>
              <button id="toggle-explode" title="Toggle exploded view" aria-label="Assemble layers" aria-pressed="true">${icon('layers')}</button>
              <button id="reset-view" title="Reset camera" aria-label="Reset camera">${icon('reset')}</button>
            </div></div>
          </div>
          <aside class="component-inspector" aria-label="Selected component"><div id="inspector-content"></div></aside>
        </div>
        </details><section id="lesson-reader" class="reader" tabindex="-1" aria-label="Lesson reader">
          <div class="reader-heading"><div><span id="lesson-position"></span><h2 id="lesson-title"></h2></div><span id="lesson-level" class="level-badge"></span></div>
          <div class="lesson-tabs" role="tablist" aria-label="Lesson sections">
            <button id="tab-essentials" role="tab" aria-controls="lesson-panel" data-tab="essentials">Foundations</button>
            <button id="tab-deep" role="tab" aria-controls="lesson-panel" data-tab="deep">Deep dive</button>
            <button id="tab-check" role="tab" aria-controls="lesson-panel" data-tab="check">Check understanding<span id="check-indicator"></span></button>
          </div>
          <div id="lesson-panel" role="tabpanel" tabindex="0"></div>
          <div class="lesson-footer"><button id="prev-lesson" class="secondary">Previous lesson</button><span id="lesson-status"></span><button id="next-lesson" class="primary">Next lesson ${icon('arrow')}</button></div>
        </section>
      </section>
      <section id="lab-view" hidden>
        <div class="section-heading"><div><h2>Break the loop. Understand the fix.</h2><p>Change a control, run a failure, and inspect what actually happens.</p></div><span class="simulation-badge">Illustrative simulation</span></div>
        <div class="scenario-picker" role="group" aria-label="Failure scenarios">${scenarios.map((scenario, i) => `<button data-scenario="${scenario.id}"><span>${String(i + 1).padStart(2, '0')}</span>${scenario.title}<small class="scenario-complete" data-lab-badge="${scenario.id}"></small></button>`).join('')}</div>
        <div id="lab-theater"></div>
        <div class="lab-grid">
          <div class="lab-controls"><h3 id="scenario-title"></h3><p id="scenario-description"></p><p id="scenario-concept" class="concept-note"></p>
            <fieldset><legend>Harness controls</legend>
              ${(['policy', 'idempotency', 'checkpoint', 'verification'] as const).map(key => `<label class="switch-row"><span>${({ policy: 'Enforce policy boundary', idempotency: 'Stable idempotency key', checkpoint: 'Durable checkpoints', verification: 'Verify the outcome' })[key]}</span><input type="checkbox" data-control="${key}" role="switch" ${controls[key] ? 'checked' : ''}/></label>`).join('')}
              <label class="range-row" for="context-budget">Context capacity <output id="context-output">16k tokens</output></label><input id="context-budget" type="range" min="8" max="32" step="4" value="16" />
              <label class="range-row" for="max-turns">Maximum turns <output id="turns-output">6</output></label><input id="max-turns" type="range" min="2" max="12" step="1" value="6" />
            </fieldset>
            <div class="run-actions"><button id="run-simulation" class="primary">${icon('play')}Run experiment</button><button id="step-simulation" class="secondary">Step</button><button id="stop-simulation" class="secondary" disabled>Stop</button></div>
            <p class="lab-disclaimer">A deterministic teaching model. No model calls, tenant access, or external actions. Outcomes describe the selected fixture, not production guarantees.</p>
          </div>
          <div class="trace-panel"><div class="trace-header"><h3>Execution trace</h3><span id="trace-status">Ready</span></div><ol id="trace-events" tabindex="0" aria-label="Observed execution events"><li class="trace-empty">Run the experiment or advance one step to follow the decision path.</li></ol><div id="trace-outcome" aria-live="polite"></div><button id="related-lesson" class="text-button" hidden>Read the related lesson ${icon('arrow')}</button></div>
        </div>
        <div class="reliability-experiment"><div><h3>One success is not the same as reliability.</h3><p>Compare finding one successful attempt with succeeding every time. Assumes independent attempts with constant probability.</p></div><div class="reliability-controls"><label for="success-rate">Per-attempt success <output id="success-output">80%</output></label><input id="success-rate" type="range" min="10" max="95" step="5" value="80"/><label for="attempts">Attempts <output id="attempts-output">3</output></label><input id="attempts" type="range" min="1" max="10" value="3"/></div><div class="probabilities"><div><span>At least one succeeds · pass@k</span><strong id="pass-at">99.2%</strong><progress id="pass-at-bar" max="100" value="99.2" aria-label="Probability at least one succeeds"></progress></div><div><span>All succeed · pass^k</span><strong id="pass-all">51.2%</strong><progress id="pass-all-bar" max="100" value="51.2" aria-label="Probability all succeed"></progress></div></div></div>
      </section>
      <section id="reference-view" hidden>
        <div class="section-heading"><div><h2>A field guide to the whole system.</h2><p>Find a concept, follow it to a lesson, and inspect the underlying sources.</p></div></div>
        <label class="search-box reference-search">${icon('search')}<input id="concept-search" type="search" placeholder="Search the concept index…" aria-label="Search concept index"/></label>
        <div id="concept-index"></div><p id="concept-empty" hidden>No concepts match this search. Try a broader term.</p>
        <section class="sources-section"><h2>Go to the source.</h2><p>Primary engineering references inform this course. Examples, architectural synthesis, quizzes, and failure fixtures are authored for this learning experience. Reviewed 7 September 2026; provider behavior and conventions can change.</p><div class="source-list">${Object.values(sources).map(source => `<a href="${source.url}" target="_blank" rel="noopener noreferrer"><strong>${source.title} ${icon('arrow', 16)}</strong><span>${source.note}</span></a>`).join('')}</div></section>
        <div class="scope-note"><h3>A map, not a claim of omniscience.</h3><p>Harness engineering has no closed, universally agreed inventory. This course spans the introductory and advanced concepts in its index. Completing it records your work through this curriculum; it does not certify every possible concept, production readiness, or regulatory compliance.</p></div>
      </section>
      <section id="completion" hidden><div>${icon('check', 30)}<h2>Every layer explored.</h2><p>You completed all 18 lessons, 36 checks, and both outcomes of all six experiments. Export the record, then apply the ideas to a real, scoped system.</p></div><button class="primary" id="export-completion">Export learning record ${icon('download')}</button></section>
      <footer class="page-footer"><a href="https://www.odin-labs.ai">Open docs · Powered by Odin</a><a href="https://github.com/odin-labs-ai/open-docs">Source &amp; contribute</a></footer>
    </main>
  </div><div id="notification" class="notification" role="status" hidden></div>`;

function save() { try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { storageAvailable = false; } updateProgress(); }
function lessonComplete(lesson: Lesson) { return ['essentials', 'deep'].every(section => progress.visited[lesson.id]?.includes(section)) && lesson.questions.every((question, i) => progress.answers[lesson.id]?.[i] === question.answer); }
function labComplete(id: string) { return ['contained', 'failed'].every(outcome => progress.labs[id]?.includes(outcome)); }
function updateProgress() {
  const count = lessons.filter(lessonComplete).length;
  $('#progress-count').textContent = `${count} / ${lessons.length}`;
  $<HTMLProgressElement>('#course-progress').value = count;
  $('#progress-note').textContent = storageAvailable ? `${scenarios.filter(scenario => labComplete(scenario.id)).length} / 6 experiments explored both ways. Saved in this browser.` : 'Browser storage is unavailable. Progress lasts for this tab; export to keep a record.';
  document.querySelectorAll<HTMLElement>('[data-lesson-status]').forEach(node => { const lesson = lessons.find(item => item.id === node.dataset.lessonStatus)!; node.innerHTML = lessonComplete(lesson) ? icon('check', 13) : ''; });
  document.querySelectorAll<HTMLElement>('[data-lab-badge]').forEach(node => { node.innerHTML = labComplete(node.dataset.labBadge!) ? icon('check', 14) : ''; });
  $('#completion').hidden = !(count === lessons.length && scenarios.every(scenario => labComplete(scenario.id)));
}
function notify(message: string) { const node = $('#notification'); node.textContent = message; node.hidden = false; setTimeout(() => { node.hidden = true; }, 5000); }
function renderCurriculum() {
  const query = $<HTMLInputElement>('#lesson-search').value.toLowerCase().trim();
  const filtered = lessons.filter(lesson => `${lesson.title} ${lesson.concepts.join(' ')} ${lesson.summary}`.toLowerCase().includes(query));
  $('#curriculum').innerHTML = [...new Set(filtered.map(lesson => lesson.group))].map(group => `<div class="curriculum-group"><h3>${group}</h3>${filtered.filter(lesson => lesson.group === group).map(lesson => `<button class="lesson-link ${lesson.id === current.id ? 'active' : ''}" data-lesson="${lesson.id}" ${lesson.id === current.id ? 'aria-current="step"' : ''}><span class="lesson-number">${String(lessons.indexOf(lesson) + 1).padStart(2, '0')}</span><span>${lesson.title}</span><span class="lesson-dot" data-lesson-status="${lesson.id}"></span></button>`).join('')}</div>`).join('');
  $('#search-empty').hidden = filtered.length > 0;
  updateProgress();
}
function saveJourney() {
  if (restoringJourney || !destination) return;
  const focusId = document.activeElement instanceof HTMLElement ? document.activeElement.id : undefined;
  const point = { scrollY: window.scrollY, focusId };
  history.replaceState({ ...point, odin: true, documentId: journeyDocument, tab, workshopReturn } satisfies JourneyState, '', `#${destination}`);
}
function visit(id: string) {
  if (id === destination) return;
  saveJourney();
  if (destination === 'workshop' && lessons.some(lesson => lesson.id === id)) {
    workshopReturn = { scrollY: window.scrollY, focusId: 'workshop-deeper' };
  } else if (!lessons.some(lesson => lesson.id === id)) workshopReturn = undefined;
  destination = id;
  history.pushState({ odin: true, documentId: journeyDocument, scrollY: 0, tab: 'essentials', workshopReturn } satisfies JourneyState, '', `#${id}`);
}
function setMode(next: string, record = true) {
  if (record) visit(next === 'explore' ? current.id : next);
  mode = next === 'workshop' ? 'learn' : next;
  if (next === 'workshop') workshop?.enter(); else workshop?.pause();
  overview?.pause(next !== 'learn');
  $('#agent-overview-host').hidden = next !== 'learn';
  $('#workshop-host').hidden = next !== 'workshop';
  $('#workshop-navigation').hidden = next !== 'workshop';
  $('#workshop-return').hidden = next !== 'explore' || !workshopReturn;
  lessonTheater?.pause(next !== 'explore' || paused); traceTheater?.pause(next !== 'lab' || paused);
  document.body.dataset.view = mode;
  if (matchMedia('(max-width:760px)').matches && next !== 'reference') $<HTMLDetailsElement>('#curriculum-disclosure').open = false;
  $('.skip-link').setAttribute('href', next === 'explore' ? '#lesson-reader' : next === 'workshop' ? '#workshop-entry' : `#${next}-view`);
  $('.skip-link').textContent = next === 'explore' ? 'Skip to lesson' : next === 'lab' ? 'Skip to failure lab' : next === 'workshop' ? 'Skip to workshop' : next === 'learn' ? 'Skip to overview' : 'Skip to field guide';
  if (next !== 'lab') stopRun();
  ['learn', 'explore', 'lab', 'reference'].forEach(id => { $(`#${id}-view`).hidden = id !== mode; });
  document.querySelectorAll<HTMLElement>('[data-mode]').forEach(button => { button.classList.toggle('active', button.dataset.mode === mode); button.setAttribute('aria-pressed', String(button.dataset.mode === mode)); });
  if (next === 'explore') scene?.select(current.component);
}
function chooseLesson(id: string, scroll = false, record = true) {
  if (record) visit(lessons.find(lesson => lesson.id === id)?.id || lessons[0].id);
  current = lessons.find(lesson => lesson.id === id) || lessons[0]; tab = 'essentials';
  setMode('explore', false); renderCurriculum(); renderLesson(); scene?.select(current.component);
  if (matchMedia('(max-width: 760px)').matches) $<HTMLDetailsElement>('#curriculum-disclosure').open = false;
  if (scroll) { $('#lesson-reader').scrollIntoView({ behavior: 'instant', block: 'start' }); $('#lesson-reader').focus({ preventScroll: true }); }
}
function renderLesson() {
  lessonTheater?.update(current);
  const index = lessons.indexOf(current);
  $('#lesson-position').textContent = `Lesson ${String(index + 1).padStart(2, '0')} of 18`;
  $('#lesson-title').textContent = current.title; $('#lesson-level').textContent = current.level;
  const component = components.find(item => item.id === current.component)!;
  $('#inspector-content').innerHTML = `<div class="inspector-symbol" style="--component-color:${component.color}">${icon(current.component === 'policy' ? 'eye' : 'layers', 25)}</div><span class="component-name">${component.title}</span><h2>${current.summary}</h2><p>${component.role}. Select the surrounding layers to trace how responsibility moves through the system.</p><div class="inspector-concepts">${current.concepts.slice(0, 3).map(concept => `<span>${concept}</span>`).join('')}</div><button id="begin-lesson" class="text-button">Read this lesson ${icon('arrow')}</button><div class="inspector-foot">${String(index + 1).padStart(2, '0')} / 18 <span>${current.group}</span></div>`;
  $<HTMLButtonElement>('#prev-lesson').disabled = index === 0;
  $('#next-lesson').innerHTML = index === lessons.length - 1 ? `Open failure lab ${icon('lab')}` : `Next lesson ${icon('arrow')}`;
  renderPanel();
}
function renderPanel() {
  lessonTheater?.setSection(tab as 'essentials' | 'deep' | 'check');
  if (tab !== 'check') { const visited = progress.visited[current.id] ||= []; if (!visited.includes(tab)) visited.push(tab); save(); }
  document.querySelectorAll<HTMLElement>('[data-tab]').forEach(button => { const isSelected = button.dataset.tab === tab; button.setAttribute('aria-selected', String(isSelected)); button.tabIndex = isSelected ? 0 : -1; });
  $('#lesson-panel').setAttribute('aria-labelledby', `tab-${tab}`);
  $('#check-indicator').textContent = ` ${current.questions.filter((question, i) => progress.answers[current.id]?.[i] === question.answer).length}/2`;
  const links = `<div class="lesson-sources"><span>Further reading</span>${current.sources.map(id => `<a href="${sources[id].url}" target="_blank" rel="noopener noreferrer">${sources[id].title} ${icon('arrow', 14)}</a>`).join('')}</div>`;
  if (tab === 'essentials') $('#lesson-panel').innerHTML = `<div class="lesson-columns"><div class="prose">${current.essentials.map(paragraph => `<p>${paragraph}</p>`).join('')}<div class="analogy"><h3>A useful analogy</h3><p>${current.analogy}</p></div></div><aside class="lesson-notes"><h3>Concepts in this lesson</h3><div class="concept-tags">${current.concepts.map(concept => `<span>${concept}</span>`).join('')}</div><h3>Watch for this</h3><p>${current.pitfall}</p><button class="text-button" data-next-tab="deep">Go deeper ${icon('arrow')}</button></aside></div>${links}`;
  if (tab === 'deep') $('#lesson-panel').innerHTML = `<div class="lesson-columns"><div class="prose">${current.deep.map((section, index) => `<section><h3>${section.title}</h3><p>${section.text}</p><button class="stage-section-link" data-stage-section="${index}">Inspect this section on the stage</button></section>`).join('')}</div><aside class="lesson-notes"><h3>Worked example</h3><pre><code>${escape(current.example)}</code></pre><p class="example-note">Conceptual example, not a production implementation.</p><button class="text-button" data-next-tab="check">Check understanding ${icon('arrow')}</button></aside></div>${links}`;
  if (tab === 'check') $('#lesson-panel').innerHTML = `<div class="quiz-intro"><p>Apply the ideas. Each answer includes an explanation; you can retry after reviewing it.</p></div>${current.questions.map((question, i) => {
    const chosen = progress.answers[current.id]?.[i]; const correct = chosen === question.answer;
    return `<fieldset class="question"><legend><span>${i + 1}.</span> ${question.prompt}</legend><div class="answer-options">${question.options.map((option, j) => `<button data-question="${i}" data-answer="${j}" class="answer ${chosen === j ? correct ? 'correct' : 'incorrect' : ''}" aria-pressed="${chosen === j}"><span class="answer-letter">${String.fromCharCode(65 + j)}</span>${option}${chosen === j && correct ? icon('check', 17) : ''}</button>`).join('')}</div><p class="answer-feedback ${correct ? 'correct' : ''}" aria-live="polite">${chosen !== undefined && chosen >= 0 ? `${correct ? 'Correct.' : 'Revisit the principle.'} ${question.explanation}` : ''}</p></fieldset>`;
  }).join('')}<p class="completion-rule">${lessonComplete(current) ? 'Lesson completed. Continue when you are ready.' : 'Completion requires opening Foundations and Deep dive, then answering both checks correctly.'}</p>`;
  $('#lesson-status').textContent = lessonComplete(current) ? 'Lesson completed' : 'Learning in progress'; updateProgress();
}
function renderReference() {
  const query = $<HTMLInputElement>('#concept-search').value.toLowerCase().trim();
  const entries = lessons.flatMap(lesson => lesson.concepts.map(concept => ({ concept, lesson }))).filter(item => `${item.concept} ${item.lesson.title}`.toLowerCase().includes(query)).sort((a, b) => a.concept.localeCompare(b.concept));
  $('#concept-index').innerHTML = entries.map(({ concept, lesson }) => `<button data-open-concept="${lesson.id}"><strong>${concept}</strong><span>${lesson.title} ${icon('chevron', 14)}</span></button>`).join('');
  $('#concept-empty').hidden = entries.length > 0;
}
function updateControls() {
  document.querySelectorAll<HTMLInputElement>('[data-control]').forEach(input => { input.checked = controls[input.dataset.control as keyof Pick<Controls, 'policy' | 'checkpoint' | 'idempotency' | 'verification'>]; });
  $<HTMLInputElement>('#context-budget').value = String(controls.contextBudget); $<HTMLInputElement>('#max-turns').value = String(controls.maxTurns);
  $('#context-output').textContent = `${controls.contextBudget}k tokens`; $('#turns-output').textContent = String(controls.maxTurns);
}
function selectScenario(id: string) {
  stopRun(); activeScenario = id; lastResult = undefined; runIndex = 0;
  const scenario = scenarios.find(item => item.id === id)!;
  controls = { ...defaults };
  if (id === 'injection') controls.policy = false;
  if (id === 'timeout') controls.idempotency = false;
  if (id === 'restart') controls.checkpoint = false;
  if (id === 'context') controls.contextBudget = 8;
  if (id === 'false-success') controls.verification = false;
  if (id === 'loop') controls.maxTurns = 12;
  updateControls();
  const relevant = ({ injection: 'policy', timeout: 'idempotency', restart: 'checkpoint', 'false-success': 'verification', context: 'context-budget', loop: 'max-turns' } as Record<string,string>)[id];
  document.querySelectorAll<HTMLInputElement>('[data-control]').forEach(input => { input.closest<HTMLElement>('label')!.hidden = input.dataset.control !== relevant; });
  for (const range of ['context-budget', 'max-turns']) { $(`#${range}`).hidden = relevant !== range; $(`label[for="${range}"]`).hidden = relevant !== range; }
  $('#scenario-title').textContent = scenario.title; $('#scenario-description').textContent = scenario.description; $('#scenario-concept').textContent = scenario.concept;
  document.querySelectorAll<HTMLElement>('[data-scenario]').forEach(button => { button.classList.toggle('active', button.dataset.scenario === id); button.setAttribute('aria-pressed', String(button.dataset.scenario === id)); });
  $('#trace-events').innerHTML = '<li class="trace-empty">Start with the failing configuration. Then change the relevant control and compare the trace.</li>';
  traceTheater?.update([], id);
  $('#trace-outcome').innerHTML = ''; $('#trace-status').textContent = 'Ready'; $('#related-lesson').hidden = true;
}
function stopRun() {
  if (runTimer) clearInterval(runTimer); runTimer = undefined;
  $<HTMLButtonElement>('#run-simulation').disabled = false; $<HTMLButtonElement>('#stop-simulation').disabled = true;
  if (lastResult && runIndex < lastResult.events.length && runIndex > 0) $('#trace-status').textContent = 'Paused';
}
function revealTrace() { const panel = $('.trace-panel'); const box = panel.getBoundingClientRect(); if (box.top < 100 || box.top > innerHeight / 2) panel.scrollIntoView({ block: 'start', behavior: 'instant' }); }
function startRun() {
  stopRun(); runSnapshot = { ...controls }; lastResult = simulate(activeScenario, runSnapshot); runIndex = 0;
  $('#trace-events').innerHTML = ''; $('#trace-outcome').innerHTML = ''; $('#related-lesson').hidden = true; $('#trace-status').textContent = 'Running';
}
function stepRun() {
  if (!lastResult || runIndex >= lastResult.events.length) startRun();
  const event = lastResult!.events[runIndex++];
  const node = document.createElement('li'); node.className = `trace-event ${event.status}`;
  node.innerHTML = `<span class="trace-sequence">${String(runIndex).padStart(2, '0')}</span><div><strong>${event.title}</strong><p>${event.detail}</p></div><span class="trace-state">${event.status === 'ok' ? 'Recorded' : event.status === 'warn' ? 'Observe' : 'Failure'}</span>`;
  $('#trace-events').append(node); $('#trace-events').scrollTop = $('#trace-events').scrollHeight; scene?.pulse(event.component, event.status === 'fail');
  traceTheater?.update(lastResult!.events.slice(0, runIndex), activeScenario);
  if (runIndex === lastResult!.events.length) finishRun();
}
function finishRun() {
  stopRun(); const result = lastResult!;
  $('#trace-status').textContent = result.contained ? 'Control effective' : 'Failure observed';
  $('#trace-outcome').innerHTML = `<div class="outcome ${result.contained ? 'contained' : 'failed'}"><strong>${result.outcome}</strong><p>${scenarios.find(item => item.id === activeScenario)!.correction}</p><small>Configuration snapshot: ${runSnapshot!.contextBudget}k capacity; ${runSnapshot!.maxTurns} turns. Only the selected scenario’s relevant controls determine its outcome.</small></div>`;
  $('#related-lesson').hidden = false;
  const runs = progress.labs[activeScenario] ||= []; const outcome = result.contained ? 'contained' : 'failed'; if (!runs.includes(outcome)) runs.push(outcome); save();
}
function controlsChanged() {
  stopRun(); lastResult = undefined; runIndex = 0; updateControls();
  $('#trace-events').innerHTML = '<li class="trace-empty">Configuration changed. Run or step to observe a new trace.</li>'; traceTheater?.update([], activeScenario);
  $('#trace-status').textContent = 'Configuration changed'; $('#trace-outcome').innerHTML = '<p class="configuration-note">Run again to inspect this configuration. The previous trace belongs to the previous run.</p>';
}
function exportProgress() {
  const report = { course: 'Odin Labs — Harness engineering', version: 1, exportedAt: new Date().toISOString(), scope: 'Local self-assessment of authored curriculum; not certification or proof of exhaustive mastery.', lessons: lessons.map(lesson => ({ id: lesson.id, title: lesson.title, concepts: lesson.concepts, sectionsOpened: progress.visited[lesson.id] || [], checksPassed: lesson.questions.map((question, i) => progress.answers[lesson.id]?.[i] === question.answer), complete: lessonComplete(lesson) })), experiments: scenarios.map(scenario => ({ id: scenario.id, outcomesObserved: progress.labs[scenario.id] || [], complete: labComplete(scenario.id) })) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'odin-harness-learning-record.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Learning record exported. It records checks and experiments completed in this browser.');
}

document.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLElement>('button'); if (!button) return;
  if (button.dataset.mode) { setMode(button.dataset.mode); const target = mode === 'explore' ? $('#lesson-reader') : $(`#${mode}-view`); target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  if (button.dataset.lesson) chooseLesson(button.dataset.lesson, true);
  if (button.dataset.openConcept) chooseLesson(button.dataset.openConcept, true);
  if (button.dataset.tab || button.dataset.nextTab) { tab = button.dataset.tab || button.dataset.nextTab!; renderPanel(); saveJourney(); if (button.dataset.nextTab) $(`#tab-${tab}`).focus(); }
  if (button.dataset.question !== undefined) {
    const index = Number(button.dataset.question); const answer = Number(button.dataset.answer);
    const answers = progress.answers[current.id] ||= [-1, -1]; answers[index] = answer; save(); renderPanel();
    $(`[data-question="${index}"][data-answer="${answer}"]`).focus({ preventScroll: true });
    const feedback = document.querySelectorAll<HTMLElement>('.answer-feedback')[index]; if (feedback.getBoundingClientRect().bottom > innerHeight) feedback.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  if (button.dataset.scenario) selectScenario(button.dataset.scenario);
  if (button.dataset.stageSection !== undefined) { lessonTheater.setSection('deep', Number(button.dataset.stageSection)); $('#lesson-theater').scrollIntoView({ behavior: paused ? 'instant' : 'smooth', block: 'start' }); }
  switch (button.id) {
    case 'begin-lesson': $('#lesson-reader').scrollIntoView({ behavior: paused ? 'instant' : 'smooth' }); $('#lesson-reader').focus({ preventScroll: true }); break;
    case 'prev-lesson': chooseLesson(lessons[Math.max(0, lessons.indexOf(current) - 1)].id, true); break;
    case 'next-lesson': if (current.id === 'capstone') { setMode('lab'); $('#lab-view').scrollIntoView(); } else chooseLesson(lessons[lessons.indexOf(current) + 1].id, true); break;
    case 'toggle-motion': paused = !paused; scene?.pause(paused); button.innerHTML = icon(paused ? 'play' : 'pause'); button.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation'); break;
    case 'toggle-explode': expanded = !expanded; scene?.explode(expanded); button.setAttribute('aria-pressed', String(expanded)); button.setAttribute('aria-label', expanded ? 'Assemble layers' : 'Explode layers'); break;
    case 'reset-view': scene?.reset(); break;
    case 'run-simulation': startRun(); $<HTMLButtonElement>('#run-simulation').disabled = true; $<HTMLButtonElement>('#stop-simulation').disabled = false; stepRun(); if (runIndex < lastResult!.events.length) runTimer = setInterval(stepRun, paused ? 120 : 520); revealTrace(); break;
    case 'step-simulation': stopRun(); stepRun(); revealTrace(); break;
    case 'stop-simulation': stopRun(); break;
    case 'related-lesson': if (lastResult) chooseLesson(lastResult.lesson, true); break;
    case 'export-progress': case 'export-completion': exportProgress(); break;
    case 'reset-progress':
      if (button.dataset.confirm !== 'yes') { button.dataset.confirm = 'yes'; button.textContent = 'Confirm reset of local progress'; setTimeout(() => { button.dataset.confirm = ''; button.textContent = 'Reset progress'; }, 7000); }
      else { progress = { visited: {}, answers: {}, labs: {} }; save(); renderCurriculum(); renderPanel(); button.dataset.confirm = ''; button.textContent = 'Reset progress'; notify('Local progress reset. The current lesson section is open.'); }
      break;
  }
});
$('.brand').addEventListener('click', event => { event.preventDefault(); setMode('learn'); window.scrollTo({ top: 0, behavior: 'instant' }); });
$('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const target = document.getElementById($('.skip-link').getAttribute('href')!.slice(1));
  if (target) { target.tabIndex = -1; target.scrollIntoView({ block: 'start', behavior: 'instant' }); target.focus({ preventScroll: true }); }
});
$('.lesson-tabs').addEventListener('keydown', event => {
  const key = (event as KeyboardEvent).key; const tabs = ['essentials', 'deep', 'check'];
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return; event.preventDefault();
  tab = key === 'Home' ? tabs[0] : key === 'End' ? tabs[2] : tabs[(tabs.indexOf(tab) + (key === 'ArrowRight' ? 1 : 2)) % 3]; renderPanel(); saveJourney(); $(`#tab-${tab}`).focus();
});
$('#lesson-search').addEventListener('input', renderCurriculum); $('#concept-search').addEventListener('input', renderReference);
document.querySelectorAll<HTMLInputElement>('[data-control]').forEach(input => input.addEventListener('change', () => { controls[input.dataset.control as keyof Pick<Controls, 'policy' | 'checkpoint' | 'idempotency' | 'verification'>] = input.checked; controlsChanged(); }));
$('#context-budget').addEventListener('input', event => { controls.contextBudget = Number((event.target as HTMLInputElement).value); controlsChanged(); });
$('#max-turns').addEventListener('input', event => { controls.maxTurns = Number((event.target as HTMLInputElement).value); controlsChanged(); });
const probabilityChanged = () => {
  const p = Number($<HTMLInputElement>('#success-rate').value) / 100; const k = Number($<HTMLInputElement>('#attempts').value);
  $('#success-output').textContent = `${Math.round(p * 100)}%`; $('#attempts-output').textContent = String(k);
  const at = (1 - (1 - p) ** k) * 100, all = p ** k * 100;
  $('#pass-at').textContent = `${at.toFixed(1)}%`; $('#pass-all').textContent = `${all.toFixed(1)}%`;
  $<HTMLProgressElement>('#pass-at-bar').value = at; $<HTMLProgressElement>('#pass-all-bar').value = all;
};
$('#success-rate').addEventListener('input', probabilityChanged); $('#attempts').addEventListener('input', probabilityChanged);
function route() {
  const raw = location.hash.slice(1) === 'workspace' ? 'reference' : location.hash.slice(1);
  const id = ['learn', 'workshop', 'lab', 'reference'].includes(raw) || lessons.some(lesson => lesson.id === raw) ? raw : 'learn';
  const state = history.state as JourneyState | null;
  restoringJourney = true;
  destination = id; workshopReturn = state?.odin && state.documentId === journeyDocument ? state.workshopReturn : undefined;
  if (['learn', 'workshop', 'lab', 'reference'].includes(id)) setMode(id, false);
  else { chooseLesson(id, false, false); if (state?.odin && ['essentials', 'deep', 'check'].includes(state.tab)) { tab = state.tab; renderPanel(); } }
  window.scrollTo({ top: state?.odin ? state.scrollY : 0, behavior: 'instant' });
  if (state?.odin && state.focusId) document.getElementById(state.focusId)?.focus({ preventScroll: true });
  restoringJourney = false; saveJourney();
}
window.addEventListener('popstate', route);
window.addEventListener('hashchange', () => { if (location.hash !== `#${destination}`) route(); });
let journeySaveTimer: ReturnType<typeof setTimeout> | undefined;
window.addEventListener('scroll', () => { clearTimeout(journeySaveTimer); journeySaveTimer = setTimeout(saveJourney, 150); }, { passive: true });
const media = matchMedia('(prefers-reduced-motion: reduce)');
media.addEventListener('change', event => { paused = event.matches; scene?.pause(paused); $('#toggle-motion').innerHTML = icon(paused ? 'play' : 'pause'); $('#toggle-motion').setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation'); });
function fallback() {
  scene?.dispose(); scene = undefined;
  $('#scene-host').hidden = true; $('#scene-fallback').hidden = false; $('#engine-state').textContent = 'Accessible component map';
  $('.fallback-components').innerHTML = components.map(component => `<button data-fallback="${component.id}" class="secondary">${component.title}</button>`).join('');
  document.querySelectorAll<HTMLElement>('[data-fallback]').forEach(button => button.addEventListener('click', () => selectComponent(button.dataset.fallback as Component)));
  document.querySelectorAll<HTMLButtonElement>('.scene-tools button').forEach(button => { button.disabled = true; });
  $('.orbit-hint').textContent = 'Select a component to investigate.';
}
function selectComponent(id: Component) { chooseLesson(components.find(component => component.id === id)!.lesson); }
const reader = $('#lesson-reader'), lessonHost = $('#lesson-theater');
$('#explore-view').prepend(reader);
const returnToWorkshop = document.createElement('div'); returnToWorkshop.id = 'workshop-return'; returnToWorkshop.className = 'workshop-return'; returnToWorkshop.hidden = true;
returnToWorkshop.innerHTML = '<button class="text-button" id="return-to-workshop">← Return to your workshop</button><span>Your experiment is saved while you read.</span>';
reader.prepend(returnToWorkshop);
$('#return-to-workshop').addEventListener('click', () => {
  const point = workshopReturn;
  setMode('workshop');
  if (point) { window.scrollTo({ top: point.scrollY, behavior: 'instant' }); document.getElementById(point.focusId || 'workshop-entry')?.focus({ preventScroll: true }); }
  else $('#workshop-entry').focus();
  saveJourney();
});
const workshopNavigation = document.createElement('nav'); workshopNavigation.id = 'workshop-navigation'; workshopNavigation.className = 'workshop-navigation'; workshopNavigation.setAttribute('aria-label', 'Workshop navigation');
workshopNavigation.innerHTML = '<button class="workshop-link" id="workshop-overview">← Back to the agent overview</button><span>Hands-on workshop</span>';
$('#workshop-host').before(workshopNavigation);
$('#workshop-overview').addEventListener('click', () => { setMode('learn'); window.scrollTo({ top: 0, behavior: 'instant' }); $('#agent-overview-title').focus({ preventScroll: true }); });
const showStage = document.createElement('button'); showStage.className = 'secondary open-lesson-stage'; showStage.textContent = 'Open this lesson’s 3D walkthrough'; showStage.addEventListener('click', () => lessonHost.scrollIntoView({ block: 'start', behavior: 'instant' })); reader.append(showStage);
const backToReader = document.createElement('button'); backToReader.className = 'text-button'; backToReader.textContent = 'Back to lesson and checks'; backToReader.addEventListener('click', () => { reader.scrollIntoView({ block: 'start', behavior: 'instant' }); reader.focus({ preventScroll: true }); }); lessonHost.before(backToReader);
$('.lab-grid').after($('#lab-theater'));
const backToLab = document.createElement('button'); backToLab.className = 'text-button'; backToLab.textContent = 'Back to experiment controls'; backToLab.addEventListener('click', () => $('.lab-grid').scrollIntoView({ block: 'start', behavior: 'instant' })); $('#lab-theater').before(backToLab);
$('.trace-header').after($('#trace-outcome'));
$('.trace-panel').prepend($('.run-actions'));
const inspectTrace = document.createElement('button'); inspectTrace.className = 'text-button'; inspectTrace.textContent = 'Inspect the current event in 3D'; inspectTrace.addEventListener('click', () => $('#lab-theater').scrollIntoView({ block: 'start', behavior: 'instant' })); $('.trace-panel').append(inspectTrace);
const workshop = mountWorkshop($('#workshop-host'), id => chooseLesson(id, true));
const overview = mountAgentOverview($('#agent-overview-host'), id => chooseLesson(id, true), () => { setMode('workshop'); window.scrollTo({ top: 0, behavior: 'instant' }); $('#workshop-entry').focus({ preventScroll: true }); });
const lessonTheater = mountLessonTheater($('#lesson-theater'), current);
const traceTheater = mountTraceTheater($('#lab-theater'));
renderCurriculum(); renderLesson(); renderReference(); selectScenario(activeScenario);
route();
if (matchMedia('(max-width: 760px)').matches) $<HTMLDetailsElement>('#curriculum-disclosure').open = false;
import('./scene').then(module => {
  try { scene = module.createScene($('#scene-host'), selectComponent, fallback); scene.select(current.component); $('#scene-loading').remove(); $('#engine-state').textContent = 'Interactive 3D'; }
  catch { fallback(); }
}).catch(fallback);
window.addEventListener('pagehide', () => { stopRun(); scene?.dispose(); workshop.dispose(); overview.dispose(); lessonTheater.dispose(); traceTheater.dispose(); });
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
// Keep the current view explicit for debugging without exposing a privileged runtime.
document.body.dataset.view = mode;
