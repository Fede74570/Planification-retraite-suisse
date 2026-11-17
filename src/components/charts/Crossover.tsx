import { m } from 'motion/react';
import { scaleLinear } from 'd3-scale';
import { area, line, curveMonotoneX } from 'd3-shape';
import { springSoft } from '@/lib/motion';
import { formatCHFCompact } from '@/lib/format';
import { useWidth } from '@/lib/useWidth';

interface CrossoverProps {
  ages: number[];
  cumulativeAnnuity: number[];
  prudent: number[];
  balanced: number[];
  dynamic: number[];
  breakEvenAge: number | null;
  netCapital: number;
}

/**
 * Cumulative net annuity (rising line) against the capital left (band = prudent…dynamic,
 * line = balanced). The break-even label follows the curve when the slider moves.
 */
export function Crossover({
  ages,
  cumulativeAnnuity,
  prudent,
  balanced,
  dynamic,
  breakEvenAge,
  netCapital,
}: CrossoverProps) {
  const [ref, width] = useWidth<HTMLDivElement>(320);
  const h = 220,
    pl = 46,
    pr = 12,
    pt = 16,
    pb = 26;
  const maxY = Math.max(netCapital, ...cumulativeAnnuity, ...dynamic) * 1.05 || 1;
  const x = scaleLinear()
    .domain([ages[0] ?? 65, ages.at(-1) ?? 95])
    .range([pl, width - pr]);
  const y = scaleLinear()
    .domain([0, maxY])
    .range([h - pb, pt]);
  const pts = (vals: number[]) => vals.map((v, i) => [ages[i]!, v] as [number, number]);
  const ln = line<[number, number]>()
    .x((d) => x(d[0]))
    .y((d) => y(d[1]))
    .curve(curveMonotoneX);
  const band =
    area<number>()
      .x((_, i) => x(ages[i]!))
      .y0((_, i) => y(prudent[i] ?? 0))
      .y1((v) => y(v))
      .curve(curveMonotoneX)(dynamic) ?? '';
  const annuityD = ln(pts(cumulativeAnnuity)) ?? '';
  const balancedD = ln(pts(balanced)) ?? '';
  const beIdx = breakEvenAge === null ? -1 : ages.indexOf(breakEvenAge);
  const ticks = y.ticks(4);
  return (
    <div ref={ref} className="w-full" aria-hidden="true">
      <svg width={width} height={h}>
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
        {ages
          .filter((a) => a % 5 === 0)
          .map((a) => (
            <text
              key={a}
              x={x(a)}
              y={h - 8}
              textAnchor="middle"
              style={{ font: '500 10px var(--font-sans)', fill: 'var(--ink-muted)' }}
            >
              {a}
            </text>
          ))}
        {/* Net capital reference: the annuity line crosses it at the break-even age. */}
        <m.line
          initial={false}
          animate={{ y1: y(netCapital), y2: y(netCapital) }}
          transition={springSoft}
          x1={pl}
          x2={width - pr}
          stroke="var(--navy)"
          strokeWidth={1.5}
          strokeDasharray="2 4"
        />
        <m.text
          initial={false}
          animate={{ y: y(netCapital) - 6 }}
          transition={springSoft}
          x={pl + 4}
          style={{ font: '600 10px var(--font-sans)', fill: 'var(--ink)' }}
        >
          Capital net {formatCHFCompact(netCapital).replace('CHF\u00A0', '')}
        </m.text>
        <m.path
          initial={false}
          animate={{ d: band }}
          transition={springSoft}
          fill="var(--chart-invest)"
          opacity={0.18}
        />
        <m.path
          initial={false}
          animate={{ d: balancedD }}
          transition={springSoft}
          fill="none"
          stroke="var(--chart-invest)"
          strokeWidth={2.5}
        />
        <m.path
          initial={false}
          animate={{ d: annuityD }}
          transition={springSoft}
          fill="none"
          stroke="var(--chart-lpp)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
        />
        {beIdx >= 0 && (
          <m.g
            initial={false}
            animate={{ x: x(breakEvenAge!), y: y(cumulativeAnnuity[beIdx]!) }}
            transition={springSoft}
          >
            <line
              y1={0}
              y2={h - pb - y(cumulativeAnnuity[beIdx]!)}
              stroke="var(--navy)"
              strokeDasharray="2 3"
            />
            <circle r={5.5} fill="var(--surface)" stroke="var(--navy)" strokeWidth={2} />
            <g transform="translate(0,-14)">
              <rect x={-30} y={-12} width={60} height={20} rx={10} fill="var(--navy)" />
              <text
                y={2}
                textAnchor="middle"
                style={{ font: '600 11px var(--font-sans)', fill: '#fff' }}
              >
                {breakEvenAge} ans
              </text>
            </g>
          </m.g>
        )}
      </svg>
    </div>
  );
}
