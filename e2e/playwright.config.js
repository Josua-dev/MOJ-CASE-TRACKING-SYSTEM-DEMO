// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for MOJ Case Tracker E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: ['**/*.spec.js'],
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  outputDir: 'test-results',

  /* Optional: uncomment to auto-start the backend + frontend */
  // webServer: {
  //   command: 'cd ../backend && node server.js',
  //   port: 5000,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30000,
  // },
});
