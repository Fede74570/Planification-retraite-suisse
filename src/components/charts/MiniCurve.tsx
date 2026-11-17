import { m } from 'motion/react';
import { scaleLinear } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import { springSoft } from '@/lib/motion';
import { useWidth } from '@/lib/useWidth';

/** Small line chart with a highlighted point (AVS pension by claim age). */
export function MiniCurve({
  points,
  selected,
  color = 'var(--chart-avs)',
  format,
}: {
  points: Array<{ x: number; y: number }>;
  selected: number;
  color?: string;
  format: (n: number) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>(280);
  const h = 96,
    padX = 16,
    padY = 18;
  const xs = scaleLinear()
    .domain([points[0]?.x ?? 0, points.at(-1)?.x ?? 1])
    .range([padX, width - padX]);
  const ys = scaleLinear()
    .domain([
      Math.min(...points.map((p) => p.y)) * 0.95,
      Math.max(...points.map((p) => p.y)) * 1.02,
    ])
    .range([h - padY, padY]);
  const d =
    line<{ x: number; y: number }>()
      .x((p) => xs(p.x))
      .y((p) => ys(p.y))
      .curve(curveMonotoneX)(points) ?? '';
  const sel = points.find((p) => p.x === Math.round(selected)) ?? points[0];
  return (
    <div ref={ref} className="w-full" aria-hidden="true">
      <svg width={width} height={h + 14}>
        <m.path
          d={d}
          initial={false}
          animate={{ d }}
          transition={springSoft}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {points.map((p) => (
          <text
            key={p.x}
            x={xs(p.x)}
            y={h + 10}
            textAnchor="middle"
            style={{ font: '500 10px var(--font-sans)', fill: 'var(--ink-muted)' }}
          >
            {p.x}
          </text>
        ))}
        {sel && (
          <m.g initial={false} animate={{ x: xs(sel.x), y: ys(sel.y) }} transition={springSoft}>
            <circle r={6} fill="var(--surface)" stroke={color} strokeWidth={2.5} />
            <text
              y={-11}
              textAnchor="middle"
              className="tabular"
              style={{ font: '600 11px var(--font-sans)', fill: 'var(--ink)' }}
            >
              {format(sel.y)}
            </text>
          </m.g>
        )}
      </svg>
    </div>
  );
}
