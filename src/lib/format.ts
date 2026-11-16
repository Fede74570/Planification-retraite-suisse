/**
 * Swiss French number formatting. Thousands separator is always the ASCII
 * apostrophe ("CHF 1'250"), whatever the ICU build of the browser emits
 * (some return U+2019 or a narrow no-break space for fr-CH).
 */
const GROUP_RE = /[\u2019\u02BC\u202F\u00A0 ']/g;

const intFmt = new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat('fr-CH', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

function normaliseGroups(s: string): string {
  return s.replace(GROUP_RE, "'");
}

/** 1250 → "1'250" (rounded to the franc). */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '–';
  const rounded = Math.round(value);
  return normaliseGroups(intFmt.format(rounded === 0 ? 0 : rounded)).replace('-', '−');
}

/** 1250 → "CHF 1'250". */
export function formatCHF(value: number): string {
  return `CHF\u00A0${formatNumber(value)}`;
}

/** 1250000 → "CHF 1,25 mio" ; under 100'000 falls back to formatCHF. */
export function formatCHFCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const n = new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 2 }).format(
      value / 1_000_000,
    );
    return `CHF\u00A0${n.replace('.', ',').replace('-', '−')}\u00A0mio`;
  }
  if (abs >= 100_000) return `CHF\u00A0${formatNumber(Math.round(value / 1000))}k`;
  return formatCHF(value);
}

/** 0.068 → "6,8 %" (Swiss French: comma decimal, space before %). */
export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '–';
  return `${pctFmt
    .format(ratio * 100)
    .replace('.', ',')
    .replace('-', '−')}\u00A0%`;
}

/** Parses user input such as "1'250", "1 250.50" or "1250,5". */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(GROUP_RE, '').replace(/CHF/i, '').replace(',', '.').trim();
  if (cleaned === '' || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
  return Number(cleaned);
}
