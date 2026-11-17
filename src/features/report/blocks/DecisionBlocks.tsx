import { m } from 'motion/react';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { Crossover } from '@/components/charts/Crossover';
import { Legend } from '@/components/charts/Legend';
import { WealthArea, type TimelineEvent, type WealthPoint } from '@/components/charts/WealthArea';
import { Badge, Kpi, Segmented, Slider, Term } from '@/components/ui';
import type { Report } from '@/engine';
import type { EventKind } from '@/engine/cashflow';
import type { ScenarioId } from '@/engine/scenarios';
import { formatCHF } from '@/lib/format';
import { spring } from '@/lib/motion';
import { useApp } from '@/state/store';
import { Block } from '../Block';

/** 4 · Rente ou capital ? */
export function CapitalBlock({ report, index }: { report: Report; index: number }) {
  const share = useApp((s) => s.choices.capitalShare);
  const setChoices = useApp((s) => s.setChoices);
  const c = report.capitalVsAnnuity;
  if (!c) {
    return (
      <Block
        id="capital"
        index={index}
        title="Rente ou capital ?"
        sentence="Sans avoir LPP à la retraite, cette question ne se pose pas."
      >
        <p className="m-0 text-ink-muted">
          Ajoutez votre avoir LPP dans « Prévoyance » pour comparer.
        </p>
      </Block>
    );
  }
  const age = (a: number | null) => (a === null ? 'jamais' : `${a} ans`);
  return (
    <Block
      id="capital"
      index={index}
      title="Rente ou capital ?"
      sentence={
        c.breakEvenAge
          ? `La rente rapporte plus que le capital si vous vivez au-delà de ${c.breakEvenAge} ans.`
          : 'Sur votre horizon, le capital reste plus avantageux que la rente.'
      }
      detail={
        <ul className="m-0 flex flex-col gap-1 pl-4">
          <li>Impôt sur le retrait en capital : {formatCHF(c.capitalTax)}.</li>
          <li>
            Capital épuisé à : {age(c.paths.prudent.exhaustionAge)} (prudent),{' '}
            {age(c.paths.balanced.exhaustionAge)} (équilibré), {age(c.paths.dynamic.exhaustionAge)}{' '}
            (dynamique).
          </li>
          <li>
            Transmissible à 85 ans (équilibré) : {formatCHF(c.paths.balanced.at85)} ; à 95 ans :{' '}
            {formatCHF(c.paths.balanced.at95)}.
          </li>
          <li>Annoncez votre choix à la caisse, souvent 1 à 3 ans avant la retraite.</li>
        </ul>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kpi
          value={c.breakEvenAge ?? 0}
          format={(n) => (c.breakEvenAge ? `${Math.round(n)} ans` : '—')}
          label={
            <span className="inline-flex items-center gap-1.5">
              Âge d’équilibre <Term k="breakEven" />
            </span>
          }
        />
        <Slider
          className="w-full sm:w-72"
          label="Part prise en capital"
          value={Math.round(share * 100)}
          min={0}
          max={100}
          step={10}
          onChange={(v) => setChoices({ capitalShare: v / 100 })}
          format={(n) => `${n} %`}
        />
      </div>
      <ChartFrame
        label="Rente cumulée face au capital restant"
        className="mt-4"
        table={{
          caption: 'Rente cumulée et capital restant (équilibré)',
          columns: ['Âge', 'Rente cumulée', 'Capital restant'],
          rows: c.ages
            .filter((a) => a % 5 === 0)
            .map((a) => {
              const i = c.ages.indexOf(a);
              return [
                a,
                formatCHF(c.cumulativeAnnuity[i]!),
                formatCHF(c.paths.balanced.balances[i]!),
              ];
            }),
        }}
      >
        <Crossover
          ages={c.ages}
          cumulativeAnnuity={c.cumulativeAnnuity}
          prudent={c.paths.prudent.balances}
          balanced={c.paths.balanced.balances}
          dynamic={c.paths.dynamic.balances}
          breakEvenAge={c.breakEvenAge}
          netCapital={c.netCapital}
        />
        <Legend
          className="mt-2"
          items={[
            { color: 'var(--chart-lpp)', label: 'Rente nette cumulée', dashed: true },
            { color: 'var(--navy)', label: 'Capital net au départ', dashed: true },
            { color: 'var(--chart-invest)', label: 'Capital restant (équilibré)' },
            { color: 'rgb(155 107 64 / 0.3)', label: 'Prudent à dynamique' },
          ]}
        />
      </ChartFrame>
    </Block>
  );
}

const SCENARIO_LABEL: Record<ScenarioId, string> = {
  ordinary: 'Ordinaire',
  early: 'Anticipée',
  partial: 'Partielle',
  deferred: 'Différée',
};

/** 5 · Quand partir ? */
export function ScenariosBlock({ report, index }: { report: Report; index: number }) {
  const selected = useApp((s) => s.choices.scenario);
  const setChoices = useApp((s) => s.setChoices);
  const horizon = useApp((s) => s.assumptions.horizonAge);
  const best = report.scenarios.find((s) => s.id === report.bestScenario)!;
  return (
    <Block
      id="scenarios"
      index={index}
      title="Quand partir ?"
      sentence={`Meilleure option : retraite ${SCENARIO_LABEL[best.id].toLowerCase()} à ${best.retirementAge} ans. Touchez une carte pour l’appliquer.`}
    >
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        role="radiogroup"
        aria-label="Scénarios de retraite"
      >
        {report.scenarios.map((sc) => {
          const active = selected === sc.id;
          const isBest = sc.id === report.bestScenario;
          return (
            <button
              key={sc.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() =>
                setChoices({ scenario: active ? null : sc.id, avsClaimAge: null, p3aAges: null })
              }
              className="relative flex min-h-36 flex-col items-start gap-1 rounded-[16px] bg-sunken p-3.5 text-left transition-colors hover:bg-alp/50"
            >
              {active && (
                <m.span
                  layoutId="scenario-active"
                  transition={spring}
                  className="absolute inset-0 rounded-[16px] ring-2 ring-accent"
                />
              )}
              <span className="flex w-full items-center justify-between text-xs font-semibold text-ink-muted">
                {SCENARIO_LABEL[sc.id]}
                {isBest && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-white">
                    ★ Meilleur
                  </span>
                )}
              </span>
              <span className="font-serif text-lg font-semibold">
                {sc.id === 'partial'
                  ? `${sc.strategy.main.partial?.fromAge ?? 62}→${sc.retirementAge}`
                  : sc.retirementAge}{' '}
                ans
              </span>
              <span className="tabular text-sm font-semibold">
                {formatCHF(sc.kpis.monthlyNetIncome)} / mois
              </span>
              <span className="tabular text-xs text-ink-muted">
                À 85 ans : {formatCHF(sc.kpis.wealthAt85)}
              </span>
              <span
                className={`text-xs font-medium ${sc.kpis.depletionAge === null ? 'text-meadow-ink' : 'text-warning'}`}
              >
                {sc.kpis.depletionAge === null
                  ? `✓ Tient au-delà de ${horizon} ans`
                  : `! Épuisé à ${sc.kpis.depletionAge} ans`}
              </span>
            </button>
          );
        })}
      </div>
    </Block>
  );
}

