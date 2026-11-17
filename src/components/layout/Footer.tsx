export const DISCLAIMER =
  'Simulation indicative fondée sur des hypothèses et des paramètres légaux 2027 simplifiés. Ne constitue pas un conseil financier, fiscal ou juridique personnalisé. Les montants exacts dépendent de votre caisse de pension, de votre commune et de votre situation.';

export function Footer({ withDisclaimer = true }: { withDisclaimer?: boolean }) {
  return (
    <footer className="mx-auto max-w-5xl px-4 pt-10 pb-[calc(32px+var(--safe-bottom))] text-xs text-ink-muted sm:px-6">
      <p className="flex items-center gap-2 font-semibold text-ink">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M4 7V5a4 4 0 118 0v2m-9 0h10v7H3z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        Vos données restent sur votre appareil.
      </p>
      {withDisclaimer && <p className="mt-2 max-w-3xl">{DISCLAIMER}</p>}
      <nav aria-label="Pied de page" className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <a
          href="/"
          className="inline-flex min-h-11 items-center font-semibold text-ink hover:text-accent"
        >
          Accueil
        </a>
        <a
          href="/methode"
          className="inline-flex min-h-11 items-center font-semibold text-ink hover:text-accent"
        >
          Méthode et sources
        </a>
        <a
          href="/app"
          className="inline-flex min-h-11 items-center font-semibold text-ink hover:text-accent"
        >
          Ma simulation
        </a>
      </nav>
    </footer>
  );
}
