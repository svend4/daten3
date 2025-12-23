import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * For testing full user flows through the API
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests serially to avoid database conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid database conflicts
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env.API_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  projects: [
    {
      name: 'api-e2e',
      testMatch: /.*\.e2e\.ts/,
    },
  ],
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
});
