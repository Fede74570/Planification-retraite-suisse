import { indexFactor } from './money';
import type { ReturnProfile } from './profile';
import { capitalWithdrawalTax, incomeTax, wealthTax, type TaxContext } from './tax';

/**
 * Annuity versus capital for the LPP assets, over the full horizon (nominal; real via deflator).
 * - Annuity: fixed nominal annuity, taxed at the marginal rate on top of other income.
 * - Capital: net of capital tax, invested; each year withdraws the first-year net annuity indexed
 *   to inflation; pays wealth tax and income tax on the taxable part of the return.
 */

export interface CapitalVsAnnuityInput {
  assets: number;
  conversionRate: number;
  /** Share taken as capital (0..1) for the mixed option. */
  capitalShare: number;
  retirementAge: number;
  retirementYear: number;
  /** Base year for real values (today). */
  baseYear: number;
  horizonAge: number;
  /** Other taxable income in retirement (AVS etc.), first year, nominal. */
  otherTaxableIncome: number;
  /** Other taxable wealth (for the marginal wealth tax). */
  otherWealth: number;
  inflation: number;
  returns: Record<ReturnProfile, number>;
  taxableYieldShare: number;
  retireeDeductionRate: number;
  tax: Omit<TaxContext, 'year'>;
}

export interface CapitalPath {
  profile: ReturnProfile;
  balances: number[];
  exhaustionAge: number | null;
  at85: number;
  at95: number;
}

export interface CapitalVsAnnuityResult {
  ages: number[];
  /** Cumulative net annuity received (nominal) at each age. */
  cumulativeAnnuity: number[];
  netCapital: number;
  capitalTax: number;
  firstYearNetAnnuity: number;
  /** Age from which the cumulative net annuity exceeds the net capital. */
  breakEvenAge: number | null;
  paths: Record<ReturnProfile, CapitalPath>;
  /** Mixed option (share capital / share annuity), balanced profile. */
  mixed: { annuity: number; capital: number; at85: number; at95: number };
  deflators: number[];
}

const PROFILES: ReturnProfile[] = ['prudent', 'balanced', 'dynamic'];

export function compareCapitalVsAnnuity(i: CapitalVsAnnuityInput): CapitalVsAnnuityResult {
  const annuity = i.assets * i.conversionRate;
  const ctx0: TaxContext = { ...i.tax, year: i.retirementYear };
  const capTax = capitalWithdrawalTax(i.assets, ctx0).total;
  const netCapital = i.assets - capTax;
  const ages: number[] = [];
  const cumulativeAnnuity: number[] = [];
  const deflators: number[] = [];
  const years = Math.max(1, Math.round(i.horizonAge - i.retirementAge) + 1);

  const annuityTax = (year: number, other: number) => {
    const ctx = { ...i.tax, year };
    const base = other * (1 - i.retireeDeductionRate);
    return (
      incomeTax(base + annuity * (1 - i.retireeDeductionRate), ctx).total -
      incomeTax(base, ctx).total
    );
  };
  const firstYearNetAnnuity = annuity - annuityTax(i.retirementYear, i.otherTaxableIncome);

  let cum = 0;
  let breakEvenAge: number | null = null;
  for (let k = 0; k < years; k++) {
    const year = i.retirementYear + k;
    const age = Math.round(i.retirementAge) + k;
    const other = i.otherTaxableIncome * indexFactor(i.inflation, i.retirementYear, year);
    cum += annuity - annuityTax(year, other);
    ages.push(age);
    cumulativeAnnuity.push(cum);
    deflators.push(1 / indexFactor(i.inflation, i.baseYear, year));
    if (breakEvenAge === null && cum >= netCapital) breakEvenAge = age;
  }

  const simulate = (capital: number, withdrawal0: number, r: number) => {
    const balances: number[] = [];
    let b = capital;
    let exhaustionAge: number | null = null;
    for (let k = 0; k < years; k++) {
      const year = i.retirementYear + k;
      const ctx = { ...i.tax, year };
      const w = withdrawal0 * indexFactor(i.inflation, i.retirementYear, year);
      const ret = b * r;
      const other =
        i.otherTaxableIncome *
        indexFactor(i.inflation, i.retirementYear, year) *
        (1 - i.retireeDeductionRate);
      const yieldTax =
        incomeTax(other + ret * i.taxableYieldShare, ctx).total - incomeTax(other, ctx).total;
      const wTax = wealthTax(i.otherWealth + b, ctx) - wealthTax(i.otherWealth, ctx);
      b = b + ret - w - Math.max(0, yieldTax) - Math.max(0, wTax);
      if (b <= 0) {
        if (exhaustionAge === null) exhaustionAge = Math.round(i.retirementAge) + k;
        b = 0;
      }
      balances.push(b);
    }
    return { balances, exhaustionAge };
  };
  const valueAt = (balances: number[], age: number) =>
    balances[Math.min(balances.length - 1, Math.max(0, age - Math.round(i.retirementAge)))] ?? 0;

  const paths = {} as Record<ReturnProfile, CapitalPath>;
  for (const profile of PROFILES) {
    const { balances, exhaustionAge } = simulate(
      netCapital,
      firstYearNetAnnuity,
      i.returns[profile],
    );
    paths[profile] = {
      profile,
      balances,
      exhaustionAge,
      at85: valueAt(balances, 85),
      at95: valueAt(balances, 95),
    };
  }

  const share = Math.min(1, Math.max(0, i.capitalShare));
  const mixedCapital = i.assets * share - capitalWithdrawalTax(i.assets * share, ctx0).total;
  const mixedAnnuity = i.assets * (1 - share) * i.conversionRate;
  const mixedPath = simulate(mixedCapital, firstYearNetAnnuity * share, i.returns.balanced);

  return {
    ages,
    cumulativeAnnuity,
    netCapital,
    capitalTax: capTax,
    firstYearNetAnnuity,
    breakEvenAge,
    paths,
    mixed: {
      annuity: mixedAnnuity,
      capital: mixedCapital,
      at85: valueAt(mixedPath.balances, 85),
      at95: valueAt(mixedPath.balances, 95),
    },
    deflators,
  };
}
