/** Legal parameters for one calendar year. Every figure must be sourced (see `meta.sources`). */

export interface Source {
  label: string;
  url: string;
  /** Publication date of the source (ISO). */
  date?: string;
}

/** One step of a progressive tax scale: from `from` CHF, tax = `base` + `rate` × (income − from). */
export interface Bracket {
  from: number;
  base: number;
  /** Marginal rate (0.0264 = 2.64 CHF per 100 CHF). */
  rate: number;
}

export interface IfdScale {
  single: Bracket[];
  married: Bracket[];
  /** Above the crossover, the whole income is taxed at this flat rate (art. 36 LIFD). */
  topRate: number;
  /** Reduction of the tax amount per child (art. 36 al. 2bis LIFD). */
  childReduction: number;
}

export interface AvsParams {
  minMonthly: number;
  maxMonthly: number;
  /** Married couple cap as a ratio of the maximum pension (150 %). */
  coupleCapRatio: number;
  /** Contribution years for a full pension (scale 44). */
  fullContributionYears: number;
  referenceAge: number;
  earliestAge: number;
  transitionalEarliestAge: number;
  maxDeferralYears: number;
  /** Lifetime reduction by number of months of anticipation (index 0..24). */
  earlyReductionByMonth: number[];
  /** Supplement by years (1..5) and quarter of year (0-2, 3-5, 6-8, 9-11 months). */
  deferralIncrease: number[][];
  /** False while the life-expectancy adjustment (AVS 21, from 2027) has not been published. */
  flexRatesConfirmed: boolean;
  /** Anticipated or deferred share must be between these bounds. */
  partialShareRange: [number, number];
  /** 13th pension: one extra monthly amount per year (paid in December). */
  thirteenthPension: boolean;
  /** Non-employed contributions: wealth + 20 × pension income → annual contribution. */
  nonEmployed: {
    min: number;
    firstStep: number;
    firstStepAmount: number;
    step: number;
    increment1: number;
    secondThreshold: number;
    increment2: number;
    max: number;
  };
}

export interface LppParams {
  entryThreshold: number;
  coordinationDeduction: number;
  upperLimit: number;
  minCoordinated: number;
  maxCoordinated: number;
  minConversionRate: number;
  minInterestRate: number;
  /** Age credits as % of coordinated salary. */
  creditRates: Array<{ fromAge: number; toAge: number; rate: number }>;
  buyBackLockYears: number;
  /** Max tranches for partial retirement capital withdrawals (usual regulation). */
  maxCapitalTranches: number;
}

export interface Pillar3aParams {
  maxWithLpp: number;
  maxWithoutLpp: number;
  maxWithoutLppIncomeRate: number;
  /** Years before the reference age from which withdrawal is allowed. */
  earlyWithdrawalYears: number;
  /** Latest withdrawal age when still working. */
  latestAgeIfWorking: number;
}

export interface TaxParams {
  ifd: IfdScale;
  /** Capital benefits from pensions: fraction of the ordinary scale (art. 38 LIFD). */
  capitalScaleFraction: number;
}

export interface HousingParams {
  /** First tax year without imputed rent / owner-occupier interest deduction. */
  imputedRentAbolishedFrom: number;
  theoreticalInterestRate: number;
  maintenanceRate: number;
  maxAffordabilityRatio: number;
  firstRankLtv: number;
  secondRankAmortizationYears: number;
}

export interface LegalParams {
  meta: {
    year: number;
    verifiedOn: string;
    sources: Source[];
    /** Values still awaiting official confirmation (shown as « à confirmer »). */
    pending: string[];
  };
  avs: AvsParams;
  lpp: LppParams;
  pillar3a: Pillar3aParams;
  tax: TaxParams;
  housing: HousingParams;
}
