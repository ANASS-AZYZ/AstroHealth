import { test, expect } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handle } from '../../functions/_lib/handler.js';

test.beforeEach(async ({ page }, testInfo) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../../migrations/0001_sessions.sql', import.meta.url), 'utf8'));
  const env = { ASTROHEALTH_DB: { prepare(query) { return { bind(...args) { return {
    async first() { return sql.prepare(query).get(...args) || null; },
    async run() { return { meta: { changes: Number(sql.prepare(query).run(...args).changes) } }; },
  }; } }; } } };
  let cookie = '';
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const response = await handle(new Request(`http://localhost${url.pathname}${url.search}`, {
      method: request.method(), headers: { cookie }, body: request.postData() || undefined,
    }), env);
    if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    const body = await response.json();
    if (url.pathname === '/api/analytics/summary' && testInfo.title.includes('predictions are absent')) body.predictions = [];
    await route.fulfill({ status: response.status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  page.once('close', () => sql.close());
});

async function chartsVisible(page, count = 5) {
  await expect(page.locator('.chart-card .recharts-surface')).toHaveCount(count);
  for (let index = 0; index < count; index += 1) {
    const chart = page.locator('.chart-card .recharts-surface').nth(index);
    await expect(chart).toBeVisible();
    await expect.poll(async () => {
      const box = await chart.boundingBox();
      return Boolean(box && box.width > 0 && box.height > 0);
    }).toBe(true);
  }
}

test('fresh dashboard displays baseline points and generates trends without visiting simulator', async ({ page }) => {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  // Hold advancement until the baseline chart is checked, without a timing assumption.
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/mission/advance', async route => { await gate; await route.fallback(); });
  await page.goto('/');
  await chartsVisible(page);
  await expect(page.locator('.recharts-line-dot, .recharts-area-dot')).toHaveCount(5);
  release();
  await expect(page.locator('.recharts-line-curve').first()).toHaveAttribute('d', /L|C/, { timeout: 15000 });
  await page.getByRole('link', { name: 'Mars simulator', exact: true }).click();
  await chartsVisible(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('.sim-status')).toContainText('PAUSED');
  await page.getByRole('link', { name: 'AI health analytics', exact: true }).click();
  await chartsVisible(page);
  await page.goBack();
  await chartsVisible(page);
  expect(failures).toEqual([]);
});

for (const path of ['/mission-simulator', '/health-analytics', '/astronaut-health', '/live-monitoring']) {
  test(`direct initial mount and responsive resize: ${path}`, async ({ page }) => {
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.goto(path);
    await chartsVisible(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await chartsVisible(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(failures).toEqual([]);
  });
}

test('analytics renders observed history even when predictions are absent', async ({ page }) => {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  // Seed real history through the same API handler before opening analytics.
  await page.goto('/mission-simulator');
  await expect(page.locator('.updated')).not.toContainText('0 observations');
  await page.getByRole('link', { name: 'AI health analytics', exact: true }).click();
  await chartsVisible(page);
  expect(failures).toEqual([]);
});

test('digital twin loads its model on a direct visit and after route navigation', async ({ page }) => {
  await page.goto('/digital-twin');
  await expect(page.locator('.astronaut-stage canvas')).toBeVisible();
  await expect(page.locator('.model-state')).toHaveCount(0, { timeout: 20000 });
  await page.getByRole('link', { name: 'Mars simulator', exact: true }).click();
  await chartsVisible(page);
  await page.goBack();
  await expect(page.locator('.astronaut-stage canvas')).toBeVisible();
  await expect(page.locator('.model-state')).toHaveCount(0);
});



test('comparison chart appears as soon as comparison data arrives', async ({ page }) => {
  await page.goto('/mission-intelligence');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.locator('.comparison-chart .recharts-line-curve')).toHaveCount(2);
  await expect(page.locator('.comparison-chart .recharts-surface')).toBeVisible();
});
