import { describe, expect, it } from 'vitest';
import { optimizeWithdrawals, type WithdrawalItem } from '../withdrawalOptimizer';

// Convex progressive tax (like the Swiss capital tax).
const tax = (a: number) => (a <= 0 ? 0 : 0.02 * a + 1e-7 * a * a);

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

describe('Withdrawal optimizer', () => {
  it('spreads equal withdrawals over distinct years', () => {
    const items: WithdrawalItem[] = [1, 2, 3].map((i) => ({
      id: `a${i}`,
      label: '',
      kind: 'p3a',
      amount: 100_000,
      earliestYear: 2030,
      latestYear: 2035,
    }));
    const plan = optimizeWithdrawals(items, tax);
    expect(new Set(plan.schedule.map((s) => s.year)).size).toBe(3);
    expect(plan.saving).toBeGreaterThan(0);
    expect(plan.method).toBe('exhaustive');
  });
  it('never does worse than « everything in the same year » (random cases)', () => {
    const r = rng(42);
    for (let k = 0; k < 40; k++) {
      const n = 1 + Math.floor(r() * 8);
      const items: WithdrawalItem[] = Array.from({ length: n }, (_, i) => {
        const e = 2030 + Math.floor(r() * 5);
        return {
          id: `i${i}`,
          label: '',
          kind: r() > 0.5 ? 'p3a' : 'lpp',
          amount: 10_000 + r() * 400_000,
          earliestYear: e,
          latestYear: e + Math.floor(r() * 6),
        };
      });
      const plan = optimizeWithdrawals(items, tax);
      expect(plan.totalTax).toBeLessThanOrEqual(plan.sameYearTax + 1e-6);
      for (const s of plan.schedule) {
        const it = items.find((x) => x.id === s.id)!;
        expect(s.year).toBeGreaterThanOrEqual(it.earliestYear);
        expect(s.year).toBeLessThanOrEqual(it.latestYear);
      }
    }
  });
  it('matches brute force on a small problem', () => {
    const items: WithdrawalItem[] = [
      { id: 'a', label: '', kind: 'p3a', amount: 50_000, earliestYear: 2030, latestYear: 2032 },
      { id: 'b', label: '', kind: 'p3a', amount: 120_000, earliestYear: 2031, latestYear: 2033 },
      { id: 'c', label: '', kind: 'lpp', amount: 300_000, earliestYear: 2032, latestYear: 2032 },
    ];
    let best = Infinity;
    for (const ya of [2030, 2031, 2032])
      for (const yb of [2031, 2032, 2033]) {
        const by = new Map<number, number>();
        [
          [ya, 50_000],
          [yb, 120_000],
          [2032, 300_000],
        ].forEach(([y, a]) => by.set(y!, (by.get(y!) ?? 0) + a!));
        best = Math.min(
          best,
          [...by.values()].reduce((s, v) => s + tax(v), 0),
        );
      }
    expect(optimizeWithdrawals(items, tax).totalTax).toBeCloseTo(best, 6);
  });
  it('respects blocked years (3-year lock after a buy-in) and falls back to greedy for big problems', () => {
    const blocked: WithdrawalItem[] = [
      {
        id: 'l',
        label: '',
        kind: 'lpp',
        amount: 1,
        earliestYear: 2030,
        latestYear: 2033,
        blockedYears: [2030, 2031, 2032],
      },
    ];
    expect(optimizeWithdrawals(blocked, tax).schedule[0]!.year).toBe(2033);
    const many: WithdrawalItem[] = Array.from({ length: 8 }, (_, i) => ({
      id: `m${i}`,
      label: '',
      kind: 'p3a',
      amount: 50_000,
      earliestYear: 2030,
      latestYear: 2040,
    }));
    const plan = optimizeWithdrawals(many, tax);
    expect(plan.method).toBe('greedy');
    expect(plan.totalTax).toBeLessThan(plan.sameYearTax);
    expect(optimizeWithdrawals([], tax)).toMatchObject({ totalTax: 0, saving: 0 });
  });
});
