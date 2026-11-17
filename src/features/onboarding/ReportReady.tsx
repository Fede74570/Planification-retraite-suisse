import { m } from 'motion/react';
import { useEffect } from 'react';
import { Marmot } from '@/components/brand/Marmot';
import { spring } from '@/lib/motion';

/** Short « report ready » moment (≈ 1.2 s) with the marmot, then the report builds itself. */
export function ReportReady({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1200);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="grid min-h-dvh place-items-center bg-sky px-6" role="status" aria-live="polite">
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="flex flex-col items-center gap-4 text-center"
      >
        <Marmot size={140} waving title="La marmotte a préparé votre rapport" />
        <p className="m-0 font-serif text-2xl font-semibold">Votre rapport est prêt</p>
        <p className="m-0 text-ink-muted">On assemble vos chiffres…</p>
      </m.div>
    </div>
  );
}
