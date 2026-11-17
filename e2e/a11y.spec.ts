import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** WCAG 2.2 AA automated checks (axe-core) on every screen and key interactive states. */
async function audit(page: Page, label: string) {
  // Let entrance animations settle so colours are measured at their final opacity.
  await page.waitForTimeout(1200);
  const res = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const issues = res.violations.map(
    (v) =>
      `${label} · ${v.id} (${v.impact}) : ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join(' | ')}`,
  );
  expect(issues, issues.join('\n')).toEqual([]);
}

test('landing and method pages', async ({ page }) => {
  await page.goto('/');
  await audit(page, 'accueil');
  await page.goto('/methode');
  await audit(page, 'méthode');
});

test('onboarding steps', async ({ page }) => {
  await page.goto('/app');
  for (let i = 0; i < 4; i++) {
    await audit(page, `onboarding ${i + 1}`);
    if (i < 3) await page.getByRole('button', { name: 'Continuer' }).click();
  }
});

test('report, criteria and map', async ({ page }, info) => {
  await page.goto('/app#exemple');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await audit(page, 'rapport');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Ajuster' }).click();
    await audit(page, 'sheet');
    await page.getByRole('button', { name: 'Fermer' }).click();
    await page.getByRole('button', { name: 'Monde' }).click();
  } else {
    await page.getByRole('radio', { name: 'Monde' }).click();
  }
  await page
    .getByRole('button', { name: /France/ })
    .first()
    .click();
  await audit(page, 'carte + fiche');
});

test('reduced motion: content shows without waiting for animations', async ({ browser }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop');
  const ctx = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto('/app#exemple');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const hidden = await page
    .locator('.report-block')
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length);
  expect(hidden).toBe(0);
  await ctx.close();
});
