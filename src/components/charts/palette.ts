/** Chart colours by pillar (§8): AVS red, LPP blue, 3a/3b green, investments marmot, cash alp. */
export const SERIES = {
  avs: { color: 'var(--chart-avs)', label: 'AVS' },
  lpp: { color: 'var(--chart-lpp)', label: 'LPP' },
  p3: { color: 'var(--chart-p3)', label: '3a / 3b' },
  invest: { color: 'var(--chart-invest)', label: 'Placements' },
  cash: { color: 'var(--chart-cash)', label: 'Liquidités' },
  realEstate: { color: '#7d93ad', label: 'Immobilier net' },
  drawdown: { color: 'var(--chart-p3)', label: 'Épargne consommée' },
  need: { color: 'var(--chart-need)', label: 'Besoin' },
} as const;
export type SeriesKey = keyof typeof SERIES;
