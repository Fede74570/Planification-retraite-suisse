/** Small numeric helpers shared by the engine (pure). */

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/** Cumulative index factor between two calendar years at a constant annual rate. */
export function indexFactor(rate: number, fromYear: number, toYear: number): number {
  return (1 + rate) ** (toYear - fromYear);
}

/** Converts a nominal amount of `year` into francs of `baseYear` (today's francs). */
export function toReal(nominal: number, inflation: number, year: number, baseYear: number): number {
  return nominal / indexFactor(inflation, baseYear, year);
}

/** Annual payment that exhausts `capital` over `years` at return `r` (payments at year start). */
export function annuityPayment(capital: number, r: number, years: number): number {
  if (years <= 0) return capital;
  if (Math.abs(r) < 1e-9) return capital / years;
  return (capital * r) / (1 - (1 + r) ** -years) / (1 + r);
}

/** Rounds to the franc. */
export const roundCHF = (v: number): number => Math.round(v);

/** Linear interpolation of y at x on sorted points. Extrapolates with the end segments. */
export function interpolate(xs: readonly number[], ys: readonly number[], x: number): number {
  const n = xs.length;
  if (n === 0) return 0;
  if (n === 1) return ys[0]!;
  let i = 0;
  if (x <= xs[0]!) i = 0;
  else if (x >= xs[n - 1]!) i = n - 2;
  else while (i < n - 2 && x > xs[i + 1]!) i++;
  const x0 = xs[i]!,
    x1 = xs[i + 1]!,
    y0 = ys[i]!,
    y1 = ys[i + 1]!;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/**
 * Log-linear interpolation of a tax amount: linear in (ln x, ln y) between positive points,
 * plain linear where a point is zero, proportional below the grid, constant marginal rate above it.
 */
export function interpolateTax(xs: readonly number[], ys: readonly number[], x: number): number {
  const n = xs.length;
  if (x <= 0 || n === 0) return 0;
  if (x <= xs[0]!) return (ys[0]! * x) / xs[0]!;
  if (x >= xs[n - 1]!) {
    const slope = (ys[n - 1]! - ys[n - 2]!) / (xs[n - 1]! - xs[n - 2]!);
    return ys[n - 1]! + slope * (x - xs[n - 1]!);
  }
  let i = 0;
  while (x > xs[i + 1]!) i++;
  const x0 = xs[i]!,
    x1 = xs[i + 1]!,
    y0 = ys[i]!,
    y1 = ys[i + 1]!;
  if (x === x1) return y1;
  if (y0 <= 0 || y1 <= 0) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  const t = (Math.log(x) - Math.log(x0)) / (Math.log(x1) - Math.log(x0));
  return Math.exp(Math.log(y0) + t * (Math.log(y1) - Math.log(y0)));
}
