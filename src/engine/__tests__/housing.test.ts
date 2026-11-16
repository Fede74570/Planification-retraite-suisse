import { describe, expect, it } from 'vitest';
import {
  affordabilityRatio,
  amortizationNeededForRetirement,
  analyzeAmortization,
  housingTaxItems,
  incomeWithWealth,
  secondRank,
  secondRankAmortization,
  theoreticalCost,
} from '../housing';
import { CH_2027 } from '../params/ch-2027';

const p = CH_2027.housing;
const home = { value: 1_000_000, mortgage: 800_000, rate: 0.016, kind: 'primary' as const };

describe('Housing', () => {
  it('computes theoretical cost and affordability', () => {
    expect(theoreticalCost(600_000, 1_000_000, 0, p)).toBe(40_000);
    expect(affordabilityRatio(600_000, 1_000_000, 0, 120_000, p)).toBeCloseTo(1 / 3);
    expect(affordabilityRatio(0, 0, 0, 0, p)).toBe(0);
    expect(affordabilityRatio(1, 1, 0, 0, p)).toBe(Number.POSITIVE_INFINITY);
  });
  it('amortises the 2nd rank to 2/3 within 15 years or by retirement', () => {
    expect(secondRank(800_000, 1_000_000, p)).toBeCloseTo(133_333.33, 1);
    expect(secondRankAmortization(800_000, 1_000_000, 30, p)).toBeCloseTo(133_333.33 / 15, 1);
    expect(secondRankAmortization(800_000, 1_000_000, 5, p)).toBeCloseTo(133_333.33 / 5, 1);
    expect(secondRankAmortization(500_000, 1_000_000, 5, p)).toBe(0);
  });
  it('finds the amortisation needed for ≤ 33 % at retirement', () => {
    const need = amortizationNeededForRetirement(800_000, 1_000_000, 90_000, p);
    expect(affordabilityRatio(800_000 - need, 1_000_000, 0, 90_000, p)).toBeCloseTo(1 / 3, 6);
    expect(amortizationNeededForRetirement(100_000, 1_000_000, 200_000, p)).toBe(0);
    expect(incomeWithWealth(80_000, 200_000, 20)).toBe(90_000);
    expect(incomeWithWealth(80_000, 200_000, 0)).toBe(80_000);
  });
  it('switches tax treatment in 2029 for owner-occupied homes only', () => {
    expect(housingTaxItems(home, 2028, 0.025, p).addedIncome).toBe(25_000);
    expect(housingTaxItems(home, 2028, 0.025, p).deduction).toBeCloseTo(800_000 * 0.016 + 5_000);
    expect(housingTaxItems(home, 2029, 0.025, p)).toEqual({ addedIncome: 0, deduction: 0 });
    const rental = housingTaxItems(
      { ...home, kind: 'rental', rentalIncome: 40_000 },
      2030,
      0.025,
      p,
    );
    expect(rental.addedIncome).toBe(40_000);
    expect(rental.deduction).toBeCloseTo(12_800 + 10_000);
    expect(housingTaxItems({ ...home, kind: 'rental' }, 2030, 0.025, p).addedIncome).toBe(0);
  });
  it('gives a clear amortisation verdict', () => {
    const base = {
      marginalRate: 0.3,
      investReturn: 0.03,
      taxableYieldShare: 0.4,
      liquidAssets: 500_000,
      p,
    };
    const a = analyzeAmortization({ ...base, housing: home, retirementIncome: 90_000 });
    expect(a.verdict).toBe('amortize');
    expect(a.suggestedAmount).toBeGreaterThan(0);
    expect(a.netDebtCostFrom2029).toBe(0.016);
    expect(a.netDebtCostBefore2029).toBeCloseTo(0.016 * 0.7);
    const b = analyzeAmortization({
      ...base,
      housing: { ...home, mortgage: 100_000 },
      retirementIncome: 200_000,
    });
    expect(b.verdict).toBe('useless');
    const c = analyzeAmortization({
      ...base,
      investReturn: 0.005,
      housing: { ...home, mortgage: 100_000, rate: 0.03 },
      retirementIncome: 200_000,
    });
    expect(c.verdict).toBe('optional');
    const r = analyzeAmortization({
      ...base,
      housing: { ...home, kind: 'rental' },
      retirementIncome: 90_000,
    });
    expect(r.netDebtCostFrom2029).toBeCloseTo(0.016 * 0.7);
  });
});
