import { expect, test } from '@playwright/test';

test('onboarding reaches the report in ≤ 12 taps without horizontal scroll', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile journey');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/app');
  let taps = 0;
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Continuer' }).click();
    taps++;
  }
  await page.getByRole('button', { name: 'Voir mon rapport' }).click();
  taps++;
  await expect(page.getByText('Revenu net à la retraite')).toBeVisible({ timeout: 5000 });
  expect(taps).toBeLessThanOrEqual(12);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  // State mirrored into the shareable hash.
  await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/^#s=/);
  expect(errors).toEqual([]);
});
