import { m } from 'motion/react';
import { springSoft } from '@/lib/motion';

export interface BarSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Horizontal stacked bar against a target marker (e.g. monthly need). */
export function StackedBar({
  segments,
  target,
  targetLabel,
  height = 36,
}: {
  segments: BarSegment[];
  target: number;
  targetLabel: string;
  height?: number;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  const max = Math.max(total, target) * 1.08 || 1;
  const offsets = segments.map((_, i) =>
    segments.slice(0, i).reduce((a, x) => a + Math.max(0, x.value), 0),
  );
  return (
    <div className="relative overflow-x-clip pt-6" aria-hidden="true">
      <div className="relative flex overflow-hidden rounded-[10px] bg-sunken" style={{ height }}>
        {segments.map((s, i) => {
          const left = offsets[i]!;
          return (
            <m.div
              key={s.key}
              className="absolute inset-y-0 origin-left"
              style={{ background: s.color, left: 0, width: '100%' }}
              initial={false}
              animate={{ x: `${(left / max) * 100}%`, scaleX: Math.max(0, s.value) / max }}
              transition={springSoft}
            />
          );
        })}
      </div>
      {/* Full-width layer translated by a % of its own width: transform-only animation. */}
      <m.div
        className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex flex-col items-start"
        initial={false}
        animate={{ x: `${(target / max) * 100}%` }}
        transition={springSoft}
      >
        <span className="-translate-x-1/2 text-[11px] font-semibold whitespace-nowrap text-ink">
          {targetLabel}
        </span>
        <span className="mt-0.5 w-0.5 flex-1 -translate-x-1/2 rounded-full bg-navy" />
      </m.div>
    </div>
  );
}
