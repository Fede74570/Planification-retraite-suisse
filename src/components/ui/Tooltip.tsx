import { AnimatePresence, m } from 'motion/react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { spring } from '@/lib/motion';

interface InfoTipProps {
  /** The term being explained, used for the button's accessible name. */
  term: string;
  /** One sentence (§1): what the term means for the user. */
  children: ReactNode;
}

/**
 * "i" button revealing a one-sentence explanation. Opens on hover, focus or tap,
 * closes on Escape, outside tap or blur. Stays within the viewport.
 */
export function InfoTip({ term, children }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open || !bubble.current) return;
    const r = bubble.current.getBoundingClientRect();
    const margin = 12;
    const vw = document.documentElement.clientWidth;
    if (r.left < margin) setShift(margin - r.left);
    else if (r.right > vw - margin) setShift(vw - margin - r.right);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <span
      ref={wrap}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setShift(0);
      }}
    >
      <button
        type="button"
        aria-label={`Qu'est-ce que « ${term} » ?`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setShift(0);
        }}
        className="relative grid size-5 place-items-center rounded-full bg-sunken text-[11px] font-bold text-alp-ink transition-colors after:absolute after:-inset-3 after:content-[''] hover:bg-alp"
      >
        i
      </button>
      <AnimatePresence>
        {open && (
          <m.span
            ref={bubble}
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2 }}
            transition={spring}
            style={{ x: `calc(-50% + ${shift}px)` }}
            className="absolute bottom-[calc(100%+10px)] left-1/2 z-30 w-max max-w-[min(260px,calc(100vw-24px))] rounded-xl bg-navy px-3 py-2 text-left text-xs leading-snug font-normal text-white shadow-float"
          >
            <strong className="block font-semibold">{term}</strong>
            {children}
          </m.span>
        )}
      </AnimatePresence>
    </span>
  );
}
