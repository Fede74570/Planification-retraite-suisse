import { m } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { ParallaxMountains } from '@/components/brand/Mountains';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { spring } from '@/lib/motion';

const PROOFS = [
  { k: '2 minutes', v: '4 questions, un rapport clair' },
  { k: '100 % privé', v: 'Aucune donnée ne quitte votre appareil' },
  { k: 'Paramètres 2027', v: 'AVS, LPP, impôts : sources officielles' },
];

const QUESTIONS: Array<{ icon: ReactNode; title: string; text: string }> = [
  { icon: '💶', title: 'Combien par mois ?', text: 'AVS, LPP et épargne, net d’impôts.' },
  { icon: '⏳', title: 'Jusqu’à quel âge ?', text: 'L’âge où votre patrimoine s’épuiserait.' },
  {
    icon: '⚖️',
    title: 'Rente ou capital ?',
    text: 'L’âge d’équilibre, chiffré sur trois rendements.',
  },
  { icon: '🗓️', title: 'Quand partir ?', text: '63, 65, 67 ans ou progressivement.' },
  { icon: '🧾', title: 'Moins d’impôts', text: 'Retraits échelonnés et rachats LPP.' },
  {
    icon: '🏠',
    title: 'Garder la maison',
    text: 'Tenue des charges et fin de la valeur locative.',
  },
  { icon: '🌍', title: 'Partir à l’étranger', text: 'AVS, LPP et 3e pilier pays par pays.' },
];

const STEPS = [
  { n: '1', title: 'Répondez à 4 questions', text: 'Tout est pré-rempli : ajustez vos chiffres.' },
  { n: '2', title: 'Lisez votre rapport', text: 'Neuf blocs courts, un chiffre clé chacun.' },
  { n: '3', title: 'Testez vos choix', text: 'Chaque curseur recalcule tout, instantanément.' },
];

/** Landing page: promise, call to action, three proofs, what you will learn, privacy. */
export function Home() {
  useEffect(() => {
    document.title = 'Ma retraite Franco-Suisse — votre retraite suisse, claire en 2 minutes';
  }, []);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pt-safe mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Logo height={48} />
        <nav aria-label="Liens" className="flex items-center gap-1">
          <a
            href="/methode"
            className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-ink hover:text-accent"
          >
            Méthode
          </a>
          <a
            href="/app"
            className="hidden min-h-11 items-center rounded-[14px] bg-accent px-4 text-sm font-semibold text-white sm:inline-flex"
          >
            Commencer
          </a>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 pt-8 pb-64 sm:px-6 sm:pt-16 sm:pb-80">
            <m.h1
              id="hero-title"
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
            </m.div>
            <ul className="m-0 mt-2 grid w-full list-none gap-3 p-0 sm:grid-cols-3">
              {PROOFS.map((p, i) => (
                <m.li
                  key={p.k}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.18 + i * 0.06 }}
                  className="rounded-card bg-surface/85 p-4 shadow-card backdrop-blur"
                >
                  <strong className="block font-serif text-lg text-ink">{p.k}</strong>
                  <span className="text-sm text-ink-muted">{p.v}</span>
                </m.li>
              ))}
            </ul>
          </div>
          <ParallaxMountains className="absolute inset-x-0 bottom-0 h-60 sm:h-80" />
        </section>

        {/* What you will learn */}
        <section className="bg-meadow/25" aria-labelledby="learn-title">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <h2 id="learn-title" className="m-0 text-2xl">
              Ce que vous saurez
            </h2>
            <ul className="m-0 mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {QUESTIONS.map((q, i) => (
                <m.li
                  key={q.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...spring, delay: (i % 4) * 0.05 }}
                  className="rounded-card bg-surface p-5 shadow-card"
                >
                  <span aria-hidden="true" className="text-2xl">
                    {q.icon}
                  </span>
                  <h3 className="m-0 mt-2 font-sans text-base font-semibold">{q.title}</h3>
                  <p className="m-0 mt-1 text-sm text-ink-muted">{q.text}</p>
                </m.li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-title">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <h2 id="how-title" className="m-0 text-2xl">
              Comment ça marche
            </h2>
            <ol className="m-0 mt-6 grid list-none gap-4 p-0 sm:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-serif text-lg font-semibold text-white">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="m-0 font-sans text-base font-semibold">{s.title}</h3>
                    <p className="m-0 mt-1 text-sm text-ink-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Privacy + sources */}
        <section className="bg-sky" aria-labelledby="trust-title">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6">
            <div>
              <h2 id="trust-title" className="m-0 text-2xl">
                Vos chiffres restent chez vous
              </h2>
              <p className="m-0 mt-3 text-ink-muted">
                Pas de compte, pas de serveur, pas de traceur. Le calcul se fait dans votre
                navigateur ; votre simulation est enregistrée sur votre appareil et dans l’adresse
                de la page, que vous seul partagez.
              </p>
            </div>
            <div>
              <h2 className="m-0 text-2xl">Des règles officielles</h2>
              <p className="m-0 mt-3 text-ink-muted">
                Paramètres 2027 de l’OFAS, barèmes de l’AFC, espérance de vie de l’OFS, conventions
                internationales de l’OFAS et du SFI.
              </p>
              <a
                href="/methode"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline"
              >
                Méthode et sources →
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
          <h2 className="m-0 text-2xl">Prêt ? Deux minutes suffisent.</h2>
          <Button size="lg" onClick={() => window.location.assign('/app')}>
            Calculer ma retraite
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
