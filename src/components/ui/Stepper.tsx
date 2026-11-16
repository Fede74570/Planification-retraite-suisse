import { useId, type ReactNode } from 'react';
import { haptic } from '@/lib/haptics';
import { cn } from './cn';

interface StepperProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (n: number) => string;
  className?: string;
}

export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
  className,
}: StepperProps) {
  const id = useId();
  const set = (v: number) => {
    const next = Math.min(max, Math.max(min, v));
    if (next !== value) {
      haptic(6);
      onChange(next);
    }
  };
  const btn =
    'grid size-11 place-items-center rounded-full bg-sunken text-xl font-semibold text-ink transition-colors hover:bg-alp disabled:opacity-35';
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span id={id} className="text-sm font-medium text-ink">
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="flex items-center gap-3">
        <button
          type="button"
          className={btn}
          onClick={() => set(value - step)}
          disabled={value <= min}
          aria-label="Diminuer"
        >
          −
        </button>
        <span
          role="spinbutton"
          tabIndex={0}
          aria-labelledby={id}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={format(value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
              e.preventDefault();
              set(value + step);
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
              e.preventDefault();
              set(value - step);
            }
          }}
          className="tabular min-w-14 text-center text-lg font-semibold text-ink"
        >
          {format(value)}
        </span>
        <button
          type="button"
          className={btn}
          onClick={() => set(value + step)}
          disabled={value >= max}
          aria-label="Augmenter"
        >
          +
        </button>
      </div>
    </div>
  );
}
