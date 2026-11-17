import { describe, expect, it } from 'vitest';
import { COUNTRIES, COUNTRY_BY_ISO3, GEO_TO_ISO3, POPULAR, REGIME_LISTS } from './countries';
import { countrySheet, flagEmoji, searchCountries } from './countrySheet';

const words = (s: string) => s.split(/\s+/).filter((w) => w && !/^[:;,–-]$/.test(w)).length;

describe('Country data', () => {
  it('maps every world-atlas geometry to a known country', () => {
    for (const iso3 of Object.values(GEO_TO_ISO3)) expect(COUNTRY_BY_ISO3.has(iso3)).toBe(true);
    expect(Object.keys(GEO_TO_ISO3).length).toBe(177);
  });
  it('classifies regimes per the OFAS overview (1.1.2026)', () => {
    expect(COUNTRY_BY_ISO3.get('CHE')!.regime).toBe('CH');
    expect(REGIME_LISTS.EU_EFTA).toHaveLength(30);
    for (const iso3 of ['FRA', 'DEU', 'PRT', 'NOR', 'LIE'])
      expect(COUNTRY_BY_ISO3.get(iso3)!.regime).toBe('EU_EFTA');
    for (const iso3 of ['USA', 'CAN', 'GBR', 'TUN', 'XKX', 'JPN'])
      expect(COUNTRY_BY_ISO3.get(iso3)!.regime).toBe('BILATERAL');
    for (const iso3 of ['CHN', 'KOR', 'IND'])
      expect(COUNTRY_BY_ISO3.get(iso3)!.regime).toBe('BILATERAL_LIMITED');
    for (const iso3 of ['THA', 'MAR', 'ARG', 'MDA'])
      expect(COUNTRY_BY_ISO3.get(iso3)!.regime).toBe('NONE');
  });
  it('knows the double taxation treaties (SIF 1.1.2026)', () => {
    for (const iso3 of ['FRA', 'USA', 'THA', 'MAR', 'CHN', 'GHA', 'XKX'])
      expect(COUNTRY_BY_ISO3.get(iso3)!.dta).toBe(true);
    for (const iso3 of ['AGO', 'KEN', 'LBN', 'NGA'])
      expect(COUNTRY_BY_ISO3.get(iso3)!.dta).toBe(false);
  });
  it('has sheets for popular destinations with sources', () => {
    for (const iso3 of POPULAR) {
      const s = countrySheet(iso3, 'CH')!;
      expect(s.sourceUrl).toMatch(/^https:\/\//);
      expect(s.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('keeps every bullet ≤ 12 words and ≤ 2 bullets per pillar', () => {
    for (const c of COUNTRIES) {
      for (const nat of ['CH', 'EU_EFTA', 'OTHER'] as const) {
        const s = countrySheet(c.iso3, nat)!;
        for (const list of Object.values(s.sheet)) {
          expect(list.length).toBeGreaterThan(0);
          expect(list.length).toBeLessThanOrEqual(2);
          for (const b of list) expect(words(b.text), b.text).toBeLessThanOrEqual(12);
        }
      }
    }
  });
  it('adapts AVS bullets to nationality and tax bullets to the treaty', () => {
    expect(countrySheet('THA', 'CH')!.sheet.avs[0]!.status).toBe('ok');
    expect(countrySheet('THA', 'OTHER')!.sheet.avs[0]!.status).toBe('no');
    expect(countrySheet('THA', 'CH')!.sheet.p3a[1]!.status).toBe('warn');
    expect(countrySheet('KEN', 'CH')!.sheet.p3a[1]!.status).toBe('no');
    expect(countrySheet('FRA', 'OTHER')!.sheet.avs[0]!.status).toBe('warn');
    expect(countrySheet('CAN', 'OTHER')!.sheet.avs).toHaveLength(2);
    expect(countrySheet('CHN', 'CH')!.sheet.avs[1]!.text).toMatch(/limitée/);
    expect(countrySheet('CHE', 'CH')!.sheet.tip[0]!.status).toBe('ok');
    expect(countrySheet('XXX', 'CH')).toBeNull();
  });
  it('flags unverified overrides', () => {
    expect(countrySheet('PRT', 'CH')!.hasUnverified).toBe(true);
    expect(countrySheet('FRA', 'CH')!.hasUnverified).toBe(false);
    expect(countrySheet('FRA', 'CH')!.sheet.lpp[1]!.text).toMatch(/7,5/);
  });
  it('searches without accents and builds flags', () => {
    expect(searchCountries('etats')[0]!.iso3).toBe('USA');
    expect(searchCountries('maroc').map((c) => c.iso3)).toContain('MAR');
    expect(searchCountries('  ')).toEqual([]);
    expect(searchCountries('lande').length).toBeGreaterThan(0);
    expect(flagEmoji('CH')).toBe('🇨🇭');
    expect(flagEmoji(undefined)).toBe('');
  });
});
