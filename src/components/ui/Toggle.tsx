import { m } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { haptic } from '@/lib/haptics';
import { spring } from '@/lib/motion';
import { cn } from './cn';

interface ToggleProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: ReactNode;
  className?: string;
}

export function Toggle({ label, checked, onChange, description, className }: ToggleProps) {
  const id = useId();
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-4', className)}>
      <div className="flex flex-col">
        <span id={id} className="text-sm font-medium text-ink">
          {label}
        </span>
        {description && <span className="text-xs text-ink-muted">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => {
          haptic(6);
          onChange(!checked);
        }}
        className={cn(
          'relative flex h-8 w-[52px] shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
          checked ? 'justify-end bg-accent' : 'justify-start bg-line-strong',
        )}
      >
        <m.span
          layout
          transition={spring}
          className="size-7 rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0/0.18)]"
        />
      </button>
    </div>
  );
}
