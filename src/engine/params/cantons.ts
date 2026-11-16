import type { CantonCode } from '../profile';
import data from './cantonal-tax-2026.json';

/**
 * Cantonal + communal tax data for the 26 cantonal capitals (church tax excluded), generated from
 * the official AFC/ESTV tax calculator by scripts/fetch-cantonal-tax.mjs. Estimation ±10 %,
 * commune chef-lieu.
 */

export interface CantonTaxGrid {
  income: number[];
  wealth: number[];
  capital: number[];
}
export interface CantonTaxData {
  capital: string;
  bfsId: number;
  single: CantonTaxGrid;
  married: CantonTaxGrid;
}
export interface CantonalTaxDataset {
  meta: {
    taxYear: number;
    generatedOn: string;
    source: string;
    notes: string;
    grid: { income: number[]; wealth: number[]; capital: number[] };
  };
  cantons: Record<CantonCode, CantonTaxData>;
}

export const CANTONAL_TAX: CantonalTaxDataset = data as CantonalTaxDataset;

export const CANTON_NAMES: Record<CantonCode, string> = {
  ZH: 'Zurich',
  BE: 'Berne',
  LU: 'Lucerne',
  UR: 'Uri',
  SZ: 'Schwytz',
  OW: 'Obwald',
  NW: 'Nidwald',
  GL: 'Glaris',
  ZG: 'Zoug',
  FR: 'Fribourg',
  SO: 'Soleure',
  BS: 'Bâle-Ville',
  BL: 'Bâle-Campagne',
  SH: 'Schaffhouse',
  AR: 'Appenzell Rhodes-Extérieures',
  AI: 'Appenzell Rhodes-Intérieures',
  SG: 'Saint-Gall',
  GR: 'Grisons',
  AG: 'Argovie',
  TG: 'Thurgovie',
  TI: 'Tessin',
  VD: 'Vaud',
  VS: 'Valais',
  NE: 'Neuchâtel',
  GE: 'Genève',
  JU: 'Jura',
};
