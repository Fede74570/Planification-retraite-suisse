import { m } from 'motion/react';
import { useState } from 'react';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { Legend } from '@/components/charts/Legend';
import { RatioMeter } from '@/components/charts/RatioMeter';
import { SERIES } from '@/components/charts/palette';
import { YearBars, type YearBar } from '@/components/charts/YearBars';
import { Badge, Button, Kpi, Term } from '@/components/ui';
import type { Report } from '@/engine';
import type { AdviceCard } from '@/engine/advice';
import { formatCHF, formatPercent } from '@/lib/format';
import { spring } from '@/lib/motion';
import { useApp } from '@/state/store';
import { Block } from '../Block';

/** 7 · Impôts. */
export function TaxBlock({ report, index }: { report: Report; index: number }) {
  const applyAdvice = useApp((s) => s.applyAdvice);
  const buyIns = useApp((s) => s.choices.buyIns);
  const w = report.withdrawals;
  const byYear = new Map<number, YearBar>();
  for (const it of report.withdrawalItems) {
    const year = w.schedule.find((x) => x.id === it.id)?.year ?? it.latestYear;
    const bar = byYear.get(year) ?? { year, parts: [] };
    bar.parts.push({
      key: it.id,
      value: it.amount,
      color: it.kind === 'lpp' ? SERIES.lpp.color : SERIES.p3.color,
    });
    byYear.set(year, bar);
  }
  const bars = [...byYear.values()].sort((a, b) => a.year - b.year);
  const alerts = report.plan.summary.lockAlerts;
  const b = report.buyIn;
  return (
    <Block
      id="taxes"
      index={index}
      title="Impôts sur vos retraits"
      sentence={
        w.saving > 0
          ? `Échelonner vos retraits économise ${formatCHF(w.saving)} par rapport à tout retirer la même année.`
          : 'Vos retraits sont déjà répartis au mieux.'
      }
      detail={
        <p className="m-0">
          Les prestations en capital sont imposées à part, au niveau fédéral au cinquième du barème
          ordinaire. Les retraits d’un couple la même année s’additionnent. Estimation cantonale ±10
          %, commune chef-lieu.
        </p>
      }
    >
      <Kpi
        value={w.saving}
        label="Économie grâce à l’échelonnement"
        tone={w.saving > 0 ? 'positive' : 'ink'}
      />
      {alerts.length > 0 && (
        <div className="mt-3">
          <Badge tone="danger">
            Blocage : retrait en capital moins de 3 ans après un rachat (
            {alerts.map((a) => a.withdrawalYear).join(', ')})
          </Badge>
        </div>
      )}
      {bars.length > 0 ? (
        <ChartFrame
          label="Retraits en capital par année fiscale"
          className="mt-3"
          table={{
            caption: 'Calendrier des retraits',
            columns: ['Retrait', 'Montant', 'Année'],
            rows: report.withdrawalItems.map((it) => [
              it.label,
              formatCHF(it.amount),
              w.schedule.find((x) => x.id === it.id)?.year ?? '',
            ]),
          }}
        >
          <YearBars bars={bars} />
          <Legend
            items={[
              { color: SERIES.p3.color, label: '3e pilier A' },
              { color: SERIES.lpp.color, label: 'Capital LPP' },
            ]}
          />
        </ChartFrame>
      ) : (
        <p className="m-0 mt-3 text-sm text-ink-muted">Aucun retrait en capital prévu.</p>
      )}
      {b && b.saving > 0 && buyIns.length === 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[#e8f3dd] p-4">
          <p className="m-0 flex items-center gap-1.5 text-sm text-ink">
            <span>
              Racheter <strong className="tabular">{formatCHF(b.amountPerYear)}</strong>/an pendant{' '}
              {b.years.length} ans →{' '}
              <strong className="tabular text-meadow-ink">−{formatCHF(b.saving)}</strong> d’impôts.
            </span>
            <Term k="buyIn" />
          </p>
          <Button
            variant="secondary"
            onClick={() =>
              applyAdvice({
                type: 'addBuyIns',
                person: 'main',
                buyIns: b.years.map((year) => ({ year, amount: b.amountPerYear })),
              })
            }
          >
            Appliquer
          </Button>
        </div>
      )}
    </Block>
  );
}

/** 8 · Votre logement. */
export function HousingBlock({ report, index }: { report: Report; index: number }) {
  const applyAdvice = useApp((s) => s.applyAdvice);
  const amortization = useApp((s) => s.choices.amortization);
  const kind = useApp((s) => s.profile.housing?.kind);
  const h = report.housing;
  if (!h) {
    return (
      <Block
        id="housing"
        index={index}
        title="Votre logement"
        sentence="Locataire : rien à amortir. Pensez à l’évolution du loyer à la retraite."
      >
        <p className="m-0 text-sm text-ink-muted">
          Ajoutez un bien dans « Patrimoine » pour vérifier la tenue des charges.
        </p>
      </Block>
    );
  }
  const a = h.analysis;
  const verdict =
    a.verdict === 'amortize'
      ? `Amortir ${formatCHF(a.suggestedAmount)} avant la retraite`
      : a.verdict === 'optional'
        ? 'Amortir est possible, sans urgence'
        : 'Amortir est inutile';
  return (
    <Block
      id="housing"
      index={index}
      title="Votre logement"
      sentence={
        kind === 'rental'
          ? 'Bien locatif : les intérêts restent déductibles après 2029.'
          : 'Dès 2029 : plus de valeur locative, ni de déduction des intérêts.'
      }
      detail={
        <p className="m-0">
          Tenue des charges = (hypothèque × 5 % + 1 % de la valeur pour l’entretien + amortissement)
          ÷ revenu brut, limite 33 %. Coût net de la dette :{' '}
          {formatPercent(a.netDebtCostBefore2029)} avant 2029,{' '}
          {formatPercent(a.netDebtCostFrom2029)} dès 2029 ; rendement net espéré{' '}
          {formatPercent(a.netInvestReturn)}.
        </p>
      }
    >
      <p className="m-0 font-serif text-xl font-semibold">{verdict}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RatioMeter label="Aujourd’hui" value={h.ratioToday} />
        <RatioMeter label="À la retraite" value={h.ratioAtRetirement} />
      </div>
      <p className="m-0 mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
        Trait vertical : limite de 33 %. <Term k="affordability" />
      </p>
      {a.verdict === 'amortize' && !amortization && (
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() =>
            applyAdvice({
              type: 'amortize',
              year: report.plan.summary.retirementYear - 1,
              amount: a.suggestedAmount,
            })
          }
        >
          Simuler cet amortissement
        </Button>
      )}
    </Block>
  );
}

