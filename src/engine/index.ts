import { buildAdvice, type AdviceCard } from './advice';
import {
  avsClaimCurve,
  avsFullMonthly,
  avsReferenceAge,
  avsScaleFactor,
  coupleCapFactor,
} from './avs';
import { simulatePlan, type PlanResult } from './cashflow';
import { compareCapitalVsAnnuity, type CapitalVsAnnuityResult } from './capitalVsAnnuity';
import {
  affordabilityRatio,
  analyzeAmortization,
  secondRankAmortization,
  type AmortizeAnalysis,
} from './housing';
import { conversionRateAt, conversionRateAt65 } from './lpp';
import { getParams, type LegalParams } from './params';
import { p3aWithdrawalWindow } from './pillar3';
import type { Assumptions, Profile, Strategy } from './profile';
import { bestScenario, computeScenarios, type ScenarioId, type ScenarioResult } from './scenarios';
import { defaultStrategy } from './strategy';
import { capitalWithdrawalTax, deductionSaving, marginalIncomeRate, type TaxContext } from './tax';
import {
  optimizeWithdrawals,
  type WithdrawalItem,
  type WithdrawalPlan,
} from './withdrawalOptimizer';

/**
 * Engine entry point: one pure call returns everything the report displays.
 */

export interface Report {
  params: LegalParams;
  strategy: Strategy;
  plan: PlanResult;
  scenarios: ScenarioResult[];
  bestScenario: ScenarioId;
  capitalVsAnnuity: CapitalVsAnnuityResult | null;
  withdrawals: WithdrawalPlan;
  withdrawalItems: WithdrawalItem[];
  housing: { ratioToday: number; ratioAtRetirement: number; analysis: AmortizeAnalysis } | null;
  buyIn: { amountPerYear: number; years: number[]; saving: number } | null;
  avsCurve: Array<{ age: number; monthly: number }>;
  advice: AdviceCard[];
}

const defaultChf = (n: number) =>
  `CHF ${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`;

