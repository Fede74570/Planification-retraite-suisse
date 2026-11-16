// Builds src/engine/params/cantonal-tax-<year>.json from the official AFC/ESTV tax calculator
// (swisstaxcalculator.estv.admin.ch). Dev-time tool only: the app never calls this service.
//
// For each of the 26 cantonal capitals it records the cantonal + communal tax (church tax excluded)
// on a grid of taxable income, taxable wealth and pension capital withdrawals, for single and
// married taxpayers. The engine interpolates log-linearly between grid points.
//
// Usage: NODE_USE_ENV_PROXY=1 node scripts/fetch-cantonal-tax.mjs 2026
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const YEAR = Number(process.argv[2] ?? 2026);
const BASE =
  'https://swisstaxcalculator.estv.admin.ch/delegate/ost-integration/v1/lg-proxy/operation/c3b67379_ESTV';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, `src/engine/params/cantonal-tax-${YEAR}.json`);

const CAPITALS = [
  ['ZH', 'Zürich'],
  ['BE', 'Bern'],
  ['LU', 'Luzern'],
  ['UR', 'Altdorf'],
  ['SZ', 'Schwyz'],
  ['OW', 'Sarnen'],
  ['NW', 'Stans'],
  ['GL', 'Glarus'],
  ['ZG', 'Zug'],
  ['FR', 'Fribourg'],
  ['SO', 'Solothurn'],
  ['BS', 'Basel'],
  ['BL', 'Liestal'],
  ['SH', 'Schaffhausen'],
  ['AR', 'Herisau'],
  ['AI', 'Appenzell'],
  ['SG', 'St. Gallen'],
  ['GR', 'Chur'],
  ['AG', 'Aarau'],
  ['TG', 'Frauenfeld'],
  ['TI', 'Bellinzona'],
  ['VD', 'Lausanne'],
  ['VS', 'Sion'],
  ['NE', 'Neuchâtel'],
  ['GE', 'Genève'],
  ['JU', 'Delémont'],
];
const INCOME = [
  10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 70_000, 80_000, 100_000, 120_000, 150_000,
  200_000, 300_000, 500_000, 1_000_000,
];
const WEALTH = [50_000, 100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const CAPITAL = [
  25_000, 50_000, 100_000, 200_000, 300_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000,
  3_000_000,
];
const REL = { single: 1, married: 2 };
const NO_CONFESSION = 4; // church tax excluded

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(op, body, attempt = 0) {
  try {
    const res = await fetch(`${BASE}/${op}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${op} HTTP ${res.status}`);
    await sleep(120); // be gentle with the public service
    return (await res.json()).response;
  } catch (e) {
    if (attempt >= 3) throw e;
    await sleep(1000 * 2 ** attempt);
    return call(op, body, attempt + 1);
  }
}

async function locate(canton, city) {
  const list = await call('API_searchLocation', { Search: city, Language: 1, TaxYear: YEAR });
  const hit =
    list.find((l) => l.Canton === canton && l.City === city) ??
    list.find((l) => l.Canton === canton);
  if (!hit) throw new Error(`location not found: ${canton} ${city}`);
  return hit;
}

const result = {
  meta: {
    taxYear: YEAR,
    generatedOn: new Date().toISOString().slice(0, 10),
    source:
      'AFC/ESTV — calculateur d’impôts officiel (swisstaxcalculator.estv.admin.ch), commune chef-lieu, sans impôt ecclésiastique',
    notes:
      'Montants annuels en CHF = impôt cantonal + communal. income/wealth : revenu et fortune imposables. capital : prestation en capital de prévoyance, âge 65.',
    grid: { income: INCOME, wealth: WEALTH, capital: CAPITAL },
  },
  cantons: {},
};

for (const [canton, city] of CAPITALS) {
  const loc = await locate(canton, city);
  const entry = { capital: city, bfsId: loc.BfsID, single: {}, married: {} };
  for (const [rel, code] of Object.entries(REL)) {
    const simple = (income, wealth) =>
      call('API_calculateSimpleTaxes', {
        SimKey: null,
        TaxYear: YEAR,
        TaxLocationID: loc.TaxLocationID,
        Relationship: code,
        Confession1: NO_CONFESSION,
        Children: [],
        Confession2: code === 2 ? NO_CONFESSION : 0,
        TaxableIncomeCanton: income,
        TaxableIncomeFed: income,
        TaxableFortune: wealth,
      });
    const income = [];
    for (const v of INCOME) {
      const r = await simple(v, 0);
      income.push(r.IncomeTaxCanton + r.IncomeTaxCity);
    }
    const wealth = [];
    for (const v of WEALTH) {
      const r = await simple(0, v);
      wealth.push(r.FortuneTaxCanton + r.FortuneTaxCity);
    }
    const capital = [];
    for (const v of CAPITAL) {
      const [r] = await call('API_calculateManyCapitalTaxes', {
        SimKey: null,
        TaxYear: YEAR,
        TaxGroupID: loc.TaxLocationID,
        Relationship: code,
        Confession1: NO_CONFESSION,
        NumberOfChildren: 0,
        Gender: 1,
        AgeAtPayment: 65,
        Capital: v,
        Confession2: code === 2 ? NO_CONFESSION : 0,
      });
      capital.push(r.TaxCanton + r.TaxCity);
    }
    entry[rel] = { income, wealth, capital };
  }
  result.cantons[canton] = entry;
  console.log(canton, city, 'ok');
}

fs.writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
console.log('written', path.relative(root, out));
