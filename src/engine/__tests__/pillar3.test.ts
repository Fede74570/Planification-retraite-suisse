import { describe, expect, it } from 'vitest';
import { CH_2027 } from '../params/ch-2027';
import {
  defaultStaggeredAges,
  futureValue,
  p3aMaxContribution,
  p3aWithdrawalWindow,
  splitAccounts,
} from '../pillar3';

const p = CH_2027.pillar3a;

describe('Pillar 3a', () => {
  it('caps contributions (2027)', () => {
    expect(p3aMaxContribution(true, 120_000, p)).toBe(7_373);
    expect(p3aMaxContribution(false, 100_000, p)).toBe(20_000);
    expect(p3aMaxContribution(false, 500_000, p)).toBe(36_864);
    expect(p3aMaxContribution(false, -5, p)).toBe(0);
  });
  it('allows withdrawals from 5 years before the reference age, up to 70 if working', () => {
    expect(p3aWithdrawalWindow(65, false, p)).toEqual([60, 65]);
    expect(p3aWithdrawalWindow(65, true, p)).toEqual([60, 70]);
    expect(p3aWithdrawalWindow(64.5, false, p)).toEqual([60, 65]);
  });
  it('staggers accounts one per year up to retirement', () => {
    expect(defaultStaggeredAges(2, 65, 65, p)).toEqual([64, 65]);
    expect(defaultStaggeredAges(3, 63, 65, p)).toEqual([61, 62, 63]);
    expect(defaultStaggeredAges(1, 58, 65, p)).toEqual([60]);
  });
  it('splits balances and compounds', () => {
    expect(splitAccounts(90_000, 3)).toEqual([30_000, 30_000, 30_000]);
    expect(futureValue(1000, 100, 0.1, 2)).toBeCloseTo(1000 * 1.21 + 110 + 100);
  });
});
