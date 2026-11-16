/**
 * Staggering of pension capital withdrawals (3a accounts, LPP tranches) over the allowed years to
 * minimise the total capital tax. Withdrawals of a household in the same year are added up.
 * Exhaustive search for small problems (≤ 6 withdrawals × ≤ 11 years), greedy otherwise.
 * Invariant: the result is never worse than « everything in the same year ».
 */

export interface WithdrawalItem {
  id: string;
  label: string;
  kind: 'p3a' | 'lpp';
  amount: number;
  earliestYear: number;
  latestYear: number;
  /** Years in which this item may not be withdrawn (e.g. 3-year lock after an LPP buy-in). */
  blockedYears?: number[];
}

export interface WithdrawalPlan {
  schedule: Array<{ id: string; year: number }>;
  totalTax: number;
  sameYearTax: number;
  sameYearYear: number;
  saving: number;
  method: 'exhaustive' | 'greedy';
}

/** Tax function for a total withdrawn in a year. */
export type YearTaxFn = (amount: number, year: number) => number;

function allowedYears(item: WithdrawalItem): number[] {
  const out: number[] = [];
  for (let y = item.earliestYear; y <= item.latestYear; y++)
    if (!item.blockedYears?.includes(y)) out.push(y);
  return out;
}

function totalTax(items: WithdrawalItem[], years: number[], taxFn: YearTaxFn): number {
  const byYear = new Map<number, number>();
  items.forEach((it, i) => byYear.set(years[i]!, (byYear.get(years[i]!) ?? 0) + it.amount));
  let sum = 0;
  for (const [y, a] of byYear) sum += taxFn(a, y);
  return sum;
}

/** Year shared by the most items (baseline « tout la même année »), preferring the latest one. */
function baselineYear(items: WithdrawalItem[]): number {
  const counts = new Map<number, number>();
  for (const it of items) for (const y of allowedYears(it)) counts.set(y, (counts.get(y) ?? 0) + 1);
  let best = items[0]?.latestYear ?? 0,
    bestCount = -1;
  for (const [y, c] of counts)
    if (c > bestCount || (c === bestCount && y > best)) {
      best = y;
      bestCount = c;
    }
  return best;
}

function clampToAllowed(item: WithdrawalItem, year: number): number {
  const allowed = allowedYears(item);
  if (!allowed.length) return item.latestYear;
  return allowed.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a));
}

export function optimizeWithdrawals(items: WithdrawalItem[], taxFn: YearTaxFn): WithdrawalPlan {
  if (!items.length)
    return {
      schedule: [],
      totalTax: 0,
      sameYearTax: 0,
      sameYearYear: 0,
      saving: 0,
      method: 'exhaustive',
    };
  // Memoise the tax function (amounts rounded to the franc).
  const cache = new Map<string, number>();
  const f: YearTaxFn = (a, y) => {
    const k = `${y}:${Math.round(a)}`;
    let v = cache.get(k);
    if (v === undefined) {
      v = taxFn(a, y);
      cache.set(k, v);
    }
    return v;
  };

  const base = baselineYear(items);
  const baselineYears = items.map((it) => clampToAllowed(it, base));
  const sameYearTax = totalTax(items, baselineYears, f);
  const domains = items.map(allowedYears);
  const span = Math.max(...domains.map((d) => d.length));

  let bestYears = baselineYears;
  let bestTax = sameYearTax;
  let method: WithdrawalPlan['method'] = 'exhaustive';

  // Greedy first: largest item first, each placed in the year that adds the least tax.
  const greedy = (() => {
    const order = items.map((_, i) => i).sort((a, b) => items[b]!.amount - items[a]!.amount);
    const years = new Array<number>(items.length);
    const byYear = new Map<number, number>();
    for (const i of order) {
      let bestY = domains[i]![0] ?? items[i]!.latestYear,
        bestDelta = Infinity;
      for (const y of domains[i]!) {
        const cur = byYear.get(y) ?? 0;
        const delta = f(cur + items[i]!.amount, y) - (cur ? f(cur, y) : 0);
        if (delta < bestDelta) {
          bestDelta = delta;
          bestY = y;
        }
      }
      years[i] = bestY;
      byYear.set(bestY, (byYear.get(bestY) ?? 0) + items[i]!.amount);
    }
    return years;
  })();
  const greedyTax = totalTax(items, greedy, f);
  if (greedyTax < bestTax) {
    bestTax = greedyTax;
    bestYears = greedy;
  }

  if (items.length <= 6 && span <= 11) {
    // Exact branch & bound: the tax is non-decreasing in the amount, so the partial cost is a lower bound.
    const order = items.map((_, i) => i).sort((a, b) => items[b]!.amount - items[a]!.amount);
    const totals = new Map<number, number>();
    const current = new Array<number>(items.length);
    const recurse = (k: number, cost: number) => {
      if (cost >= bestTax - 1e-6) return;
      if (k === order.length) {
        bestTax = cost;
        bestYears = [...current];
        return;
      }
      const i = order[k]!;
      const amount = items[i]!.amount;
      for (const y of domains[i]!) {
        const cur = totals.get(y) ?? 0;
        const delta = f(cur + amount, y) - (cur ? f(cur, y) : 0);
        totals.set(y, cur + amount);
        current[i] = y;
        recurse(k + 1, cost + delta);
        totals.set(y, cur);
      }
    };
    recurse(0, 0);
  } else {
    method = 'greedy';
  }

  return {
    schedule: items.map((it, i) => ({ id: it.id, year: bestYears[i]! })),
    totalTax: bestTax,
    sameYearTax,
    sameYearYear: base,
    saving: sameYearTax - bestTax,
    method,
  };
}
