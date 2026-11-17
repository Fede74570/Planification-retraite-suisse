import { AnimatePresence, m } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Marmot } from '@/components/brand/Marmot';
import { Footer } from '@/components/layout/Footer';
import { Button, Segmented, Sheet } from '@/components/ui';
import { formatCHF } from '@/lib/format';
import { spring } from '@/lib/motion';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useApp, type Tab } from '@/state/store';
import { useReport } from '@/state/useReport';
import { CriteriaPanel } from '../settings/CriteriaPanel';
import { Report } from '../report/Report';

// The map (d3-geo, topojson, world atlas) is loaded only when the « Monde » view opens.
const WorldMapView = lazy(() => import('../map/WorldMapView'));

/** Desktop: criteria panel (360 px) + live report. Mobile: tab bar, « Ajuster » bottom sheet, sticky KPI bar. */
export function AppShell() {
  const report = useReport();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };
  const share = async () => {
    const url = window.location.href;
    // Native share sheet on mobile (the link stays on the device until the user picks a target).
    if (!desktop && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Ma retraite Franco-Suisse',
          text: 'Ma simulation de retraite (le lien contient mes chiffres)',
          url,
        });
        return;
      } catch {
        /* cancelled: fall back to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      notify('Lien copié. Attention : il contient vos chiffres.');
    } catch {
      notify('Copiez l’adresse de la page. Elle contient vos chiffres.');
    }
  };
  // The PDF always contains the full report, whatever view is open.
  const exportPdf = () => {
    if (tab !== 'report') setTab('report');
    window.setTimeout(() => window.print(), tab !== 'report' ? 400 : 0);
  };

  const s = report.plan.summary;
  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur print:static print:border-0">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <a href="/" aria-label="Accueil — Ma retraite Franco-Suisse">
            <Logo height={44} />
          </a>
          {desktop && (
            <div className="w-56 print:hidden">
              <Segmented
                size="sm"
                label="Vue"
                value={tab === 'world' ? 'world' : 'report'}
                onChange={(v) => setTab(v)}
                options={[
                  { value: 'report', label: 'Rapport' },
                  { value: 'world', label: 'Monde' },
                ]}
              />
            </div>
          )}
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="secondary" onClick={exportPdf} aria-label="Exporter en PDF">
              <PrintIcon />
              <span className="hidden whitespace-nowrap sm:inline">Exporter PDF</span>
            </Button>
            <Button variant="secondary" onClick={share} aria-label="Partager le lien">
              <ShareIcon />
              <span className="hidden sm:inline">Partager</span>
            </Button>
          </div>
        </div>
      </header>

      {desktop && tab === 'world' ? (
        <main className="mx-auto max-w-[1440px] px-6 py-6">
          <Suspense fallback={<MapLoading />}>
            <WorldMapView />
          </Suspense>
        </main>
      ) : desktop ? (
        <div className="mx-auto grid max-w-[1440px] grid-cols-[var(--panel-width)_1fr] gap-6 px-6 print:block print:px-0">
          <aside
            aria-label="Vos critères"
            className="sticky top-[61px] h-[calc(100dvh-61px)] overflow-y-auto overscroll-contain py-6 pr-2 print:hidden"
          >
            <h2 className="m-0 mb-3 text-lg">Vos critères</h2>
            <CriteriaPanel />
          </aside>
          <main className="min-w-0 py-6">
            <Report report={report} />
          </main>
        </div>
      ) : (
        <>
          <main className="px-4 pt-4 pb-[calc(var(--tabbar-height)+96px+var(--safe-bottom))]">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={spring}
              >
                {tab === 'report' && <Report report={report} />}
                {tab === 'scenarios' && <Report report={report} only="scenarios" />}
                {tab === 'advice' && <Report report={report} only="advice" />}
                {tab === 'world' && (
                  <Suspense fallback={<MapLoading />}>
                    <WorldMapView />
                  </Suspense>
                )}
              </m.div>
            </AnimatePresence>
          </main>

          {/* Floating « Ajuster » button above the tab bar. */}
          <div
            className="pointer-events-none fixed inset-x-0 z-30 flex justify-center print:hidden"
            style={{ bottom: 'calc(var(--tabbar-height) + 16px + var(--safe-bottom))' }}
          >
            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-float"
              onClick={() => setSheet(true)}
            >
              <SlidersIcon /> Ajuster
            </Button>
          </div>
          <TabBar tab={tab} onChange={setTab} />
          <Sheet open={sheet} onClose={() => setSheet(false)} title="Ajuster vos critères">
            <CriteriaPanel />
          </Sheet>
          {/* Sticky KPI bar: stays visible above the sheet while adjusting. */}
          <AnimatePresence>
            {sheet && (
              <m.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={spring}
                className="pt-safe fixed inset-x-0 top-0 z-[60] border-b border-line bg-surface/95 backdrop-blur"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span>
                    <span className="text-ink-muted">Net / mois </span>
                    <strong className="tabular">{formatCHF(s.monthlyNetIncome)}</strong>
                  </span>
                  <span className="text-ink-muted">
                    Tient{' '}
                    {s.depletionAge === null
                      ? 'jusqu’à l’horizon'
                      : `jusqu’à ${s.depletionAge} ans`}
                  </span>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="print:hidden">
        <Footer withDisclaimer={false} />
      </div>

      <AnimatePresence>
        {toast && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
            role="status"
            className="fixed inset-x-4 top-20 z-[70] mx-auto max-w-sm rounded-[14px] bg-navy px-4 py-3 text-sm text-white shadow-float"
          >
            {toast}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MapLoading() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-card bg-sky p-8 text-center"
      role="status"
    >
      <Marmot size={96} title="La marmotte prépare la carte" />
      <p className="m-0 text-sm text-ink-muted">Chargement de la carte…</p>
    </div>
  );
}

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  {
    id: 'report',
    label: 'Rapport',
    icon: (
      <path d="M5 4h10a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm2 4h6M7 11h6M7 14h4" />
    ),
  },
  { id: 'scenarios', label: 'Scénarios', icon: <path d="M4 16V9m4 7V5m4 11v-5m4 5V7" /> },
  {
    id: 'world',
    label: 'Monde',
    icon: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="M3 10h14M10 3c2 2 3 4.5 3 7s-1 5-3 7c-2-2-3-4.5-3-7s1-5 3-7z" />
      </>
    ),
  },
  {
    id: 'advice',
    label: 'Conseils',
    icon: <path d="M10 3a5 5 0 00-3 9v2h6v-2a5 5 0 00-3-9zM8 17h4" />,
  },
];

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Sections"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur print:hidden"
    >
      <ul className="m-0 grid h-[var(--tabbar-height)] list-none grid-cols-4 p-0">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <li key={t.id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(t.id)}
                className={`relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? 'text-accent' : 'text-ink-muted'}`}
              >
                {active && (
                  <m.span
                    layoutId="tab-dot"
                    transition={spring}
                    className="absolute top-1 h-1 w-6 rounded-full bg-accent"
                  />
                )}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {t.icon}
                </svg>
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const PrintIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 7V3h8v4M6 14H4V8h12v6h-2M6 12h8v5H6z" />
  </svg>
);
const ShareIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 11v5h12v-5" />
  </svg>
);
const SlidersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M4 6h8m4 0h0M4 14h2m4 0h6M14 4v4M8 12v4" />
  </svg>
);
