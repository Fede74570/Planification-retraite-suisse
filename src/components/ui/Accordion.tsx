import { AnimatePresence, m } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
import { spring } from '@/lib/motion';
import { cn } from './cn';

interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Accordion({ title, children, defaultOpen = false, className }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cn('border-b border-line', className)}>
      <h3 className="m-0 font-sans text-base font-semibold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-ink"
        >
          {title}
          <m.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={spring}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="shrink-0 text-ink-muted"
          >
            <path
              d="M5 7.5l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </m.svg>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={id}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: spring, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-ink-muted">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
