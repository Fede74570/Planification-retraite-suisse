import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { formatCHF } from '@/lib/format';
import { cn } from './cn';

interface KpiProps {
  value: number;
  label: ReactNode;
  /** Formats the (interpolated) value. Defaults to CHF. */
  format?: (n: number) => string;
  suffix?: ReactNode;
  hint?: ReactNode;
  size?: 'md' | 'xl';
  tone?: 'ink' | 'positive' | 'danger';
  className?: string;
}

const TONE = { ink: 'text-ink', positive: 'text-meadow-ink', danger: 'text-red-ink' };

/**
 * Animated counter: rolls from the previous value to the new one on every recalculation
 * (writes to the DOM directly, no re-render per frame). Screen readers get the final value only.
 */
export function Kpi({
  value,
  label,
  format = formatCHF,
  suffix,
  hint,
  size = 'md',
  tone = 'ink',
  className,
}: KpiProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prev.current;
    prev.current = value;
    if (reduce || from === value) {
      el.textContent = format(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = format(v)),
    });
    return () => controls.stop();
  }, [value, format, reduce]);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      <span
        className={cn(
          'tabular font-serif font-semibold leading-none tracking-tight',
          size === 'xl' ? 'text-kpi' : 'text-2xl',
          TONE[tone],
        )}
      >
        <span ref={ref} aria-hidden="true">
          {format(value)}
        </span>
        <span className="sr-only" aria-live="polite">
          {format(value)}
        </span>
        {suffix && (
          <span className="ml-1.5 font-sans text-base font-medium text-ink-muted">{suffix}</span>
        )}
      </span>
      {hint && <span className="text-sm text-ink-muted">{hint}</span>}
    </div>
  );
}
