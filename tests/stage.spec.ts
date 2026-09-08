import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Bound each interaction; allow the complete 72-scene GPU sweep its own total budget.
test.use({ actionTimeout: 15000 });

test('provider selection changes the engineered ecosystem and inspectable code', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('./#workshop');
  await page.locator('#inspect-workshop-run').click();
  const stage = page.locator('#workshop-scene .engineering-stage');
  await expect(stage).toHaveAttribute('data-engine', 'three');
  const observations: object[] = [];
  const layouts = new Set<string>(); const artifacts = new Set<string>();
  for (const provider of ['pi', 'factory', 'codex', 'claude', 'deepseek']) {
    await page.locator('#stage-provider').selectOption(provider);
    await expect(stage).toHaveAttribute('data-stage', `${provider}-contract`);
    layouts.add((await stage.getAttribute('data-layout'))!);
    const objects = stage.locator('.engineering-objects button');
    expect(await objects.count()).toBeGreaterThanOrEqual(5);
    const inspected: object[] = [];
    for (let i = 0; i < await objects.count(); i++) {
      await objects.nth(i).click();
      const name = await objects.nth(i).getAttribute('aria-label');
      await expect(stage.locator('.engineering-code h3')).toHaveText(name);
      const text = await stage.locator('.engineering-code pre').innerText();
      expect(text.length).toBeGreaterThan(30); artifacts.add(text);
      inspected.push({ name, asset: await objects.nth(i).getAttribute('data-asset'), file: await stage.locator('.engineering-file').innerText(), code: text });
    }
    const before = await stage.getAttribute('data-frame');
    await stage.getByRole('button', { name: 'Next event', exact: true }).click();
    expect(await stage.getAttribute('data-frame')).not.toBe(before);
    await expect(stage.locator('.engineering-code-line.highlighted').first()).toBeVisible();
    observations.push({ provider, layout: await stage.getAttribute('data-layout'), inspected });
  }
  expect(layouts.size).toBe(5); expect(artifacts.size).toBeGreaterThan(15);
  await expect(page.locator('#stage-provider option')).toHaveCount(5);
  expect(errors).toEqual([]);
  await test.info().attach('provider-code-inspection', { body: JSON.stringify(observations, null, 2), contentType: 'application/json' });
});

test('every lesson and individual deep section changes the stage and its code', async ({ page }) => {
  test.setTimeout(360000);
  await page.goto('./#foundations');
  await page.locator('#curriculum-disclosure > summary').click();
  await page.locator('#open-lesson-stage').click();
  const stage = page.locator('#lesson-theater .engineering-stage');
  await expect(stage).toHaveAttribute('data-engine', 'three');
  const ids = await page.locator('.lesson-link').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.lesson!));
  const examples = new Set<string>(); const scenes = new Set<string>(); const observations: object[] = [];
  for (const id of ids) {
    await page.locator(`[data-lesson="${id}"]`).click();
    const foundations = await stage.getAttribute('data-stage');
    await page.locator('#tab-deep').click();
    expect(await stage.getAttribute('data-stage')).not.toBe(foundations);
    for (let section = 0; section < 2; section++) {
      await page.locator(`[data-stage-section="${section}"]`).click();
      const code = await stage.locator('.engineering-code pre').innerText();
      examples.add(code); scenes.add((await stage.getAttribute('data-stage'))!);
      expect(code).not.toContain('undefined');
      expect((await stage.locator('.engineering-narrative').innerText()).length).toBeGreaterThan(100);
      const title = await stage.locator('.engineering-stage-header p').innerText();
      observations.push({ id, section, title, code });
    }
    const deep = await stage.getAttribute('data-stage');
    await page.locator('#tab-check').click(); expect(await stage.getAttribute('data-stage')).not.toBe(deep);
  }
  expect(ids).toHaveLength(18); expect(scenes.size).toBe(36); expect(examples.size).toBe(36);
  await test.info().attach('section-code-inspection', { body: JSON.stringify(observations, null, 2), contentType: 'application/json' });
});

test('stage code and timelines survive unavailable renderer and retain mobile accessibility', async ({ page }) => {
  await page.route(/\/(?:src\/stage-renderer\.ts|assets\/stage-renderer-[^/]+\.js)(?:\?.*)?$/, route => route.abort());
  await page.goto('./#workshop');
  await page.locator('#inspect-workshop-run').click();
  const stage = page.locator('#workshop-scene .engineering-stage');
  await expect(stage.locator('.engineering-fallback')).toBeVisible();
  await page.locator('#stage-provider').selectOption('pi');
  await stage.getByRole('button', { name: 'Next event', exact: true }).click();
  await expect(stage.locator('.engineering-code pre')).toBeVisible();
  await expect(stage).toHaveAttribute('data-stage', 'pi-contract');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
});
