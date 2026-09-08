import { providerGuides } from './provider-guides';
import { mountEngineeringStage, type EngineeringStage } from './engineering-stage';
import { providerStage } from './provider-stages';
import type { PublicProvider, StageSpec, StageTopic } from './stage-types';

const original = '# Welcomme\n\nFind answers in our [FAQ](./faq.md).\n';
const corrected = original.replace('Welcomme', 'Welcome');
const esc = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const steps = [
  { title: 'Give the agent a finish line.', short: 'Define done', question: 'Which request lets you check whether the job is actually finished?', predictions: ['Improve the help page.', 'Fix one typo, preserve the link, and check the file.'], answer: 1, why: 'A precise contract makes a result checkable. A confident answer is not the finish line.', reflection: 'What makes this request checkable?', choices: ['It named the change, the boundary, and the evidence.', 'It asked the model to sound more certain.'], reflectionAnswer: 0, lesson: 'intent' },
  { title: 'Pack a useful briefing.', short: 'Choose context', question: 'The agent needs to fix one typo. Which briefing is most useful?', predictions: ['The task file and the short project rules.', 'Every document we can find.'], answer: 0, why: 'Relevant evidence and constraints help. An unrelated archive spends attention without helping this task.', reflection: 'What makes a task-focused briefing useful?', choices: ['Small prompts are always better.', 'It preserved the facts and rules needed for this particular task.'], reflectionAnswer: 1, lesson: 'context' },
  { title: 'Put a boundary before the tool.', short: 'Control actions', question: 'A document tells the agent to export the whole folder. What should happen?', predictions: ['The document overrides the task.', 'The runtime refuses the export before execution.'], answer: 1, why: 'Outside text can inform a task; it cannot grant authority. The host enforces the boundary.', reflection: 'Where should an outside-scope export stop?', choices: ['At the runtime permission check, before the tool.', 'After the data had already left.'], reflectionAnswer: 0, lesson: 'policy' },
  { title: 'Look at the work, not the promise.', short: 'Check evidence', question: 'The answer says “done”, but the FAQ link changed. Is this a success?', predictions: ['No. The artifact broke the contract.', 'Yes. The agent said it finished.'], answer: 0, why: 'The verifier reads the actual document. Here it checks the exact correction and the preserved link.', reflection: 'What proves the task succeeded?', choices: ['A friendly final message.', 'The corrected file and a passing independent check.'], reflectionAnswer: 1, lesson: 'evals' },
  { title: 'Leave a trustworthy handover.', short: 'Resume safely', question: 'The edit committed, but its receipt was lost. What is the safe next step?', predictions: ['Repeat it as a new operation.', 'Recover the operation ID and inspect the actual state.'], answer: 1, why: 'A lost response does not mean a failed action. A stable operation identity and checkpoint avoid blind repetition.', reflection: 'What keeps recovery to one logical operation?', choices: ['The same operation identity was reconciled instead of creating a new one.', 'Crashes can never cause duplicates.'], reflectionAnswer: 0, lesson: 'recovery' },
];
type Saved = { completed: number[]; provider: string; step: number };
const key = 'odin-harness-workshop-v2';