/** 9 · Nos conseils. */
export function AdviceBlock({ report, index }: { report: Report; index: number }) {
  return (
    <Block
      id="advice"
      index={index}
      title="Nos conseils"
      sentence="Quatre repères essentiels, puis ce qui compte le plus pour vous."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {report.advice.map((c, i) => (
          <AdviceCardView key={c.id} card={c} index={i} />
        ))}
      </div>
    </Block>
  );
}

const ICON: Record<AdviceCard['icon'], string> = {
  scale: '⚖️',
  inflation: '📈',
  hourglass: '⏳',
  buckets: '🪣',
  alert: '⚠️',
  piggy: '🐷',
  calendar: '🗓️',
  home: '🏠',
  shield: '🛡️',
  globe: '🌍',
  avs: '🇨🇭',
};

function formatKey(c: AdviceCard): string {
  const v = c.keyFigure.value;
  switch (c.keyFigure.unit) {
    case 'age':
      return `${Math.round(v)} ans`;
    case 'percent':
      return `${Math.round(v)} %`;
    case 'years':
      return `${Math.round(v)}`;
    case 'chfMonth':
      return `${formatCHF(v)} / mois`;
    default:
      return formatCHF(v);
  }
}

export function AdviceCardView({ card, index }: { card: AdviceCard; index: number }) {
  const applyAdvice = useApp((s) => s.applyAdvice);
  const [done, setDone] = useState(false);
  return (
    <m.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...spring, delay: index * 0.05 }}
      className={`reveal flex flex-col gap-2 rounded-[16px] p-4 ${card.mandatory ? 'bg-sunken' : 'bg-[#fbf0dc]/60 ring-1 ring-[#f0dcb4]'}`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">
          {ICON[card.icon]}
        </span>
        <h3 className="m-0 font-sans text-sm font-semibold">{card.title}</h3>
      </div>
      {card.id !== 'abroad' && (
        <p className="m-0">
          <span className="tabular block font-serif text-xl font-semibold">{formatKey(card)}</span>
          <span className="text-xs text-ink-muted">{card.keyFigure.label}</span>
        </p>
      )}
      {card.buckets && <Buckets b={card.buckets} />}
      <ul className="m-0 flex flex-col gap-1 pl-4 text-sm text-ink-muted">
        {card.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {card.action && (
        <Button
          variant="ghost"
          className="mt-auto self-start px-0"
          onClick={() => {
            applyAdvice(card.action!);
            setDone(true);
            window.setTimeout(() => setDone(false), 1600);
          }}
          aria-live="polite"
        >
          {done ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckMark /> Appliqué
            </span>
          ) : card.action.type === 'openMap' ? (
            'Ouvrir la carte'
          ) : (
            'Appliquer'
          )}
        </Button>
      )}
    </m.article>
  );
}

function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <m.path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  );
}

/** Three buckets (short / mid / long term) filled proportionally to the amounts. */
function Buckets({ b }: { b: NonNullable<AdviceCard['buckets']> }) {
  const items = [
    { label: 'Court terme', sub: '2–3 ans · liquidités', value: b.short, color: 'var(--alp)' },
    { label: 'Moyen terme', sub: '3–10 ans · équilibré', value: b.mid, color: 'var(--blue-fr)' },
    { label: 'Long terme', sub: '> 10 ans · actions', value: b.long, color: 'var(--marmot)' },
  ];
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="img"
      aria-label={items.map((i) => `${i.label} ${formatCHF(i.value)}`).join(', ')}
    >
      {items.map((i) => (
        <div key={i.label} className="flex flex-col items-center gap-1 text-center">
          <div
            className="relative h-16 w-12 overflow-hidden rounded-b-[12px] rounded-t-[4px] border-2 border-t-0 border-line-strong bg-surface"
            aria-hidden="true"
          >
            <m.div
              className="absolute inset-x-0 bottom-0 h-full origin-bottom"
              style={{ background: i.color }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: i.value / max }}
              transition={spring}
            />
          </div>
          <span className="tabular text-xs font-semibold text-ink">{formatCHF(i.value)}</span>
          <span className="text-[10px] leading-tight text-ink-muted">
            {i.label}
            <br />
            {i.sub}
          </span>
        </div>
      ))}
    </div>
  );
}
