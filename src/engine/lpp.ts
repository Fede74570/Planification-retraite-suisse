import { clamp } from './money';
import type { LppParams } from './params/types';
import type { LppInput } from './profile';

/**
 * Occupational pension (2nd pillar, LPP). Amounts are nominal.
 */

/** Coordinated salary (art. 8 LPP). */
export function coordinatedSalary(gross: number, p: LppParams): number {
  if (gross < p.entryThreshold) return 0;
  const insured = Math.min(gross, p.upperLimit) - p.coordinationDeduction;
  return clamp(insured, p.minCoordinated, p.maxCoordinated);
}

/** Legal age credit rate for an age (art. 16 LPP); 0 outside 25–65. */
export function creditRate(age: number, p: LppParams): number {
  return p.creditRates.find((c) => age >= c.fromAge && age <= c.toAge)?.rate ?? 0;
}

/** Annual legal age credit (minimum plan). */
export function legalAgeCredit(gross: number, age: number, p: LppParams): number {
  return coordinatedSalary(gross, p) * creditRate(age, p);
}

/**
 * Certificate mode: the implied yearly contribution C such that the current balance, credited
 * at `rate`, reaches the certificate projection at 65.
 */
export function impliedAnnualContribution(
  balance: number,
  projectedAt65: number,
  years: number,
  rate: number,
): number {
  if (years <= 0) return 0;
  const g = (1 + rate) ** years;
  const annuityFactor = Math.abs(rate) < 1e-9 ? years : (g - 1) / rate;
  return Math.max(0, (projectedAt65 - balance * g) / annuityFactor);
}

/** Conversion rate at 65: fund rate if known, else annuity/assets from the certificate, else legal minimum. */
export function conversionRateAt65(input: LppInput, p: LppParams): number {
  if (input.conversionRate && input.conversionRate > 0) return input.conversionRate;
  if (input.projectedAnnuityAt65 && input.projectedAt65)
    return input.projectedAnnuityAt65 / input.projectedAt65;
  return p.minConversionRate;
}

/** Conversion rate at a retirement age: cut per year before 65, raised symmetrically after (fund practice). */
export function conversionRateAt(
  rateAt65: number,
  retirementAge: number,
  cutPerYear: number,
): number {
  return Math.max(0.03, rateAt65 + (retirementAge - 65) * cutPerYear);
}

export interface LppSplit {
  capital: number;
  annuity: number;
}

/** Splits the assets between capital and annuity (share capped by the regulation). */
export function splitRetirementAssets(
  assets: number,
  capitalShare: number,
  conversionRate: number,
  maxCapitalShare = 1,
): LppSplit {
  const share = clamp(capitalShare, 0, maxCapitalShare);
  const capital = assets * share;
  return { capital, annuity: (assets - capital) * conversionRate };
}

export interface BuyIn {
  year: number;
  amount: number;
}
export interface CapitalWithdrawal {
  year: number;
  amount: number;
}

/**
 * Art. 79b al. 3 LPP: benefits from a buy-in cannot be withdrawn as capital within 3 years.
 * Returns each conflicting (buy-in, withdrawal) pair.
 */
export function buyBackLockConflicts(
  buyIns: BuyIn[],
  withdrawals: CapitalWithdrawal[],
  p: LppParams,
): Array<{ buyIn: BuyIn; withdrawal: CapitalWithdrawal }> {
  const out: Array<{ buyIn: BuyIn; withdrawal: CapitalWithdrawal }> = [];
  for (const b of buyIns) {
    if (b.amount <= 0) continue;
    for (const w of withdrawals) {
      if (w.amount <= 0) continue;
      if (w.year >= b.year && w.year < b.year + p.buyBackLockYears)
        out.push({ buyIn: b, withdrawal: w });
    }
  }
  return out;
}

/** Survivor (spouse) pension as a share of the retiree's annuity. */
export const survivorPension = (annuity: number, ratio: number): number => annuity * ratio;
