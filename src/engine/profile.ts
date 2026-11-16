/** Inputs of the engine: who the user is, what they own, and the assumptions they accept. */

export type Sex = 'm' | 'f';
export type CivilStatus = 'single' | 'married';
export type Nationality = 'CH' | 'EU_EFTA' | 'OTHER';
export type ReturnProfile = 'prudent' | 'balanced' | 'dynamic';
export type PersonKey = 'main' | 'partner';

export const CANTON_CODES = [
  'ZH',
  'BE',
  'LU',
  'UR',
  'SZ',
  'OW',
  'NW',
  'GL',
  'ZG',
  'FR',
  'SO',
  'BS',
  'BL',
  'SH',
  'AR',
  'AI',
  'SG',
  'GR',
  'AG',
  'TG',
  'TI',
  'VD',
  'VS',
  'NE',
  'GE',
  'JU',
] as const;
export type CantonCode = (typeof CANTON_CODES)[number];

export interface LppInput {
  /** Current retirement assets (certificate). */
  balance: number;
  /** Projected assets at 65 (certificate). Optional: computed from the legal minimum otherwise. */
  projectedAt65?: number;
  /** Fund's conversion rate at 65 (envelope rate). Defaults to projectedAnnuity / projectedAt65, else legal minimum. */
  conversionRate?: number;
  /** Projected annual annuity at 65 (certificate). */
  projectedAnnuityAt65?: number;
  /** Remaining buy-in potential (certificate). */
  buyInPotential: number;
  /** Maximum capital share allowed by the regulation (default 100 %). */
  maxCapitalShare?: number;
  /** Earliest retirement age allowed by the regulation (default 58). */
  earliestRetirementAge?: number;
}

export interface PersonInput {
  birthYear: number;
  sex: Sex;
  /** Current gross annual income from employment (already reflects the activity rate). */
  grossIncome: number;
  /** Current activity rate, 0..1 (informative; the income already reflects it). */
  activityRate: number;
  /** Missing AVS contribution years (gaps). */
  avsMissingYears: number;
  /** Expert: average determining income (RAM) read from the individual account statement. */
  ramOverride?: number;
  lpp: LppInput;
  pillar3a: { balance: number; accounts: number; annualContribution?: number };
  /** Desired retirement age (full stop of activity). */
  retirementAge: number;
}

export interface HousingInput {
  value: number;
  mortgage: number;
  /** Current mortgage interest rate (e.g. 0.016). */
  rate: number;
  kind: 'primary' | 'rental';
  /** Gross annual rent received (rental property only). */
  rentalIncome?: number;
}

export interface Profile {
  status: CivilStatus;
  canton: CantonCode;
  nationality: Nationality;
  main: PersonInput;
  partner?: PersonInput;
  children: number;
  /** Household living expenses per month, excluding taxes and mortgage interest/amortisation. */
  monthlyExpenses: number;
  savings: number;
  investments: number;
  pillar3b?: { value: number; annualContribution: number; availableAge: number };
  housing?: HousingInput;
}

/** User-adjustable assumptions (panel « Hypothèses »). Not legal parameters. */
export interface Assumptions {
  paramYear: number;
  /** First simulated calendar year. */
  startYear: number;
  inflation: number;
  returnProfile: ReturnProfile;
  returns: Record<ReturnProfile, number>;
  cashReturn: number;
  realWageGrowth: number;
  /** Planning horizon (age of the main person). */
  horizonAge: number;
  /** Remaining life expectancy at 65 (OFS). */
  lifeExpectancy65: Record<Sex, number>;
  spendingDropAtRetirement: number;
  spendingDropAfter80: number;
  spendingDropAfter80Enabled: boolean;
  /** Conversion-rate cut per year of early retirement (fund practice). */
  earlyConversionCutPerYear: number;
  lppSurvivorRatio: number;
  /** Share of gross salary removed to approximate taxable income (social contributions, LPP, flat deductions). */
  employeeDeductionRate: number;
  /** Share of pension income removed to approximate taxable income (insurance premiums, flat deductions). */
  retireeDeductionRate: number;
  /** Share of the investment return that is taxable income (dividends, interest; capital gains are tax-free). */
  taxableYieldShare: number;
  /** Tax value of real estate as a share of market value. */
  realEstateTaxValueRatio: number;
  /** Imputed rental value as a share of market value (until 2028). */
  imputedRentRate: number;
  /** Emergency fund, in months of expenses. */
  emergencyMonths: number;
}

/** Decisions that define a scenario (retirement timing, rente/capital, withdrawals…). */
export interface PersonStrategy {
  /** Age at which work fully stops. */
  retirementAge: number;
  /** Optional partial retirement: activity rate between `fromAge` and the retirement age. */
  partial?: { fromAge: number; activityRate: number };
  /** Age at which the AVS pension starts (63..70). */
  avsClaimAge: number;
  /** Share of the LPP assets taken as capital, 0..1. */
  lppCapitalShare: number;
  /** Age of each 3a account withdrawal (length = number of accounts). */
  p3aWithdrawalAges: number[];
}

export interface Strategy {
  main: PersonStrategy;
  partner?: PersonStrategy;
  /** Voluntary LPP buy-ins (calendar year, amount). */
  lppBuyIns: Array<{ person: PersonKey; year: number; amount: number }>;
  /** One-off mortgage amortisation (calendar year, amount). */
  amortization?: { year: number; amount: number };
}
