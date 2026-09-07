import { test, expect } from '@playwright/test';

test('public navigation, official mark and downloads work without an identity backend', async ({ page }) => {
  const errors: string[] = [], privateRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/\/(api\/auth|api\/tenants|login)(\/|\?|$)/.test(request.url())) privateRequests.push(request.url());
  });
  await page.goto('./#learn');
  await expect(page.locator('.brand')).toContainText('Open Docs');
  await expect(page.locator('.brand img')).toHaveJSProperty('complete', true);
  expect(await page.locator('.brand img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('#stage-provider option')).toHaveCount(5);
  await expect(page.locator('[data-mode="workspace"]')).toHaveCount(0);
  for (const mode of ['explore', 'lab', 'reference', 'learn']) {
    await page.locator(`[data-mode="${mode}"]`).click();
    await expect(page.locator(`#${mode}-view`)).toBeVisible();
  }
  await page.goto('./#workspace');
  await expect(page.locator('#reference-view')).toBeVisible();
  for (const path of ['odin-logo.svg', 'workshop.zip', 'workshop/verify.mjs', 'references/odin-conventions.md']) {
    const response = await page.request.get(new URL(path, page.url().split('#')[0]).href);
    expect(response.ok(), path).toBeTruthy();
  }
  await page.locator('.brand').click();
  await expect(page.locator('#learn-view')).toBeVisible();
  expect(privateRequests).toEqual([]);
  expect(errors).toEqual([]);
});

for (const width of [320, 390]) {
  test(`public mobile navigation stays in one row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./#learn');
    const buttons = page.locator('.mode-nav button');
    await expect(buttons).toHaveCount(4);
    const boxes = await buttons.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top, height: rect.height, right: rect.right };
    }));
    expect(new Set(boxes.map(box => box.top)).size).toBe(1);
    expect(boxes.every(box => box.height >= 44 && box.right <= width)).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
