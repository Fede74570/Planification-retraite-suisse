import type { Profile } from './profile';

/**
 * « Marc et Sophie », Lausanne (VD), married — fictitious example and acceptance profile (§13).
 */
export const EXAMPLE_PROFILE: Profile = {
  status: 'married',
  canton: 'VD',
  nationality: 'CH',
  children: 0,
  main: {
    birthYear: 1966,
    sex: 'm',
    grossIncome: 125_000,
    activityRate: 1,
    avsMissingYears: 0,
    lpp: {
      balance: 420_000,
      projectedAt65: 610_000,
      conversionRate: 0.056,
      buyInPotential: 90_000,
    },
    pillar3a: { balance: 85_000, accounts: 2 },
    retirementAge: 65,
  },
  partner: {
    birthYear: 1968,
    sex: 'f',
    grossIncome: 60_000,
    activityRate: 0.8,
    avsMissingYears: 0,
    lpp: { balance: 180_000, buyInPotential: 0 },
    pillar3a: { balance: 40_000, accounts: 1 },
    retirementAge: 65,
  },
  monthlyExpenses: 9_500,
  savings: 150_000,
  investments: 200_000,
  housing: { value: 1_300_000, mortgage: 650_000, rate: 0.016, kind: 'primary' },
};