export function computeReport(
  profile: Profile,
  a: Assumptions,
  strategyIn?: Strategy,
  chf: (n: number) => string = defaultChf,
): Report {
  const p = getParams(a.paramYear);
  const strategy = strategyIn ?? defaultStrategy(profile, p);
  const plan = simulatePlan(profile, a, strategy, p);
  const scenarios = computeScenarios(profile, a, p, strategy);
  const taxBase: Omit<TaxContext, 'year'> = {
    canton: profile.canton,
    status: profile.status,
    children: profile.children,
    params: p,
    inflation: a.inflation,
  };
  const mainRet = plan.retirements.find((r) => r.person === 'main');
  const retYear = plan.summary.retirementYear;
  const steady =
    plan.rows.find((r) => r.year === plan.summary.householdRetirementYear + 1) ??
    plan.rows[plan.rows.length - 1]!;

  // Annuity vs capital (main person's LPP assets).
  let capitalVsAnnuity: CapitalVsAnnuityResult | null = null;
  if (mainRet && mainRet.lppAssetsAtRetirement > 0) {
    const conv = conversionRateAt(
      conversionRateAt65(profile.main.lpp, p.lpp),
      strategy.main.retirementAge,
      a.earlyConversionCutPerYear,
    );
    capitalVsAnnuity = compareCapitalVsAnnuity({
      assets: mainRet.lppAssetsAtRetirement,
      conversionRate: conv,
      capitalShare: strategy.main.lppCapitalShare,
      retirementAge: strategy.main.retirementAge,
      retirementYear: mainRet.retirementYear,
      baseYear: a.startYear,
      horizonAge: a.horizonAge,
      otherTaxableIncome:
        steady.avs +
        (steady.lppAnnuity - (strategy.main.lppCapitalShare < 1 ? mainRet.lppAnnuity : 0)),
      otherWealth: steady.balances.cash + steady.balances.investments,
      inflation: a.inflation,
      returns: a.returns,
      taxableYieldShare: a.taxableYieldShare,
      retireeDeductionRate: a.retireeDeductionRate,
      tax: taxBase,
    });
  }

  // Withdrawal staggering: 3a accounts of both persons + LPP capital (if any).
  const items: WithdrawalItem[] = [];
  const persons = [
    { key: 'main' as const, input: profile.main, strat: strategy.main },
    ...(profile.partner && strategy.partner
      ? [{ key: 'partner' as const, input: profile.partner, strat: strategy.partner }]
      : []),
  ];
  for (const per of persons) {
    const ref = avsReferenceAge(per.input.birthYear, per.input.sex);
    const working = per.strat.retirementAge > ref;
    const [minAge, maxAge] = p3aWithdrawalWindow(ref, working, p.pillar3a);
    const latest = Math.max(
      minAge,
      Math.min(maxAge, Math.ceil(Math.max(per.strat.retirementAge, minAge))),
    );
    const yearsOfWithdrawal = plan.events.filter((e) => e.person === per.key && e.kind === 'p3a');
    yearsOfWithdrawal.forEach((e, idx) => {
      items.push({
        id: `${per.key}-3a-${idx + 1}`,
        label: `3a ${idx + 1}`,
        kind: 'p3a',
        amount: e.amount ?? 0,
        earliestYear: per.input.birthYear + minAge,
        latestYear: per.input.birthYear + latest,
      });
    });
    const ret = plan.retirements.find((r) => r.person === per.key);
    if (ret && ret.lppCapital > 0) {
      const blocked = strategy.lppBuyIns
        .filter((b) => b.person === per.key)
        .flatMap((b) => Array.from({ length: p.lpp.buyBackLockYears }, (_, k) => b.year + k));
      items.push({
        id: `${per.key}-lpp`,
        label: 'Capital LPP',
        kind: 'lpp',
        amount: ret.lppCapital,
        earliestYear: ret.retirementYear,
        latestYear: ret.retirementYear,
        blockedYears: blocked.filter((y) => y !== ret.retirementYear),
      });
    }
  }
  const withdrawals = optimizeWithdrawals(
    items,
    (amount, year) => capitalWithdrawalTax(amount, { ...taxBase, year }).total,
  );

  // Housing.
  let housing: Report['housing'] = null;
  if (profile.housing && profile.housing.value > 0) {
    const h = profile.housing;
    const gross = profile.main.grossIncome + (profile.partner?.grossIncome ?? 0);
    const yearsToRet = Math.max(
      1,
      strategy.main.retirementAge - (a.startYear - profile.main.birthYear),
    );
    const amort = secondRankAmortization(h.mortgage, h.value, yearsToRet, p.housing);
    const ratioToday = affordabilityRatio(h.mortgage, h.value, amort, gross, p.housing);
    // At retirement, all nominal: pensions + prudent yield on investments vs theoretical costs.
    const retirementIncome =
      steady.avs +
      steady.lppAnnuity +
      steady.rental +
      steady.balances.investments * a.returns.prudent;
    const ratioAtRetirement = affordabilityRatio(
      steady.balances.mortgage,
      steady.balances.realEstate,
      0,
      retirementIncome,
      p.housing,
    );
    const marginal = marginalIncomeRate(plan.rows[0]!.taxableIncome, {
      ...taxBase,
      year: a.startYear,
    });
    const analysis = analyzeAmortization({
      housing: { ...h, mortgage: steady.balances.mortgage, value: steady.balances.realEstate },
      marginalRate: marginal,
      investReturn: a.returns[a.returnProfile],
      taxableYieldShare: a.taxableYieldShare,
      retirementIncome,
      liquidAssets: profile.savings + profile.investments,
      p: p.housing,
    });
    housing = { ratioToday, ratioAtRetirement, analysis };
  }

  // LPP buy-in suggestion: spread over up to 3 years, ending ≥ 3 years before any capital withdrawal.
  let buyIn: Report['buyIn'] = null;
  const potential = profile.main.lpp.buyInPotential;
  const yearsToRet = (mainRet?.retirementYear ?? retYear) - a.startYear;
  if (potential > 0 && yearsToRet > 3 && !strategy.lppBuyIns.length) {
    const lastYear =
      strategy.main.lppCapitalShare > 0
        ? (mainRet?.retirementYear ?? retYear) - p.lpp.buyBackLockYears
        : (mainRet?.retirementYear ?? retYear) - 1;
    const count = Math.max(1, Math.min(3, lastYear - a.startYear + 1));
    const years = Array.from({ length: count }, (_, k) => lastYear - count + 1 + k);
    const amountPerYear = Math.round(potential / count / 1000) * 1000;
    const saving = years.reduce((s, y) => {
      const row = plan.rows.find((r) => r.year === y);
      return row
        ? s +
            deductionSaving(row.taxableIncome, amountPerYear, { ...taxBase, year: y }) *
              row.deflator
        : s;
    }, 0);
    buyIn = { amountPerYear, years, saving };
  }

  // AVS pension by claim age (main person), with the married couple cap applied as in the plan.
  const ramOf = (own: number, other?: number, override?: number) =>
    override ?? (profile.status === 'married' && other !== undefined ? (own + other) / 2 : own);
  const mainRam = ramOf(
    profile.main.grossIncome,
    profile.partner?.grossIncome,
    profile.main.ramOverride,
  );
  let capFactor = 1;
  if (profile.status === 'married' && profile.partner) {
    const sA = avsScaleFactor(profile.main.avsMissingYears, p.avs);
    const sB = avsScaleFactor(profile.partner.avsMissingYears, p.avs);
    const partnerRam = ramOf(
      profile.partner.grossIncome,
      profile.main.grossIncome,
      profile.partner.ramOverride,
    );
    capFactor = coupleCapFactor(
      avsFullMonthly(mainRam, p.avs) * sA,
      avsFullMonthly(partnerRam, p.avs) * sB,
      sA,
      sB,
      p.avs,
    );
  }
  const avsCurve = avsClaimCurve(
    {
      ram: mainRam,
      missingYears: profile.main.avsMissingYears,
      birthYear: profile.main.birthYear,
      sex: profile.main.sex,
    },
    p.avs,
    capFactor,
  );

  const advice = buildAdvice({
    profile,
    assumptions: a,
    plan,
    capital: capitalVsAnnuity,
    capitalShare: strategy.main.lppCapitalShare,
    withdrawals,
    housing,
    buyIn,
    chf,
  });

  return {
    params: p,
    strategy,
    plan,
    scenarios,
    bestScenario: bestScenario(scenarios),
    capitalVsAnnuity,
    withdrawals,
    withdrawalItems: items,
    housing,
    buyIn,
    avsCurve,
    advice,
  };
}

export { DEFAULT_ASSUMPTIONS } from './assumptions';
export { EXAMPLE_PROFILE } from './example';
export { getParams } from './params';
export type * from './profile';