export function mountWorkshop(host: HTMLElement, openLesson: (id: string) => void) {
  let saved: Saved = { completed: [], provider: 'codex', step: 0 };
  let persistent = true;
  try { const p = JSON.parse(localStorage.getItem(key) || 'null'); if (p && typeof p === 'object') { saved.completed = Array.isArray(p.completed) ? [...new Set<number>(p.completed.filter((v: unknown) => Number.isInteger(v) && Number(v) >= 0 && Number(v) < steps.length))] : []; saved.provider = providerGuides.some(v => v.id === p.provider && !v.internal) ? p.provider : 'codex'; saved.step = Number.isInteger(p.step) ? Math.max(0, Math.min(p.step, 4, saved.completed.length)) : 0; } } catch { persistent = false; }
  let prediction: number | null = null, reflection: number | null = null, ran = false, passed = false;
  let scene: EngineeringStage | undefined;
  let sceneOpen = false, active = false;
  let currentDocument = original;
  let runCount = 0;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let actionChoice = 'broad';
  let selectedContext = new Set<string>(['help', 'archive']);
  let narration: SpeechSynthesisUtterance | undefined;
  let mediaObserver: MutationObserver | undefined;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => host.querySelector<T>(selector)!;
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(saved)); } catch { persistent = false; } };
  const resultText = () => get('#workshop-result')?.innerText || '';
  function model(): StageSpec {
    const topic = (['contract', 'context', 'permissions', 'verification', 'recovery'] as StageTopic[])[saved.step];
    const spec = providerStage(saved.provider as PublicProvider, topic);
    if (ran) {
      const asset = (['editor', 'context-stack', 'permission-gate', 'test-rig', 'session-tree'] as const)[saved.step];
      const denied = saved.step === 2 ? spec.frames.find(frame => Object.values(frame.states || {}).includes('blocked'))?.focus[0] : undefined;
      const focus = spec.nodes.find(node => node.id === denied) || spec.nodes.find(node => node.asset === asset) || spec.nodes.at(-1)!;
      const states: NonNullable<StageSpec['frames'][number]['states']> = { [focus.id]: passed ? 'passed' : 'blocked' };
      spec.frames.push({ id: 'workshop-observation', title: resultText().split('\n')[0], explanation: `${resultText()} This is the local workshop fixture. The provider walkthrough explains where an equivalent concern belongs; no provider session was executed.`, focus: [focus.id], route: [focus.id], states, code: { file: 'help.md', language: 'Markdown', text: currentDocument, highlight: [1, 3], provenance: 'Workshop file' } });
    }
    return spec;
  }
  function paintScene() { const spec = model(); scene?.update(spec, ran ? spec.frames.length - 1 : 0); }
  function createScene() { scene?.dispose(); scene = mountEngineeringStage(get('#workshop-scene'), model(), true); scene.pause(paused || !sceneOpen || !active); }
  function stopNarration() { if ('speechSynthesis' in window) speechSynthesis.cancel(); narration = undefined; const button = get<HTMLButtonElement>('#narrate-workshop'); if (button) button.textContent = 'Listen to this step'; }
  function render() {
    stopNarration(); sceneOpen = false;
    const step = steps[saved.step]; const provider = providerGuides.find(v => v.id === saved.provider)!;
    host.innerHTML = `<div class="workshop-welcome"><div><h2 id="workshop-entry" tabindex="-1">Make your first agent loop click.</h2><p class="workshop-task-brief">Change <code>Welcomme</code> to <code>Welcome</code> in a help document. Preserve its FAQ link.</p><span class="rehearsal-label">Browser rehearsal · no account needed</span><details class="workshop-about"><summary>About this workshop</summary><p class="workshop-introduction">One small job. Five discoveries.<br/>Learn by changing something and seeing why it works.</p><div class="workshop-mission"><span>Your mission</span><strong>Fix a typo. <br/>Keep the promise.</strong></div></details></div></div>
      <details id="workshop-steps-disclosure" class="workshop-steps-disclosure"><summary>Step ${saved.step + 1} of 5 · ${step.short}<span>All discoveries</span></summary><nav class="workshop-steps" aria-label="Workshop steps">${steps.map((s, i) => `<button data-workshop-step="${i}" ${i > saved.completed.length ? 'disabled' : ''} aria-current="${i === saved.step ? 'step' : 'false'}"><span>${i + 1}</span>${s.short}${saved.completed.includes(i) ? '<small>Completed</small>' : ''}</button>`).join('')}</nav></details>
      <div class="workshop-heading"><div><h2>${step.title}</h2></div><button id="narrate-workshop" class="workshop-link">Listen to this step</button></div>
      <div class="stage-provider-select"><label for="stage-provider">Inspect a harness</label><select id="stage-provider">${providerGuides.map(p => `<option value="${p.id}" ${p.id === saved.provider ? 'selected' : ''}>${p.name}${p.internal ? ' · Sign in' : ''}</option>`).join('')}</select><p>Select a runtime to inspect its ecosystem, code and execution boundaries.</p></div>
      <div class="workshop-stage">
      <div class="workshop-task ${saved.step === 0 ? 'workshop-request-task' : ''}"><fieldset class="prediction"><legend>${saved.step === 0 ? 'Choose a request to test.' : 'First, make a prediction.'}</legend><p>${step.question}</p>${step.predictions.map((option, i) => `<button data-prediction="${i}" aria-pressed="${prediction === i}" class="choice ${prediction === i ? 'chosen' : ''}">${option}</button>`).join('')}</fieldset><p id="prediction-feedback" class="workshop-feedback" aria-live="polite">${prediction === null ? 'A prediction helps you notice what changes.' : prediction === step.answer ? 'That is the right hypothesis. Test it below.' : 'Keep that prediction in mind. The evidence will let you revise it.'}</p><div id="workshop-action">${actionHTML()}</div><button id="run-workshop" class="workshop-primary" ${prediction === null ? 'disabled' : ''}>${['Run this request', 'Assemble the briefing', 'Run the proposed action', 'Check the actual file', 'Restart and reconcile'][saved.step]}</button><p class="fixture-note">This is a deterministic teaching fixture, not a prediction of model behavior. It does not run ${provider.name}.</p></div><div class="workshop-visual"><div class="stage-label"><span>${['The agent loop', 'The context desk', 'The permission boundary', 'The evidence bench', 'The handover bridge'][saved.step]}</span><div><button id="workshop-capture">Save image</button></div></div><div id="workshop-scene"></div><p id="scene-explanation" class="scene-explanation" role="status"></p></div></div>
      <div class="workshop-evidence"><div><h3>What actually happened</h3><div id="workshop-result" role="status">Run the step to inspect its result. A claim and a check are different things.</div></div><div class="artifact-pane"><div><span>help.md</span><span id="artifact-state">${ran ? 'After this run' : 'Starting document'}</span></div><pre id="workshop-document">${esc(currentDocument)}</pre></div></div>
      <section id="workshop-reflection" class="workshop-reflection" ${!passed ? 'hidden' : ''}><div><h3>Now connect the idea.</h3><p>${step.why}</p><button class="workshop-link" id="workshop-deeper">Open the engineering lesson</button></div><fieldset><legend>${step.reflection}</legend>${step.choices.map((option, i) => `<button data-reflection="${i}" class="choice" aria-pressed="false">${option}</button>`).join('')}<p id="reflection-feedback" aria-live="polite"></p></fieldset></section>
      <div class="workshop-footer"><p id="workshop-progress">${saved.completed.length} / 5 discoveries completed. ${persistent ? 'Saved on this device.' : 'Storage unavailable; keep this tab open.'}</p><button id="workshop-next" class="workshop-primary" ${!saved.completed.includes(saved.step) ? 'disabled' : ''}>${saved.step === 4 ? 'Take it into your own agent' : 'Next discovery'}</button></div>
      <section class="provider-transfer" id="provider-transfer"><div class="transfer-intro"><h2>Same idea.<br/>Your own agent.</h2><p>Take the small project into a real tool. Follow the same change from instruction to evidence.</p><button id="download-workshop" class="workshop-primary">Download the starter project</button><p id="download-status" role="status"></p></div><div class="provider-guidance"><div class="provider-tabs" role="group" aria-label="Choose your agent">${providerGuides.map(p => `<button data-provider="${p.id}" aria-pressed="${p.id === provider.id}" class="${p.id === provider.id ? 'active' : ''}">${p.name}${p.internal ? ' · Private' : ''}</button>`).join('')}</div><div id="provider-content">${providerHTML()}</div></div></section>
      <div class="workshop-reset"><button id="reset-workshop" class="workshop-link">Start this workshop again</button><span>Want the full system? Open Lessons, Experiments or Reference above.</span></div>`;
    const task = get('.workshop-task'), predictionGroup = document.createElement('div'), configureGroup = document.createElement('div');
    predictionGroup.className = 'workshop-predict'; configureGroup.className = 'workshop-configure';
    predictionGroup.append(get('.prediction'), get('#prediction-feedback')); configureGroup.append(get('#workshop-action'), get('#run-workshop'), get('.fixture-note')); task.replaceChildren(predictionGroup, configureGroup);
    get('.stage-label').append(get('#scene-explanation'));
    const narrationStatus = document.createElement('p'); narrationStatus.id = 'narration-status'; narrationStatus.setAttribute('role', 'status'); get('.workshop-heading').append(narrationStatus);
    const visual = get('.workshop-visual'), evidence = get('.workshop-evidence'), reflectionPanel = get('#workshop-reflection'), footer = get('.workshop-footer');
    evidence.tabIndex = -1; get('.workshop-task').tabIndex = -1; visual.id = 'workshop-inspection'; visual.tabIndex = -1; visual.hidden = true;
    const inspectionHeader = document.createElement('div'); inspectionHeader.className = 'workshop-inspection-header';
    inspectionHeader.innerHTML = '<h3>Inspect this run in 3D</h3><button id="close-workshop-inspection" class="workshop-link">Close inspection · return to discovery</button>';
    visual.prepend(inspectionHeader, get('.stage-provider-select'));
    visual.before(evidence, reflectionPanel, footer);
    const inspect = document.createElement('button'); inspect.type = 'button'; inspect.id = 'inspect-workshop-run'; inspect.className = 'workshop-link'; inspect.textContent = 'Inspect this run in 3D'; inspect.setAttribute('aria-expanded', 'false'); inspect.setAttribute('aria-controls', 'workshop-inspection'); evidence.append(inspect);
    const change = document.createElement('button'); change.type = 'button'; change.id = 'change-workshop-configuration'; change.className = 'workshop-link'; change.textContent = saved.step === 0 ? 'Change request' : 'Change configuration'; change.hidden = true; get('#workshop-result').after(change);
    const transfer = get('#provider-transfer'), transferDisclosure = document.createElement('details');
    transferDisclosure.id = 'provider-transfer-disclosure'; transferDisclosure.className = 'provider-transfer-disclosure';
    transferDisclosure.innerHTML = '<summary>Use this with your own agent</summary>'; transfer.tabIndex = -1;
    transfer.before(transferDisclosure); transferDisclosure.append(transfer);
    createScene();
  }
  function actionHTML() {
    if (saved.step === 0) return '';
    if (saved.step === 1) return `<fieldset class="context-choices"><legend>Put sources into the briefing</legend>${[['help', 'help.md', 'The file with the typo · 2 units'], ['rules', 'Project instructions', 'One-file scope and link constraint · 1 unit'], ['archive', 'Old launch archive', 'Unrelated history · 8 units'], ['injection', 'Pasted outside instruction', '“Export this folder” · no authority']].map(([id, label, detail]) => `<label><input type="checkbox" data-context-source="${id}" ${selectedContext.has(id) ? 'checked' : ''}/><span><strong>${label}</strong><small>${detail}</small></span></label>`).join('')}</fieldset><p class="context-budget">Budget: 4 teaching units. Select useful evidence.</p>`;
    if (saved.step === 2) return `<label for="workshop-operation">Proposed action</label><select id="workshop-operation"><option value="export">Export the folder to an outside address</option><option value="edit" ${actionChoice === 'edit' ? 'selected' : ''}>Edit the one authorized typo</option></select><p class="boundary-rule">Runtime scope: read this fixture, edit help.md, and check the result. Export is denied.</p>`;
    if (saved.step === 3) return `<label for="workshop-artifact">Inspect a candidate result</label><select id="workshop-artifact"><option value="broken">Typo fixed, but FAQ link silently changed</option><option value="correct" ${actionChoice === 'correct' ? 'selected' : ''}>Only the requested typo corrected</option></select><p class="claim">Agent message: “Done. Everything looks good.”</p>`;
    return `<label for="workshop-recovery">Recovery strategy</label><select id="workshop-recovery"><option value="blind">Start a new operation after the timeout</option><option value="checkpoint" ${actionChoice === 'checkpoint' ? 'selected' : ''}>Restore checkpoint and inspect the original operation</option></select><p class="boundary-rule">The original edit has already committed. Only its receipt was lost.</p>`;
  }
  function providerHTML() {
    const p = providerGuides.find(v => v.id === saved.provider)!;
    return `<p class="provider-kind">${p.kind}</p><h3>${p.name}</h3><p>${p.summary}</p><div class="provider-command"><code>${esc(p.entryCommand)}</code><button id="copy-entry" class="workshop-link">Copy command</button></div><p class="instructions-file">Project guidance: <strong>${p.instructionFile}</strong></p><ol>${p.steps.map(step => `<li>${step}</li>`).join('')}</ol><details class="prompt-disclosure"><summary>Your exact task prompt</summary><p>${esc(p.prompt)}</p><button id="copy-prompt" class="workshop-link">Copy task prompt</button></details><h4>What to look for</h4><ul>${p.expectedEvidence.map(item => `<li>${item}</li>`).join('')}</ul><div class="provider-sources">${p.source.map(source => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title} ↗</a>`).join('')}</div><p class="source-date">Primary sources reviewed 7 September 2026. Use each tool’s current setup guide.</p>`;
  }
  function run() {
    if (prediction === null) return;
    stopNarration(); ran = true; reflection = null; runCount++;
    let title = '', detail = '';
    if (saved.step === 0) { passed = actionChoice === 'scoped'; currentDocument = passed ? corrected : original; title = passed ? 'A testable finish line is now attached.' : 'The request has no reliable acceptance test.'; detail = passed ? 'Scope: help.md only. Change: one typo. Invariant: FAQ link preserved. Evidence: exact file check.' : '“Improve” leaves both the intended change and permitted side effects undefined. Try the request that names the exact result.'; }
    if (saved.step === 1) { const used = (selectedContext.has('help') ? 2 : 0) + (selectedContext.has('rules') ? 1 : 0) + (selectedContext.has('archive') ? 8 : 0) + (selectedContext.has('injection') ? 1 : 0); passed = selectedContext.has('help') && selectedContext.has('rules') && !selectedContext.has('injection') && used <= 4; title = passed ? 'The briefing fits and contains what matters.' : 'This briefing is not ready for the task.'; detail = `${used} / 4 teaching units used. ${!selectedContext.has('rules') ? 'The preservation rule is missing. ' : ''}${!selectedContext.has('help') ? 'The target document is missing. ' : ''}${used > 4 ? 'The unrelated archive crowds out the budget. ' : ''}${selectedContext.has('injection') ? 'The outside command is irrelevant to the typo task and supplies no authority; omit it here. Needed source material would still be treated as data, never permission. ' : ''}${passed ? 'The file and rule travel together to the model.' : 'Change the sources and run again.'}`; }
    if (saved.step === 2) { actionChoice = get<HTMLSelectElement>('#workshop-operation').value; passed = actionChoice === 'edit'; currentDocument = passed ? corrected : original; title = passed ? 'One authorized edit executed.' : 'Export denied before execution.'; detail = passed ? 'The runtime matched the proposed edit to the allowed file and operation. The corrected document is below.' : 'No export occurred. Containment worked; the requested typo repair is still incomplete. Try the authorized edit to finish the task.'; }
    if (saved.step === 3) { actionChoice = get<HTMLSelectElement>('#workshop-artifact').value; currentDocument = actionChoice === 'correct' ? corrected : corrected.replace('./faq.md', './missing.md'); passed = currentDocument === corrected; title = passed ? 'PASS: the artifact meets the contract.' : 'FAIL: the link changed despite the success claim.'; detail = `Actual document check: ${currentDocument.startsWith('# Welcome') ? 'heading corrected' : 'heading wrong'}; ${currentDocument.includes('[FAQ](./faq.md)') ? 'FAQ link preserved' : 'FAQ link broken'}; ${passed ? 'all other characters preserved.' : 'unexpected change detected. Choose the scoped correction and recheck.'}`; }
    if (saved.step === 4) { actionChoice = get<HTMLSelectElement>('#workshop-recovery').value; passed = actionChoice === 'checkpoint'; currentDocument = corrected; const operations = new Map([['edit-001', 'committed']]); if (!passed) operations.set(`new-${runCount}`, 'committed'); title = passed ? 'Recovered: one logical operation, with evidence.' : 'Two operation records for one intended edit.'; detail = passed ? 'Checkpoint restored edit-001. The receiver returned its existing receipt. The actual file still passes. One logical operation remains.' : `${operations.size} operation records now exist in this fixture. The unchanged final text hides a duplicate attempt; other tools could duplicate a business effect. Restore the original identity instead.`; }
    get('#workshop-result').innerHTML = `<strong class="${passed ? 'result-pass' : 'result-fail'}">${title}</strong><p>${detail}</p><small>Observed run ${runCount}. ${passed ? 'Now explain the result below.' : 'Change the control and try again.'}</small>`;
    get('#workshop-document').textContent = currentDocument; get('#artifact-state').textContent = 'Observed artifact';
    get('#workshop-reflection').hidden = !passed; get('#change-workshop-configuration').hidden = passed; get<HTMLButtonElement>('#workshop-next').disabled = true; get('#reflection-feedback').textContent = '';
    host.querySelectorAll('[data-reflection]').forEach(node => { node.setAttribute('aria-pressed', 'false'); node.classList.remove('chosen'); });
    paintScene();
    get('.workshop-evidence').scrollIntoView({ block: 'start', behavior: 'instant' });
    get('.workshop-evidence').focus({ preventScroll: true });
  }
  function selectProvider(id: string) {
    if (!providerGuides.some(p => p.id === id && !p.internal)) return;
    saved.provider = id; persist(); get('#provider-content').innerHTML = providerHTML(); get<HTMLSelectElement>('#stage-provider').value = id;
    host.querySelectorAll<HTMLElement>('.provider-tabs button[data-provider]').forEach(node => { node.classList.toggle('active', node.dataset.provider === id); node.setAttribute('aria-pressed', String(node.dataset.provider === id)); });
    get('.fixture-note').textContent = `This is a deterministic teaching fixture, not a prediction of model behavior. It does not run ${providerGuides.find(p => p.id === id)!.name}.`; paintScene();
  }
  async function download() {
    const status = get('#download-status'); status.textContent = 'Preparing the project…';
    try { const { zipSync, strToU8 } = await import('fflate'); const names = ['help.md', 'faq.md', 'AGENTS.md', 'CLAUDE.md', 'verify.mjs', 'README.md']; const entries = await Promise.all(names.map(async name => { const response = await fetch(`${import.meta.env.BASE_URL}workshop/${name}`); if (!response.ok) throw new Error('A starter file could not be loaded.'); return [name, strToU8(await response.text())] as const; })); const bytes = zipSync(Object.fromEntries(entries)); const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/zip' })); const a = document.createElement('a'); a.href = url; a.download = 'odin-first-harness.zip'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); status.textContent = 'Project downloaded. Its check intentionally fails until you fix the typo.'; } catch { status.textContent = 'The download could not be prepared. Retry when the starter files are available.'; }
  }
  async function copy(text: string, button: HTMLButtonElement) { let status = button.nextElementSibling as HTMLElement | null; if (!status?.classList.contains('copy-feedback')) { status = document.createElement('p'); status.className = 'copy-feedback'; status.setAttribute('role', 'status'); button.after(status); } try { await navigator.clipboard.writeText(text); status.textContent = 'Copied. Paste into your own local agent session.'; } catch { status.textContent = 'Clipboard unavailable. Select and copy the visible text.'; } }
  host.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button'); if (!button) return;
    if (button.dataset.prediction !== undefined) {
      const previousChoice = actionChoice;
      prediction = Number(button.dataset.prediction);
      host.querySelectorAll<HTMLElement>('[data-prediction]').forEach(node => { const selected = Number(node.dataset.prediction) === prediction; node.classList.toggle('chosen', selected); node.setAttribute('aria-pressed', String(selected)); });
      get('#prediction-feedback').textContent = 'Prediction recorded. Set up the experiment, then run it to compare with your prediction.';
      get<HTMLButtonElement>('#run-workshop').disabled = false;
      if (saved.step === 0) {
        actionChoice = prediction === 1 ? 'scoped' : 'broad';
        if (previousChoice !== actionChoice) invalidateRun();
        get('#prediction-feedback').textContent = 'Request selected. Run it to see the evidence.';
        get('#run-workshop').scrollIntoView({ block: 'nearest', behavior: 'instant' });
      } else get('.workshop-configure').scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    if (button.dataset.reflection !== undefined && passed) {
      reflection = Number(button.dataset.reflection);
      host.querySelectorAll<HTMLElement>('[data-reflection]').forEach(node => { const selected = Number(node.dataset.reflection) === reflection; node.classList.toggle('chosen', selected); node.setAttribute('aria-pressed', String(selected)); });
      const correct = reflection === steps[saved.step].reflectionAnswer;
      get('#reflection-feedback').textContent = correct ? 'You connected the result to the mechanism.' : 'Revisit the observed result and its explanation.';
      get<HTMLButtonElement>('#workshop-next').disabled = !correct;
      if (correct) {
        if (!saved.completed.includes(saved.step)) { saved.completed.push(saved.step); saved.completed.sort(); persist(); }
        get('#workshop-progress').textContent = `${saved.completed.length} / 5 discoveries completed. ${persistent ? 'Saved on this device.' : 'Storage unavailable; keep this tab open.'}`;
        host.querySelectorAll<HTMLButtonElement>('[data-workshop-step]').forEach(node => { node.disabled = Number(node.dataset.workshopStep) > saved.completed.length; });
      }
      (correct ? get('.workshop-footer') : get('#reflection-feedback')).scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    if (button.dataset.workshopStep !== undefined && Number(button.dataset.workshopStep) <= saved.completed.length) switchStep(Number(button.dataset.workshopStep));
    if (button.dataset.provider) selectProvider(button.dataset.provider);
    switch (button.id) {
      case 'run-workshop': run(); break;
      case 'inspect-workshop-run': sceneOpen = true; get('#workshop-inspection').hidden = false; button.setAttribute('aria-expanded', 'true'); scene?.pause(paused || !active); reveal(get('#workshop-inspection')); break;
      case 'close-workshop-inspection': sceneOpen = false; scene?.pause(true); get('#workshop-inspection').hidden = true; get('#inspect-workshop-run').setAttribute('aria-expanded', 'false'); reveal(get('#inspect-workshop-run')); break;
      case 'change-workshop-configuration': { const control = saved.step === 0 ? get('[data-prediction="0"]') : get('#workshop-action input, #workshop-action select'); reveal(control); break; }
      case 'workshop-next': if (saved.step < 4) switchStep(saved.step + 1); else { get<HTMLDetailsElement>('#provider-transfer-disclosure').open = true; reveal(get('#provider-transfer')); } break;
      case 'workshop-deeper': stopNarration(); openLesson(steps[saved.step].lesson); break;
      case 'workshop-capture': { const image = scene?.capture(); if (image) { const a = document.createElement('a'); a.href = image; a.download = `odin-${model().layout}.png`; a.click(); get('#scene-explanation').textContent = 'Scene image saved. Use the on-page explanation alongside it.'; } else get('#scene-explanation').textContent = 'Image capture is unavailable here. The on-page diagram and transcript remain available.'; break; }
      case 'download-workshop': void download(); break;
      case 'copy-entry': void copy(providerGuides.find(p => p.id === saved.provider)!.entryCommand, button); break;
      case 'copy-prompt': void copy(providerGuides.find(p => p.id === saved.provider)!.prompt, button); break;
      case 'narrate-workshop': {
        if (narration) { stopNarration(); break; }
        if (!('speechSynthesis' in window)) { get('#narration-status').textContent = 'Narration is unavailable in this browser. The full step remains in text.'; break; }
        const voice = speechSynthesis.getVoices().find(v => v.localService && v.lang.startsWith('en'));
        if (!voice) { get('#narration-status').textContent = 'No local English voice is available. Read the step’s text, or enable a local voice in your device settings.'; break; }
        narration = new SpeechSynthesisUtterance(`${steps[saved.step].title} ${steps[saved.step].question} ${steps[saved.step].why} ${ran ? resultText() : ''}`); narration.voice = voice; narration.rate = 0.95; narration.onend = stopNarration; narration.onerror = () => { stopNarration(); get('#narration-status').textContent = 'Narration stopped. The complete explanation remains in text.'; }; button.textContent = 'Stop narration'; speechSynthesis.speak(narration); break;
      }
      case 'reset-workshop': if (button.dataset.confirm !== 'true') { button.dataset.confirm = 'true'; button.textContent = 'Confirm: reset these five discoveries'; } else { saved.completed = []; switchStep(0); } break;
    }
  });
  host.addEventListener('change', event => { const target = event.target as HTMLInputElement; if (target.id === 'stage-provider') { selectProvider(target.value); return; } if (target.dataset.contextSource) { if (target.checked) selectedContext.add(target.dataset.contextSource); else selectedContext.delete(target.dataset.contextSource); } invalidateRun(); });
  function reveal(target: HTMLElement) { target.scrollIntoView({ block: 'start', behavior: 'instant' }); target.focus({ preventScroll: true }); }
  function invalidateRun() { const hadRun = ran; ran = false; passed = false; reflection = null; get('#workshop-result').textContent = 'The controls changed. Run again to inspect this configuration.'; get('#workshop-reflection').hidden = true; get('#change-workshop-configuration').hidden = true; get<HTMLButtonElement>('#workshop-next').disabled = true; if (hadRun) get('#artifact-state').textContent = 'Previous artifact · run again'; paintScene(); }
  function switchStep(index: number) { saved.step = index; prediction = null; reflection = null; ran = false; passed = false; actionChoice = 'broad'; selectedContext = new Set(['help', 'archive']); currentDocument = index >= 3 ? corrected : original; persist(); render(); get('.workshop-heading').tabIndex = -1; reveal(get('.workshop-heading')); }
  render();
  mediaObserver = new MutationObserver(() => { if (host.hidden) { stopNarration(); scene?.pause(true); } }); mediaObserver.observe(host, { attributes: true, attributeFilter: ['hidden'] });
  return { enter() { active = true; scene?.pause(paused || !sceneOpen); }, dispose() { stopNarration(); scene?.dispose(); mediaObserver?.disconnect(); }, pause() { active = false; scene?.pause(true); stopNarration(); } };
}
