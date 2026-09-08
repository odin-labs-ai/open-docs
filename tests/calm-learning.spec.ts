import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`the overview starts with an explanation and lets the reader choose depth at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('./#learn');
    const details = page.locator('#overview-details');
    const summary = details.locator(':scope > summary');
    await expect(page.locator('.agent-overview-definition')).toBeVisible();
    await expect(page.locator('.agent-overview-purpose')).toBeVisible();
    await expect(page.locator('.agent-overview-example')).toHaveText('A model proposes: read the project instructions, inspect the file, then make a scoped edit.');
    await expect(page.locator('.agent-overview-example')).toBeVisible();
    await expect(page.locator('.agent-overview-actions .workshop-primary')).toHaveText('Read the foundations');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(page.locator('.agent-part-picker')).toBeHidden();
    await expect(page.locator('#overview-map-toggle')).toBeHidden();
    await expect(page.locator('#agent-overview-scene canvas')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(page.locator('[data-agent-part]')).toHaveCount(6);
    await expect(page.locator('#agent-overview-scene canvas')).toHaveCount(0);
    await page.locator('[data-agent-part="tools"]').click();
    await expect(page.locator('#agent-part-detail h3')).toHaveText('Connect reasoning to permitted actions.');
    await expect(page.locator('.agent-part-example')).toContainText('Read and edit this workshop folder.');
    await expect(page.locator('.agent-part-boundary')).toHaveText('A proposed tool call is not an executed action. A denied action is not a completed task.');
    await expect(page.locator('.agent-overview-sources a')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#agent-part-detail')).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-agent-part="tools"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#agent-part-detail h3')).toHaveText('Connect reasoning to permitted actions.');
    await expect(page.locator('#agent-overview-scene canvas')).toHaveCount(0);

    await page.locator('#overview-map-toggle').click();
    await expect(page.locator('#agent-overview-scene canvas')).toHaveCount(1);
    await expect(page.locator('#agent-overview-scene [data-stage-node="tools"]')).toHaveAttribute('aria-pressed', 'true');
    const canvas = await page.locator('#agent-overview-scene canvas').elementHandle();
    await summary.click();
    await expect(page.locator('#overview-map')).toBeHidden();
    // The retained canvas must stay still while its disclosure is closed.
    await page.waitForTimeout(150);
    const hiddenPixels = await canvas!.evaluate(node => (node as HTMLCanvasElement).toDataURL());
    await page.waitForTimeout(200);
    expect(await canvas!.evaluate(node => (node as HTMLCanvasElement).toDataURL())).toBe(hiddenPixels);
    await summary.click();
    await expect(page.locator('#overview-map')).toBeVisible();
    expect(await canvas!.evaluate(node => node === document.querySelector('#agent-overview-scene canvas'))).toBe(true);
    await expect(page.locator('[data-agent-part="tools"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#overview-map-toggle').click();
    await expect(page.locator('#overview-map')).toBeHidden();
    await page.locator('#overview-map-toggle').click();
    expect(await canvas!.evaluate(node => node === document.querySelector('#agent-overview-scene canvas'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.locator('#overview-foundations').click();
    await expect(page).toHaveURL(/#foundations$/);
    await expect(page.locator('#lesson-reader')).toBeVisible();
    await expect(page.locator('#lesson-panel .prose > p').first()).toContainText('A model maps input context to an output.');
    await expect(page.locator('.lesson-pitfall')).toBeVisible();
    for (const selector of ['#curriculum-disclosure', '#progress-disclosure', '.course-about', '.lesson-concepts', '.lesson-sources']) {
      await expect(page.locator(selector)).not.toHaveAttribute('open', '');
    }
    await expect(page.locator('#lesson-inspection')).toBeHidden();
    await expect(page.locator('#open-lesson-stage')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#lesson-summary')).toBeVisible();
    await expect(page.locator('.analogy p')).toBeVisible();
    await page.locator('#open-lesson-stage').click();
    await expect(page.locator('#lesson-inspection')).toBeVisible();
    await page.locator('#close-lesson-stage').click();
    await expect(page.locator('#lesson-inspection')).toBeHidden();
    await expect(page.locator('#open-lesson-stage')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
