import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Independent answer choices derived from the rendered course's explanations.
// Tests do not import curriculum answer keys or manipulate saved progress.
const reviewAnswers: [string, number, number][] = [
  ['foundations', 1, 2], ['intent', 1, 2], ['loop', 1, 0], ['context', 1, 2],
  ['memory', 1, 2], ['tools', 2, 1], ['environment', 0, 1], ['policy', 2, 0],
  ['injection', 2, 1], ['recovery', 2, 1], ['observability', 1, 0], ['evals', 2, 1],
  ['economics', 1, 1], ['multiagent', 1, 2], ['repository', 1, 1], ['governance', 1, 2],
  ['improvement', 1, 2], ['capstone', 2, 1],
];

test('complete the course from rendered lessons and observe every failure and correction', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#foundations'); await page.locator('.architecture-disclosure > summary').click(); await expect(page.locator('#scene-host')).toHaveAttribute('data-engine', 'three');
  let readWords = 0;
  const learned: { title: string; essentials: string; deep: string; explanations: string[] }[] = [];
  for (const [id, first, second] of reviewAnswers) {
    await page.locator(`[data-lesson="${id}"]`).click();
    const title = await page.locator('#lesson-title').innerText();
    const essentials = await page.locator('#lesson-panel').innerText();
    expect(essentials.length).toBeGreaterThan(500);
    await page.getByRole('tab', { name: 'Deep dive', exact: true }).click();
    const deep = await page.locator('#lesson-panel').innerText(); expect(deep.length).toBeGreaterThan(500);
    readWords += `${essentials} ${deep}`.split(/\s+/).length;
    await page.getByRole('tab', { name: /Check understanding/ }).click();
    if (id === 'foundations') {
      await page.locator('[data-question="0"][data-answer="0"]').click();
      await expect(page.locator('.answer-feedback').first()).toContainText('Revisit the principle');
      await expect(page.locator('#progress-count')).toHaveText('0 / 18');
    }
    await page.locator(`[data-question="0"][data-answer="${first}"]`).click();
    await page.locator(`[data-question="1"][data-answer="${second}"]`).click();
    await expect(page.locator('#lesson-status')).toHaveText('Lesson completed');
    const explanations = await page.locator('.answer-feedback').allInnerTexts();
    expect(explanations.every(text => text.startsWith('Correct.'))).toBeTruthy();
    learned.push({ title, essentials, deep, explanations });
  }
  await expect(page.locator('#progress-count')).toHaveText('18 / 18');
  await page.reload(); await expect(page.locator('#progress-count')).toHaveText('18 / 18');
  await page.locator('[data-mode="lab"]').click();
  const observations: { scenario: string; failure: string; correction: string }[] = [];
  for (const id of ['injection', 'timeout', 'restart', 'context', 'false-success', 'loop']) {
    await page.locator(`[data-scenario="${id}"]`).click();
    await page.locator('#run-simulation').click();
    await expect(page.locator('#trace-status')).toHaveText('Failure observed');
    const failure = await page.locator('#trace-events').innerText();
    if (id === 'injection') await page.locator('[data-control="policy"]').check();
    if (id === 'timeout') await page.locator('[data-control="idempotency"]').check();
    if (id === 'restart') await page.locator('[data-control="checkpoint"]').check();
    if (id === 'false-success') await page.locator('[data-control="verification"]').check();
    if (id === 'context') { await page.locator('#context-budget').fill('16'); await page.locator('#context-budget').dispatchEvent('input'); }
    if (id === 'loop') { await page.locator('#max-turns').fill('6'); await page.locator('#max-turns').dispatchEvent('input'); }
    await page.locator('#run-simulation').click();
    await expect(page.locator('#trace-status')).toHaveText('Control effective');
    const correction = await page.locator('#trace-events').innerText(); expect(correction).not.toBe(failure);
    observations.push({ scenario: id, failure, correction });
    if (id === 'false-success') await expect(page.locator('#trace-outcome')).toContainText('Task remains incomplete');
    if (id === 'loop') await expect(page.locator('#trace-outcome')).toContainText('not complete');
  }
  await expect(page.locator('#completion')).toBeVisible();
  const downloadPromise = page.waitForEvent('download'); await page.locator('#export-completion').click(); const download = await downloadPromise;
  await download.saveAs('/tmp/odin-harness-learning-record.json');
  await test.info().attach('rendered-curriculum-review', { body: JSON.stringify({ readWords, learned, observations, errors }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('desktop and mobile views, accessibility, scene controls, search, and keyboard tabs', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./#foundations'); await page.locator('.architecture-disclosure > summary').click(); await expect(page.locator('#scene-host')).toHaveAttribute('data-engine', 'three');
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '/tmp/odin-harness-desktop.png', fullPage: true });
  await page.locator('.layer-label[data-component="policy"]').click();
  await expect(page.locator('#lesson-title')).toHaveText('Authority before action');
  await page.getByRole('button', { name: 'Assemble layers', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Explode layers', exact: true })).toBeVisible();
  await page.locator('#reset-view').click();
  await page.getByRole('tab', { name: 'Foundations', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Deep dive', exact: true })).toBeFocused();
  await page.locator('#lesson-search').fill('idempotency'); await expect(page.locator('.lesson-link')).toHaveCount(1);
  await page.locator('#lesson-search').fill('nonesuch'); await expect(page.locator('#search-empty')).toBeVisible(); await page.locator('#lesson-search').fill('');
  let audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.locator('[data-mode="lab"]').click();
  await page.locator('#step-simulation').click(); await expect(page.locator('.trace-event')).toHaveCount(1);
  await page.locator('#run-simulation').click(); await page.locator('#stop-simulation').click();
  const count = await page.locator('.trace-event').count(); await page.waitForTimeout(700); await expect(page.locator('.trace-event')).toHaveCount(count);
  await expect(page.locator('#pass-at')).toHaveText('99.2%'); await expect(page.locator('#pass-all')).toHaveText('51.2%');
  await page.locator('#attempts').fill('1'); await page.locator('#attempts').dispatchEvent('input');
  await expect(page.locator('#pass-at')).toHaveText('80.0%'); await expect(page.locator('#pass-all')).toHaveText('80.0%');
  audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(audit.violations).toEqual([]);
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
  await page.screenshot({ path: '/tmp/odin-harness-lab-desktop.png', fullPage: true });
  await page.locator('[data-mode="reference"]').click(); await page.locator('#concept-search').fill('TOCTOU');
  await expect(page.locator('#concept-index button')).toHaveCount(1); await page.locator('#concept-index button').click();
  await expect(page.locator('#lesson-title')).toHaveText('Authority before action');
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('./#foundations'); await page.reload(); await page.locator('.architecture-disclosure > summary').click(); await expect(page.locator('#scene-host')).toHaveAttribute('data-engine', 'three');
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click(); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '/tmp/odin-harness-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(audit.violations).toEqual([]);
  await page.locator('[data-mode="lab"]').click(); await page.screenshot({ path: '/tmp/odin-harness-lab-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('no WebGL, reduced motion, and storage refusal', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
    Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
  });
  await page.goto('./#foundations'); await page.locator('.architecture-disclosure > summary').click(); await expect(page.locator('#scene-fallback')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play animation', exact: true })).toBeDisabled();
  await expect(page.locator('#progress-note')).toContainText('storage is unavailable');
  await page.locator('[data-fallback="memory"]').click(); await expect(page.locator('#lesson-title')).toHaveText('Memory across sessions');
  await page.locator('[data-mode="reference"]').click(); await expect(page.locator('#concept-index button')).toHaveCount(111);
  await context.close();
});
