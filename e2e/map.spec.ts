import { expect, test } from '@playwright/test';

test('world map: chips, search, sheet and list view', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/app#exemple');
  if (info.project.name === 'desktop') await page.getByRole('radio', { name: 'Monde' }).click();
  else await page.getByRole('button', { name: 'Monde' }).click();
  await expect(page.getByRole('img', { name: /Carte du monde/ })).toBeVisible();

  // Popular chip → France sheet with the verified French tax rule.
  await page
    .getByRole('button', { name: /France/ })
    .first()
    .click();
  await expect(page.getByText(/option 7,5 % après abattement 10 %/)).toBeVisible();
  await expect(page.getByText('CDI en vigueur').first()).toBeVisible();

  // Keyboard search (combobox) → Thailand, no social security convention.
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Fermer' }).click();
  else await page.getByRole('button', { name: 'Fermer la fiche' }).click();
  await page.getByRole('combobox', { name: 'Rechercher un pays' }).fill('thaï');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Aucune convention').first()).toBeVisible();

  // Nationality « Autre » changes the AVS bullet.
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Fermer' }).click();
  await page.getByRole('radio', { name: 'Autre' }).click();
  await page
    .getByRole('button', { name: /Thaïlande/ })
    .first()
    .click();
  await expect(page.getByText(/rente non exportée/)).toBeVisible();
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Fermer' }).click();
  else await page.getByRole('button', { name: 'Fermer la fiche' }).click();

  // Accessible list view.
  await page.getByRole('radio', { name: 'Liste' }).click();
  await page.getByRole('button', { name: /^Convention bilatérale \(\d+\)/ }).click();
  await expect(page.getByRole('button', { name: /Uruguay/ })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
