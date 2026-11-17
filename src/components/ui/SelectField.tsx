import { useId, type ReactNode } from 'react';
import { cn } from './cn';

interface SelectFieldProps<T extends string> {
  label: ReactNode;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="min-h-12 w-full appearance-none rounded-[14px] bg-surface px-3.5 pr-10 text-base font-semibold text-ink ring-1 ring-line-strong outline-none focus:ring-2 focus:ring-accent"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-muted"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="M5 7.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
