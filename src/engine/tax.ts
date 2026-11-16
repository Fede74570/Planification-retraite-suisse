import { indexFactor, interpolateTax } from './money';
import { CANTONAL_TAX } from './params/cantons';
import type { IfdScale, LegalParams } from './params/types';
import type { CantonCode, CivilStatus } from './profile';

/**
 * Swiss income, wealth and capital-benefit taxes for residents.
 * - Federal (IFD): official scale of the parameter year (art. 36 LIFD), capital at 1/5 (art. 38).
 * - Cantonal + communal: AFC calculator grid for the cantonal capital, log-linear interpolation.
 * Future years: brackets are assumed indexed to inflation (cold progression compensation), so
 * amounts are deflated to the scale year, taxed, then re-inflated.
 */

export interface TaxContext {
  canton: CantonCode;
  status: CivilStatus;
  children: number;
  params: LegalParams;
  /** Calendar year of the amounts. */
  year: number;
  inflation: number;
}

/** Federal tax on a taxable income for the scale's own year. */
export function ifdTax(
  taxable: number,
  status: CivilStatus,
  scale: IfdScale,
  children = 0,
): number {
  const income = Math.floor(Math.max(0, taxable) / 100) * 100; // fractions under CHF 100 dropped
  const brackets = status === 'married' ? scale.married : scale.single;
  let tax = 0;
  for (const b of brackets) if (income >= b.from) tax = b.base + b.rate * (income - b.from);
  tax = Math.min(tax, scale.topRate * income);
  if (status === 'married') tax -= scale.childReduction * children;
  return Math.max(0, Math.floor(tax * 20) / 20); // rounded down to 5 cents
}

const grid = (canton: CantonCode, status: CivilStatus) => CANTONAL_TAX.cantons[canton][status];

/** Cantonal + communal income tax (scale year of the dataset). */
export function cantonalIncomeTax(
  taxable: number,
  canton: CantonCode,
  status: CivilStatus,
): number {
  return interpolateTax(CANTONAL_TAX.meta.grid.income, grid(canton, status).income, taxable);
}

/** Cantonal + communal wealth tax (scale year of the dataset). */
export function cantonalWealthTax(
  taxableWealth: number,
  canton: CantonCode,
  status: CivilStatus,
): number {
  return interpolateTax(CANTONAL_TAX.meta.grid.wealth, grid(canton, status).wealth, taxableWealth);
}

/** Cantonal + communal tax on a pension capital withdrawal (scale year of the dataset). */
export function cantonalCapitalTax(
  amount: number,
  canton: CantonCode,
  status: CivilStatus,
): number {
  return interpolateTax(CANTONAL_TAX.meta.grid.capital, grid(canton, status).capital, amount);
}

function deflators(ctx: TaxContext) {
  return {
    fed: indexFactor(ctx.inflation, ctx.params.meta.year, ctx.year),
    cant: indexFactor(ctx.inflation, CANTONAL_TAX.meta.taxYear, ctx.year),
  };
}

export interface TaxBreakdown {
  federal: number;
  cantonal: number;
  total: number;
}

/** Annual income tax (federal + cantonal/communal) on a nominal taxable income. */
export function incomeTax(taxable: number, ctx: TaxContext): TaxBreakdown {
  const d = deflators(ctx);
  const federal = ifdTax(taxable / d.fed, ctx.status, ctx.params.tax.ifd, ctx.children) * d.fed;
  const cantonal = cantonalIncomeTax(taxable / d.cant, ctx.canton, ctx.status) * d.cant;
  return { federal, cantonal, total: federal + cantonal };
}

/** Annual wealth tax (cantonal/communal only) on a nominal taxable wealth. */
export function wealthTax(taxableWealth: number, ctx: TaxContext): number {
  const d = deflators(ctx);
  return cantonalWealthTax(taxableWealth / d.cant, ctx.canton, ctx.status) * d.cant;
}

/**
 * Tax on pension capital withdrawals of one household in one year. All withdrawals of a married
 * couple in the same year are added up to determine the rate.
 */
export function capitalWithdrawalTax(totalAmount: number, ctx: TaxContext): TaxBreakdown {
  if (totalAmount <= 0) return { federal: 0, cantonal: 0, total: 0 };
  const d = deflators(ctx);
  const federal =
    ifdTax(totalAmount / d.fed, ctx.status, ctx.params.tax.ifd) *
    ctx.params.tax.capitalScaleFraction *
    d.fed;
  const cantonal = cantonalCapitalTax(totalAmount / d.cant, ctx.canton, ctx.status) * d.cant;
  return { federal, cantonal, total: federal + cantonal };
}

/** Marginal income tax rate around a taxable income (federal + cantonal). */
export function marginalIncomeRate(taxable: number, ctx: TaxContext, step = 1000): number {
  return (incomeTax(taxable + step, ctx).total - incomeTax(taxable, ctx).total) / step;
}

/** Tax saved by deducting `deduction` from a taxable income (e.g. LPP buy-in). */
export function deductionSaving(taxable: number, deduction: number, ctx: TaxContext): number {
  return incomeTax(taxable, ctx).total - incomeTax(Math.max(0, taxable - deduction), ctx).total;
}
