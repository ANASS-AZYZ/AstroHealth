import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'charts.spec.js',
  use: { baseURL: 'http://127.0.0.1:8790', channel: 'chrome', headless: true },
  workers: 1,
  reporter: 'list',
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 8790', url: 'http://127.0.0.1:8790', reuseExistingServer: true },
});

