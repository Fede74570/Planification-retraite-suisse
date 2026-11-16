import { avsReferenceAge } from './avs';
import { simulatePlan, type PlanResult } from './cashflow';
import type { LegalParams } from './params/types';
import { defaultStaggeredAges } from './pillar3';
import type { Assumptions, PersonStrategy, Profile, Strategy } from './profile';

/**
 * The four retirement scenarios, computed in parallel and comparable.
 * Only the main person's timing changes; the partner keeps the base strategy.
 */

export type ScenarioId = 'ordinary' | 'early' | 'partial' | 'deferred';

export interface ScenarioOptions {
  earlyAge: number;
  partial: { fromAge: number; activityRate: number };
  deferredAge: number;
}

export const DEFAULT_SCENARIO_OPTIONS: ScenarioOptions = {
  earlyAge: 63,
  partial: { fromAge: 62, activityRate: 0.6 },
  deferredAge: 67,
};

export interface ScenarioKpis {
  monthlyNetIncome: number;
  replacementRate: number;
  totalTaxesReal: number;
  wealthAt85: number;
  wealthAt95: number;
  depletionAge: number | null;
  yearsFunded: number;
  horizonYears: number;
}

export interface ScenarioResult {
  id: ScenarioId;
  retirementAge: number;
  strategy: Strategy;
  plan: PlanResult;
  kpis: ScenarioKpis;
}

function withMain(base: Strategy, main: Partial<PersonStrategy>): Strategy {
  const merged: PersonStrategy = { ...base.main, ...main };
  if (!('partial' in main)) delete merged.partial;
  return { ...base, main: merged };
}

export function scenarioStrategies(
  profile: Profile,
  p: LegalParams,
  base: Strategy,
  o: ScenarioOptions = DEFAULT_SCENARIO_OPTIONS,
): Record<ScenarioId, Strategy> {
  const person = profile.main;
  const ref = avsReferenceAge(person.birthYear, person.sex);
  const p3a = (retAge: number, working: boolean) =>
    defaultStaggeredAges(
      person.pillar3a.accounts,
      working ? retAge : Math.min(retAge, Math.ceil(ref)),
      ref,
      p.pillar3a,
    );
  const early = Math.min(o.earlyAge, ref);
  return {
    ordinary: withMain(base, {
      retirementAge: ref,
      avsClaimAge: ref,
      p3aWithdrawalAges: p3a(ref, false),
    }),
    early: withMain(base, {
      retirementAge: early,
      avsClaimAge: Math.max(p.avs.earliestAge, early),
      p3aWithdrawalAges: p3a(early, false),
    }),
    partial: withMain(base, {
      retirementAge: ref,
      avsClaimAge: ref,
      partial: {
        fromAge: Math.min(o.partial.fromAge, ref - 1),
        activityRate: o.partial.activityRate,
      },
      p3aWithdrawalAges: p3a(ref, false),
    }),
    deferred: withMain(base, {
      retirementAge: o.deferredAge,
      avsClaimAge: Math.min(ref + p.avs.maxDeferralYears, o.deferredAge),
      p3aWithdrawalAges: p3a(o.deferredAge, true),
    }),
  };
}

const kpisOf = (plan: PlanResult): ScenarioKpis => ({
  monthlyNetIncome: plan.summary.monthlyNetIncome,
  replacementRate: plan.summary.replacementRate,
  totalTaxesReal: plan.summary.totalTaxesReal,
  wealthAt85: plan.summary.wealthAt85,
  wealthAt95: plan.summary.wealthAt95,
  depletionAge: plan.summary.depletionAge,
  yearsFunded: plan.summary.yearsFunded,
  horizonYears: plan.summary.horizonYears,
});

export function computeScenarios(
  profile: Profile,
  a: Assumptions,
  p: LegalParams,
  base: Strategy,
  o?: ScenarioOptions,
): ScenarioResult[] {
  const strategies = scenarioStrategies(profile, p, base, o);
  return (Object.keys(strategies) as ScenarioId[]).map((id) => {
    const strategy = strategies[id];
    const plan = simulatePlan(profile, a, strategy, p);
    return { id, retirementAge: strategy.main.retirementAge, strategy, plan, kpis: kpisOf(plan) };
  });
}

/** Best scenario: fully funded with the highest net income; otherwise the one that lasts longest. */
export function bestScenario(results: ScenarioResult[]): ScenarioId {
  const funded = results.filter((s) => s.kpis.depletionAge === null);
  if (funded.length)
    return funded.reduce((a, b) => (b.kpis.monthlyNetIncome > a.kpis.monthlyNetIncome ? b : a)).id;
  return results.reduce((a, b) => ((b.kpis.depletionAge ?? 0) > (a.kpis.depletionAge ?? 0) ? b : a))
    .id;
}
