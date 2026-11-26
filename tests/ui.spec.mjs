import { test, expect } from '@playwright/test';

test('the atlas opens matching sources in place and browser Back restores the overview', async ({
  page,
}) => {
  await page.goto('/ai-engineering/');
  await expect(page.locator('[data-source-browser]')).toBeHidden();
  await expect(page.locator('[data-chart-row]')).toHaveCount(12);
  await page.locator('[data-chart-segment="agents"][data-kind="course"]').click();
  await expect(page.locator('[data-source-browser]')).toBeVisible();
  await expect(page.locator('#source-topic')).toHaveValue('agents');
  await expect(page.locator('#source-type')).toHaveValue('course');
  await expect(page.locator('#source-count')).toHaveText('5 sources');
  await expect(page.locator('[data-guide-link]')).toHaveAttribute(
    'href',
    '/ai-engineering/topics/agents-and-workflows.html',
  );
  await page.reload();
  await expect(page.locator('#source-topic')).toHaveValue('agents');
  await expect(page.locator('#source-count')).toHaveText('5 sources');
  await page.goBack();
  await expect(page.locator('[data-source-browser]')).toBeHidden();
});

test('source filters, sorting, pagination and empty states work together', async ({ page }) => {
  await page.goto('/ai-engineering/library.html');
  await expect(page.locator('#source-count')).toHaveText('127 sources');
  await expect(page.locator('[data-source-row]:visible')).toHaveCount(15);
  await page.locator('#source-more').click();
  await expect(page.locator('[data-source-row]:visible')).toHaveCount(30);
  await page.locator('#source-type').selectOption('project');
  await expect(page.locator('#source-count')).toHaveText('24 sources');
  await page.locator('#source-sort').selectOption('name');
  const names = await page.locator('[data-source-row]:visible .source-title').allTextContents();
  expect(names[0]).toBe('Agents SDK for Python');
  await page.locator('#source-reset').click();
  await page.locator('#source-search').fill('Hamel');
  await expect(page.locator('#source-count')).toHaveText('2 sources');
  await page.locator('#source-search').fill('no-match-zzzzzz');
  await expect(page.locator('#source-empty')).toBeVisible();
  await expect(page.locator('.source-table-wrap')).toBeHidden();
});

test('details retain access and contribution notes, close by keyboard, and support deep links', async ({
  page,
}) => {
  await page.goto('/ai-engineering/library.html#project-smolagents');
  await expect(page.locator('#source-dialog')).toBeVisible();
  await expect(page.locator('#source-dialog-title')).toContainText(/smolagents/i);
  await expect(page.locator('#source-dialog')).toContainText('Access & source notes');
  await expect(page.locator('#source-dialog .source-visit')).toHaveAttribute(
    'href',
    /huggingface\/smolagents/,
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('#source-dialog')).toBeHidden();
  await page.locator('[data-source-details="oai-quickstart"]').click();
  await expect(page.locator('#source-dialog-title')).toHaveText('Developer quickstart');
  await page.locator('[data-source-close]').click();
  await expect(page.locator('[data-source-details="oai-quickstart"]')).toBeFocused();
});

test('themes, global search and hashed assets work without Quarto website chrome', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/ai-engineering/');
  await expect(page.locator('link[rel="stylesheet"][href^="/_astro/"]')).toHaveCount(1);
  await expect(page.locator('script[src*="quarto"]')).toHaveCount(0);
  await expect(page.locator('#source-atlas')).toHaveCSS('background-color', 'rgb(17, 17, 19)');
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#source-atlas')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.keyboard.press('/');
  await expect(page.locator('[data-search-dialog]')).toBeVisible();
  await page.locator('#site-search').fill('smolagents');
  await expect(page.locator('[data-search-results]')).toContainText(/smolagents/i);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('phone layout, navigation, table and source sheet are usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ai-engineering/');
  await page.locator('[data-chart-topic="agents"]').click();
  await expect(page.locator('#sources-title')).toBeFocused();
  await expect(page.locator('#source-count')).toHaveText('27 sources');
  expect((await page.locator('#source-mode').boundingBox()).width).toBeGreaterThan(90);
  expect((await page.locator('#source-type').boundingBox()).width).toBeGreaterThan(90);
  await page.locator('[data-source-details="oai-agents"]').click();
  await expect(page.locator('#source-dialog')).toBeVisible();
  const box = await page.locator('#source-dialog').boundingBox();
  expect(Math.round(box.width)).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await page.locator('[data-menu-toggle]').click();
  await expect(page.locator('#mobile-nav')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
