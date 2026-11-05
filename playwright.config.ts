import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: process.env.E2E_PRODUCTION ? 'http://localhost:3100' : 'http://localhost:3000',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: process.env.E2E_PRODUCTION ? 'node --env-file=.env .output/server/index.mjs' : 'npm run dev -- --host localhost --port 3000',
    env: process.env.E2E_PRODUCTION ? { PORT: '3100', HOST: 'localhost' } : undefined,
    url: process.env.E2E_PRODUCTION ? 'http://localhost:3100/login' : 'http://localhost:3000/login',
    reuseExistingServer: !process.env.E2E_PRODUCTION,
    timeout: 180000
  }
})
