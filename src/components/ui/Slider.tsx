import { AnimatePresence, m } from 'motion/react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { haptic } from '@/lib/haptics';
import { spring } from '@/lib/motion';
import { cn } from './cn';

interface SliderProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (n: number) => string;
  /** Optional tick labels under the track (e.g. ages). */
  marks?: number[];
  info?: ReactNode;
  className?: string;
}

/**
 * Native range input (full keyboard + screen-reader support) with a custom skin,
 * a floating value bubble while interacting, and a haptic tick on each step.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
  marks,
  info,
  className,
}: SliderProps) {
  const id = useId();
  const [active, setActive] = useState(false);
  const last = useRef(value);
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-ink">
          {label}
          {info}
        </label>
        <output htmlFor={id} className="tabular text-sm font-semibold text-ink">
          {format(value)}
        </output>
      </div>
      <div className="relative h-11">
        <AnimatePresence>
          {active && (
            <m.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={spring}
              aria-hidden="true"
              className="tabular pointer-events-none absolute -top-9 z-10 -translate-x-1/2 rounded-lg bg-navy px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-float"
              style={{ left: `calc(${pct}% + ${14 - (pct / 100) * 28}px)` }}
            >
              {format(value)}
            </m.div>
          )}
        </AnimatePresence>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={format(value)}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v !== last.current) haptic(4);
            last.current = v;
            onChange(v);
          }}
          onPointerDown={() => setActive(true)}
          onPointerUp={() => setActive(false)}
          onPointerCancel={() => setActive(false)}
          onFocus={(e) => e.currentTarget.matches(':focus-visible') && setActive(true)}
          onBlur={() => setActive(false)}
          className="mrfs-range absolute inset-0 w-full"
          style={{ ['--pct' as string]: `${pct}%` }}
        />
      </div>
      {marks && (
        <div className="tabular relative -mt-1 h-4 text-xs text-ink-muted" aria-hidden="true">
          {marks.map((mk) => {
            const p = ((mk - min) / (max - min)) * 100;
            return (
              <span
                key={mk}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `calc(${p}% + ${14 - (p / 100) * 28}px)` }}
              >
                {format(mk)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
