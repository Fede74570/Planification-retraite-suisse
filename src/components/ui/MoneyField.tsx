import { forwardRef, useEffect, useId, useState, type ReactNode } from 'react';
import { formatNumber, parseAmount } from '@/lib/format';
import { cn } from './cn';

interface MoneyFieldProps {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  info?: ReactNode;
  hint?: ReactNode;
  suffix?: string;
  prefix?: string;
  min?: number;
  max?: number;
  /** Decimal places (rates); amounts are rounded to the franc. */
  decimals?: number;
  className?: string;
}

/** Amount input: numeric keyboard on mobile, Swiss formatting on blur ("1'250"). */
export const MoneyField = forwardRef<HTMLInputElement, MoneyFieldProps>(function MoneyField(
  {
    label,
    value,
    onChange,
    info,
    hint,
    suffix,
    prefix = 'CHF',
    min = 0,
    max = 100_000_000,
    decimals = 0,
    className,
  },
  ref,
) {
  const id = useId();
  const fmt = (v: number) =>
    decimals > 0 ? v.toFixed(decimals).replace('.', ',') : formatNumber(v);
  const [text, setText] = useState(fmt(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-ink">
        {label}
        {info}
      </label>
      <div className="flex min-h-12 items-center gap-2 rounded-[14px] bg-surface px-3.5 ring-1 ring-line-strong transition-shadow focus-within:ring-2 focus-within:ring-accent">
        {prefix && <span className="text-sm font-medium text-ink-muted">{prefix}</span>}
        <input
          ref={ref}
          id={id}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          value={text}
          onFocus={(e) => {
            setFocused(true);
            e.currentTarget.select();
          }}
          onBlur={() => {
            setFocused(false);
            setText(fmt(value));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseAmount(e.target.value);
            if (n !== null) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="tabular w-full min-w-0 bg-transparent py-2 text-lg font-semibold text-ink outline-none"
        />
        {suffix && (
          <span className="text-sm font-medium whitespace-nowrap text-ink-muted">{suffix}</span>
        )}
      </div>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
});
