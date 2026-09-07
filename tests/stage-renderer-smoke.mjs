// Start pnpm dev, then node tests/stage-renderer-smoke.mjs.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
try {
 const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1200, height: 900 } });
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 await page.route('**/__renderer-check', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><title>Renderer fixture</title></head><body><main style="height:600px"></main></body></html>' }));
 await page.goto('http://127.0.0.1:4329/__renderer-check');
 const report = await page.evaluate(async () => {
  const { createStageRenderer } = await import('/src/stage-renderer.ts');
  let shaderCompilations = 0; const compileShader = WebGL2RenderingContext.prototype.compileShader; WebGL2RenderingContext.prototype.compileShader = function(shader) { shaderCompilations++; return compileShader.call(this, shader); };
  let allocations = 0, losses = 0; const picked = new Set(), written = [];
  const create = document.createElement.bind(document); document.createElement = function(tag, options) { if(tag === 'canvas') allocations++; return create(tag, options); };
  const fill = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function(value, ...args) { written.push(value); return fill.call(this, value, ...args); };
  const code = file => ({file, language:'pseudocode', text:'proposal = inspect(request)\nallowed = authorize(proposal)\nexecute_only_if_allowed(allowed)', provenance:'Illustrative pseudocode', highlight:[2]});
  const spec = {id:'selection-boundary',title:'Inspect without changing authority',subtitle:'Renderer test fixture',layout:'boundary-section',nodes:[
   {id:'proposal',label:'Proposal',asset:'model-chip',detail:'A proposal has no side effect.',position:[-3,0,0],code:code('proposal.pseudo')},
   {id:'gate',label:'Gate',asset:'permission-gate',detail:'Denied before execution.',position:[0,0,0],code:code('gate.pseudo')},
   {id:'tool',label:'Tool',asset:'tool-workbench',detail:'This effect remains unexecuted.',position:[3,0,0],code:code('tool.pseudo')}],links:[{from:'proposal',to:'gate',label:'authorize',kind:'proposal'},{from:'gate',to:'tool',label:'only if allowed',kind:'denied'}],frames:[{id:'denied',title:'Denied before action',explanation:'The gate denies the proposal; the tool does not execute.',focus:['gate'],route:['proposal','gate','tool'],states:{gate:'blocked',tool:'ready'},code:code('active-event-policy.pseudo')}],sources:[],note:'Isolated rendering fixture.'};
  const renderer = createStageRenderer(document.querySelector('main'),spec,0,'tool',id=>picked.add(id),()=>losses++,true); renderer.pause(true);
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const before = renderer.capture(), labels = [...document.querySelectorAll('.stage-node-label')], startAllocations = allocations;
  const ids = ['tool','proposal','gate']; const started = performance.now();
  for(let i=1;i<=201;i++) renderer.update(spec,0,ids[i%3]);
  const selectionMilliseconds = performance.now()-started, selectionCanvasAllocations = allocations-startAllocations;
  const after = renderer.capture();
  const sameLabelElements = labels.every(label=>label.isConnected && document.querySelector(`[data-stage-node="${label.dataset.stageNode}"]`)===label);
  const canvas=document.querySelector('canvas'), bounds=canvas.getBoundingClientRect();
  for(let y=0.2;y<=0.85;y+=0.05) for(let x=0.1;x<=0.9;x+=0.05){const init={clientX:bounds.x+bounds.width*x,clientY:bounds.y+bounds.height*y,pointerId:1,pointerType:'mouse',button:0};canvas.dispatchEvent(new PointerEvent('pointerdown',init));canvas.dispatchEvent(new PointerEvent('pointerup',init));}
  const shaderCountBefore = shaderCompilations;
  const nextSpec = {...spec, frames: [...spec.frames, {...spec.frames[0], id: 'still-denied'}]};
  renderer.update(nextSpec, 1, 'tool'); renderer.capture();
  const eventShaderCompilations = shaderCompilations - shaderCountBefore;
  const denialCaption=document.querySelector('.stage-packet-caption').textContent;
  canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})); const captureAfterLoss=renderer.capture(); renderer.dispose(); renderer.dispose();
  document.createElement=create; CanvasRenderingContext2D.prototype.fillText=fill; WebGL2RenderingContext.prototype.compileShader=compileShader;
  return {eventShaderCompilations,selectionCount:201,selectionMilliseconds,selectionCanvasAllocations,sameLabelElements,sameDeniedPoseAfterInspection:before===after,pngCaptured:before?.startsWith('data:image/png;base64,'),frameCodeBoundWhileOtherObjectSelected:written.includes('active-event-policy.pseudo')&&!written.includes('gate.pseudo'),meshPickedNodes:[...picked],denialCaption,contextLossCallbacks:losses,captureAfterLoss,canvasesAfterDisposal:document.querySelectorAll('canvas').length};
 });
 assert.equal(report.eventShaderCompilations,0); assert.equal(report.selectionCanvasAllocations,0); assert.equal(report.sameLabelElements,true); assert.equal(report.sameDeniedPoseAfterInspection,true); assert.equal(report.pngCaptured,true); assert.equal(report.frameCodeBoundWhileOtherObjectSelected,true); assert(report.meshPickedNodes.length>=2); assert.match(report.denialCaption,/stops at Gate/); assert.equal(report.contextLossCallbacks,1); assert.equal(report.captureAfterLoss,null); assert.equal(report.canvasesAfterDisposal,0); assert.deepEqual(errors,[]);
 await writeFile('/tmp/odin-v3-renderer-final.json',JSON.stringify({...report,pageErrors:errors},null,2)); console.log(report);
} finally { await browser.close(); }
