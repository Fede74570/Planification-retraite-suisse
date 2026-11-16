import { describe, expect, it } from 'vitest';
import {
  buyBackLockConflicts,
  conversionRateAt,
  conversionRateAt65,
  coordinatedSalary,
  creditRate,
  impliedAnnualContribution,
  legalAgeCredit,
  splitRetirementAssets,
  survivorPension,
} from '../lpp';
import { CH_2027 } from '../params/ch-2027';
import { futureValue } from '../pillar3';

const p = CH_2027.lpp;

describe('LPP', () => {
  it('computes the coordinated salary (art. 8 LPP)', () => {
    expect(coordinatedSalary(20_000, p)).toBe(0);
    expect(coordinatedSalary(25_000, p)).toBe(3_840); // minimum coordinated salary
    expect(coordinatedSalary(60_000, p)).toBe(60_000 - 26_880);
    expect(coordinatedSalary(200_000, p)).toBe(65_280);
  });
  it('uses the legal age credits', () => {
    expect(creditRate(24, p)).toBe(0);
    expect(creditRate(30, p)).toBe(0.07);
    expect(creditRate(40, p)).toBe(0.1);
    expect(creditRate(50, p)).toBe(0.15);
    expect(creditRate(60, p)).toBe(0.18);
    expect(legalAgeCredit(200_000, 60, p)).toBeCloseTo(65_280 * 0.18);
  });
  it('reproduces the certificate projection with the implied contribution', () => {
    const c = impliedAnnualContribution(420_000, 610_000, 4, 0.02);
    expect(futureValue(420_000, c, 0.02, 4)).toBeCloseTo(610_000, 0);
    expect(impliedAnnualContribution(100, 50, 3, 0.02)).toBe(0);
    expect(impliedAnnualContribution(100, 200, 0, 0.02)).toBe(0);
    expect(impliedAnnualContribution(100, 200, 4, 0)).toBe(25);
  });
  it('derives the conversion rate', () => {
    expect(conversionRateAt65({ balance: 1, buyInPotential: 0, conversionRate: 0.056 }, p)).toBe(
      0.056,
    );
    expect(
      conversionRateAt65(
        { balance: 1, buyInPotential: 0, projectedAt65: 500_000, projectedAnnuityAt65: 27_500 },
        p,
      ),
    ).toBeCloseTo(0.055);
    expect(conversionRateAt65({ balance: 1, buyInPotential: 0 }, p)).toBe(0.068);
    expect(conversionRateAt(0.056, 63, 0.002)).toBeCloseTo(0.052);
    expect(conversionRateAt(0.056, 67, 0.002)).toBeCloseTo(0.06);
  });
  it('splits capital and annuity within the regulation cap', () => {
    expect(splitRetirementAssets(600_000, 0.5, 0.056)).toEqual({
      capital: 300_000,
      annuity: 300_000 * 0.056,
    });
    expect(splitRetirementAssets(600_000, 1, 0.056, 0.25).capital).toBe(150_000);
    expect(survivorPension(30_000, 0.6)).toBe(18_000);
  });
  it('detects the 3-year lock after a buy-in (art. 79b al. 3 LPP)', () => {
    const conflicts = buyBackLockConflicts(
      [{ year: 2027, amount: 30_000 }],
      [{ year: 2029, amount: 200_000 }],
      p,
    );
    expect(conflicts).toHaveLength(1);
    expect(
      buyBackLockConflicts([{ year: 2027, amount: 30_000 }], [{ year: 2030, amount: 200_000 }], p),
    ).toHaveLength(0);
    expect(
      buyBackLockConflicts([{ year: 2027, amount: 0 }], [{ year: 2028, amount: 1 }], p),
    ).toHaveLength(0);
  });
});
