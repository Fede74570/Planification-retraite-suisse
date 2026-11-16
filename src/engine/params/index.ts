import { CH_2026 } from './ch-2026';
import { CH_2027 } from './ch-2027';
import type { LegalParams } from './types';

export const PARAMS_BY_YEAR: Record<number, LegalParams> = { 2026: CH_2026, 2027: CH_2027 };
export const AVAILABLE_YEARS = Object.keys(PARAMS_BY_YEAR).map(Number).sort();
export const DEFAULT_PARAM_YEAR = 2027;

/** Parameters for a given year; falls back to the closest available year. */
export function getParams(year: number = DEFAULT_PARAM_YEAR): LegalParams {
  const exact = PARAMS_BY_YEAR[year];
  if (exact) return exact;
  const closest = AVAILABLE_YEARS.reduce((a, b) =>
    Math.abs(b - year) < Math.abs(a - year) ? b : a,
  );
  return PARAMS_BY_YEAR[closest]!;
}

export type { LegalParams } from './types';
