import type { HTMLAttributes } from 'react';
import { cn } from './cn';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'article' | 'div';
  tone?: 'surface' | 'sky';
  padded?: boolean;
}

export function Card({
  as: Tag = 'section',
  tone = 'surface',
  padded = true,
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'relative rounded-card shadow-card',
        tone === 'surface' ? 'bg-surface' : 'bg-sunken',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    />
  );
}
