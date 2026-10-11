// Verify the production bundle under a nested docs URL without any external requests.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const prefix = '/academy/harness/';
// GitHub Pages serves the project at /open-docs/ and answers any missing path with 404.html.
const pagesPrefix = '/open-docs/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.md': 'text/plain' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const base = [prefix, pagesPrefix].find(candidate => pathname.startsWith(candidate));
    if (!base) throw new Error('Outside fixture');
    const file = path.resolve(root, pathname.slice(base.length) || 'index.html');
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error('Outside fixture');
    let data;
    try { data = await readFile(file); } catch {
      response.writeHead(404, { 'Content-Type': 'text/html' }); response.end(await readFile(path.join(root, '404.html'))); return;
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [], badResponses = [], externalRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });
  await context.route('**/*', route => { const url = route.request().url(); if (url.startsWith(origin)) return route.continue(); externalRequests.push(url); return route.abort(); });
  await page.goto(`${origin}${prefix}#recovery`);
  await page.locator('.architecture-disclosure > summary').click();
  await page.locator('#scene-host[data-engine="three"]').waitFor({ timeout: 20000 });
  assert.equal(await page.locator('#lesson-title').innerText(), 'Recover without repeating harm');
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(() => document.fonts.check('14px Manrope') && document.fonts.check('14px "Space Grotesk"')));
  assert.equal(await page.locator('#toggle-motion').getAttribute('aria-label'), 'Play animation');
  // Read the course through its actual production UI. No curriculum imports.
  await page.locator('#curriculum-disclosure > summary').click();
  const lessonIds = await page.locator('.lesson-link').evaluateAll(nodes => nodes.map(node => node.dataset.lesson));
  const rendered = [];
  for (const id of lessonIds) {
    await page.locator(`[data-lesson="${id}"]`).click();
    const title = await page.locator('#lesson-title').innerText();
    for (const summary of await page.locator('#lesson-panel .reading-disclosure > summary').all()) await summary.click();
    const foundations = await page.locator('#lesson-panel').innerText();
    await page.locator('#tab-deep').click();
    for (const summary of await page.locator('#lesson-panel .reading-disclosure > summary').all()) await summary.click();
    const deep = await page.locator('#lesson-panel').innerText();
    rendered.push({ id, title, foundations, deep });
    if (id === 'context' || id === 'memory') {
      await page.locator('[data-stage-section="1"]').click();
      await page.locator('#lesson-theater .engineering-stage').screenshot({ path: `/tmp/odin-v3-final-${id}-section.png` });
    }
  }
  assert.equal(rendered.length, 18);
  await writeFile('/tmp/odin-harness-rendered-lessons.json', JSON.stringify(rendered, null, 2));
  // Exercise actual mesh picking (not the overlaid HTML component buttons).
  await page.locator('[data-lesson="foundations"]').click(); await page.evaluate(() => window.scrollTo(0, 0));
  const canvas = page.locator('#scene-host canvas'); await canvas.scrollIntoViewIfNeeded(); const bounds = await canvas.boundingBox();
  const picked = new Set();
  for (const ratio of [0.26, 0.38, 0.49, 0.60, 0.71]) {
    await page.mouse.click(bounds.x + bounds.width * 0.53, bounds.y + bounds.height * ratio);
    picked.add(await page.locator('#lesson-title').innerText());
  }
  assert(picked.size >= 2, `Mesh selection did not change lessons: ${[...picked]}`);
  await page.locator('[data-mode="reference"]').click();
  const targets = await page.locator('#concept-index button').evaluateAll(nodes => nodes.map(node => node.dataset.openConcept));
  assert.equal(targets.length, 111); assert(targets.every(id => lessonIds.includes(id)));
  const refLink = page.locator('.source-list a').filter({ hasText: 'Odin repository conventions' });
  const localReference = await context.request.get(new URL(await refLink.getAttribute('href'), `${origin}${prefix}`).href);
  assert.equal(localReference.status(), 200); assert((await localReference.text()).includes('forward correction'));
  // Capability deep links and authored downloads also work below a nested base path.
  await page.goto(`${origin}${prefix}#reference/capabilities/odin-next`);
  assert.equal(await page.locator('#capability-detail-title').innerText(), 'Odin Next and grounded action');
  assert.equal(await page.locator('[data-capability]').count(), 8);
  for (const filename of ['odin-capability-guide.md', 'mechanism-map.svg']) {
    const asset = await context.request.get(`${origin}${prefix}capabilities/${filename}`);
    assert.equal(asset.status(), 200);
  }
  await page.goto(`${origin}${prefix}#reference/capabilities/no-such-guide`);
  assert.equal(await page.locator('#capability-detail-title').innerText(), 'Guide not found');
  await page.locator('#capability-back').click();
  assert.equal(await page.locator('#capability-detail').isHidden(), true);
  // The lazy engineering renderer and provider code also load from this nested build.
  await page.locator('[data-mode="learn"]').click();
  await page.locator('#overview-workshop').click();
  await page.locator('#inspect-workshop-run').click();
  const stage = page.locator('#workshop-scene .engineering-stage');
  await stage.locator('.stage-renderer canvas').waitFor();
  const providerLayouts = [];
  for (const provider of ['pi', 'factory', 'codex', 'claude', 'deepseek']) {
    await page.locator('#stage-provider').selectOption(provider);
    assert.equal(await stage.getAttribute('data-stage'), `${provider}-contract`);
    providerLayouts.push(await stage.getAttribute('data-layout'));
    await stage.getByRole('button', { name: 'Next event', exact: true }).click();
    assert((await stage.locator('.engineering-code pre').innerText()).length > 30);
    if (provider === 'pi' || provider === 'factory') await stage.screenshot({ path: `/tmp/odin-v3-final-${provider}.png` });
  }
  assert.equal(new Set(providerLayouts).size, 5);
  // Context-loss fallback keeps the lesson navigation alive after a renderer was created.
  await page.locator('[data-mode="explore"]').click();
  await canvas.dispatchEvent('webglcontextlost'); await page.locator('#scene-fallback').waitFor();
  await page.locator('[data-fallback="tools"]').click(); assert.equal(await page.locator('#lesson-title').innerText(), 'Tools are contracts');
  assert.deepEqual(errors, []); assert.deepEqual(badResponses, []); assert.deepEqual(externalRequests, []);
  // Hash-less links land on 404.html, which forwards known routes into the hash and anything else to Start here.
  const missing = await context.newPage();
  const missingErrors = []; missing.on('pageerror', error => missingErrors.push(error.message));
  const forwarded = [];
  for (const [from, to, check] of [
    [`${pagesPrefix}repository`, `${pagesPrefix}#repository`, async () => assert.equal(await missing.locator('#lesson-title').innerText(), 'The repository is part of the harness')],
    [`${pagesPrefix}reference/capabilities/memory`, `${pagesPrefix}#reference/capabilities/memory`, async () => assert.equal(await missing.locator('#capability-detail-title').innerText(), 'Memory and grounding')],
    [`${pagesPrefix}workshop`, `${pagesPrefix}#workshop`, async () => assert.equal(await missing.locator('#workshop-entry').isVisible(), true)],
    [`${pagesPrefix}does/not/exist`, `${pagesPrefix}#learn`, async () => assert.equal(await missing.locator('#agent-overview-title').isVisible(), true)],
    [`${prefix}lab`, `${prefix}#lab`, async () => assert.equal(await missing.locator('#lab-view').isVisible(), true)],
    [`${prefix}not-a-page`, `${prefix}#learn`, async () => assert.equal(await missing.locator('#agent-overview-title').isVisible(), true)],
  ]) {
    await missing.goto(`${origin}${from}`);
    await missing.waitForURL(`${origin}${to}`);
    await missing.locator('#app .topbar').waitFor();
    await check();
    forwarded.push({ from, to });
  }
  assert.deepEqual(missingErrors, []);
  // Without JavaScript the 404 page still offers a visible way into Open Docs and back to odin-labs.ai.
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await noScript.newPage();
  const fallbackResponse = await fallback.goto(`${origin}${pagesPrefix}learn`);
  assert.equal(fallbackResponse.status(), 404);
  assert.equal(await fallback.getByRole('link', { name: 'Open Open Docs' }).getAttribute('href'), 'https://odin-labs-ai.github.io/open-docs/#learn');
  assert.equal(await fallback.getByRole('link', { name: 'Back to odin-labs.ai' }).first().getAttribute('href'), 'https://odin-labs.ai/');
  await noScript.close();
  const report = { build: 'dist', nestedPath: prefix, forwarded404: forwarded, lessonsRead: rendered.length, renderedWords: rendered.reduce((count, lesson) => count + `${lesson.foundations} ${lesson.deep}`.split(/\s+/).length, 0), conceptLinksChecked: targets.length, providerLayouts, meshPickedLessons: [...picked], externalRequests, badResponses, errors, fontsLoaded: true, contextLossRecovered: true };
  await writeFile('/tmp/odin-harness-static-verification.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
