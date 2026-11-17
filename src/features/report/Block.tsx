import { m, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { Accordion } from '@/components/ui';
import { spring } from '@/lib/motion';

interface BlockProps {
  id: string;
  index: number;
  /** ≤ 6 words. */
  title: string;
  /** One sentence. */
  sentence?: ReactNode;
  children: ReactNode;
  detail?: ReactNode;
  className?: string;
}

/** Report block: title + KPI + visual + one sentence, optional « Voir le détail ». Builds in cascade. */
export function Block({ id, index, title, sentence, children, detail, className }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <m.section
      id={id}
      aria-labelledby={`${id}-title`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={reduce ? { duration: 0.1 } : { ...spring, delay: Math.min(index, 4) * 0.06 }}
      className={`report-block relative rounded-card bg-surface p-5 shadow-card sm:p-6 ${className ?? ''}`}
    >
      <h2 id={`${id}-title`} className="m-0 mb-4 text-xl">
        {title}
      </h2>
      {children}
      {sentence && <p className="m-0 mt-4 text-[0.95rem] text-ink-muted">{sentence}</p>}
      {detail && (
        <Accordion title="Voir le détail" className="mt-3 border-t border-b-0 print:hidden">
          {detail}
        </Accordion>
      )}
    </m.section>
  );
}
