import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const [base='http://127.0.0.1:4341',out='/tmp/open-docs-calm/round1']=process.argv.slice(2);
await mkdir(out,{recursive:true});
const expected = process.argv[4];
if (expected) { const version = await (await fetch(base.replace(/\/$/, '') + '/version.json', {cache:'no-store'})).json(); if (version.sha !== expected) throw new Error('Served version mismatch: '+JSON.stringify(version)); await writeFile(out+'/served-version.json', JSON.stringify(version,null,2)+'\n'); }
const browser=await chromium.launch();
const observations=[];
try {
 for(const width of [1440,390]) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function capture(name) {
   await page.evaluate(()=>document.fonts.ready);
   await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:false});
   observations.push({name,width,buttons:await page.locator('button:visible').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),headings:await page.locator('h1:visible,h2:visible').allTextContents(),errors:[...errors]});
  }
  await page.goto(base+'/#learn'); await page.locator('#overview-details').waitFor(); assert.equal(await page.locator('#overview-details').getAttribute('open'), null); assert.match(await page.locator('.agent-overview-example').innerText(), /A model proposes/); await capture('home');
  await page.locator('#overview-details > summary').click();await capture('parts');
  await page.locator('#overview-map-toggle').click();await page.locator('#agent-overview-scene canvas').waitFor();
  await capture('map');
  await page.locator('#overview-foundations').click(); assert.match(await page.locator('#lesson-summary').innerText(), /model supplies capability/); assert.equal(await page.locator('#lesson-inspection').isVisible(),false); await capture('lesson');
  await page.locator('#tab-deep').click();await capture('deep');
  await page.goto(base+'/#workshop');await capture('workshop');
  await page.locator('[data-prediction="0"]').click();await page.locator('#run-workshop').click(); assert.match(await page.locator('#workshop-result').innerText(), /no reliable acceptance test/); await capture('failed');
  await page.locator('#change-workshop-configuration').click();await page.locator('[data-prediction="1"]').click();await page.locator('#run-workshop').click(); assert.match(await page.locator('#workshop-result').innerText(), /testable finish line/); await capture('corrected'); await page.locator('[data-reflection="0"]').click(); assert.equal(await page.locator('#workshop-next').isEnabled(),true);
  await page.close();
 }
}finally { await browser.close(); }
assert(observations.every(row=>row.overflow<=1 && row.errors.length===0));
await writeFile(`${out}/observations.json`,JSON.stringify(observations,null,2)+'\n');
console.log(JSON.stringify(observations,null,2));
