import { clamp } from './money';
import type { Pillar3aParams } from './params/types';

/**
 * Pillar 3a (tied pension) and 3b (free savings). Amounts are nominal.
 */

/** Maximum deductible 3a contribution for a year. */
export function p3aMaxContribution(
  hasLpp: boolean,
  netEarnedIncome: number,
  p: Pillar3aParams,
): number {
  if (hasLpp) return p.maxWithLpp;
  return Math.min(p.maxWithoutLpp, Math.max(0, netEarnedIncome) * p.maxWithoutLppIncomeRate);
}

/** Allowed withdrawal window [earliest, latest] (ages) for a person. */
export function p3aWithdrawalWindow(
  referenceAge: number,
  stillWorking: boolean,
  p: Pillar3aParams,
): [number, number] {
  const earliest = Math.ceil(referenceAge) - p.earlyWithdrawalYears;
  const latest = stillWorking ? p.latestAgeIfWorking : Math.ceil(referenceAge);
  return [earliest, latest];
}

/**
 * Default staggered plan: one account per year, ending the year of retirement
 * (e.g. 2 accounts, retirement at 65 → withdrawals at 64 and 65).
 */
export function defaultStaggeredAges(
  accounts: number,
  retirementAge: number,
  referenceAge: number,
  p: Pillar3aParams,
): number[] {
  const n = Math.max(1, Math.round(accounts));
  const [earliest] = p3aWithdrawalWindow(referenceAge, false, p);
  const last = clamp(Math.round(retirementAge), earliest, p.latestAgeIfWorking);
  return Array.from({ length: n }, (_, i) => clamp(last - (n - 1 - i), earliest, last));
}

/** Splits a 3a balance evenly between accounts. */
export function splitAccounts(balance: number, accounts: number): number[] {
  const n = Math.max(1, Math.round(accounts));
  return Array.from({ length: n }, () => balance / n);
}

/** Future value of a balance with yearly contributions (end of year). */
export function futureValue(balance: number, annual: number, rate: number, years: number): number {
  let b = balance;
  for (let i = 0; i < years; i++) b = b * (1 + rate) + annual;
  return b;
}
