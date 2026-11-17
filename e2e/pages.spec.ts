import { expect, test } from '@playwright/test';

test('landing → app, method page with sources', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/claire en 2/);
  await page.getByRole('link', { name: 'Méthode', exact: true }).click();
  await expect(page).toHaveURL(/\/methode$/);
  await expect(page.getByRole('heading', { name: 'Sources officielles' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Conseil fédéral – Adaptation des rentes AVS/ }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Calculer ma retraite' }).first().click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByText('Faisons connaissance')).toBeVisible();
  expect(errors).toEqual([]);
});

test('print layout: logo header and disclaimer footer, every block visible', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop print');
  await page.goto('/app#exemple');
  await expect(page.locator('#hero-title')).toBeAttached();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-head')).toBeVisible();
  await expect(page.locator('.print-foot')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Vos critères' })).toBeHidden();
  const hidden = await page
    .locator('.report-block')
    .evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  expect(hidden).toBe(0);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.byteLength).toBeGreaterThan(50_000);
});
