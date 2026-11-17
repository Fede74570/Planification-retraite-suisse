import { ChartFrame } from '@/components/charts/ChartFrame';
import { Donut } from '@/components/charts/Donut';
import { Gauge } from '@/components/charts/Gauge';
import { Legend } from '@/components/charts/Legend';
import { MiniCurve } from '@/components/charts/MiniCurve';
import { SERIES } from '@/components/charts/palette';
import { StackedBar } from '@/components/charts/StackedBar';
import { Badge, Kpi, Slider, Term } from '@/components/ui';
import type { Report } from '@/engine';
import { formatCHF, formatPercent } from '@/lib/format';
import { useApp } from '@/state/store';
import { Block } from '../Block';

const perMonth = (n: number) => `${formatCHF(n)} / mois`;

/** 1 · Synthèse (hero). */
export function HeroBlock({ report }: { report: Report }) {
  const horizon = useApp((s) => s.assumptions.horizonAge);
  const s = report.plan.summary;
  const gap = s.monthlyNeed - s.monthlyNetIncome;
  const lasts =
    s.depletionAge === null ? `au-delà de ${horizon} ans` : `jusqu’à ${s.depletionAge} ans`;
  const verdict =
    s.depletionAge === null
      ? gap <= 0
        ? 'Vos rentes couvrent vos dépenses : votre plan est solide.'
        : `Votre épargne comble l’écart de ${formatCHF(gap)} par mois jusqu’à l’horizon.`
      : `Il manque environ ${formatCHF(Math.max(0, gap))} par mois : votre épargne s’épuise à ${s.depletionAge} ans.`;
  return (
    <section
      aria-labelledby="hero-title"
      className="report-block relative overflow-hidden rounded-card bg-surface p-5 shadow-card sm:p-7"
    >
      <h2 id="hero-title" className="sr-only">
        Synthèse
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Kpi
            size="xl"
            value={s.monthlyNetIncome}
            label="Revenu net à la retraite, en francs d’aujourd’hui"
            suffix="/ mois"
          />
          <div className="flex flex-wrap gap-2">
            <Badge tone={s.depletionAge === null ? 'positive' : 'warning'}>
              Votre patrimoine tient {lasts}
            </Badge>
            {!report.params.avs.flexRatesConfirmed && (
              <Badge tone="warning">Taux AVS 2027 à confirmer</Badge>
            )}
          </div>
        </div>
        <ChartFrame
          label={`Taux de remplacement : ${formatPercent(s.replacementRate)}`}
          className="pr-8"
        >
          <Gauge
            value={s.replacementRate}
            label="remplacement"
            display={formatPercent(s.replacementRate)}
            size={170}
          />
        </ChartFrame>
      </div>
      <p className="m-0 mt-4 flex items-center gap-1.5 text-[0.95rem] text-ink">
        {verdict} <Term k="replacement" />
      </p>
    </section>
  );
}

/** 2 · Aujourd'hui. */
export function TodayBlock({ report, index }: { report: Report; index: number }) {
  const profile = useApp((s) => s.profile);
  const first = report.plan.rows[0]!;
  const lppNow = profile.main.lpp.balance + (profile.partner?.lpp.balance ?? 0);
  const p3aNow =
    profile.main.pillar3a.balance +
    (profile.partner?.pillar3a.balance ?? 0) +
    (profile.pillar3b?.value ?? 0);
  const reNet = profile.housing ? profile.housing.value - profile.housing.mortgage : 0;
  const slices = [
    { key: 'cash', label: 'Épargne', value: profile.savings, color: SERIES.cash.color },
    { key: 'invest', label: 'Placements', value: profile.investments, color: SERIES.invest.color },
    { key: 'p3', label: '3e pilier', value: p3aNow, color: SERIES.p3.color },
    { key: 'lpp', label: 'LPP', value: lppNow, color: SERIES.lpp.color },
    { key: 're', label: 'Immobilier net', value: reNet, color: SERIES.realEstate.color },
  ];
  const total = slices.reduce((s, x) => s + x.value, 0);
  const income = (first.netSalary - first.taxes.income - first.taxes.wealth) / 12;
  const spend = (first.expenses + first.mortgageInterest) / 12;
  const saving = income - spend;
  return (
    <Block
      id="today"
      index={index}
      title="Aujourd’hui"
      sentence={
        saving >= 0
          ? `Vous mettez de côté environ ${formatCHF(saving)} par mois.`
          : `Vous puisez environ ${formatCHF(-saving)} par mois dans votre épargne.`
      }
    >
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <ChartFrame
          label={`Patrimoine total ${formatCHF(total)}`}
          table={{
            caption: 'Patrimoine actuel',
            columns: ['Poche', 'Montant'],
            rows: slices.map((s) => [s.label, formatCHF(s.value)]),
          }}
        >
          <Donut
            slices={slices}
            center={
              <div>
                <span className="block text-xs text-ink-muted">Patrimoine</span>
                <span className="tabular font-serif text-lg font-semibold">{formatCHF(total)}</span>
              </div>
            }
          />
        </ChartFrame>
        <div className="flex flex-col gap-4">
          <Legend items={slices.map((s) => ({ color: s.color, label: s.label }))} />
          <div className="flex flex-col gap-2 text-sm">
            <BarRow
              label="Revenu net"
              value={income}
              max={Math.max(income, spend)}
              color="var(--navy)"
            />
            <BarRow
              label="Dépenses"
              value={spend}
              max={Math.max(income, spend)}
              color="var(--red-ch)"
            />
          </div>
        </div>
      </div>
    </Block>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr_auto] items-center gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="h-2.5 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
        <span
          className="block h-full origin-left rounded-full transition-transform duration-300"
          style={{
            background: color,
            transform: `scaleX(${max > 0 ? Math.max(0, value) / max : 0})`,
          }}
        />
      </span>
      <span className="tabular font-semibold">{perMonth(value)}</span>
    </div>
  );
}

