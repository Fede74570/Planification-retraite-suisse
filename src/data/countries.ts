import codes from './countryCodes.json';
import dtaData from './dta.json';

/**
 * Retirement abroad: social security regime per country (OFAS overview, état 1.1.2026),
 * double taxation treaties (SIF, état 1.1.2026) and sourced country overrides.
 * Templates per regime live in regimeTemplates.ts; the sheet is built in countrySheet.ts.
 */

export type Regime = 'CH' | 'EU_EFTA' | 'BILATERAL' | 'BILATERAL_LIMITED' | 'NONE';
export type PillarKey = 'avs' | 'lpp' | 'p3a' | 'p3b' | 'tip';

export interface Bullet {
  status: 'ok' | 'warn' | 'no';
  /** ≤ 12 words. */
  text: string;
  /** Not yet confirmed on an official source: displayed « à confirmer ». */
  unverified?: boolean;
}

export interface Country {
  iso3: string;
  nameFr: string;
  regime: Regime;
  /** Double taxation treaty on income in force. */
  dta: boolean;
  overrides?: Partial<Record<PillarKey, Bullet[]>>;
  sourceUrl?: string;
  verifiedOn: string;
}

export const SOURCES = {
  ofas: {
    label:
      'OFAS – Conventions bilatérales et accords multilatéraux de sécurité sociale (état 1.1.2026)',
    url: 'https://www.bsv.admin.ch/fileservice/sdweb-docs-prod-bsvmigch-files/files/2025/12/29/2581d00b-d526-4837-af8e-8a9af24ce17e.pdf',
  },
  memento1003: {
    label: 'Mémento AVS 10.03 – Ressortissants d’États non contractants',
    url: 'https://www.ahv-iv.ch/p/10.03.f',
  },
  memento1002: {
    label: 'Mémento AVS 10.02 – AVS/AI facultative',
    url: 'https://www.ahv-iv.ch/p/10.02.f',
  },
  sif: { label: dtaData.source, url: dtaData.url },
  frTax: {
    label:
      'impots.gouv.fr – Brochure IR 2026, pensions et capitaux de retraite (taux forfaitaire 7,5 %)',
    url: 'https://www.impots.gouv.fr/www2/fichiers/documentation/brochure/ir_2026/pdf_som/07-pensions_115a120.pdf',
  },
} as const;

export const DATA_VERIFIED_ON = '2026-11-17';

/** EU member states (27) + EFTA (Iceland, Liechtenstein, Norway): ALCP / EFTA Convention. */
const EU_EFTA = [
  'AUT',
  'BEL',
  'BGR',
  'HRV',
  'CYP',
  'CZE',
  'DNK',
  'EST',
  'FIN',
  'FRA',
  'DEU',
  'GRC',
  'HUN',
  'IRL',
  'ITA',
  'LVA',
  'LTU',
  'LUX',
  'MLT',
  'NLD',
  'POL',
  'PRT',
  'ROU',
  'SVK',
  'SVN',
  'ESP',
  'SWE',
  'ISL',
  'LIE',
  'NOR',
];
/** Bilateral conventions covering AVS/AI benefits (OFAS overview 1.1.2026, section 3). */
const BILATERAL = [
  'ALB',
  'AUS',
  'BIH',
  'BRA',
  'CAN',
  'CHL',
  'ISR',
  'JPN',
  'XKX',
  'MKD',
  'MNE',
  'PHL',
  'GBR',
  'SMR',
  'SRB',
  'TUN',
  'TUR',
  'URY',
  'USA',
];
/** Conventions limited to insurance liability only (annotation 3: « assujettissement »). */
const BILATERAL_LIMITED = ['CHN', 'KOR', 'IND'];

const DTA = new Set(dtaData.iso3);

