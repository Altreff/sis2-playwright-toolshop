import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true, // shards split tests, not whole files
  forbidOnly: isCI, // a forgotten test.only fails CI
  retries: isCI ? 2 : 0, // a flaky test is marked flaky, not red
  workers: isCI ? 1 : undefined, // 1 worker per shard in CI to prevent Cloudflare concurrent rate-limits
  timeout: 60000, // 60s for full E2E journeys in CI
  expect: {
    timeout: 15000,
  },
  reporter: isCI
    ? [
        ['list'],
        ['blob'], // for merging shards
        ['junit', { outputFile: 'reports/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'on-failure' }]],
  timeout: 60000, // 60s for full E2E journeys in CI
  use: {
    baseURL: process.env.BASE_URL || 'https://practicesoftwaretesting.com',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry', // trace recorded on the first retry
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20000,
    navigationTimeout: 45000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
          ],
        },
      },
    },
  ],
});
