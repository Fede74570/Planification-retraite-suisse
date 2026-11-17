import { AnimatePresence, m } from 'motion/react';
import { useMemo, useState } from 'react';
import { Accordion, Segmented, Sheet, Toggle } from '@/components/ui';
import { COUNTRIES, COUNTRY_BY_ISO3, POPULAR, REGIME_LABEL, type Regime } from '@/data/countries';
import { countrySheet, flagEmoji } from '@/data/countrySheet';
import type { Nationality } from '@/engine/profile';
import { spring } from '@/lib/motion';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useApp } from '@/state/store';
import { CountrySearch } from './CountrySearch';
import { CountrySheetView, iso2Of } from './CountrySheetView';
import { MapCanvas, REGIME_COLOR } from './MapCanvas';

const LEGEND: Array<{ regime: Regime; label: string; icon?: string }> = [
  { regime: 'CH', label: 'Suisse', icon: '🇨🇭' },
  { regime: 'EU_EFTA', label: 'UE / AELE : coordination complète' },
  { regime: 'BILATERAL', label: 'Convention bilatérale' },
  { regime: 'BILATERAL_LIMITED', label: 'Convention limitée' },
  { regime: 'NONE', label: 'Aucune convention' },
];

/** « Partir à la retraite à l'étranger »: animated map + country sheet, search, chips, list view. */
export default function WorldMapView() {
  const desktop = useMediaQuery('(min-width: 1024px)');
  const nationality = useApp((s) => s.profile.nationality);
  const setProfile = useApp((s) => s.setProfile);
  const [selected, setSelected] = useState<string | null>(null);
  const [isolate, setIsolate] = useState<Regime | null>(null);
  const [showDta, setShowDta] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const data = useMemo(
    () => (selected ? countrySheet(selected, nationality) : null),
    [selected, nationality],
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-2xl">Partir à la retraite à l’étranger</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Ce que deviennent votre AVS, votre LPP et votre 3e pilier selon le pays.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <CountrySearch onSelect={setSelected} />
        <Segmented<Nationality>
          size="sm"
          className="lg:w-80"
          label="Ma nationalité"
          value={nationality}
          onChange={(v) => setProfile((p) => ({ ...p, nationality: v }))}
          options={[
            { value: 'CH', label: 'Suisse' },
            { value: 'EU_EFTA', label: 'UE / AELE' },
            { value: 'OTHER', label: 'Autre' },
          ]}
        />
        <Segmented
          size="sm"
          className="lg:w-48"
          label="Affichage"
          value={view}
          onChange={setView}
          options={[
            { value: 'map', label: 'Carte' },
            { value: 'list', label: 'Liste' },
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Destinations populaires">
        {POPULAR.map((iso3) => (
          <button
            key={iso3}
            type="button"
            onClick={() => setSelected(iso3)}
            aria-pressed={selected === iso3}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 transition-colors ${selected === iso3 ? 'bg-accent text-white ring-accent' : 'bg-surface text-ink ring-line-strong hover:bg-sunken'}`}
          >
            <span aria-hidden="true">{flagEmoji(iso2Of(iso3))}</span>
            {COUNTRY_BY_ISO3.get(iso3)?.nameFr}
          </button>
        ))}
      </div>

      {view === 'map' ? (
        <>
          <div className="relative">
            <MapCanvas
              selected={selected}
              onSelect={setSelected}
              isolate={isolate}
              showDta={showDta}
              rightInset={desktop && data ? 384 : 0}
            />
            <AnimatePresence>
              {desktop && data && (
                <m.aside
                  key="panel"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={spring}
                  aria-label={`Fiche ${data.country.nameFr}`}
                  className="absolute top-3 right-3 bottom-3 w-[360px] overflow-y-auto rounded-card bg-surface p-5 shadow-float"
                >
                  <CountrySheetView data={data} onClose={() => setSelected(null)} />
                </m.aside>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul
              className="m-0 flex list-none flex-wrap gap-2 p-0"
              aria-label="Légende : touchez une catégorie pour l’isoler"
            >
              {LEGEND.map((l) => {
                const active = isolate === l.regime;
                return (
                  <li key={l.regime}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setIsolate(active ? null : l.regime)}
                      className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold ring-1 transition-colors ${active ? 'bg-navy text-white ring-navy' : 'bg-surface text-ink ring-line-strong hover:bg-sunken'}`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-3 rounded-full ring-1 ring-black/10"
                        style={{ background: REGIME_COLOR[l.regime] }}
                      />
                      {l.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Toggle
              label="Hachures : convention de double imposition (CDI)"
              checked={showDta}
              onChange={setShowDta}
              className="min-w-72"
            />
          </div>
          <p className="m-0 text-xs text-ink-muted">
            Pincez ou faites défiler pour zoomer. Liechtenstein, Malte et Saint-Marin : utilisez la
            recherche ou la liste.
          </p>
        </>
      ) : (
        <ListView onSelect={setSelected} />
      )}

      {!desktop && (
        <Sheet open={!!data} onClose={() => setSelected(null)} title={data ? 'Fiche pays' : ''}>
          {data && <CountrySheetView data={data} />}
        </Sheet>
      )}
      {desktop && view === 'list' && data && (
        <div className="rounded-card bg-surface p-5 shadow-card">
          <CountrySheetView data={data} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}

function ListView({ onSelect }: { onSelect: (iso3: string) => void }) {
  const groups = (['EU_EFTA', 'BILATERAL', 'BILATERAL_LIMITED', 'NONE'] as Regime[]).map((r) => ({
    regime: r,
    countries: COUNTRIES.filter((c) => c.regime === r),
  }));
  return (
    <div className="rounded-card bg-surface px-5 py-2 shadow-card">
      {groups.map((g) => (
        <Accordion key={g.regime} title={`${REGIME_LABEL[g.regime]} (${g.countries.length})`}>
          <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {g.countries.map((c) => (
              <li key={c.iso3}>
                <button
                  type="button"
                  onClick={() => onSelect(c.iso3)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-[10px] px-2 text-left text-sm text-ink hover:bg-sunken"
                >
                  <span aria-hidden="true">{flagEmoji(iso2Of(c.iso3))}</span>
                  {c.nameFr}
                  {c.dta && (
                    <span className="ml-auto text-[10px] font-semibold text-meadow-ink">CDI</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Accordion>
      ))}
    </div>
  );
}
