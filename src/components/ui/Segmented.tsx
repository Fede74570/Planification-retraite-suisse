import { m } from 'motion/react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { haptic } from '@/lib/haptics';
import { spring } from '@/lib/motion';
import { cn } from './cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

/** iOS-style segmented control. role=radiogroup, arrow keys move the selection. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = 'md',
}: SegmentedProps<T>) {
  const layoutId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (i: number) => {
    const opt = options[(i + options.length) % options.length];
    if (!opt) return;
    haptic(6);
    onChange(opt.value);
    refs.current[(i + options.length) % options.length]?.focus();
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      select(i + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      select(i - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex w-full rounded-[14px] bg-sunken p-1', className)}
    >
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (!selected) {
                haptic(6);
                onChange(o.value);
              }
            }}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'relative flex-1 rounded-[10px] px-3 font-semibold transition-colors duration-150',
              size === 'md' ? 'min-h-11 text-sm' : 'min-h-9 text-xs',
              selected ? 'text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {selected && (
              <m.span
                layoutId={layoutId}
                transition={spring}
                className="absolute inset-0 rounded-[10px] bg-surface shadow-[0_1px_2px_rgb(26_42_73/0.08),0_2px_8px_rgb(26_42_73/0.08)]"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
