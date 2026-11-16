import { describe, expect, it } from 'vitest';
import {
  avsAnnualAtAge,
  avsClaimCurve,
  avsContributionYearsSoFar,
  avsEarliestAge,
  avsFlexAdjustment,
  avsFullMonthly,
  avsNonEmployedContribution,
  avsPension,
  avsReferenceAge,
  avsScaleFactor,
  coupleCapFactor,
  estimateRam,
  isTransitionalWoman,
  paymentsPerYear,
} from '../avs';
import { CH_2026 } from '../params/ch-2026';
import { CH_2027 } from '../params/ch-2027';

const p26 = CH_2026.avs;
const p27 = CH_2027.avs;

describe('AVS pension formula (art. 34 LAVS)', () => {
  it('matches the official 2026 bounds', () => {
    expect(avsFullMonthly(15_120, p26)).toBeCloseTo(1260, 6);
    expect(avsFullMonthly(90_720, p26)).toBeCloseTo(2520, 6);
  });
  it('is continuous at the break point (36 × minimum)', () => {
    const k = 36 * p26.minMonthly;
    expect(avsFullMonthly(k - 0.001, p26)).toBeCloseTo(avsFullMonthly(k + 0.001, p26), 2);
    expect(avsFullMonthly(k, p26)).toBeCloseTo(1915.2, 6);
  });
  it('is bounded by min and max', () => {
    expect(avsFullMonthly(0, p27)).toBe(1280);
    expect(avsFullMonthly(10_000_000, p27)).toBe(2560);
  });
  it('reduces partial pensions by missing years / 44', () => {
    expect(avsScaleFactor(0, p27)).toBe(1);
    expect(avsScaleFactor(11, p27)).toBeCloseTo(0.75);
    expect(avsScaleFactor(99, p27)).toBe(0);
  });
});

describe('AVS 21 reference age and anticipation', () => {
  it('handles the transitional generation of women', () => {
    expect(avsReferenceAge(1960, 'f')).toBe(64);
    expect(avsReferenceAge(1961, 'f')).toBe(64.25);
    expect(avsReferenceAge(1962, 'f')).toBe(64.5);
    expect(avsReferenceAge(1963, 'f')).toBe(64.75);
    expect(avsReferenceAge(1964, 'f')).toBe(65);
    expect(avsReferenceAge(1955, 'm')).toBe(65);
    expect(isTransitionalWoman(1965, 'f')).toBe(true);
    expect(isTransitionalWoman(1970, 'f')).toBe(false);
    expect(avsEarliestAge(1965, 'f', p27)).toBe(62);
    expect(avsEarliestAge(1965, 'm', p27)).toBe(63);
  });
  it('applies −13.6 % for 2 years of anticipation and +31.5 % for 5 years of deferral', () => {
    expect(avsFlexAdjustment(63, 65, p26)).toBeCloseTo(-0.136);
    expect(avsFlexAdjustment(64, 65, p26)).toBeCloseTo(-0.068);
    expect(avsFlexAdjustment(70, 65, p26)).toBeCloseTo(0.315);
    expect(avsFlexAdjustment(66, 65, p26)).toBeCloseTo(0.052);
    expect(avsFlexAdjustment(66.5, 65, p26)).toBeCloseTo(0.08);
    expect(avsFlexAdjustment(65.5, 65, p26)).toBe(0);
    expect(avsFlexAdjustment(65, 65, p26)).toBe(0);
    expect(avsFlexAdjustment(64.5, 65, p26)).toBeCloseTo(-0.034);
  });
  it('flags 2027 flexibility rates as awaiting confirmation', () => {
    expect(p26.flexRatesConfirmed).toBe(true);
    expect(p27.flexRatesConfirmed).toBe(false);
  });
});

describe('AVS pension amounts', () => {
  const base = { ram: 200_000, missingYears: 0, birthYear: 1966, sex: 'm' as const };
  it('pays 13 monthly amounts per year', () => {
    expect(paymentsPerYear(p27)).toBe(13);
    const pen = avsPension({ ...base, claimAge: 65 }, p27);
    expect(pen.monthly).toBe(2560);
    expect(pen.annual).toBe(2560 * 13);
    expect(paymentsPerYear({ ...p27, thirteenthPension: false })).toBe(12);
  });
  it('pays nothing before the claim age (no 13th pension while deferred)', () => {
    const input = { ...base, claimAge: 67 };
    expect(avsAnnualAtAge(input, 66, p27)).toBe(0);
    expect(avsAnnualAtAge(input, 67, p27)).toBeCloseTo(2560 * 1.108 * 13);
  });
  it('handles partial anticipation (rest paid unreduced from the reference age)', () => {
    const input = { ...base, claimAge: 63, partialShare: 0.5 };
    expect(avsAnnualAtAge(input, 63, p26)).toBeCloseTo(2520 * 0.5 * (1 - 0.136) * 13);
    expect(avsAnnualAtAge(input, 65, p26)).toBeCloseTo(2520 * (0.5 * (1 - 0.136) + 0.5) * 13);
    expect(avsPension(input, p26).adjustment).toBeCloseTo(-0.068);
  });
  it('clamps the claim age to the legal window', () => {
    expect(avsPension({ ...base, claimAge: 60 }, p27).claimAge).toBe(63);
    expect(avsPension({ ...base, claimAge: 75 }, p27).claimAge).toBe(70);
  });
  it('caps a married couple at 150 % of the maximum (2027: CHF 3840)', () => {
    const f = coupleCapFactor(2560, 2560, 1, 1, p27);
    expect(2560 * f * 2).toBeCloseTo(3840);
    expect(coupleCapFactor(1500, 1500, 1, 1, p27)).toBe(1);
  });
  it('splits incomes for married couples', () => {
    expect(estimateRam(100_000, 60_000)).toBe(80_000);
    expect(estimateRam(100_000)).toBe(100_000);
  });
  it('gives an increasing curve from 63 to 70', () => {
    const curve = avsClaimCurve(base, p27);
    expect(curve).toHaveLength(8);
    for (let i = 1; i < curve.length; i++)
      expect(curve[i]!.monthly).toBeGreaterThanOrEqual(curve[i - 1]!.monthly);
  });
  it('counts contribution years from the year after the 20th birthday', () => {
    expect(avsContributionYearsSoFar(1966, 1987)).toBe(1);
    expect(avsContributionYearsSoFar(1966, 1980)).toBe(0);
  });
});

describe('Non-employed AVS contributions (memento 2.03)', () => {
  it('follows the official 2026 scale', () => {
    expect(avsNonEmployedContribution(100_000, 0, p26)).toBe(530);
    expect(avsNonEmployedContribution(350_000, 0, p26)).toBe(636);
    expect(avsNonEmployedContribution(1_000_000, 0, p26)).toBe(2014);
    expect(avsNonEmployedContribution(1_750_000, 0, p26)).toBe(3604);
    expect(avsNonEmployedContribution(1_850_000, 0, p26)).toBe(3922);
    expect(avsNonEmployedContribution(8_950_000, 0, p26)).toBe(26_500);
    expect(avsNonEmployedContribution(50_000_000, 0, p26)).toBe(26_500);
    // 20 × annual pension income is added to wealth.
    expect(avsNonEmployedContribution(0, 25_000, p26)).toBe(954);
  });
  it('uses the 2027 minimum of CHF 541', () => {
    expect(avsNonEmployedContribution(0, 0, p27)).toBe(541);
  });
});
