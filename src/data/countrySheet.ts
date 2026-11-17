import type { Nationality } from '@/engine/profile';
import { COUNTRY_BY_ISO3, COUNTRIES, SOURCES, type Country, type PillarKey } from './countries';
import { regimeTemplate, type Sheet } from './regimeTemplates';

/** A country sheet ready to display: template + overrides, with its source. */
export interface CountrySheet {
  country: Country;
  sheet: Sheet;
  sourceUrl: string;
  sourceLabel: string;
  verifiedOn: string;
  hasUnverified: boolean;
}

export function countrySheet(iso3: string, nationality: Nationality): CountrySheet | null {
  const country = COUNTRY_BY_ISO3.get(iso3);
  if (!country) return null;
  const base = regimeTemplate(country.regime, nationality, country.dta);
  const sheet = { ...base };
  for (const key of Object.keys(country.overrides ?? {}) as PillarKey[]) {
    const o = country.overrides![key];
    if (o?.length) sheet[key] = o;
  }
  const sourceUrl =
    country.sourceUrl ?? (country.regime === 'NONE' ? SOURCES.memento1003.url : SOURCES.ofas.url);
  const sourceLabel = Object.values(SOURCES).find((s) => s.url === sourceUrl)?.label ?? 'OFAS';
  const hasUnverified = Object.values(sheet).some((list) => list.some((b) => b.unverified));
  return { country, sheet, sourceUrl, sourceLabel, verifiedOn: country.verifiedOn, hasUnverified };
}

/** Accent- and case-insensitive country search (prefix matches first). */
export function searchCountries(query: string, limit = 8): Country[] {
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = n(query.trim());
  if (!q) return [];
  const starts = COUNTRIES.filter((c) => n(c.nameFr).startsWith(q));
  const contains = COUNTRIES.filter((c) => !n(c.nameFr).startsWith(q) && n(c.nameFr).includes(q));
  return [...starts, ...contains].slice(0, limit);
}

/** Emoji flag from an ISO3 code (via ISO2), empty for unknown codes. */
export function flagEmoji(iso2: string | undefined): string {
  if (!iso2 || iso2.length !== 2) return '';
  return String.fromCodePoint(
    ...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
