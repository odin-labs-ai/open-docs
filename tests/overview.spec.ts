import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [1440, 390]) {
  test(`agent overview supports component inspection and onward learning at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./#learn');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The model reasons.The harness makes it work.');
    await expect(page.locator('#agent-overview-title')).toBeInViewport();
    await expect(page.locator('#agent-overview-scene [data-stage-node="model"]')).toHaveAccessibleName('Model. Explain component');
    const pin = page.locator('#agent-overview-scene .stage-node-label').nth(4);
    await expect(pin).toHaveAccessibleName('Telemetry & checks. Explain component');
    await pin.focus();
    await page.keyboard.press('Enter');
    await expect(pin).toBeFocused();
    await expect(pin).toHaveAccessibleName('Telemetry & checks. Explain component');
    await expect(pin).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-agent-part="feedback"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#agent-part-detail')).toContainText('Telemetry records events');
    await expect(page.locator('#agent-part-detail h3')).toBeInViewport();
    const routes = [ ['model', 'loop'], ['knowledge', 'context'], ['tools', 'tools'], ['work', 'intent'], ['feedback', 'observability'], ['plugins', 'repository'] ];
    for (const [part, lesson] of routes) {
      const button = page.locator(`[data-agent-part="${part}"]`);
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await page.locator('#overview-part-lesson').click();
      await expect(page).toHaveURL(new RegExp(`#${lesson}$`));
      await expect(page.locator('#explore-view')).toBeVisible();
      await page.locator('.brand').click();
      await expect(page.locator('#agent-overview-title')).toBeInViewport();
    }
    await page.locator('#overview-foundations').click();
    await expect(page).toHaveURL(/#foundations$/);
    await page.locator('[data-mode="learn"]').click();
    await page.locator('#overview-workshop').click();
    await expect(page.locator('#workshop-entry')).toBeFocused();
    await expect(page.locator('#workshop-entry')).toBeInViewport();
    await page.locator('#inspect-workshop-run').click();
    const workshopPin = page.locator('#workshop-scene .stage-node-label[data-state="active"]').first();
    await expect(workshopPin).toHaveAccessibleName(/: current event\. Inspect code$/);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
  });

  test(`normal-motion stages animate, settle and return to the overview at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('./#learn');
    const overview = page.locator('#agent-overview-scene');
    await expect(overview.locator('.stage-node-label')).toHaveCount(6);
    await overview.locator('[data-stage-node="plugins"]').click();
    await expect(page.locator('#agent-part-detail')).toContainText('Package extensions');
    await page.locator('#overview-workshop').click();
    await page.locator('#inspect-workshop-run').click();
    await page.locator('#stage-provider').selectOption('pi');
    const stage = page.locator('#workshop-scene .engineering-stage');
    await stage.getByRole('button', { name: 'Next event', exact: true }).click();
    await stage.getByRole('button', { name: 'Replay event', exact: true }).click();
    const canvas = stage.locator('canvas');
    await canvas.scrollIntoViewIfNeeded();
    const pixels = () => canvas.evaluate(node => (node as HTMLCanvasElement).toDataURL());
    const initial = await pixels();
    await expect.poll(pixels, { timeout: 10000 }).not.toBe(initial);
    // A replay is bounded; it must finish instead of continuously moving the scene.
    await page.waitForTimeout(2400);
    const settled = await pixels();
    await page.waitForTimeout(300);
    expect(await pixels()).toBe(settled);
    await page.locator('[data-mode="explore"]').click();
    await page.locator('.brand').click();
    await expect(page.locator('#agent-overview-title')).toBeInViewport();
    await overview.locator('[data-stage-node="model"]').click();
    await expect(page.locator('#agent-part-detail')).toContainText('The model supplies the intelligence.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(overview.locator('[data-stage-node="model"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('the overview remains useful when the graphic cannot load', async ({ page }) => {
  await page.route(/\/assets\/stage-renderer-[^/]+\.js(?:\?.*)?$/, route => route.abort());
  await page.goto('./#learn');
  await expect(page.locator('#overview-fallback')).toBeVisible();
  await page.locator('[data-agent-part="work"]').click();
  await expect(page.locator('#agent-part-detail')).toContainText('objective, scope, constraints and acceptance evidence');
  await page.locator('#overview-workshop').click();
  await expect(page.locator('#workshop-entry')).toBeFocused();
  await page.locator('[data-prediction="1"]').click();
  await page.locator('#run-workshop').click();
  await expect(page.locator('#workshop-result')).toContainText('A testable finish line');
});
