import { m } from 'motion/react';
import { arc, pie } from 'd3-shape';
import { springSoft } from '@/lib/motion';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Ring chart; slices animate their angles when values change. */
export function Donut({
  slices,
  size = 168,
  center,
}: {
  slices: DonutSlice[];
  size?: number;
  center?: React.ReactNode;
}) {
  const data = slices.filter((s) => s.value > 0);
  const r = size / 2;
  const arcs = pie<DonutSlice>()
    .value((d) => d.value)
    .sort(null)
    .padAngle(0.02)(data);
  const gen = arc<(typeof arcs)[number]>()
    .innerRadius(r * 0.68)
    .outerRadius(r)
    .cornerRadius(4);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} aria-hidden="true">
        {arcs.length === 0 && (
          <circle r={r * 0.84} fill="none" stroke="var(--line)" strokeWidth={r * 0.32} />
        )}
        {arcs.map((a) => (
          <m.path
            key={a.data.key}
            initial={false}
            animate={{ d: gen(a) ?? '' }}
            transition={springSoft}
            fill={a.data.color}
          />
        ))}
      </svg>
      {center && (
        <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
      )}
    </div>
  );
}
