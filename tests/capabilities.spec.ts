import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const entries = [
  ['annotation', 'Annotation and visual intent'], ['swarm', 'Swarm and coordination'],
  ['goals', 'Goals and continuity'], ['skills', 'Skills and composition'],
  ['memory', 'Memory and grounding'], ['odin-next', 'Odin Next and grounded action'],
  ['intelligence-systems', 'Intelligence Systems and outcome learning'], ['media', 'Media and artifacts'],
];

for (const width of [1440, 390, 320]) {
  test(`eight capability guides are navigable and readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('./#learn');
    await page.getByRole('link', { name: 'Explore Odin’s capabilities' }).click();
    await expect(page).toHaveURL(/#reference\/capabilities$/);
    await expect(page.locator('[data-capability]')).toHaveCount(8);
    await expect(page.locator('.mode-nav button')).toHaveCount(4);
    for (const [id, title] of entries) {
      await page.locator(`[data-capability="${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#reference/capabilities/${id}$`));
      await expect(page.locator('#capability-detail-title')).toHaveText(title);
      await expect(page.locator('#capability-detail-title')).toBeFocused();
      await expect(page.locator('#capability-detail-title')).toBeInViewport();
      for (const heading of ['Before you begin', 'In the CLI', 'In Code Server and your workspace', 'What to verify', 'Limits to keep in view']) {
        await expect(page.locator('#capability-detail').getByRole('heading', { name: heading, exact: true })).toBeVisible();
      }
      await expect(page.locator(`[data-capability="${id}"]`)).toHaveAttribute('aria-current', 'page');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await page.getByRole('button', { name: 'See all capability guides' }).click();
    await expect(page.locator('#capability-detail')).toBeHidden();
    await expect(page.locator('#capabilities-title')).toBeFocused();
    const audit = await new AxeBuilder({ page }).include('.odin-capabilities').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
  });
}

test('a direct guide link survives reload and history without changing course progress', async ({ page }) => {
  await page.goto('./#reference/capabilities/memory');
  await expect(page.locator('#capability-detail-title')).toHaveText('Memory and grounding');
  await page.reload();
  await expect(page.locator('#capability-detail-title')).toHaveText('Memory and grounding');
  await page.locator('[data-capability="skills"]').click();
  await page.goBack();
  await expect(page.locator('#capability-detail-title')).toHaveText('Memory and grounding');
  await page.goForward();
  await expect(page.locator('#capability-detail-title')).toHaveText('Skills and composition');
  await page.getByRole('button', { name: 'Reference', exact: true }).click();
  await expect(page.locator('#concept-index button')).toHaveCount(111);
  await page.getByRole('button', { name: 'Lessons', exact: true }).click();
  await expect(page.locator('.lesson-link')).toHaveCount(18);
  await expect(page.locator('#progress-count')).toHaveText('0 / 18');
});

test('unknown, encoded and extra-path slugs refuse a guide and offer a recovery path', async ({ page }) => {
  for (const slug of ['unknown', '%3Cimg%20src=x%3E', 'memory/extra', '']) {
    await page.goto(`./#reference/capabilities/${slug}`);
    await expect(page.locator('#capability-detail-title')).toHaveText('Guide not found');
    await expect(page.locator('[data-capability][aria-current]')).toHaveCount(0);
    await expect(page.locator('#capability-detail img')).toHaveCount(0);
    await page.getByRole('button', { name: 'See all capability guides' }).click();
    await expect(page).toHaveURL(/#reference\/capabilities$/);
    await page.locator('[data-capability="annotation"]').click();
    await expect(page.locator('#capability-detail-title')).toHaveText('Annotation and visual intent');
  }
});

test('downloadable report and diagram contain the guides and their limits', async ({ page }) => {
  await page.goto('./#reference/capabilities');
  const reportLink = page.getByRole('link', { name: 'Download the capability guide' });
  const pending = page.waitForEvent('download');
  await reportLink.click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('odin-capability-guide.md');
  const report = await page.request.get(new URL((await reportLink.getAttribute('href'))!, page.url().split('#')[0]).href);
  expect(report.ok()).toBeTruthy();
  const text = await report.text();
  for (const [id, title] of entries) {
    expect(text).toContain(`## ${title}`);
    expect(text).toContain(`#reference/capabilities/${id}`);
  }
  expect(text.match(/### Before you begin/g)).toHaveLength(8);
  expect(text.match(/### Limits to keep in view/g)).toHaveLength(8);
  expect(text).toContain('not a live runtime report');
  expect(text).toContain('/skills search review');
  expect(text).toContain('/goal status');
  expect(text).not.toMatch(/github\.com\/odin-labs-ai|\b(?:77\.42\.80\.233|136\.243\.18\.36)\b|\/opt\/odin/);
  const diagramLink = page.getByRole('link', { name: 'Download the mechanism diagram' });
  const diagram = await page.request.get(new URL((await diagramLink.getAttribute('href'))!, page.url().split('#')[0]).href);
  expect(diagram.ok()).toBeTruthy();
  expect(await diagram.text()).toContain('not a connected deployment');
  await page.locator('.capability-mechanism > summary').click();
  await expect(page.locator('.capability-mechanism img')).toHaveJSProperty('complete', true);
  expect(await page.locator('.capability-mechanism img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});
