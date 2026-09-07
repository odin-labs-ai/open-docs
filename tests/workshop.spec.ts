import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { unzipSync } from 'fflate';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const original = '# Welcomme\n\nFind answers in our [FAQ](./faq.md).\n';
const corrected = '# Welcome\n\nFind answers in our [FAQ](./faq.md).\n';

async function openWorkshop(page: Page) {
  await page.goto('./#learn');
  await expect(page.getByRole('heading', { name: 'Make your first agent loop click.' })).toBeVisible();
  await expect(page.locator('#run-workshop')).toBeDisabled();
}

// Answers and observations follow the rendered task contract, not imported answer keys.
const discoveries = [
  {
    title: 'Give the agent a finish line.', prediction: 'Fix one typo, preserve the link, and check the file.',
    wrongReflection: 'It asked the model to sound more certain.', reflection: 'It named the change, the boundary, and the evidence.',
    failure: 'The request has no reliable acceptance test.', success: 'A testable finish line is now attached.',
    correct: async (page: Page) => { await page.locator('#workshop-contract').selectOption('scoped'); },
  },
  {
    title: 'Pack a useful briefing.', prediction: 'The task file and the short project rules.',
    wrongReflection: 'Small prompts are always better.', reflection: 'It preserved the facts and rules needed for this particular task.',
    failure: 'This briefing is not ready for the task.', success: 'The briefing fits and contains what matters.',
    correct: async (page: Page) => { await page.locator('[data-context-source="archive"]').uncheck(); await page.locator('[data-context-source="rules"]').check(); },
  },
  {
    title: 'Put a boundary before the tool.', prediction: 'The runtime refuses the export before execution.',
    wrongReflection: 'After the data had already left.', reflection: 'At the runtime permission check, before the tool.',
    failure: 'Export denied before execution.', success: 'One authorized edit executed.',
    correct: async (page: Page) => { await page.locator('#workshop-operation').selectOption('edit'); },
  },
  {
    title: 'Look at the work, not the promise.', prediction: 'No. The artifact broke the contract.',
    wrongReflection: 'A friendly final message.', reflection: 'The corrected file and a passing independent check.',
    failure: 'FAIL: the link changed despite the success claim.', success: 'PASS: the artifact meets the contract.',
    correct: async (page: Page) => { await page.locator('#workshop-artifact').selectOption('correct'); },
  },
  {
    title: 'Leave a trustworthy handover.', prediction: 'Recover the operation ID and inspect the actual state.',
    wrongReflection: 'Crashes can never cause duplicates.', reflection: 'The same operation identity was reconciled instead of creating a new one.',
    failure: 'Two operation records for one intended edit.', success: 'Recovered: one logical operation, with evidence.',
    correct: async (page: Page) => { await page.locator('#workshop-recovery').selectOption('checkpoint'); },
  },
];

