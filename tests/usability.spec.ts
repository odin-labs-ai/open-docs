import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.use({ actionTimeout: 15000 });

async function visibleFeedback(locator: Locator, height: number) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const header = await locator.page().locator('.topbar').boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  expect(box!.y + Math.min(box!.height, 160)).toBeLessThan(height);
}
for (const width of [1440, 390]) {
 test(`visible workshop action-feedback journey at ${width}px`, async ({ page }) => {
  test.setTimeout(180000);
  const height = width === 390 ? 844 : 900;
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height });
  await page.goto('./#learn');
  await expect(page.getByRole('heading', { name: 'Make your first agent loop click.' })).toBeVisible();
  await page.locator('[data-prediction="1"]').click();
  await expect(page.locator('#workshop-contract')).toHaveValue('scoped');
  await page.locator('#run-workshop').click();
  await expect(page.locator('#workshop-result')).toContainText('A testable finish line');
  await visibleFeedback(page.locator('#workshop-result'), height);
  await page.screenshot({ path: `/tmp/harness-v4-workshop-result-${width}.png` });
  await page.locator('[data-prediction="0"]').click();
  await expect(page.locator('#workshop-result')).toContainText('controls changed');
  await expect(page.locator('#workshop-reflection')).toBeHidden();
  await page.locator('[data-prediction="1"]').click();
  await page.locator('#run-workshop').click();
  await page.locator('[data-reflection="0"]').click();
  await expect(page.locator('#workshop-next')).toBeEnabled();
  await page.locator('#inspect-workshop-run').click();
  const stage = page.locator('#workshop-scene .engineering-stage');
  await stage.getByRole('button', { name: 'Previous event', exact: true }).click();
  await visibleFeedback(stage.locator('.engineering-narrative'), height);
  const frame = await stage.getAttribute('data-frame');
  await stage.getByRole('button', { name: 'Play sequence', exact: true }).click();
  await expect(stage).not.toHaveAttribute('data-frame', frame!, { timeout: 15000 });
  await expect(stage.getByRole('button', { name: 'Play sequence', exact: true })).toBeVisible();
  await expect(stage.locator('.engineering-viewport')).toHaveCSS('height', width === 390 ? '300px' : '360px');
  const object = stage.locator('.engineering-objects button').nth(1);
  const name = await object.getAttribute('aria-label');
  await object.click();
  await expect(stage.locator('.engineering-code h3')).toHaveText(name!);
  await visibleFeedback(stage.locator('.engineering-code h3'), height);
  await expect(stage.locator('.engineering-inspection-status')).toContainText('The event has not advanced');
  await page.screenshot({ path: `/tmp/harness-v4-code-${width}.png` });
  if (width === 390) { await stage.getByRole('button', { name: 'Back to 3D objects', exact: true }).click(); await expect(object).toBeFocused(); }
  const pin = stage.locator('.stage-node-label').nth(2);
  await pin.click();
  await expect(stage.locator('.engineering-code h3')).toHaveText((await stage.locator('.engineering-objects button').nth(2).getAttribute('aria-label'))!);
  await visibleFeedback(stage.locator('.engineering-code h3'), height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]); expect(errors).toEqual([]);
 });
 test(`Explore and Failure lab reveal controls and outcomes at ${width}px`, async ({ page }) => {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.goto('./#foundations');
  await page.locator('[data-mode="explore"]').click();
  await visibleFeedback(page.locator('#tab-deep'), height);
  await page.locator('#tab-deep').click();
  await page.locator('.open-lesson-stage').click();
  const stage = page.locator('#lesson-theater .engineering-stage');
  await stage.getByRole('button', { name: 'Next event', exact: true }).click();
  await visibleFeedback(stage.locator('.engineering-narrative'), height);
  await page.getByRole('button', { name: 'Back to lesson and checks', exact: true }).click();
  await visibleFeedback(page.locator('#tab-check'), height);
  await expect(page.locator('#lesson-reader')).toBeFocused();
  await page.locator('[data-mode="lab"]').click();
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('[data-control]:visible')).toHaveCount(1);
  await page.locator('#step-simulation').click();
  await expect(page.locator('.trace-event')).toHaveCount(1);
  await visibleFeedback(page.locator('.trace-header'), height);
  await expect(page.locator('#step-simulation')).toBeInViewport();
  await page.locator('[data-control="policy"]').check();
  await expect(page.locator('.trace-event')).toHaveCount(0);
  await expect(page.locator('#lab-theater .engineering-stage')).toHaveAttribute('data-stage', 'trace-injection-ready');
  await page.locator('#run-simulation').click();
  await expect(page.locator('#trace-status')).toHaveText('Control effective');
  await visibleFeedback(page.locator('#trace-outcome'), height);
  await page.screenshot({ path: `/tmp/harness-v4-lab-result-${width}.png` });
  await page.getByRole('button', { name: 'Inspect the current event in 3D', exact: true }).click();
  await expect(page.locator('#lab-theater').getByRole('button', { name: 'Next event', exact: true })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
 });
}

test('copy and unavailable media explain the result beside their controls', async ({ page }) => {
 await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Clipboard disabled'); } }, configurable: true }); if ('speechSynthesis' in window) speechSynthesis.getVoices = () => []; });
 await page.goto('./#learn');
 await page.locator('#copy-entry').click();
 await expect(page.locator('.provider-command .copy-feedback')).toContainText('Clipboard unavailable');
 await expect(page.locator('.provider-command .copy-feedback')).toBeInViewport();
 await page.locator('#narrate-workshop').click();
 await expect(page.locator('#narration-status')).toContainText(/voice|unavailable/);
 await expect(page.locator('#narration-status')).toBeInViewport();
});
