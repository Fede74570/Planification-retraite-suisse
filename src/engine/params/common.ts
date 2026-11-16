import type { AvsParams, HousingParams, Source } from './types';

/**
 * Values shared by several years. Each block cites its source.
 */

// AVS flexible retirement — official tables, memento 3.04 « Flexibilisation de la retraite », état au 1.1.2026.
// Index = months of anticipation (0..24). Lifetime reduction in %.
export const EARLY_REDUCTION_2026 = [
  0, 0.6, 1.1, 1.7, 2.3, 2.8, 3.4, 4.0, 4.5, 5.1, 5.7, 6.2, 6.8, 7.4, 7.9, 8.5, 9.1, 9.6, 10.2,
  10.8, 11.3, 11.9, 12.5, 13.0, 13.6,
].map((p) => p / 100);

// Deferral supplement in %, rows = years 1..5, columns = extra months 0-2, 3-5, 6-8, 9-11.
export const DEFERRAL_INCREASE_2026 = [
  [5.2, 6.6, 8.0, 9.4],
  [10.8, 12.3, 13.9, 15.5],
  [17.1, 18.8, 20.5, 22.2],
  [24.0, 25.8, 27.7, 29.6],
  [31.5, 31.5, 31.5, 31.5],
].map((r) => r.map((p) => p / 100));

// Non-employed AVS/AI/APG contributions — memento 2.03, état au 1.1.2026.
export const NON_EMPLOYED_2026: AvsParams['nonEmployed'] = {
  min: 530,
  firstStep: 350_000,
  firstStepAmount: 636,
  step: 50_000,
  increment1: 106,
  secondThreshold: 1_750_000,
  increment2: 159,
  max: 26_500,
};

// Mortgage practice (not law): Swiss Bankers Association guidelines recognised by FINMA
// (2nd rank amortised to 2/3 of the value within 15 years, at the latest by retirement) and
// the usual affordability rule (5 % theoretical interest + 1 % maintenance ≤ 1/3 of gross income).
export const HOUSING_PRACTICE: Omit<HousingParams, 'imputedRentAbolishedFrom'> = {
  theoreticalInterestRate: 0.05,
  maintenanceRate: 0.01,
  maxAffordabilityRatio: 1 / 3,
  firstRankLtv: 2 / 3,
  secondRankAmortizationYears: 15,
};

// Imputed rental value abolished from tax year 2029 (popular vote 28.09.2025, date set by the
// Federal Council on 01.04.2026 — per project brief).
export const IMPUTED_RENT_ABOLISHED_FROM = 2029;

export const LPP_CREDIT_RATES = [
  { fromAge: 25, toAge: 34, rate: 0.07 },
  { fromAge: 35, toAge: 44, rate: 0.1 },
  { fromAge: 45, toAge: 54, rate: 0.15 },
  { fromAge: 55, toAge: 65, rate: 0.18 },
];

export const SOURCES = {
  memento304: {
    label: 'Mémento 3.04 – Flexibilisation de la retraite (état au 1.1.2026)',
    url: 'https://www.ahv-iv.ch/p/3.04.f',
  },
  memento203: {
    label: 'Mémento 2.03 – Cotisations des personnes sans activité lucrative (état au 1.1.2026)',
    url: 'https://www.ahv-iv.ch/p/2.03.f',
  },
  memento2025: {
    label: 'Mémento 1.2025 – Modifications au 1er janvier 2025 (montants inchangés en 2026)',
    url: 'https://www.ahv-iv.ch/p/1.2025.f',
  },
  form58c2026: {
    label: 'AFC – Form. 58c, barèmes IFD 2026 (personnes physiques et prestations en capital)',
    url: 'https://www.estv.admin.ch/dam/fr/sd-web/gnde9CmEsalK/dbst-tairfe-58c-2026-dfi.pdf',
    date: '2026-01-01',
  },
  opfr2027: {
    label: 'DFF – OPFr, compensation de la progression à froid, barèmes IFD 2027 (art. 2)',
    url: 'https://www.estv.admin.ch/fr/newnsb/rq9rumbCaofX',
    date: '2026-09-22',
  },
  cf2027: {
    label: 'Conseil fédéral – Adaptation des rentes AVS/AI au 1.1.2027 (fiche des montants)',
    url: 'https://www.admin.ch/fr/newnsb/BqB41FVYi5FB',
    date: '2026-10-02',
  },
  lppInterest2027: {
    label: 'Conseil fédéral – Taux d’intérêt minimal LPP relevé à 2 % dès 2027',
    url: 'https://www.bsv.admin.ch/fr/newnsb/8DF8zxcfvu7l',
    date: '2026-11-04',
  },
  lifd: {
    label: 'LIFD (RS 642.11), art. 36 et 38',
    url: 'https://www.fedlex.admin.ch/eli/cc/1991/1184_1184_1184/fr',
  },
  lpp: {
    label: 'LPP (RS 831.40), art. 8, 14, 16, 79b',
    url: 'https://www.fedlex.admin.ch/eli/cc/1983/797_797_797/fr',
  },
  lavs: {
    label: 'LAVS (RS 831.10), art. 34, 35, 39, 40',
    url: 'https://www.fedlex.admin.ch/eli/cc/63/837_843_843/fr',
  },
} satisfies Record<string, Source>;
