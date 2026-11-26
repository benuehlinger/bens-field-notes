import { test, expect } from '@playwright/test';

test('the portfolio introduces Ben and links to all three areas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ben Uehlinger' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About me' })).toBeVisible();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Ben Uehlinger | Portfolio',
  );
  for (const [link, heading] of [
    ['AI Engineering Field Notes', 'Applied AI'],
    ['Lending Data Lake', 'Data Engineering'],
    ['Credit Risk Research', 'Data Science'],
  ]) {
    await page
      .locator('.portfolio-rows')
      .getByRole('link', { name: new RegExp(link) })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await page.goBack();
  }

  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Data Engineering' })
    .click();
  await page.getByRole('link', { name: 'Explore the Lending Data Lake' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lending Data Lake' })).toBeVisible();
});

test.describe('the portfolio hero with scripts disabled', () => {
  test.use({ javaScriptEnabled: false });

  for (const [device, viewport, reducedMotion] of [
    ['desktop', { width: 1440, height: 900 }, 'no-preference'],
    ['phone', { width: 390, height: 844 }, 'no-preference'],
    ['phone', { width: 390, height: 844 }, 'reduce'],
  ]) {
    test(`cycles on ${device} with reduced motion set to ${reducedMotion}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const visible = page.locator('.portfolio-phrase:visible');
      for (const label of ['Applied AI', 'Data Engineering', 'Data Science', 'Applied AI']) {
        await expect(visible).toHaveText(label);
      }

      const pause = page.getByRole('checkbox', { name: 'Pause rotating text' });
      await pause.focus();
      await page.keyboard.press('Space');
      await expect(pause).toBeChecked();
      await expect(visible).toHaveCSS('animation-play-state', 'paused');
      await page.keyboard.press('Space');
      await expect(pause).not.toBeChecked();
      await expect(visible).toHaveCSS('animation-play-state', 'running');
    });
  }
});

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

test('the reading desk separates reading, release checks and discovery with shareable views', async ({
  page,
}) => {
  await page.goto('/ai-engineering/keep-up.html');
  await expect(page.locator('[data-desk-panel]:visible')).toHaveCount(1);
  await expect(page.locator('[data-desk-panel="read"]')).toContainText('Simon Willison');
  await page.locator('[data-desk-choice="check"]').click();
  await expect(page).toHaveURL(/view=check/);
  await expect(page.locator('[data-desk-choice="check"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-desk-panel="check"]')).toBeVisible();
  await expect(page.locator('[data-desk-panel="read"]')).toBeHidden();
  await page.locator('[data-desk-panel="check"] details').first().locator('summary').click();
  await expect(page.locator('[data-desk-panel="check"] details').first()).toContainText(
    'regression cases',
  );
  await page.reload();
  await expect(page.locator('[data-desk-panel="check"]')).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-desk-panel="read"]')).toBeVisible();
  await page.locator('[data-desk-choice="discover"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-desk-panel="discover"]')).toContainText('OpenReview');
  await page.getByRole('link', { name: 'Browse the watchlist' }).click();
  await expect(page.locator('#source-mode')).toHaveValue('keep-up');
});

test('participation connects concrete actions with real contribution and community routes', async ({
  page,
}) => {
  await page.goto('/ai-engineering/get-involved.html');
  const contribution = page.locator('[data-desk-panel="contribute"]');
  await expect(contribution).toBeVisible();
  await expect(contribution.locator('.participation-path')).toContainText('Reproduce a failure');
  await expect(
    contribution.getByRole('link', {
      name: 'Contribution route for Hugging Face smolagents',
      exact: true,
    }),
  ).toHaveAttribute('href', 'https://github.com/huggingface/smolagents/blob/main/CONTRIBUTING.md');
  await contribution.locator('summary').first().click();
  await expect(contribution.locator('details').first()).toContainText('minimal reproduction');
  for (const view of ['discuss', 'collaborate', 'share']) {
    await page.locator(`[data-desk-choice="${view}"]`).click();
    await expect(page.locator('[data-desk-panel]:visible')).toHaveCount(1);
    await expect(page.locator(`[data-desk-panel="${view}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-desk-panel="share"]')).toContainText('Hugging Face Spaces');
  await page.goto('/ai-engineering/get-involved.html?view=missing');
  await expect(contribution).toBeVisible();
  await expect(page.locator('.current-thread')).toContainText('smolagents vs LangGraph');
  await page.locator('.current-thread a[href*="keep-up"]').click();
  await expect(page.locator('[data-desk-panel="read"]')).toBeVisible();
});

test('both desks remain readable on a phone in either theme', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['keep-up', 'get-involved']) {
    await page.goto(`/ai-engineering/${path}.html`);
    const modeLinks = await page.locator('.mode-nav > a').all();
    const modePositions = await Promise.all(
      modeLinks.map(async (link) => (await link.boundingBox()).y),
    );
    expect(new Set(modePositions).size).toBe(1);
    for (const theme of ['dark', 'light']) {
      await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
      for (const choice of await page.locator('[data-desk-choice]').all()) {
        await choice.click();
        await expect(page.locator('[data-desk-panel]:visible')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        for (const row of await page.locator('[data-desk-panel]:visible .desk-source').all()) {
          const bounds = await row.boundingBox();
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
        }
      }
    }
  }
});

test('shared links expose distinct preview art and Apple icons without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const images = new Set();
    for (const path of [
      '/',
      '/ai-engineering/',
      '/ai-engineering/keep-up.html',
      '/ai-engineering/get-involved.html',
      '/ai-engineering/investigations/smolagents-and-langgraph.html',
    ]) {
      await page.goto(`${baseURL}${path}`);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      const title = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(title).not.toContain('· Ben’s Field Notes');
      await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
        'content',
        'Ben’s Field Notes',
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        `https://bensnotes.fyi${path}`,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image',
      );
      const image = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(image).toMatch(/^https:\/\/bensnotes\.fyi\/_astro\/.+\.png$/);
      images.add(image);
      const response = await page.request.get(new URL(image).pathname);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
      const bytes = await response.body();
      expect(bytes.readUInt32BE(16)).toBe(1200);
      expect(bytes.readUInt32BE(20)).toBe(630);
      expect(bytes.length).toBeLessThan(1_000_000);
      expect(
        await page.locator('meta[property="og:image:alt"]').getAttribute('content'),
      ).toBeTruthy();
    }
    expect(images.size).toBe(5);
    const iconPath = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    const iconResponse = await page.request.get(iconPath);
    expect(iconResponse.status()).toBe(200);
    const icon = await iconResponse.body();
    expect(icon.readUInt32BE(16)).toBe(180);
    expect(icon.readUInt32BE(20)).toBe(180);
  } finally {
    await context.close();
  }
});