/** 3 · Vos 3 piliers. */
export function PillarsBlock({ report, index }: { report: Report; index: number }) {
  const setChoices = useApp((s) => s.setChoices);
  const s = report.plan.summary;
  const src = s.incomeBySource;
  const segments = [
    { key: 'avs', label: 'AVS', value: src.avs, color: SERIES.avs.color },
    { key: 'lpp', label: 'LPP', value: src.lpp, color: SERIES.lpp.color },
    {
      key: 'draw',
      label: 'Épargne et 3a/3b consommés',
      value: src.drawdown,
      color: SERIES.p3.color,
    },
    ...(src.rental > 0
      ? [{ key: 'rent', label: 'Loyers', value: src.rental, color: SERIES.invest.color }]
      : []),
  ];
  const gross = segments.reduce((a, b) => a + b.value, 0);
  const claim = report.strategy.main.avsClaimAge;
  const avsMonthly = report.avsCurve.find((p) => p.age === Math.round(claim))?.monthly ?? 0;
  return (
    <Block
      id="pillars"
      index={index}
      title="Vos 3 piliers"
      sentence={`Après ${formatCHF(src.taxes)} d’impôts par mois, il vous reste ${formatCHF(s.monthlyNetIncome)}.`}
      detail={
        <p className="m-0">
          L’AVS est indexée comme l’inflation (simplification de l’indice mixte). La rente LPP reste
          fixe. L’épargne consommée est un retrait régulier jusqu’à{' '}
          {useApp.getState().assumptions.horizonAge} ans.
        </p>
      }
    >
      <Kpi value={gross} label="Revenu brut mensuel à la retraite" suffix="/ mois" />
      <ChartFrame
        label="Revenu mensuel à la retraite par source, face au besoin"
        className="mt-2"
        table={{
          caption: 'Sources de revenu mensuel',
          columns: ['Source', 'Montant'],
          rows: [
            ...segments.map((x) => [x.label, formatCHF(x.value)]),
            ['Besoin', formatCHF(s.monthlyNeed)],
          ],
        }}
      >
        <StackedBar
          segments={segments}
          target={s.monthlyNeed}
          targetLabel={`Besoin ${formatCHF(s.monthlyNeed)}`}
        />
        <Legend
          className="mt-3"
          items={segments.map((x) => ({ color: x.color, label: x.label }))}
        />
      </ChartFrame>
      <div className="mt-6 grid gap-3 rounded-[16px] bg-sunken/60 p-4 sm:grid-cols-[1fr_1fr] sm:items-center">
        <Slider
          label={
            <span className="inline-flex items-center gap-1.5">
              Rente AVS dès <Term k="reference" />
            </span>
          }
          value={Math.round(claim)}
          min={63}
          max={70}
          onChange={(v) => setChoices({ avsClaimAge: v })}
          format={(n) => `${n} ans`}
        />
        <ChartFrame
          label={`Rente AVS mensuelle à ${Math.round(claim)} ans : ${formatCHF(avsMonthly)}`}
        >
          <MiniCurve
            points={report.avsCurve.map((p) => ({ x: p.age, y: p.monthly }))}
            selected={claim}
            format={formatCHF}
          />
        </ChartFrame>
      </div>
    </Block>
  );
}
