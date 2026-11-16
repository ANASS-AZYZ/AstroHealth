import { defineConfig } from '@playwright/test';
import process from 'node:process';
export default defineConfig({
  testDir:'./tests/browser',
  use:{baseURL:'http://127.0.0.1:8788',channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true},
  workers:1,
  reporter:'list',
});
