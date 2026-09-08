import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`workshop detours preserve the experiment, location and browser history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./#learn');
    await expect(page.locator('#workshop-host')).toBeHidden();
    await page.locator('#overview-workshop').click();
    await expect(page).toHaveURL(/#workshop$/);
    await expect(page.locator('#agent-overview-host')).toBeHidden();
    await expect(page.locator('#workshop-inspection')).toBeHidden();
    await page.locator('[data-prediction="0"]').click();
    await page.locator('#run-workshop').click();
    await expect(page.locator('#workshop-reflection')).toBeHidden();
    await page.locator('#change-workshop-configuration').click();
    await expect(page.locator('[data-prediction="0"]')).toBeFocused();
    await page.locator('[data-prediction="1"]').click();
    await page.locator('#run-workshop').click();
    await page.locator('[data-reflection="0"]').click();
    await expect(page.locator('#workshop-next')).toBeEnabled();
    const artifact = await page.locator('#workshop-document').textContent();
    await page.locator('#workshop-deeper').scrollIntoViewIfNeeded();
    const workshopY = await page.evaluate(() => scrollY);
    await page.locator('#workshop-deeper').click();
    await expect(page).toHaveURL(/#intent$/);
    await expect(page.locator('#return-to-workshop')).toBeInViewport();
    await page.locator('#tab-deep').click();
    await page.locator('#tab-check').click();
    await page.goBack();
    await expect(page).toHaveURL(/#workshop$/);
    await expect(page.locator('#workshop-document')).toHaveText(artifact!);
    await expect(page.locator('#workshop-next')).toBeEnabled();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(workshopY, -1);
    await page.goForward();
    await expect(page).toHaveURL(/#intent$/);
    await expect(page.locator('#tab-check')).toHaveAttribute('aria-selected', 'true');
    await page.locator('#return-to-workshop').click();
    await expect(page).toHaveURL(/#workshop$/);
    await expect(page.locator('#workshop-deeper')).toBeFocused();
    await expect(page.locator('#workshop-document')).toHaveText(artifact!);
    await expect(page.locator('#workshop-next')).toBeEnabled();
    await page.locator('#workshop-next').click();
    await expect(page.locator('.workshop-heading h2')).toHaveText('Pack a useful briefing.');
    await expect(page.locator('.workshop-heading')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('skip links stay in the active view and reloaded lessons do not promise an in-memory experiment', async ({ page }) => {
  await page.goto('./#workshop');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#workshop$/);
  await expect(page.locator('#workshop-entry')).toBeFocused();
  await page.locator('[data-prediction="1"]').click();
  await page.locator('#run-workshop').click();
  await page.locator('#workshop-deeper').click();
  await expect(page.locator('#return-to-workshop')).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/#intent$/);
  await expect(page.locator('#workshop-return')).toBeHidden();
});
