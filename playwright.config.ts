import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL ?? 'http://localhost:4173'

export default defineConfig({
  testDir: 'e2e',
  // Every world spec renders WebGL in software; the default (half the cores) starves the page of CPU and
  // trips 30 s deep-link timeouts. A fixed small pool keeps frame timing, and so the settle helpers, stable.
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 6,
  use: { baseURL, channel: 'chromium' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  ...(process.env.BASE_URL
    ? {}
    : {
        webServer: {
          command: 'npm run build && npx vite preview --port 4173',
          url: 'http://localhost:4173',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
})
