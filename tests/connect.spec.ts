import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Every journey in Open Docs should lead somewhere on odin-labs.ai.
const site = 'https://odin-labs.ai/';
const guideNextSteps: [string, string, string][] = [
  ['annotation', `${site}contact/`, `${site}products/`],
  ['swarm', `${site}contact/`, `${site}products/`],
  ['goals', `${site}contact/`, `${site}products/`],
  ['skills', `${site}products/harness/`, `${site}contact/#product-harness`],
  ['memory', `${site}products/odin-next/`, `${site}contact/#product-odin-next`],
  ['odin-next', `${site}products/odin-next/`, `${site}contact/#product-odin-next`],
  ['intelligence-systems', `${site}products/odin-next/`, `${site}contact/#product-odin-next`],
  ['media', `${site}contact/`, `${site}products/`],
];

for (const width of [1440, 390, 320]) {
  test(`header and footer lead back to odin-labs.ai at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./#learn');
    for (const mode of ['learn', 'explore', 'lab', 'reference']) {
      await page.locator(`[data-mode="${mode}"]`).click();
      const home = page.getByRole('link', { name: 'Back to odin-labs.ai' });
      await expect(home).toBeVisible();
      await expect(home).toHaveAttribute('href', site);
      const box = (await home.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    const footer = page.locator('.page-footer');
    await expect(footer.getByRole('link', { name: 'Open Docs is part of odin-labs.ai' })).toHaveAttribute('href', site);
    for (const [name, href] of [['Products', 'products/'], ['Talk to Odin', 'contact/'], ['Trust & control', 'trust/'], ['Research', 'research/']]) {
      await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', `${site}${href}`);
    }
    await expect(page.locator('a[href*="www.odin-labs.ai"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test('every capability guide ends with a concrete Odin next step', async ({ page }) => {
  await page.goto('./#reference/capabilities');
  for (const [name, href] of [['AI Gateway', 'gateway'], ['Harness', 'harness'], ['Command Center', 'command-center'], ['Odin Next', 'odin-next']]) {
    await expect(page.locator('.capabilities-products').getByRole('link', { name, exact: true })).toHaveAttribute('href', `${site}products/${href}/`);
  }
  for (const [id, primary, secondary] of guideNextSteps) {
    await page.locator(`[data-capability="${id}"]`).click();
    const next = page.locator('#capability-detail .odin-next-step');
    await expect(next.getByRole('heading', { name: 'Next step with Odin' })).toBeVisible();
    await expect(next.locator('a').nth(0)).toHaveAttribute('href', primary);
    await expect(next.locator('a').nth(1)).toHaveAttribute('href', secondary);
    await expect(next.locator('.odin-distinction')).toHaveCount(id === 'skills' ? 1 : 0);
  }
  const audit = await new AxeBuilder({ page }).include('#capability-detail').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`the workshop end offers Odin beside the provider options at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./#workshop');
    await page.locator('#provider-transfer-disclosure > summary').click();
    const odin = page.locator('.workshop-odin');
    await expect(odin.getByRole('heading', { name: 'Or run it with Odin.' })).toBeVisible();
    await expect(odin).toContainText('Harness engineering is the discipline these docs teach. Odin Harness is Odin’s product for it');
    await expect(odin.getByRole('link', { name: 'Run this with Odin: Harness' })).toHaveAttribute('href', `${site}products/harness/`);
    await expect(odin.getByRole('link', { name: 'Talk to Odin' })).toHaveAttribute('href', `${site}contact/#product-harness`);
    await expect(page.locator('#download-workshop')).toBeVisible();
    await expect(page.locator('.provider-tabs button')).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const audit = await new AxeBuilder({ page }).include('#provider-transfer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
  });
}

test('the workshop reset confirmation reverts when not confirmed', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#workshop');
  const reset = page.locator('#reset-workshop');
  await reset.click();
  await expect(reset).toHaveText('Confirm: reset these five discoveries');
  await page.clock.runFor(7100);
  await expect(reset).toHaveText('Start this workshop again');
});

test('each view names itself in the document title', async ({ page }) => {
  await page.goto('./#learn');
  await expect(page).toHaveTitle('Harness engineering · Odin Open Docs');
  await page.goto('./#workshop');
  await expect(page).toHaveTitle('Hands-on workshop · Odin Open Docs');
  await page.goto('./#repository');
  await expect(page).toHaveTitle('The repository is part of the harness · Lessons · Odin Open Docs');
  await page.locator('#next-lesson').click();
  await expect(page).toHaveTitle(/^(?!The repository).+ · Lessons · Odin Open Docs$/);
  await page.locator('[data-mode="lab"]').click();
  await expect(page).toHaveTitle('Experiments · Odin Open Docs');
  await page.goto('./#reference/capabilities/memory');
  await expect(page).toHaveTitle('Memory and grounding · Reference · Odin Open Docs');
  await page.goto('./#reference/capabilities');
  await expect(page).toHaveTitle('What can you do with Odin? · Reference · Odin Open Docs');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://odin-labs-ai.github.io/open-docs/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Odin Open Docs/);
});

test('an unknown address explains itself and lands on Start here', async ({ page }) => {
  await page.goto('./#does-not-exist');
  await expect(page).toHaveURL(/#learn$/);
  await expect(page.locator('#learn-view')).toBeVisible();
  await expect(page.locator('#notification')).toBeVisible();
  await expect(page.locator('#notification')).toContainText('There is no page at “#does-not-exist”');
  await page.goto('./#workshop');
  await expect(page.locator('#notification')).toBeHidden();
});

test('the 404 forwarder knows exactly the app’s routes', async ({ page, request }) => {
  await page.goto('./#learn');
  const lessonIds = [...new Set(await page.locator('[data-lesson]').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.lesson!)))];
  const capabilityIds = await page.locator('[data-capability]').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.capability!));
  const response = await request.get(new URL('404.html', page.url().split('#')[0]).href);
  expect(response.ok()).toBeTruthy();
  const forwarder = await response.text();
  const list = (name: string) => JSON.parse(forwarder.match(new RegExp(`var ${name} = (\\[[^\\]]*\\]);`))![1].replace(/'/g, '"')) as string[];
  expect(list('lessons')).toEqual(lessonIds);
  expect(list('capabilities')).toEqual(capabilityIds);
  expect(list('views')).toEqual(['learn', 'workshop', 'lab', 'reference', 'workspace']);
  for (const path of ['robots.txt', 'sitemap.xml']) {
    const file = await request.get(new URL(path, page.url().split('#')[0]).href);
    expect(file.ok(), path).toBeTruthy();
  }
});

test('on the deployed site a hash-less link reaches its page', async ({ page }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'GitHub Pages serves 404.html only on the real deployment; static-smoke covers it locally.');
  const base = new URL('./', process.env.PLAYWRIGHT_BASE_URL!).href;
  await page.goto(new URL('repository', base).href);
  await expect(page).toHaveURL(new URL('#repository', base).href);
  await expect(page.locator('#lesson-title')).toHaveText('The repository is part of the harness');
  await page.goto(new URL('no/such/page', base).href);
  await expect(page).toHaveURL(new URL('#learn', base).href);
});
