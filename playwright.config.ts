import { defineConfig, devices } from '@playwright/test';

// E2E against the production build served by `vite preview` (production CSP included).
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4173', trace: 'off' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 }, browserName: 'chromium' } },
  ],
});
