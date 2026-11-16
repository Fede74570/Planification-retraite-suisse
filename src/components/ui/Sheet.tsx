import { AnimatePresence, m, useReducedMotion, type PanInfo } from 'motion/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { spring } from '@/lib/motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}

/**
 * Bottom sheet (mobile). Springs up, drags down to dismiss, closes on Escape or backdrop tap,
 * restores focus to the opener. Max 85 % of the viewport so the hero KPI stays visible.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <m.div
            className="absolute inset-0 bg-navy/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <m.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={reduce ? { duration: 0.1 } : spring}
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[24px] bg-surface shadow-float outline-none"
          >
            <div className="flex cursor-grab touch-none flex-col items-center pt-2.5 pb-1 active:cursor-grabbing">
              <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-line-strong" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h2 id={titleId} className="m-0 text-lg">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="grid size-11 place-items-center rounded-full text-ink-muted hover:bg-sunken"
                aria-label="Fermer"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    d="M4 4l10 10M14 4L4 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(20px+var(--safe-bottom))]">
              {children}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
