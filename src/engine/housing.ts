import type { HousingParams } from './params/types';
import type { HousingInput } from './profile';

/**
 * Home ownership: affordability (« tenue des charges »), 2nd-rank amortisation and the
 * amortise-or-invest decision before / from 2029 (end of the imputed rental value).
 */

/** Annual theoretical cost used by lenders: 5 % interest + 1 % maintenance + amortisation. */
export function theoreticalCost(
  mortgage: number,
  value: number,
  amortization: number,
  p: HousingParams,
): number {
  return mortgage * p.theoreticalInterestRate + value * p.maintenanceRate + amortization;
}

/** Affordability ratio = theoretical cost / gross income (≤ 1/3 required). */
export function affordabilityRatio(
  mortgage: number,
  value: number,
  amortization: number,
  grossIncome: number,
  p: HousingParams,
): number {
  if (grossIncome <= 0) return mortgage > 0 || value > 0 ? Number.POSITIVE_INFINITY : 0;
  return theoreticalCost(mortgage, value, amortization, p) / grossIncome;
}

/** Second-rank mortgage: the part above 2/3 of the value. */
export function secondRank(mortgage: number, value: number, p: HousingParams): number {
  return Math.max(0, mortgage - value * p.firstRankLtv);
}

/** Yearly amortisation of the 2nd rank: within 15 years, at the latest by retirement. */
export function secondRankAmortization(
  mortgage: number,
  value: number,
  yearsToRetirement: number,
  p: HousingParams,
): number {
  const second = secondRank(mortgage, value, p);
  if (second <= 0) return 0;
  const years = Math.max(1, Math.min(p.secondRankAmortizationYears, yearsToRetirement));
  return second / years;
}

/**
 * Bank practice option: add part of liquid wealth to income (wealth spread over the years until
 * life expectancy).
 */
export function incomeWithWealth(
  grossIncome: number,
  liquidWealth: number,
  yearsToLifeExpectancy: number,
): number {
  return grossIncome + (yearsToLifeExpectancy > 0 ? liquidWealth / yearsToLifeExpectancy : 0);
}

/** Mortgage amount to repay so that affordability at retirement is ≤ the limit (no amortisation then). */
export function amortizationNeededForRetirement(
  mortgage: number,
  value: number,
  retirementIncome: number,
  p: HousingParams,
): number {
  const maxMortgage =
    (retirementIncome * p.maxAffordabilityRatio - value * p.maintenanceRate) /
    p.theoreticalInterestRate;
  return Math.max(0, mortgage - Math.max(0, maxMortgage));
}

export interface AmortizeAnalysis {
  /** Net yearly cost of 1 CHF of debt before 2029 (interest minus tax saving). */
  netDebtCostBefore2029: number;
  /** Net yearly cost of 1 CHF of debt from 2029 (owner-occupied: no deduction any more). */
  netDebtCostFrom2029: number;
  /** Expected net return of 1 CHF left invested (after tax on taxable yield). */
  netInvestReturn: number;
  /** Suggested amount to amortise before retirement. */
  suggestedAmount: number;
  verdict: 'amortize' | 'useless' | 'optional';
}

/**
 * Amortise or keep invested? Compares the after-tax cost of debt with the after-tax return
 * and adds the amount required for affordability at retirement.
 */
export function analyzeAmortization(input: {
  housing: HousingInput;
  marginalRate: number;
  investReturn: number;
  taxableYieldShare: number;
  retirementIncome: number;
  liquidAssets: number;
  p: HousingParams;
}): AmortizeAnalysis {
  const {
    housing,
    marginalRate,
    investReturn,
    taxableYieldShare,
    retirementIncome,
    liquidAssets,
    p,
  } = input;
  const ownerOccupied = housing.kind === 'primary';
  const netDebtCostBefore2029 = housing.rate * (1 - marginalRate);
  const netDebtCostFrom2029 = ownerOccupied ? housing.rate : housing.rate * (1 - marginalRate);
  const netInvestReturn = investReturn * (1 - taxableYieldShare * marginalRate);
  const needed = amortizationNeededForRetirement(
    housing.mortgage,
    housing.value,
    retirementIncome,
    p,
  );
  const suggestedAmount = Math.min(needed, Math.max(0, liquidAssets), housing.mortgage);
  let verdict: AmortizeAnalysis['verdict'];
  if (suggestedAmount > 0) verdict = 'amortize';
  else if (netDebtCostFrom2029 > netInvestReturn && housing.mortgage > 0) verdict = 'optional';
  else verdict = 'useless';
  return {
    netDebtCostBefore2029,
    netDebtCostFrom2029,
    netInvestReturn,
    suggestedAmount: Math.round(suggestedAmount / 1000) * 1000,
    verdict,
  };
}

/** Taxable housing items of a year (imputed rent and deductions depend on 2029). */
export function housingTaxItems(
  housing: HousingInput,
  year: number,
  imputedRentRate: number,
  p: HousingParams,
): { addedIncome: number; deduction: number } {
  const interest = housing.mortgage * housing.rate;
  if (housing.kind === 'rental') {
    const rent = housing.rentalIncome ?? 0;
    return { addedIncome: rent, deduction: interest + housing.value * p.maintenanceRate };
  }
  if (year >= p.imputedRentAbolishedFrom) return { addedIncome: 0, deduction: 0 };
  const imputed = housing.value * imputedRentRate;
  return { addedIncome: imputed, deduction: interest + imputed * 0.2 }; // IFD flat maintenance: 20 % of the rental value (building ≥ 10 years)
}
