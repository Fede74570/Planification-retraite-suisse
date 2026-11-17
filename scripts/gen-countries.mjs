// Generates src/data/countryCodes.json (ISO numeric → ISO3 + French name) and src/data/dta.json
// (jurisdictions with a Swiss double taxation treaty on income in force).
// Inputs: world-atlas (country ids), i18n-iso-countries (French names), and the SIF list
// « Conventions suisses de double imposition, état au 1er janvier 2026 » (names copied below
// from its table of withholding-tax relief, which lists the applicable treaties).
// Usage: node scripts/gen-countries.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const countries = require('i18n-iso-countries');
const world = require('world-atlas/countries-110m.json');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

// --- Country codes -------------------------------------------------------------------------
const names = countries.getNames('fr', { select: 'official' });
const list = Object.entries(countries.getAlpha3Codes()).map(([iso3, iso2]) => ({
  iso3,
  iso2,
  num: countries.alpha3ToNumeric(iso3),
  name: names[iso2] ?? iso3,
}));
list.push({ iso3: 'XKX', iso2: 'XK', num: null, name: 'Kosovo' });
// Shorter, usual French names where the official short name is awkward.
const RENAME = {
  USA: 'États-Unis',
  GBR: 'Royaume-Uni',
  RUS: 'Russie',
  KOR: 'Corée du Sud',
  PRK: 'Corée du Nord',
  IRN: 'Iran',
  SYR: 'Syrie',
  VEN: 'Venezuela',
  BOL: 'Bolivie',
  TZA: 'Tanzanie',
  MDA: 'Moldavie',
  LAO: 'Laos',
  VNM: 'Vietnam',
  CZE: 'Tchéquie',
  MKD: 'Macédoine du Nord',
  COD: 'Congo (RDC)',
  COG: 'Congo',
  TWN: 'Taïwan',
  PSE: 'Palestine',
  FSM: 'Micronésie',
  BRN: 'Brunei',
  CIV: 'Côte d’Ivoire',
  NLD: 'Pays-Bas',
  ARE: 'Émirats arabes unis',
  BIH: 'Bosnie-Herzégovine',
  VAT: 'Vatican',
};
for (const c of list) if (RENAME[c.iso3]) c.name = RENAME[c.iso3];
list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

// world-atlas geometries without id: Kosovo, Northern Cyprus (→ Cyprus), Somaliland (→ Somalia).
const NAMELESS = { Kosovo: 'XKX', 'N. Cyprus': 'CYP', Somaliland: 'SOM' };
const geoToIso3 = {};
for (const g of world.objects.countries.geometries) {
  const iso3 = g.id ? countries.numericToAlpha3(g.id) : NAMELESS[g.properties.name];
  if (!iso3) throw new Error(`unmapped geometry ${g.id} ${g.properties.name}`);
  geoToIso3[g.id ?? g.properties.name] = iso3;
}
fs.writeFileSync(
  path.join(root, 'src/data/countryCodes.json'),
  JSON.stringify({ countries: list, geoToIso3 }) + '\n',
);

// --- Double taxation treaties (income) in force, SIF 01.01.2026 --------------------------------
const DTA_NAMES =
  `Afrique du Sud, Albanie, Algérie, Allemagne, Arabie saoudite, Argentine, Arménie, Australie, Autriche,
Azerbaïdjan, Bahreïn, Bangladesh, Bélarus, Belgique, Brésil, Bulgarie, Canada, Chili, Chine, Chypre, Colombie,
Corée (Sud), Côte d'Ivoire, Croatie, Danemark, Egypte, Emirats Arabes Unis, Equateur, Espagne, Etats-Unis, Estonie,
Ethiopie, Finlande, France, Géorgie, Ghana, Grèce, Hongrie, Hong Kong, Inde, Indonésie, Iran, Irlande, Islande, Israël,
Italie, Jamaïque, Japon, Jordanie, Kazakhstan, Kirghizistan, Kosovo, Koweït, Lettonie, Liechtenstein, Lituanie,
Luxembourg, Macédoine du Nord, Malaisie, Malte, Maroc, Mexique, Moldova, Mongolie, Monténégro, Norvège,
Nouvelle-Zélande, Oman, Ouzbékistan, Pakistan, Pays-Bas, Pérou, Philippines, Pologne, Portugal, Qatar, Roumanie,
Royaume-Uni, Russie, Serbie, Singapour, Slovaquie, Slovénie, Sri Lanka, Suède, Tadjikistan, Taiwan, Tchéquie,
Thaïlande, Trinité-et-Tobago, Tunisie, Turkménistan, Turquie, Ukraine, Uruguay, Venezuela, Vietnam, Zambie`
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const ALIAS = {
  coreesud: 'KOR',
  etatsunis: 'USA',
  emiratsarabesunis: 'ARE',
  egypte: 'EGY',
  equateur: 'ECU',
  ethiopie: 'ETH',
  moldova: 'MDA',
  taiwan: 'TWN',
  royaumeuni: 'GBR',
  russie: 'RUS',
  tchequie: 'CZE',
  kosovo: 'XKX',
  bielorussie: 'BLR',
  belarus: 'BLR',
  iran: 'IRN',
  vietnam: 'VNM',
  venezuela: 'VEN',
  hongkong: 'HKG',
  macedoinedunord: 'MKD',
  coteivoire: 'CIV',
  cotedivoire: 'CIV',
  kirghizistan: 'KGZ',
  paysbas: 'NLD',
};
const byName = new Map();
for (const c of list) {
  byName.set(norm(c.name), c.iso3);
  for (const alt of [
    countries.getName(c.iso2, 'fr'),
    ...(countries.getName(c.iso2, 'fr', { select: 'all' }) ?? []),
  ])
    if (alt) byName.set(norm(alt), c.iso3);
}
const dta = DTA_NAMES.map((n) => {
  const iso3 = ALIAS[norm(n)] ?? byName.get(norm(n));
  if (!iso3) throw new Error(`DTA name not resolved: ${n}`);
  return iso3;
});
fs.writeFileSync(
  path.join(root, 'src/data/dta.json'),
  JSON.stringify(
    {
      source: 'SFI – Conventions suisses de double imposition, état au 1er janvier 2026',
      url: 'https://www.sif.admin.ch/dam/fr/sd-web/Rq53YeWNalWg/DBA-Liste%20FR-per%2001.01.2026.pdf',
      verifiedOn: '2026-11-17',
      iso3: [...new Set(dta)].sort(),
    },
    null,
    1,
  ) + '\n',
);
console.log(
  `countries: ${list.length}, geometries: ${Object.keys(geoToIso3).length}, DTA: ${new Set(dta).size}`,
);
