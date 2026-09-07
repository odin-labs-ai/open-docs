/** Full rendered code-content matrix in a WebGL fallback fixture.
 * Start pnpm dev, then node tests/teaching-smoke.mjs.
 * Real GPU geometry/interaction is checked by stage.spec.ts and visual captures.
 */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base = process.env.TEACHING_BASE_URL || 'http://127.0.0.1:4329';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.route(`${base}/__stage-matrix`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><title>Stage matrix fixture</title></head><body><main></main></body></html>' }));
  await page.route('**/src/stage-renderer.ts*', route => route.abort());
  await page.goto(`${base}/__stage-matrix`);
  const report = await page.evaluate(async () => {
    const { mountEngineeringStage } = await import('/src/engineering-stage.ts');
    const { providerStage } = await import('/src/provider-stages.ts');
    const { lessonStage, traceStage } = await import('/src/lesson-stages.ts');
    const { lessons } = await import('/src/curriculum.ts');
    const { scenarios, defaults, simulate } = await import('/src/simulation.ts');
    const host = document.querySelector('main');
    const initial = providerStage('pi', 'contract'), stage = mountEngineeringStage(host, initial, true);
    const specs = [];
    for (const provider of ['pi','factory','codex','claude','deepseek']) for (const topic of ['contract','context','permissions','verification','recovery']) specs.push(providerStage(provider,topic));
    for (const lesson of lessons) { specs.push(lessonStage(lesson,'essentials'),lessonStage(lesson,'deep',0),lessonStage(lesson,'deep',1),lessonStage(lesson,'check')); }
    const layouts = new Set(), assets = new Set(); let frames = 0;
    for (const spec of specs) {
      layouts.add(spec.layout); spec.nodes.forEach(node => assets.add(node.asset));
      const ids = new Set(spec.nodes.map(n=>n.id));
      for (const link of spec.links) if (!ids.has(link.from)||!ids.has(link.to)) throw Error('Invalid link '+spec.id);
      for (let i=0;i<spec.frames.length;i++) {
        const frame=spec.frames[i]; stage.update(spec,i); frames++;
        if(host.querySelector('.engineering-narrative p').textContent!==frame.explanation) throw Error('Narrative mismatch '+spec.id);
        if(!host.querySelector('.engineering-code pre').textContent.trim())throw Error('Missing code '+spec.id);
        const selected=spec.nodes.find(n=>n.id===frame.focus[0]); const code=frame.code||selected.code;
        if(host.querySelector('.engineering-file').textContent!==code.file)throw Error('Wrong file '+spec.id);
        if(!frame.route.every(id=>ids.has(id)))throw Error('Invalid route '+spec.id);
        if((code.highlight||[]).some(line=>line<1||line>code.text.split('\n').length))throw Error('Invalid highlighted line '+spec.id);
      }
    }
    let prefixes=0;
    for(const scenario of scenarios) for(const good of[false,true]) {
      const controls={...defaults}; if(!good){ if(scenario.id==='injection')controls.policy=false;if(scenario.id==='timeout')controls.idempotency=false;if(scenario.id==='restart')controls.checkpoint=false;if(scenario.id==='context')controls.contextBudget=8;if(scenario.id==='false-success')controls.verification=false;if(scenario.id==='loop')controls.maxTurns=12; }
      const result=simulate(scenario.id,controls);
      for(let count=0;count<=result.events.length;count++){const spec=traceStage(result.events.slice(0,count),scenario.id);stage.update(spec,spec.frames.length-1);prefixes++;if(count&&host.querySelector('.engineering-narrative p').textContent!==result.events[count-1].detail)throw Error('Trace mismatch');}
    }
    stage.dispose();
    return{providerTopicScenes:25,lessonSectionScenes:72,renderedFrames:frames,assets:[...assets],layouts:[...layouts],tracePrefixes:prefixes,remainingStageElements:host.childElementCount,scope:'Rendered code/narrative matrix without GPU; primary UI and GPU checked separately.'};
  });
  assert.equal(report.renderedFrames,413);assert.equal(report.assets.length,18);assert.equal(report.tracePrefixes,78);assert.equal(report.remainingStageElements,0);
  await writeFile('/tmp/odin-v3-stage-matrix.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); }
