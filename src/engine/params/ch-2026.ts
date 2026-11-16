import {
  DEFERRAL_INCREASE_2026,
  EARLY_REDUCTION_2026,
  HOUSING_PRACTICE,
  IMPUTED_RENT_ABOLISHED_FROM,
  LPP_CREDIT_RATES,
  NON_EMPLOYED_2026,
  SOURCES,
} from './common';
import type { LegalParams } from './types';

/**
 * Legal parameters 2026. AVS/LPP/3a amounts unchanged since 1.1.2025 (no adaptation in 2026).
 * IFD scale: AFC Form. 58c 2026 — brackets reconstructed from the official table and checked
 * against its rows (see __tests__/tax.test.ts).
 */
export const CH_2026: LegalParams = {
  meta: {
    year: 2026,
    verifiedOn: '2026-11-16',
    sources: [
      SOURCES.memento2025,
      SOURCES.memento304,
      SOURCES.memento203,
      SOURCES.form58c2026,
      SOURCES.lavs,
      SOURCES.lpp,
      SOURCES.lifd,
    ],
    pending: [],
  },
  avs: {
    minMonthly: 1260,
    maxMonthly: 2520,
    coupleCapRatio: 1.5,
    fullContributionYears: 44,
    referenceAge: 65,
    earliestAge: 63,
    transitionalEarliestAge: 62,
    maxDeferralYears: 5,
    earlyReductionByMonth: EARLY_REDUCTION_2026,
    deferralIncrease: DEFERRAL_INCREASE_2026,
    flexRatesConfirmed: true,
    partialShareRange: [0.2, 0.8],
    thirteenthPension: true,
    nonEmployed: NON_EMPLOYED_2026,
  },
  lpp: {
    entryThreshold: 22_680,
    coordinationDeduction: 26_460,
    upperLimit: 90_720,
    minCoordinated: 3_780,
    maxCoordinated: 64_260,
    minConversionRate: 0.068,
    minInterestRate: 0.0125,
    creditRates: LPP_CREDIT_RATES,
    buyBackLockYears: 3,
    maxCapitalTranches: 3,
  },
  pillar3a: {
    maxWithLpp: 7_258,
    maxWithoutLpp: 36_288,
    maxWithoutLppIncomeRate: 0.2,
    earlyWithdrawalYears: 5,
    latestAgeIfWorking: 70,
  },
  tax: {
    capitalScaleFraction: 0.2,
    ifd: {
      topRate: 0.115,
      childReduction: 263,
      single: [
        { from: 15_200, base: 0, rate: 0.0077 },
        { from: 33_200, base: 138.6, rate: 0.0088 },
        { from: 43_500, base: 229.24, rate: 0.0264 },
        { from: 58_000, base: 612.04, rate: 0.0297 },
        { from: 76_200, base: 1_152.58, rate: 0.0594 },
        { from: 82_100, base: 1_503.04, rate: 0.066 },
        { from: 108_900, base: 3_271.84, rate: 0.088 },
        { from: 141_500, base: 6_140.64, rate: 0.11 },
        { from: 185_100, base: 10_936.64, rate: 0.132 },
      ],
      married: [
        { from: 29_700, base: 0, rate: 0.01 },
        { from: 53_400, base: 237, rate: 0.02 },
        { from: 61_300, base: 395, rate: 0.03 },
        { from: 79_100, base: 929, rate: 0.04 },
        { from: 94_900, base: 1_561, rate: 0.05 },
        { from: 108_700, base: 2_251, rate: 0.06 },
        { from: 120_600, base: 2_965, rate: 0.07 },
        { from: 130_500, base: 3_658, rate: 0.08 },
        { from: 138_400, base: 4_290, rate: 0.09 },
        { from: 144_300, base: 4_821, rate: 0.1 },
        { from: 148_300, base: 5_221, rate: 0.11 },
        { from: 150_400, base: 5_452, rate: 0.12 },
        { from: 152_400, base: 5_692, rate: 0.13 },
      ],
    },
  },
  housing: { ...HOUSING_PRACTICE, imputedRentAbolishedFrom: IMPUTED_RENT_ABOLISHED_FROM },
};
