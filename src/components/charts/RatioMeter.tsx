import { m } from 'motion/react';
import { springSoft } from '@/lib/motion';
import { formatPercent } from '@/lib/format';

/** Horizontal meter with a limit line (affordability ≤ 33 %). */
export function RatioMeter({
  label,
  value,
  limit = 1 / 3,
  max = 0.6,
}: {
  label: string;
  value: number;
  limit?: number;
  max?: number;
}) {
  const v = Number.isFinite(value) ? value : max;
  const ok = v <= limit;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className={`tabular font-semibold ${ok ? 'text-meadow-ink' : 'text-red-ink'}`}>
          <span aria-hidden="true">{ok ? '✓ ' : '! '}</span>
          {Number.isFinite(value) ? formatPercent(value) : '—'}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-sunken" aria-hidden="true">
        <m.div
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full"
          style={{ background: ok ? 'var(--meadow)' : 'var(--red-ch)' }}
          initial={false}
          animate={{ scaleX: Math.min(1, v / max) }}
          transition={springSoft}
        />
        <span
          className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-navy"
          style={{ left: `${(limit / max) * 100}%` }}
        />
      </div>
    </div>
  );
}