const OVERRIDES: Record<string, Pick<Country, 'overrides' | 'sourceUrl'>> = {
  FRA: {
    sourceUrl: SOURCES.frTax.url,
    overrides: {
      lpp: [
        { status: 'ok', text: 'Rente exportée' },
        { status: 'warn', text: 'Capital imposé en France : option 7,5 % après abattement 10 %' },
      ],
      tip: [
        {
          status: 'warn',
          text: 'Retenue suisse sur le capital récupérable avec une attestation fiscale française',
        },
      ],
    },
  },
  GBR: {
    sourceUrl: SOURCES.ofas.url,
    overrides: {
      avs: [
        { status: 'ok', text: 'Convention 2021 : rentes AVS exportées' },
        { status: 'ok', text: 'Droits acquis avant 2021 protégés selon l’ALCP' },
      ],
      tip: [
        {
          status: 'warn',
          text: 'Plus d’assurance maladie suisse : prévoir une couverture britannique',
        },
      ],
    },
  },
  CAN: {
    sourceUrl: SOURCES.ofas.url,
    overrides: {
      tip: [
        { status: 'ok', text: 'Convention avec le Canada et entente distincte avec le Québec' },
      ],
    },
  },
  USA: {
    sourceUrl: SOURCES.ofas.url,
    overrides: {
      tip: [
        {
          status: 'warn',
          text: 'FATCA et PFIC : fonds suisses souvent pénalisants pour Américains',
          unverified: true,
        },
      ],
    },
  },
  PRT: {
    sourceUrl: SOURCES.ofas.url,
    overrides: {
      tip: [
        {
          status: 'warn',
          text: 'Régime RNH fermé ; IFICI ne vise pas les retraités',
          unverified: true,
        },
      ],
    },
  },
  TUN: {
    sourceUrl: SOURCES.ofas.url,
    overrides: {
      tip: [
        { status: 'ok', text: 'Convention de sécurité sociale en vigueur depuis le 1.10.2022' },
      ],
    },
  },
  THA: {
    sourceUrl: SOURCES.sif.url,
    overrides: {
      tip: [{ status: 'warn', text: 'Aucune convention sociale ; CDI en vigueur pour les impôts' }],
    },
  },
  MAR: {
    sourceUrl: SOURCES.sif.url,
    overrides: {
      tip: [{ status: 'warn', text: 'Aucune convention sociale ; CDI en vigueur pour les impôts' }],
    },
  },
  ITA: { sourceUrl: SOURCES.ofas.url },
  ESP: { sourceUrl: SOURCES.ofas.url },
  DEU: { sourceUrl: SOURCES.ofas.url },
};

function regimeOf(iso3: string): Regime {
  if (iso3 === 'CHE') return 'CH';
  if (EU_EFTA.includes(iso3)) return 'EU_EFTA';
  if (BILATERAL.includes(iso3)) return 'BILATERAL';
  if (BILATERAL_LIMITED.includes(iso3)) return 'BILATERAL_LIMITED';
  return 'NONE';
}

export const COUNTRIES: Country[] = codes.countries.map((c) => ({
  iso3: c.iso3,
  nameFr: c.name,
  regime: regimeOf(c.iso3),
  dta: DTA.has(c.iso3),
  verifiedOn: DATA_VERIFIED_ON,
  ...OVERRIDES[c.iso3],
}));

export const COUNTRY_BY_ISO3 = new Map(COUNTRIES.map((c) => [c.iso3, c]));
export const GEO_TO_ISO3: Record<string, string> = codes.geoToIso3;

/** Popular destinations shown as chips (§9.1). */
export const POPULAR = ['FRA', 'ITA', 'ESP', 'PRT', 'DEU', 'THA', 'MAR', 'TUN', 'CAN', 'USA'];

export const REGIME_LABEL: Record<Regime, string> = {
  CH: 'Suisse',
  EU_EFTA: 'UE / AELE',
  BILATERAL: 'Convention bilatérale',
  BILATERAL_LIMITED: 'Convention limitée',
  NONE: 'Aucune convention',
};

export const REGIME_LISTS = { EU_EFTA, BILATERAL, BILATERAL_LIMITED };