const EVENT_ICON: Record<EventKind, [string, string]> = {
  retirement: ['🏖', 'Retraite'],
  partnerRetirement: ['🏖', 'Retraite du conjoint'],
  partial: ['⏳', 'Retraite partielle'],
  avs: ['A', 'Début de la rente AVS'],
  p3a: ['3a', 'Retrait 3a'],
  lppCapital: ['💼', 'Capital LPP'],
  imputedRentEnd: ['🏠', 'Fin de la valeur locative (2029)'],
  amortization: ['↓', 'Amortissement'],
  buyIn: ['+', 'Rachat LPP'],
  p3b: ['3b', '3e pilier B disponible'],
  depletion: ['⚠', 'Épargne épuisée'],
};

/** 6 · Votre plan dans le temps. */
export function PlanBlock({ report, index }: { report: Report; index: number }) {
  const showReal = useApp((s) => s.showReal);
  const setShowReal = useApp((s) => s.setShowReal);
  const a = useApp((s) => s.assumptions);
  const sex = useApp((s) => s.profile.main.sex);
  const f = (row: (typeof report.plan.rows)[number], v: number) =>
    showReal ? v * row.deflator : v;
  const data: WealthPoint[] = report.plan.rows.map((r) => ({
    age: r.ages.main,
    cash: f(r, r.balances.cash),
    invest: f(r, r.balances.investments),
    p3: f(r, r.balances.p3a + r.balances.p3b),
    lpp: f(r, r.balances.lpp),
    realEstate: f(r, Math.max(0, r.balances.realEstateNet)),
    income: f(r, r.netSalary + r.avs + r.lppAnnuity + r.rental),
    spending: f(r, r.expenses + r.mortgageInterest + r.taxes.income + r.taxes.wealth),
  }));
  const seen = new Set<string>();
  const events: TimelineEvent[] = report.plan.events
    .filter((e) => {
      const k = `${e.age}-${e.kind}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((e) => ({
      age: e.age,
      icon: EVENT_ICON[e.kind][0],
      label: `${EVENT_ICON[e.kind][1]} (${e.year})`,
    }));
  const at85 = report.plan.summary.wealthAt85;
  return (
    <Block
      id="plan"
      index={index}
      title="Votre plan dans le temps"
      sentence={`À 85 ans, votre patrimoine net vaudrait ${formatCHF(at85)} en francs d’aujourd’hui.`}
      detail={
        <ul className="m-0 flex flex-col gap-1 pl-4">
          {events.map((e, i) => (
            <li key={i}>
              {e.age} ans : {e.label}
            </li>
          ))}
        </ul>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Kpi value={at85} label="Patrimoine net à 85 ans" />
        <Segmented
          size="sm"
          className="w-auto"
          label="Unité"
          value={showReal ? 'real' : 'nominal'}
          onChange={(v) => setShowReal(v === 'real')}
          options={[
            { value: 'real', label: 'Francs d’aujourd’hui' },
            { value: 'nominal', label: 'Nominal' },
          ]}
        />
      </div>
      <ChartFrame
        label="Patrimoine par poche, revenus et dépenses au fil des années"
        className="mt-3"
        table={{
          caption: 'Plan annuel',
          columns: ['Âge', 'Patrimoine financier', 'Revenus', 'Dépenses'],
          rows: data
            .filter((d) => d.age % 5 === 0)
            .map((d) => [
              d.age,
              formatCHF(d.cash + d.invest + d.p3),
              formatCHF(d.income),
              formatCHF(d.spending),
            ]),
        }}
      >
        <WealthArea
          data={data}
          events={events}
          lifeExpectancyAge={Math.round(65 + a.lifeExpectancy65[sex])}
        />
        <Legend
          className="mt-1"
          items={[
            'realEstate',
            'lpp',
            'p3',
            'invest',
            'cash',
            { color: 'var(--navy)', label: 'Revenus / an (axe droit)' },
            { color: 'var(--red-ink)', label: 'Dépenses et impôts / an', dashed: true },
          ]}
        />
      </ChartFrame>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
        <Badge tone="neutral" icon={false}>
          Zone « Réserve »
        </Badge>{' '}
        entre l’espérance de vie et l’horizon de {a.horizonAge} ans. <Term k="realValues" />
      </div>
    </Block>
  );
}
