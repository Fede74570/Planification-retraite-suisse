import { describe, expect, it } from 'vitest';
import { CANTON_CODES } from '../profile';
import { CANTONAL_TAX } from '../params/cantons';
import { CH_2026 } from '../params/ch-2026';
import { CH_2027 } from '../params/ch-2027';
import {
  cantonalCapitalTax,
  cantonalIncomeTax,
  cantonalWealthTax,
  capitalWithdrawalTax,
  deductionSaving,
  ifdTax,
  incomeTax,
  marginalIncomeRate,
  wealthTax,
  type TaxContext,
} from '../tax';

const s26 = CH_2026.tax.ifd;
const s27 = CH_2027.tax.ifd;

describe('IFD 2026 — rows of the official AFC Form. 58c', () => {
  it.each([
    [18_500, 25.4],
    [33_100, 137.8],
    [43_500, 229.2],
    [50_000, 400.8],
    [61_300, 710.0],
    [79_000, 1318.8],
    [100_000, 2684.35],
    [130_000, 5128.55],
    [185_100, 10936.6],
    [250_000, 19503.35],
    [700_000, 78903.35],
    [800_000, 92_000],
  ])('single %i → %f', (income, tax) => expect(ifdTax(income, 'single', s26)).toBeCloseTo(tax, 0));
  it.each([
    [33_000, 33],
    [53_400, 237],
    [61_300, 395],
    [100_000, 1816],
    [135_000, 4018],
    [151_000, 5524],
    [300_000, 24_880],
    [941_200, 108_236],
    [950_000, 109_250],
  ])('married %i → %f', (income, tax) =>
    expect(ifdTax(income, 'married', s26)).toBeCloseTo(tax, 0),
  );
  it('drops fractions under CHF 100, rounds down to 5 cents and applies child reductions', () => {
    expect(ifdTax(100_099, 'single', s26)).toBe(ifdTax(100_000, 'single', s26));
    expect(ifdTax(10_000, 'single', s26)).toBe(0);
    expect(ifdTax(100_000, 'married', s26, 2)).toBe(1816 - 2 * 263);
    expect(ifdTax(30_000, 'married', s26, 3)).toBe(0);
    expect((ifdTax(77_777, 'single', s26) * 20) % 1).toBeCloseTo(0);
  });
});

describe('IFD 2027 — OPFr art. 2 (official brackets)', () => {
  it('matches the published steps', () => {
    expect(ifdTax(29_900, 'married', s27)).toBe(0);
    expect(ifdTax(53_700, 'married', s27)).toBe(238);
    expect(ifdTax(945_900, 'married', s27)).toBeCloseTo(108_778, 0);
    expect(ifdTax(946_000, 'married', s27)).toBeCloseTo(108_790, 0);
    expect(ifdTax(33_400, 'single', s27)).toBeCloseTo(139.35, 1);
    expect(ifdTax(797_400, 'single', s27)).toBeCloseTo(91_699.7, 0);
    expect(ifdTax(797_500, 'single', s27)).toBeCloseTo(91_712.5, 0);
    expect(ifdTax(1_000_000, 'single', s27)).toBe(115_000);
  });
  it('indexation lowers the 2027 tax compared with 2026 for the same income', () => {
    expect(ifdTax(100_000, 'single', s27)).toBeLessThan(ifdTax(100_000, 'single', s26));
  });
});

const ctx = (over: Partial<TaxContext> = {}): TaxContext => ({
  canton: 'VD',
  status: 'single',
  children: 0,
  params: CH_2026,
  year: 2026,
  inflation: 0.01,
  ...over,
});

describe('Cantonal data (AFC calculator, 26 cantonal capitals)', () => {
  it('covers all 26 cantons with monotonic grids', () => {
    expect(Object.keys(CANTONAL_TAX.cantons).sort()).toEqual([...CANTON_CODES].sort());
    for (const c of CANTON_CODES) {
      for (const st of ['single', 'married'] as const) {
        const g = CANTONAL_TAX.cantons[c][st];
        expect(g.income).toHaveLength(CANTONAL_TAX.meta.grid.income.length);
        for (let i = 1; i < g.income.length; i++)
          expect(g.income[i]!).toBeGreaterThanOrEqual(g.income[i - 1]!);
        for (let i = 1; i < g.capital.length; i++)
          expect(g.capital[i]!).toBeGreaterThanOrEqual(g.capital[i - 1]!);
        for (let i = 1; i < g.wealth.length; i++)
          expect(g.wealth[i]!).toBeGreaterThanOrEqual(g.wealth[i - 1]!);
      }
    }
  });
  it('reproduces the calculator on grid points (Lausanne, single, 100k: 12 777 + 6 811)', () => {
    expect(cantonalIncomeTax(100_000, 'VD', 'single')).toBe(19_588);
    expect(cantonalCapitalTax(500_000, 'VD', 'single')).toBe(20_874 + 10_572);
  });
  it('interpolates between grid points and is zero at zero', () => {
    const a = cantonalIncomeTax(100_000, 'ZH', 'married');
    const b = cantonalIncomeTax(120_000, 'ZH', 'married');
    const m = cantonalIncomeTax(110_000, 'ZH', 'married');
    expect(m).toBeGreaterThan(a);
    expect(m).toBeLessThan(b);
    expect(cantonalIncomeTax(0, 'ZH', 'married')).toBe(0);
    expect(cantonalWealthTax(0, 'GE', 'single')).toBe(0);
    expect(cantonalWealthTax(1_000_000, 'GE', 'single')).toBeGreaterThan(0);
  });
  it('taxes married couples less than singles at equal income', () => {
    expect(cantonalIncomeTax(100_000, 'BE', 'married')).toBeLessThan(
      cantonalIncomeTax(100_000, 'BE', 'single'),
    );
  });
});

describe('Combined taxes', () => {
  it('capital benefits: federal part = 1/5 of the ordinary scale (art. 38 LIFD)', () => {
    const t = capitalWithdrawalTax(500_000, ctx());
    expect(t.federal).toBeCloseTo(ifdTax(500_000, 'single', s26) / 5, 2);
    expect(Math.round(t.federal)).toBe(10_501); // AFC calculator, Lausanne 2026
    expect(capitalWithdrawalTax(0, ctx()).total).toBe(0);
  });
  it('adding withdrawals in the same year costs more than splitting them', () => {
    const together = capitalWithdrawalTax(600_000, ctx()).total;
    const split = capitalWithdrawalTax(300_000, ctx()).total * 2;
    expect(together).toBeGreaterThan(split);
  });
  it('indexes brackets in future years (no bracket creep)', () => {
    const t26 = incomeTax(100_000, ctx()).total;
    const t36 = incomeTax(100_000 * 1.01 ** 10, ctx({ year: 2036 })).total;
    expect(t36).toBeCloseTo(t26 * 1.01 ** 10, 0);
    expect(incomeTax(100_000, ctx({ inflation: 0, year: 2040 })).total).toBeCloseTo(t26, 6);
  });
  it('computes marginal rates, deductions and wealth tax', () => {
    const m = marginalIncomeRate(150_000, ctx());
    expect(m).toBeGreaterThan(0.2);
    expect(m).toBeLessThan(0.5);
    expect(deductionSaving(150_000, 30_000, ctx())).toBeGreaterThan(30_000 * 0.2);
    expect(wealthTax(1_000_000, ctx())).toBeGreaterThan(0);
  });
});
