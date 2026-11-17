import { m } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { Mountains } from '@/components/brand/Mountains';
import { Footer } from '@/components/layout/Footer';
import { Badge, Button } from '@/components/ui';
import { spring } from '@/lib/motion';

const PROOFS = [
  { k: '2 minutes', v: '4 questions, un rapport clair' },
  { k: '100 % privé', v: 'Aucune donnée ne quitte votre appareil' },
  { k: 'Paramètres 2027', v: 'AVS, LPP, 3e pilier, impôts' },
];

/** Phase 1 placeholder — the full landing page ships in Phase 5. */
export function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo height={48} />
        <Badge tone="info">Bêta</Badge>
      </header>

      <main className="relative flex flex-1 flex-col">
        <section className="relative mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 pt-10 pb-56 sm:px-6 sm:pt-20">
          <m.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="m-0 max-w-[14ch] text-3xl text-ink"
          >
            Votre retraite suisse, claire en 2&nbsp;minutes.
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.06 }}
            className="m-0 max-w-[46ch] text-lg text-ink-muted"
          >
            Combien vous toucherez, jusqu’à quel âge votre patrimoine tient, rente ou capital : un
            rapport simple, recalculé en direct.
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.12 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Button size="lg" onClick={() => window.location.assign('/app')}>
              Calculer ma retraite
            </Button>
            <a
              href="/app#exemple"
              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Essayer avec un exemple
            </a>
            <a
              href="/ui"
              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Voir le design system →
            </a>
          </m.div>
          <ul className="m-0 mt-4 grid w-full list-none gap-3 p-0 sm:grid-cols-3">
            {PROOFS.map((p, i) => (
              <m.li
                key={p.k}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.18 + i * 0.06 }}
                className="rounded-card bg-surface/80 p-4 shadow-card backdrop-blur"
              >
                <strong className="block font-serif text-lg text-ink">{p.k}</strong>
                <span className="text-sm text-ink-muted">{p.v}</span>
              </m.li>
            ))}
          </ul>
        </section>
        <Mountains className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full sm:h-72" />
      </main>
      <div className="bg-meadow/0">
        <Footer />
      </div>
    </div>
  );
}
