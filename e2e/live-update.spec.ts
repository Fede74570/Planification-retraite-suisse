import { expect, test } from '@playwright/test';

test('changing a criterion updates the hero KPI in < 100 ms', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop split view');
  await page.goto('/app#exemple');
  const live = page.locator('#hero-title ~ div [aria-live="polite"]').first();
  await expect(live).toHaveText(/CHF/);
  const before = await live.textContent();
  await page.getByRole('button', { name: 'Revenus et dépenses' }).click();
  const field = page.getByLabel('Dépenses du ménage');
  await field.click();
  const elapsed = await page.evaluate(async (prev) => {
    const input = document.activeElement as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    const t0 = performance.now();
    setter.call(input, '8000');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return await new Promise<number>((resolve) => {
      const check = () => {
        const el = document.querySelector('#hero-title ~ div [aria-live="polite"]');
        if (el && el.textContent !== prev) resolve(performance.now() - t0);
        else requestAnimationFrame(check);
      };
      check();
    });
  }, before);
  expect(elapsed).toBeLessThan(100);
});

test('a shared link restores the report', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop');
  await page.goto('/app#exemple');
  await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/^#s=/);
  const url = page.url();
  const kpi = await page.locator('#hero-title ~ div [aria-live="polite"]').first().textContent();
  const p2 = await page.context().newPage();
  await p2.goto(url);
  await expect(p2.locator('#hero-title ~ div [aria-live="polite"]').first()).toHaveText(kpi!);
});
