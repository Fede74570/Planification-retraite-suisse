import { describe, expect, it } from 'vitest';
import { splitBuckets } from '../advice';
import { DEFAULT_ASSUMPTIONS } from '../assumptions';
import { simulatePlan } from '../cashflow';
import { compareCapitalVsAnnuity } from '../capitalVsAnnuity';
import { EXAMPLE_PROFILE } from '../example';
import { computeReport } from '../index';
import { getParams, AVAILABLE_YEARS } from '../params';
import type { Profile } from '../profile';
import { bestScenario, computeScenarios } from '../scenarios';
import { defaultStrategy } from '../strategy';

const p = getParams(2027);
const a = DEFAULT_ASSUMPTIONS;

describe('Parameters', () => {
  it('exposes 2026 and 2027 and falls back to the closest year', () => {
    expect(AVAILABLE_YEARS).toEqual([2026, 2027]);
    expect(getParams(2030).meta.year).toBe(2027);
    expect(getParams(2020).meta.year).toBe(2026);
    expect(getParams().meta.year).toBe(2027);
    for (const y of AVAILABLE_YEARS) {
      const m = getParams(y).meta;
      expect(m.sources.length).toBeGreaterThan(3);
      expect(m.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('Cash-flow plan — Marc et Sophie', () => {
  const plan = simulatePlan(EXAMPLE_PROFILE, a, defaultStrategy(EXAMPLE_PROFILE, p), p);
  it('runs from 2027 to the horizon (main person 95)', () => {
    expect(plan.rows[0]!.year).toBe(2027);
    expect(plan.rows.at(-1)!.ages.main).toBe(95);
  });
  it('retires both persons at 65 with the certificate assets', () => {
    const marc = plan.retirements.find((r) => r.person === 'main')!;
    expect(marc.retirementYear).toBe(2031);
    expect(marc.lppAssetsAtRetirement).toBeCloseTo(610_000, -2);
    expect(marc.lppAnnuity).toBeCloseTo(610_000 * 0.056, -2);
    expect(plan.retirements.find((r) => r.person === 'partner')!.retirementYear).toBe(2033);
  });
  it('caps the couple AVS at 150 % of the maximum once both are paid', () => {
    const row = plan.rows.find((r) => r.year === 2034)!;
    const idx = (1 + a.inflation) ** (2034 - p.meta.year);
    expect(row.avs).toBeCloseTo(3840 * 13 * idx, 0);
  });
  it('produces coherent KPIs', () => {
    const s = plan.summary;
    expect(s.monthlyNetIncome).toBeGreaterThan(5_000);
    expect(s.monthlyNetIncome).toBeLessThan(12_000);
    expect(s.replacementRate).toBeGreaterThan(0.5);
    expect(s.replacementRate).toBeLessThan(1.2);
    expect(s.totalTaxesReal).toBeGreaterThan(0);
    expect(plan.events.some((e) => e.kind === 'imputedRentEnd' && e.year === 2029)).toBe(true);
    expect(plan.events.filter((e) => e.kind === 'p3a')).toHaveLength(3);
  });
  it('real values equal nominal values when inflation is 0', () => {
    const p0 = simulatePlan(
      EXAMPLE_PROFILE,
      { ...a, inflation: 0 },
      defaultStrategy(EXAMPLE_PROFILE, p),
      p,
    );
    expect(p0.rows.every((r) => r.deflator === 1)).toBe(true);
  });
  it('alerts when a capital withdrawal follows a buy-in within 3 years', () => {
    const strategy = defaultStrategy(EXAMPLE_PROFILE, p);
    strategy.main.lppCapitalShare = 0.5;
    strategy.lppBuyIns = [{ person: 'main', year: 2029, amount: 30_000 }]; // capital in 2031 = N+2
    const alert = simulatePlan(EXAMPLE_PROFILE, a, strategy, p).summary.lockAlerts;
    expect(alert).toEqual([{ person: 'main', buyInYear: 2029, withdrawalYear: 2031 }]);
    strategy.lppBuyIns = [{ person: 'main', year: 2027, amount: 30_000 }]; // N+4: fine
    expect(simulatePlan(EXAMPLE_PROFILE, a, strategy, p).summary.lockAlerts).toEqual([]);
  });
  it('models partial retirement, early retirement contributions, 3b and rental property', () => {
    const profile: Profile = {
      ...EXAMPLE_PROFILE,
      status: 'single',
      partner: undefined,
      pillar3b: { value: 50_000, annualContribution: 2_000, availableAge: 64 },
      housing: {
        value: 800_000,
        mortgage: 600_000,
        rate: 0.02,
        kind: 'rental',
        rentalIncome: 30_000,
      },
    };
    const strategy = defaultStrategy(profile, p);
    strategy.main.retirementAge = 62;
    strategy.main.avsClaimAge = 63;
    strategy.main.partial = { fromAge: 61, activityRate: 0.5 };
    strategy.main.lppCapitalShare = 1;
    strategy.amortization = { year: 2028, amount: 50_000 };
    const plan2 = simulatePlan(profile, a, strategy, p);
    expect(plan2.events.some((e) => e.kind === 'partial')).toBe(true);
    expect(plan2.events.some((e) => e.kind === 'p3b')).toBe(true);
    expect(plan2.events.some((e) => e.kind === 'amortization')).toBe(true);
    expect(plan2.rows.some((r) => r.contributions.avsNonEmployed > 0)).toBe(true);
    expect(plan2.rows.find((r) => r.year === 2030)!.rental).toBe(30_000);
    expect(plan2.rows.some((r) => r.lumpSums.lpp > 0)).toBe(true);
  });
  it('detects depletion when spending is far above income', () => {
    const poor = simulatePlan(
      { ...EXAMPLE_PROFILE, monthlyExpenses: 25_000 },
      a,
      defaultStrategy(EXAMPLE_PROFILE, p),
      p,
    );
    expect(poor.summary.depletionAge).not.toBeNull();
    expect(poor.summary.monthlyGapAfterDepletion).toBeGreaterThan(0);
    expect(poor.events.some((e) => e.kind === 'depletion')).toBe(true);
    const rich = simulatePlan(
      { ...EXAMPLE_PROFILE, monthlyExpenses: 5_000 },
      a,
      defaultStrategy(EXAMPLE_PROFILE, p),
      p,
    );
    expect(rich.summary.depletionAge).toBeNull();
  });
});

describe('Scenarios', () => {
  const results = computeScenarios(EXAMPLE_PROFILE, a, p, defaultStrategy(EXAMPLE_PROFILE, p));
  it('computes the four scenarios', () => {
    expect(results.map((r) => r.id)).toEqual(['ordinary', 'early', 'partial', 'deferred']);
    expect(results.find((r) => r.id === 'early')!.retirementAge).toBe(63);
    expect(results.find((r) => r.id === 'deferred')!.retirementAge).toBe(67);
  });
  it('earning longer yields a higher income than retiring early', () => {
    const net = (id: string) => results.find((r) => r.id === id)!.kpis.monthlyNetIncome;
    expect(net('deferred')).toBeGreaterThan(net('ordinary'));
    expect(net('ordinary')).toBeGreaterThan(net('early'));
    expect(['ordinary', 'early', 'partial', 'deferred']).toContain(bestScenario(results));
  });
  it('prefers a fully funded scenario', () => {
    const funded = results.map((r, i) => ({
      ...r,
      kpis: { ...r.kpis, depletionAge: i === 1 ? null : 80 },
    }));
    expect(bestScenario(funded)).toBe('early');
  });
});

describe('Annuity vs capital', () => {
  const base = {
    assets: 600_000,
    conversionRate: 0.056,
    capitalShare: 0.5,
    retirementAge: 65,
    retirementYear: 2031,
    baseYear: 2027,
    horizonAge: 95,
    otherTaxableIncome: 50_000,
    otherWealth: 300_000,
    inflation: 0.01,
    returns: a.returns,
    taxableYieldShare: 0.4,
    retireeDeductionRate: 0.08,
    tax: {
      canton: 'VD' as const,
      status: 'married' as const,
      children: 0,
      params: p,
      inflation: 0.01,
    },
  };
  const r = compareCapitalVsAnnuity(base);
  it('finds a break-even age in the plausible range', () => {
    expect(r.breakEvenAge).not.toBeNull();
    expect(r.breakEvenAge!).toBeGreaterThan(75);
    expect(r.breakEvenAge!).toBeLessThan(95);
    expect(r.netCapital).toBeLessThan(600_000);
    expect(r.ages[0]).toBe(65);
  });
  it('orders the return profiles', () => {
    expect(r.paths.dynamic.at85).toBeGreaterThanOrEqual(r.paths.balanced.at85);
    expect(r.paths.balanced.at85).toBeGreaterThanOrEqual(r.paths.prudent.at85);
    expect(r.mixed.annuity).toBeCloseTo(300_000 * 0.056);
    expect(r.mixed.share).toBe(0.5);
    expect(r.mixed.balances).toHaveLength(r.ages.length);
  });
  it('real equals nominal at zero inflation', () => {
    const z = compareCapitalVsAnnuity({
      ...base,
      inflation: 0,
      tax: { ...base.tax, inflation: 0 },
    });
    expect(z.deflators.every((d) => d === 1)).toBe(true);
  });
});

describe('Report and advice', () => {
  const t0 = performance.now();
  const report = computeReport(EXAMPLE_PROFILE, a);
  const ms = performance.now() - t0;
  it('recomputes the whole report fast (< 50 ms target; CI margin 150 ms)', () => {
    const t1 = performance.now();
    computeReport({ ...EXAMPLE_PROFILE, monthlyExpenses: 9_000 }, a);
    expect(performance.now() - t1).toBeLessThan(150);
    expect(ms).toBeLessThan(1000);
  });
  it('returns 4 mandatory advice cards and at most 3 contextual ones', () => {
    const mandatory = report.advice.filter((c) => c.mandatory);
    expect(mandatory.map((c) => c.id)).toEqual([
      'capital-vs-annuity',
      'inflation',
      'horizon',
      'buckets',
    ]);
    expect(mandatory[3]!.buckets).toBeDefined();
    expect(report.advice.filter((c) => !c.mandatory).length).toBeLessThanOrEqual(3);
    for (const c of report.advice) {
      expect(c.bullets.length).toBeLessThanOrEqual(2);
      expect(c.title.split(/\s+/).length).toBeLessThanOrEqual(6);
    }
  });
  it('suggests an LPP buy-in ending before the lock period and a staggered withdrawal plan', () => {
    expect(report.buyIn).not.toBeNull();
    expect(report.buyIn!.years.at(-1)!).toBeLessThan(2031);
    expect(report.buyIn!.saving).toBeGreaterThan(0);
    expect(report.withdrawals.totalTax).toBeLessThanOrEqual(report.withdrawals.sameYearTax);
    expect(report.avsCurve).toHaveLength(8);
    // Couple cap: two maximum pensions → 3'840 / 2 each at the reference age (2027).
    expect(report.avsCurve.find((x) => x.age === 65)!.monthly).toBeCloseTo(1920);
    expect(report.housing!.ratioToday).toBeGreaterThan(0);
  });
  it('produces contextual advice for edge profiles', () => {
    const edge: Profile = {
      ...EXAMPLE_PROFILE,
      nationality: 'EU_EFTA',
      monthlyExpenses: 20_000,
      main: {
        ...EXAMPLE_PROFILE.main,
        avsMissingYears: 3,
        retirementAge: 60,
        pillar3a: { balance: 20_000, accounts: 1 },
      },
      partner: { ...EXAMPLE_PROFILE.partner!, birthYear: 1972 },
    };
    const ids = computeReport(edge, a).advice.map((c) => c.id);
    expect(ids).toContain('depletion');
    const single = computeReport(
      {
        ...EXAMPLE_PROFILE,
        status: 'single',
        partner: undefined,
        housing: undefined,
        main: {
          ...EXAMPLE_PROFILE.main,
          grossIncome: 20_000,
          lpp: { balance: 0, buyInPotential: 0 },
        },
      },
      a,
    );
    expect(single.capitalVsAnnuity).toBeNull();
    expect(single.housing).toBeNull();
  });
  it('keeps every advice bullet ≤ 12 words (§1), on contrasting profiles', () => {
    const words = (t: string) => t.split(/\s+/).filter((w) => w && !/^[:;,–-]$/.test(w)).length;
    const edge: Profile = {
      ...EXAMPLE_PROFILE,
      nationality: 'OTHER',
      monthlyExpenses: 20_000,
      main: {
        ...EXAMPLE_PROFILE.main,
        avsMissingYears: 3,
        retirementAge: 60,
        pillar3a: { balance: 20_000, accounts: 1 },
      },
      partner: { ...EXAMPLE_PROFILE.partner!, birthYear: 1972 },
    };
    for (const p of [EXAMPLE_PROFILE, edge]) {
      for (const c of computeReport(p, a).advice) {
        for (const b of c.bullets) expect(words(b), b).toBeLessThanOrEqual(12);
      }
    }
  });
  it('splits wealth into 3 buckets', () => {
    expect(splitBuckets(1_000_000, 30_000, 100_000)).toEqual({
      short: 100_000,
      mid: 210_000,
      long: 690_000,
    });
    expect(splitBuckets(50_000, 30_000, 100_000)).toEqual({ short: 50_000, mid: 0, long: 0 });
  });
});
