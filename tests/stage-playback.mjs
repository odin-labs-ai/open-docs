// Start pnpm dev, then node tests/stage-playback.mjs. Real Three.js finite timeline verification.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:1100}}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__flow-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><head><title>Event playback fixture</title></head><body><main></main></body></html>'}));
 await page.goto('http://127.0.0.1:4329/__flow-check');
 await page.evaluate(async()=>{const{mountEngineeringStage}=await import('/src/engineering-stage.ts');const{providerStage}=await import('/src/provider-stages.ts');window.stage=mountEngineeringStage(document.querySelector('main'),providerStage('pi','permissions'),true)});
 const stage=page.locator('.engineering-stage'); await stage.locator('canvas').waitFor();
 await stage.getByRole('button',{name:'Play sequence',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.engineering-count')?.textContent==='5 / 5',undefined,{timeout:20000});
 await stage.getByRole('button',{name:'Play sequence',exact:true}).waitFor({timeout:15000});
 assert.equal(await stage.locator('.engineering-objects button[data-state="blocked"]').count(),1);
 assert.match(await stage.locator('.engineering-code pre').innerText(),/Task acceptance: not satisfied/);
 await stage.locator('.engineering-objects').getByRole('button',{name:'Unchanged task document',exact:true}).click();
 assert.match(await stage.locator('.engineering-code pre').innerText(),/Welcomme/);
 const frame=await stage.getAttribute('data-frame'); await page.waitForTimeout(2800); assert.equal(await stage.getAttribute('data-frame'),frame);
 await stage.screenshot({path:'/tmp/odin-v3-pi-denial-final.png'});
 const report={finitePlaybackStops:true,deniedBoundaryRetained:true,unmodifiedArtifactVisible:true,pageErrors:errors}; assert.deepEqual(errors,[]);
 await page.evaluate(()=>window.stage.dispose()); assert.equal(await page.locator('canvas').count(),0); report.disposalClearsCanvas=true;
 await writeFile('/tmp/odin-v3-flow-check.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}
