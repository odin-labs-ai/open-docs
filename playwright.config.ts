import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: false, workers: 1, timeout: 180000, expect: { timeout: 15000 },
  outputDir: 'test-results',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4329', headless: true, channel: 'chromium', reducedMotion: 'reduce', viewport: { width: 1440, height: 1100 } },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'pnpm preview', url: 'http://127.0.0.1:4329', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
