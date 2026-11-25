import { defineConfig } from '@playwright/test';

const scenario = process.env.E2E_SCENARIO ?? 'ready';
if (!['ready', 'degraded', 'outage'].includes(scenario)) {
  throw new Error('E2E_SCENARIO must be ready, degraded or outage');
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: scenario === 'outage' ? '**/outage.spec.ts' : '**/connected.spec.ts',
  timeout: 30000,
  expect: { timeout: 5000 },
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    browserName: 'chromium',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
