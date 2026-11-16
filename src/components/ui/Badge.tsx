import type { ReactNode } from 'react';
import { cn } from './cn';

export type BadgeTone = 'neutral' | 'info' | 'positive' | 'warning' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-sunken text-ink',
  info: 'bg-[#e1ecf8] text-blue-fr',
  positive: 'bg-[#e8f3dd] text-meadow-ink',
  warning: 'bg-[#fbf0dc] text-warning',
  danger: 'bg-[#fbe5e2] text-red-ink',
};
// Status is never carried by colour alone (§10): each tone has a glyph.
const GLYPHS: Record<BadgeTone, string | null> = {
  neutral: null,
  info: 'ℹ',
  positive: '✓',
  warning: '!',
  danger: '✕',
};

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode | false;
  children: ReactNode;
  className?: string;
}) {
  const glyph = icon === false ? null : (icon ?? GLYPHS[tone]);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        TONES[tone],
        className,
      )}
    >
      {glyph && (
        <span aria-hidden="true" className="text-[0.95em]">
          {glyph}
        </span>
      )}
      {children}
    </span>
  );
}
