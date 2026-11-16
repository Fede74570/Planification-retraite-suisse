import type { Assumptions, Sex } from './profile';

/**
 * Default modelling assumptions (§4 of the brief). These are choices, not legal parameters;
 * the user can change them in « Hypothèses ».
 */
export const LIFE_EXPECTANCY_SOURCE = {
  label:
    'OFS – Naissances et décès : espérance de vie à 65 ans en 2024 (hommes 20,4 ans, femmes 23,0 ans)',
  url: 'https://www.bfs.admin.ch/bfs/fr/home/statistiques/population/naissances-deces.html',
};

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  paramYear: 2027,
  startYear: 2027,
  inflation: 0.01,
  returnProfile: 'balanced',
  returns: { prudent: 0.015, balanced: 0.03, dynamic: 0.045 },
  cashReturn: 0.005,
  realWageGrowth: 0.005,
  horizonAge: 95,
  // OFS 2024 observed values (verified via the OFS « Naissances et décès » page, 16.11.2026).
  lifeExpectancy65: { m: 20.4, f: 23.0 } satisfies Record<Sex, number>,
  spendingDropAtRetirement: 0.1,
  spendingDropAfter80: 0.15,
  spendingDropAfter80Enabled: false,
  earlyConversionCutPerYear: 0.002,
  lppSurvivorRatio: 0.6,
  employeeDeductionRate: 0.2,
  retireeDeductionRate: 0.08,
  taxableYieldShare: 0.4,
  realEstateTaxValueRatio: 0.7,
  imputedRentRate: 0.025,
  emergencyMonths: 12,
};

export const RETURN_PROFILES = ['prudent', 'balanced', 'dynamic'] as const;
