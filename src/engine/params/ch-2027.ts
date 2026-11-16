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
 * Legal parameters 2027.
 * - AVS/LPP/3a amounts: Federal Council decision of 02.10.2026 (official fact sheet).
 * - LPP minimum interest: 2 % (Federal Council, 04.11.2026).
 * - IFD scale: OPFr of 22.09.2026, art. 2 (official brackets).
 */
export const CH_2027: LegalParams = {
  meta: {
    year: 2027,
    verifiedOn: '2026-11-16',
    sources: [
      SOURCES.cf2027,
      SOURCES.lppInterest2027,
      SOURCES.opfr2027,
      SOURCES.memento304,
      SOURCES.memento203,
      SOURCES.lavs,
      SOURCES.lpp,
      SOURCES.lifd,
    ],
    pending: [
      'Taux d’anticipation et d’ajournement AVS adaptés à l’espérance de vie (AVS 21) : non publiés au 16.11.2026, taux 2026 utilisés.',
      'Barème des cotisations AVS des non-actifs 2027 : seule la cotisation minimale (541 fr.) est publiée, paliers 2026 utilisés.',
    ],
  },
  avs: {
    minMonthly: 1280,
    maxMonthly: 2560,
    coupleCapRatio: 1.5,
    fullContributionYears: 44,
    referenceAge: 65,
    earliestAge: 63,
    transitionalEarliestAge: 62,
    maxDeferralYears: 5,
    // TODO: VERIFY — life-expectancy adjustment not yet set by the Federal Council (16.11.2026).
    earlyReductionByMonth: EARLY_REDUCTION_2026,
    deferralIncrease: DEFERRAL_INCREASE_2026,
    flexRatesConfirmed: false,
    partialShareRange: [0.2, 0.8],
    thirteenthPension: true,
    // TODO: VERIFY — only the 2027 minimum (541) is published; steps kept from 2026.
    nonEmployed: { ...NON_EMPLOYED_2026, min: 541 },
  },
  lpp: {
    entryThreshold: 23_040,
    coordinationDeduction: 26_880,
    upperLimit: 92_160,
    minCoordinated: 3_840,
    maxCoordinated: 65_280,
    minConversionRate: 0.068,
    minInterestRate: 0.02,
    creditRates: LPP_CREDIT_RATES,
    buyBackLockYears: 3,
    maxCapitalTranches: 3,
  },
  pillar3a: {
    maxWithLpp: 7_373,
    maxWithoutLpp: 36_864,
    maxWithoutLppIncomeRate: 0.2,
    earlyWithdrawalYears: 5,
    latestAgeIfWorking: 70,
  },
  tax: {
    capitalScaleFraction: 0.2,
    ifd: {
      topRate: 0.115,
      childReduction: 264,
      single: [
        { from: 15_300, base: 0, rate: 0.0077 },
        { from: 33_400, base: 139.35, rate: 0.0088 },
        { from: 43_700, base: 229.95, rate: 0.0264 },
        { from: 58_300, base: 615.35, rate: 0.0297 },
        { from: 76_500, base: 1_155.85, rate: 0.0594 },
        { from: 82_400, base: 1_506.3, rate: 0.066 },
        { from: 109_400, base: 3_288.3, rate: 0.088 },
        { from: 142_200, base: 6_174.7, rate: 0.11 },
        { from: 185_900, base: 10_981.7, rate: 0.132 },
      ],
      married: [
        { from: 29_900, base: 0, rate: 0.01 },
        { from: 53_700, base: 238, rate: 0.02 },
        { from: 61_600, base: 396, rate: 0.03 },
        { from: 79_500, base: 933, rate: 0.04 },
        { from: 95_400, base: 1_569, rate: 0.05 },
        { from: 109_200, base: 2_259, rate: 0.06 },
        { from: 121_200, base: 2_979, rate: 0.07 },
        { from: 131_100, base: 3_672, rate: 0.08 },
        { from: 139_100, base: 4_312, rate: 0.09 },
        { from: 145_000, base: 4_843, rate: 0.1 },
        { from: 149_000, base: 5_243, rate: 0.11 },
        { from: 151_100, base: 5_474, rate: 0.12 },
        { from: 153_100, base: 5_714, rate: 0.13 },
      ],
    },
  },
  housing: { ...HOUSING_PRACTICE, imputedRentAbolishedFrom: IMPUTED_RENT_ABOLISHED_FROM },
};
