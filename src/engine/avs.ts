import { clamp } from './money';
import type { AvsParams } from './params/types';
import type { Sex } from './profile';

/**
 * AVS old-age pension (LAVS art. 34, 35, 39, 40; AVS 21 flexible retirement).
 * Amounts are in francs of the parameter year; indexation is applied by the cash-flow engine.
 */

/** AVS 21 reference age in years (women of the transitional generation: +3 months per cohort). */
export function avsReferenceAge(birthYear: number, sex: Sex): number {
  if (sex === 'm' || birthYear >= 1964) return 65;
  if (birthYear <= 1960) return 64;
  return 64 + (birthYear - 1960) * 0.25; // 1961 → 64.25, 1962 → 64.5, 1963 → 64.75
}

/** True for women born 1961–1969 (transitional generation: anticipation from 62). */
export function isTransitionalWoman(birthYear: number, sex: Sex): boolean {
  return sex === 'f' && birthYear >= 1961 && birthYear <= 1969;
}

export function avsEarliestAge(birthYear: number, sex: Sex, p: AvsParams): number {
  return isTransitionalWoman(birthYear, sex) ? p.transitionalEarliestAge : p.earliestAge;
}

/** Full monthly pension (scale 44) for an average determining income (RAM), art. 34 LAVS. */
export function avsFullMonthly(ram: number, p: AvsParams): number {
  const min = p.minMonthly;
  const raw = ram <= 36 * min ? 0.74 * min + (13 / 600) * ram : 1.04 * min + (8 / 600) * ram;
  return clamp(raw, min, p.maxMonthly);
}

/** Pension scale factor for contribution gaps (partial pension). */
export function avsScaleFactor(missingYears: number, p: AvsParams): number {
  const years = clamp(p.fullContributionYears - missingYears, 0, p.fullContributionYears);
  return years / p.fullContributionYears;
}

/** Contribution years elapsed so far (from Jan 1st after the 20th birthday) — informative. */
export function avsContributionYearsSoFar(birthYear: number, year: number): number {
  return Math.max(0, year - (birthYear + 21) + 1);
}

/**
 * Lifetime adjustment for claiming at `claimAge` instead of the reference age.
 * Negative = reduction (anticipation), positive = supplement (deferral). Uses the official
 * month-by-month tables.
 */
export function avsFlexAdjustment(claimAge: number, referenceAge: number, p: AvsParams): number {
  const months = Math.round((claimAge - referenceAge) * 12);
  if (months < 0) {
    const m = Math.min(-months, p.earlyReductionByMonth.length - 1);
    return -(p.earlyReductionByMonth[m] ?? 0);
  }
  if (months < 12) return 0; // deferral counts from 1 full year
  const capped = Math.min(months, p.maxDeferralYears * 12);
  const years = Math.floor(capped / 12);
  const quarter = Math.min(3, Math.floor((capped % 12) / 3));
  return p.deferralIncrease[years - 1]?.[quarter] ?? 0;
}

export interface AvsPersonInput {
  ram: number;
  missingYears: number;
  birthYear: number;
  sex: Sex;
  claimAge: number;
  /** Partial anticipation/deferral: share claimed at `claimAge`, the rest at the reference age. */
  partialShare?: number;
}

export interface AvsPension {
  referenceAge: number;
  claimAge: number;
  /** Base monthly amount before flexibility (after scale, before couple cap). */
  baseMonthly: number;
  adjustment: number;
  /** Monthly amount once fully in payment. */
  monthly: number;
  /** Annual amount incl. the 13th pension. */
  annual: number;
}

/** Number of monthly payments per year (12 + the 13th pension). */
export const paymentsPerYear = (p: AvsParams): number => (p.thirteenthPension ? 13 : 12);

export function avsPension(input: AvsPersonInput, p: AvsParams, capFactor = 1): AvsPension {
  const referenceAge = avsReferenceAge(input.birthYear, input.sex);
  const earliest = avsEarliestAge(input.birthYear, input.sex, p);
  const claimAge = clamp(input.claimAge, earliest, referenceAge + p.maxDeferralYears);
  const baseMonthly =
    avsFullMonthly(input.ram, p) * avsScaleFactor(input.missingYears, p) * capFactor;
  const adj = avsFlexAdjustment(claimAge, referenceAge, p);
  const share =
    input.partialShare === undefined
      ? 1
      : clamp(input.partialShare, p.partialShareRange[0], p.partialShareRange[1]);
  // The non-claimed share is paid unadjusted from the reference age.
  const adjustment = share * adj;
  const monthly = baseMonthly * (1 + adjustment);
  return {
    referenceAge,
    claimAge,
    baseMonthly,
    adjustment,
    monthly,
    annual: monthly * paymentsPerYear(p),
  };
}

/**
 * Annual AVS amount paid at a given age (handles partial anticipation where the remaining share
 * starts at the reference age). Zero before the claim age (including during deferral: no 13th).
 */
export function avsAnnualAtAge(
  input: AvsPersonInput,
  age: number,
  p: AvsParams,
  capFactor = 1,
): number {
  const pen = avsPension(input, p, capFactor);
  const share =
    input.partialShare === undefined
      ? 1
      : clamp(input.partialShare, p.partialShareRange[0], p.partialShareRange[1]);
  const adj = avsFlexAdjustment(pen.claimAge, pen.referenceAge, p);
  let monthly = 0;
  if (age >= pen.claimAge) monthly += pen.baseMonthly * share * (1 + adj);
  if (share < 1 && age >= pen.referenceAge) monthly += pen.baseMonthly * (1 - share);
  return monthly * paymentsPerYear(p);
}

/**
 * Married couple cap (LAVS art. 35): the sum of both base pensions may not exceed 150 % of the
 * maximum (scaled by the pension scale in case of gaps). Returns the factor applied to each.
 */
export function coupleCapFactor(
  baseA: number,
  baseB: number,
  scaleA: number,
  scaleB: number,
  p: AvsParams,
): number {
  const cap = p.coupleCapRatio * p.maxMonthly * Math.max(scaleA, scaleB);
  const sum = baseA + baseB;
  return sum > cap ? cap / sum : 1;
}

/** Average determining income (RAM) estimate; for married couples incomes are split 50/50. */
export function estimateRam(ownIncome: number, partnerIncome?: number): number {
  return partnerIncome === undefined ? ownIncome : (ownIncome + partnerIncome) / 2;
}

/** Monthly pension for each claim age from 63 to 70 (mini-chart of block 3). */
export function avsClaimCurve(
  input: Omit<AvsPersonInput, 'claimAge'>,
  p: AvsParams,
  capFactor = 1,
): Array<{ age: number; monthly: number }> {
  const out: Array<{ age: number; monthly: number }> = [];
  for (let age = 63; age <= 70; age++)
    out.push({ age, monthly: avsPension({ ...input, claimAge: age }, p, capFactor).monthly });
  return out;
}

/** Annual AVS contribution of a non-employed person (wealth + 20 × annual pension income). */
export function avsNonEmployedContribution(
  wealth: number,
  annualPensionIncome: number,
  p: AvsParams,
): number {
  const n = p.nonEmployed;
  const basis = Math.max(0, wealth) + 20 * Math.max(0, annualPensionIncome);
  if (basis < n.firstStep) return n.min;
  const steps1 = Math.floor((Math.min(basis, n.secondThreshold) - n.firstStep) / n.step);
  let c = n.firstStepAmount + steps1 * n.increment1;
  if (basis >= n.secondThreshold + n.step)
    c += Math.floor((basis - n.secondThreshold) / n.step) * n.increment2;
  return Math.min(c, n.max);
}
