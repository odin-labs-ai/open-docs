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
