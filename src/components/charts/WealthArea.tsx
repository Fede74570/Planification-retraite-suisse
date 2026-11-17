import { m } from 'motion/react';
import { scaleLinear } from 'd3-scale';
import { area, line, stack, curveMonotoneX } from 'd3-shape';
import { springSoft } from '@/lib/motion';
import { formatCHFCompact } from '@/lib/format';
import { useWidth } from '@/lib/useWidth';
import { SERIES } from './palette';

export interface WealthPoint {
  age: number;
  cash: number;
  invest: number;
  p3: number;
  lpp: number;
  realEstate: number;
  income: number;
  spending: number;
}
export interface TimelineEvent {
  age: number;
  icon: string;
  label: string;
}

const KEYS = ['realEstate', 'lpp', 'p3', 'invest', 'cash'] as const;

/** Stacked wealth by pocket + income and spending lines, events under the axis, reserve zone shaded. */
export function WealthArea({
  data,
  events,
  lifeExpectancyAge,
}: {
  data: WealthPoint[];
  events: TimelineEvent[];
  lifeExpectancyAge: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>(320);
  const h = 260,
    pl = 46,
    pr = 46,
    pt = 12,
    pb = 52;
  const x = scaleLinear()
    .domain([data[0]?.age ?? 60, data.at(-1)?.age ?? 95])
    .range([pl, width - pr]);
  const series = stack<WealthPoint>()
    .keys(KEYS as unknown as string[])
    .value((d, k) => Math.max(0, d[k as (typeof KEYS)[number]]))(data);
  const top = Math.max(1, ...series.at(-1)!.map((p) => p[1]));
  const y = scaleLinear()
    .domain([0, top * 1.05])
    .range([h - pb, pt])
    .nice();
  // Flows (per year) use a secondary axis on the right.
  const fy = scaleLinear()
    .domain([0, Math.max(1, ...data.map((d) => Math.max(d.income, d.spending))) * 1.1])
    .range([h - pb, pt])
    .nice();
  const flowY = (v: number) => fy(v);
  const ar = area<[number, number]>()
    .x((_, i) => x(data[i]!.age))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(curveMonotoneX);
  const incomeD =
    line<WealthPoint>()
      .x((d) => x(d.age))
      .y((d) => flowY(d.income))
      .curve(curveMonotoneX)(data) ?? '';
  const spendD =
    line<WealthPoint>()
      .x((d) => x(d.age))
      .y((d) => flowY(d.spending))
      .curve(curveMonotoneX)(data) ?? '';
  const ticks = y.ticks(4);
  const lastAge = data.at(-1)?.age ?? 95;
  return (
    <div ref={ref} className="w-full" aria-hidden="true">
      <svg key={width} width={width} height={h}>
        {lifeExpectancyAge < lastAge && (
          <g>
            <rect
              x={x(lifeExpectancyAge)}
              y={pt}
              width={Math.max(0, x(lastAge) - x(lifeExpectancyAge))}
              height={h - pb - pt}
              fill="var(--sky)"
            />
            <text
              x={x(lifeExpectancyAge) + 6}
              y={pt + 12}
              style={{ font: '600 10px var(--font-sans)', fill: 'var(--alp-ink)' }}
            >
              Réserve
            </text>
          </g>
        )}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pl} x2={width - pr} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text
              x={pl - 6}
              y={y(t) + 3}
              textAnchor="end"
              style={{ font: '500 10px var(--font-sans)', fill: 'var(--ink-muted)' }}
            >
              {formatCHFCompact(t).replace('CHF ', '')}
            </text>
          </g>
        ))}
        {fy.ticks(4).map((t) => (
          <text
            key={`r${t}`}
            x={width - pr + 6}
            y={fy(t) + 3}
            style={{ font: '500 10px var(--font-sans)', fill: 'var(--ink-muted)' }}
          >
            {formatCHFCompact(t).replace('CHF\u00A0', '')}
          </text>
        ))}
        {series.map((s) => (
          <m.path
            key={s.key}
            initial={false}
            animate={{ d: ar(s as unknown as Array<[number, number]>) ?? '' }}
            transition={springSoft}
            fill={SERIES[s.key as (typeof KEYS)[number]].color}
            opacity={0.9}
          />
        ))}
        <m.path
          initial={false}
          animate={{ d: incomeD }}
          transition={springSoft}
          fill="none"
          stroke="var(--navy)"
          strokeWidth={2}
        />
        <m.path
          initial={false}
          animate={{ d: spendD }}
          transition={springSoft}
          fill="none"
          stroke="var(--red-ink)"
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        {data
          .filter((d) => d.age % 5 === 0)
          .map((d) => (
            <text
              key={d.age}
              x={x(d.age)}
              y={h - pb + 14}
              textAnchor="middle"
              style={{ font: '500 10px var(--font-sans)', fill: 'var(--ink-muted)' }}
            >
              {d.age}
            </text>
          ))}
        {events.map((e, i) => (
          <g
            key={`${e.age}-${i}`}
            transform={`translate(${x(e.age)}, ${h - pb + 32 + (i % 2) * 0})`}
          >
            <line y1={-14} y2={-6} stroke="var(--line-strong)" />
            <circle r={9} fill="var(--surface)" stroke="var(--line-strong)" />
            <text y={4} textAnchor="middle" style={{ font: '11px var(--font-sans)' }}>
              {e.icon}
            </text>
            <title>{e.label}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