test('beginner completes five discoveries through failed and corrected runs, explanations, and persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openWorkshop(page);
  await expect(page.locator('[data-workshop-step="1"]')).toBeDisabled();
  await expect(page.locator('#workshop-document')).toHaveText(original);
  const observations: { title: string; before: string; after: string }[] = [];

  for (const [index, discovery] of discoveries.entries()) {
    await expect(page.getByRole('heading', { name: discovery.title, exact: true })).toBeVisible();
    await expect(page.locator('#workshop-scene')).toHaveAttribute('data-engine', 'three');
    await expect(page.locator('#workshop-scene .engineering-stage')).toHaveAttribute('data-stage', new RegExp(['contract', 'context', 'permissions', 'verification', 'recovery'][index]));
    await expect(page.locator('#run-workshop')).toBeDisabled();
    await expect(page.locator('#workshop-next')).toBeDisabled();
    await page.getByRole('button', { name: discovery.prediction, exact: true }).click();
    if (index === 0) await page.locator('#workshop-contract').selectOption('broad');
    await page.locator('#run-workshop').click();
    await expect(page.locator('#workshop-result')).toContainText(discovery.failure);
    await expect(page.locator('#workshop-scene .engineering-narrative h3')).toHaveText(discovery.failure);
    const before = await page.locator('#workshop-result').innerText();
    if (index === 2) {
      await expect(page.locator('#workshop-result')).toContainText('No export occurred');
      await expect(page.locator('#workshop-scene .engineering-objects button[data-state=blocked]')).toHaveCount(1);
      await expect(page.locator('#workshop-document')).toHaveText(original);
    }
    if (index === 3) await expect(page.locator('#workshop-document')).toContainText('./missing.md');
    await page.getByRole('button', { name: discovery.reflection, exact: true }).click();
    await expect(page.locator('#reflection-feedback')).toContainText('Correct the failed run');
    await expect(page.locator('#workshop-next')).toBeDisabled();
    await discovery.correct(page);
    await expect(page.locator('#workshop-result')).toContainText('controls changed');
    await expect(page.locator('#workshop-reflection')).toBeHidden();
    await page.locator('#run-workshop').click();
    await expect(page.locator('#workshop-result')).toContainText(discovery.success);
    await expect(page.locator('#workshop-scene .engineering-narrative h3')).toHaveText(discovery.success);
    if (index === 2) await expect(page.locator('#workshop-scene .engineering-objects button[data-state=passed]')).toHaveCount(1);
    if (index !== 1) await expect(page.locator('#workshop-document')).toHaveText(corrected);
    if (index === 1) await expect(page.locator('#workshop-result')).toContainText('3 / 4 teaching units used');
    await page.getByRole('button', { name: discovery.wrongReflection, exact: true }).click();
    await expect(page.locator('#reflection-feedback')).toContainText('Revisit the observed result');
    await expect(page.locator('#workshop-next')).toBeDisabled();
    await page.getByRole('button', { name: discovery.reflection, exact: true }).click();
    await expect(page.locator('#reflection-feedback')).toContainText('connected the result to the mechanism');
    await expect(page.locator('#workshop-progress')).toContainText(`${index + 1} / 5 discoveries completed`);
    observations.push({ title: discovery.title, before, after: await page.locator('#workshop-result').innerText() });
    await page.locator('#workshop-next').click();
  }

  await expect(page.locator('#provider-transfer')).toBeInViewport();
  await page.reload();
  await expect(page.locator('#workshop-progress')).toContainText('5 / 5 discoveries completed');
  await expect(page.locator('[data-workshop-step="4"]')).toHaveAttribute('aria-current', 'step');
  await page.locator('#reset-workshop').click();
  await expect(page.locator('#workshop-progress')).toContainText('5 / 5');
  await page.locator('#reset-workshop').click();
  await expect(page.locator('#workshop-progress')).toContainText('0 / 5');
  await expect(page.locator('[data-workshop-step="1"]')).toBeDisabled();
  await test.info().attach('beginner-observations', { body: JSON.stringify(observations, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('provider transfer guides distinguish models and harnesses; all guides work publicly', async ({ page }) => {
  await openWorkshop(page);
  const providers = [
    ['codex', 'Codex', 'codex', 'AGENTS.md'],
    ['claude', 'Claude Code', 'claude', 'CLAUDE.md'],
    ['pi', 'Pi', 'pi', 'AGENTS.md'],
    ['deepseek', 'DeepSeek + Pi', 'pi', 'loaded by Pi'],
    ['factory', 'Factory Droid', 'droid', 'AGENTS.md'],
  ];
  for (const [id, name, command, instructions] of providers) {
    await page.locator(`[data-provider="${id}"]`).click();
    await expect(page.locator('#provider-content h3')).toHaveText(name);
    await expect(page.locator('.provider-command code')).toHaveText(command);
    await expect(page.locator('.instructions-file')).toContainText(instructions);
    await expect(page.locator('#provider-content .provider-sources a').first()).toHaveAttribute('href', /^https:\/\//);
    await expect(page.locator('.fixture-note')).toContainText(`It does not run ${name}`);
    if (id === 'pi') await expect(page.locator('#provider-content')).toContainText('no permission popups');
    if (id === 'deepseek') await expect(page.locator('#provider-content')).toContainText('not the CLI or the permission boundary');
  }
  await page.reload();
  await expect(page.locator('#provider-content h3')).toHaveText('Factory Droid');
  await expect(page.locator('[data-mode="workspace"]')).toHaveCount(0);
});

test('downloaded starter ZIP is runnable and independently rejects wrong artifacts', async ({ page }) => {
  await openWorkshop(page);
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#download-workshop').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('odin-first-harness.zip');
  const path = await download.path();
  expect(path).toBeTruthy();
  const files = unzipSync(new Uint8Array(await readFile(path!)));
  expect(Object.keys(files).sort()).toEqual(['AGENTS.md', 'CLAUDE.md', 'README.md', 'faq.md', 'help.md', 'verify.mjs'].sort());
  const directory = await mkdtemp(join(tmpdir(), 'odin-downloaded-workshop-'));
  try {
    for (const [name, content] of Object.entries(files)) await writeFile(join(directory, name), content);
    const verify = () => spawnSync(process.execPath, ['verify.mjs'], { cwd: directory, encoding: 'utf8' });
    expect(await readFile(join(directory, 'help.md'), 'utf8')).toBe(original);
    expect(verify().status).toBe(1);
    await writeFile(join(directory, 'help.md'), corrected);
    const result = verify();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PASS:');
    await writeFile(join(directory, 'help.md'), corrected.replace('./faq.md', './missing.md'));
    expect(verify().status).toBe(1);
    await writeFile(join(directory, 'help.md'), corrected);
    await writeFile(join(directory, 'faq.md'), 'Unexpected change');
    expect(verify().status).toBe(1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('beginner workshop stays readable and accessible on desktop and mobile with reduced motion', async ({ page }) => {
  await openWorkshop(page);
  for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#workshop-scene').getByRole('button', { name: 'Play sequence', exact: true })).toHaveAttribute('aria-pressed', 'false');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    await test.info().attach(`beginner-${viewport.width}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
  const prediction = page.getByRole('button', { name: 'Fix one typo, preserve the link, and check the file.', exact: true });
  await prediction.focus();
  await page.keyboard.press('Enter');
  await expect(prediction).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#run-workshop')).toBeEnabled();
});

test('unavailable WebGL preserves the beginner task and evidence', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return getContext.call(this, type, ...args);
    } as typeof getContext;
  });
  await openWorkshop(page);
  await expect(page.locator('#workshop-scene .engineering-fallback')).toContainText('3D is unavailable');
  await page.getByRole('button', { name: discoveries[0].prediction, exact: true }).click();
  await discoveries[0].correct(page);
  await page.locator('#run-workshop').click();
  await expect(page.locator('#workshop-result')).toContainText(discoveries[0].success);
  await expect(page.locator('#workshop-document')).toHaveText(corrected);
  await page.getByRole('button', { name: discoveries[0].reflection, exact: true }).click();
  await expect(page.locator('#workshop-next')).toBeEnabled();
  await page.locator('#workshop-capture').click();
  await expect(page.locator('#scene-explanation')).toContainText('Image capture is unavailable');
});
