import { m } from 'motion/react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { springSoft } from '@/lib/motion';
import { formatCHFCompact } from '@/lib/format';
import { useWidth } from '@/lib/useWidth';

export interface YearBar {
  year: number;
  parts: Array<{ key: string; value: number; color: string }>;
}

/** Withdrawals per tax year, stacked by pillar. */
export function YearBars({ bars }: { bars: YearBar[] }) {
  const [ref, width] = useWidth<HTMLDivElement>(320);
  const h = 170,
    pb = 22,
    pt = 18;
  const years = bars.map((b) => b.year);
  const x = scaleBand<number>()
    .domain(years)
    .range([8, width - 8])
    .padding(0.35);
  const max = Math.max(1, ...bars.map((b) => b.parts.reduce((s, p) => s + p.value, 0)));
  const y = scaleLinear()
    .domain([0, max * 1.1])
    .range([h - pb, pt]);
  return (
    <div ref={ref} className="w-full" aria-hidden="true">
      <svg width={width} height={h}>
        <line x1={0} x2={width} y1={h - pb} y2={h - pb} stroke="var(--line-strong)" />
        {bars.map((b) => {
          const total = b.parts.reduce((s, p) => s + p.value, 0);
          const tops = b.parts.map((_, i) =>
            b.parts.slice(0, i + 1).reduce((s, p) => s + p.value, 0),
          );
          return (
            <g key={b.year} transform={`translate(${x(b.year) ?? 0},0)`}>
              {b.parts.map((p, i) => {
                const top = tops[i]!;
                const y0 = top - p.value;
                return (
                  <m.rect
                    key={p.key}
                    width={x.bandwidth()}
                    rx={4}
                    fill={p.color}
                    initial={false}
                    animate={{ y: y(top), height: Math.max(0, y(y0) - y(top)) }}
                    transition={springSoft}
                  />
                );
              })}
              {total > 0 && (
                <text
                  x={x.bandwidth() / 2}
                  y={y(total) - 5}
                  textAnchor="middle"
                  className="tabular"
                  style={{ font: '600 10px var(--font-sans)', fill: 'var(--ink)' }}
                >
                  {formatCHFCompact(total).replace('CHF ', '')}
                </text>
              )}
              <text
                x={x.bandwidth() / 2}
                y={h - 6}
                textAnchor="middle"
                style={{ font: '500 10px var(--font-sans)', fill: 'var(--ink-muted)' }}
              >
                {b.year}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
