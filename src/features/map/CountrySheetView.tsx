import { Badge, Button } from '@/components/ui';
import codes from '@/data/countryCodes.json';
import type { Bullet, PillarKey } from '@/data/countries';
import { REGIME_LABEL } from '@/data/countries';
import { flagEmoji, type CountrySheet } from '@/data/countrySheet';
import { shareSheetPng } from './sharePng';

const ISO2 = new Map(codes.countries.map((c) => [c.iso3, c.iso2]));
const ROWS: Array<[Exclude<PillarKey, 'tip'>, string]> = [
  ['avs', 'AVS'],
  ['lpp', 'LPP'],
  ['p3a', '3a'],
  ['p3b', '3b'],
];
const ICON: Record<Bullet['status'], string> = { ok: '✅', warn: '⚠️', no: '❌' };
const ICON_LABEL: Record<Bullet['status'], string> = { ok: 'Oui', warn: 'Attention', no: 'Non' };

export function iso2Of(iso3: string): string | undefined {
  return ISO2.get(iso3);
}

/** Ultra-short country sheet: flag + name + badges, one line per pillar, « Bon à savoir », source. */
export function CountrySheetView({ data, onClose }: { data: CountrySheet; onClose?: () => void }) {
  const { country, sheet } = data;
  const verified = new Date(data.verifiedOn).toLocaleDateString('fr-CH');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 flex items-center gap-2 font-serif text-2xl font-semibold">
            <span aria-hidden="true">{flagEmoji(iso2Of(country.iso3))}</span>
            {country.nameFr}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge
              tone={
                country.regime === 'NONE'
                  ? 'neutral'
                  : country.regime === 'BILATERAL_LIMITED'
                    ? 'warning'
                    : 'info'
              }
              icon={false}
            >
              {REGIME_LABEL[country.regime]}
            </Badge>
            {country.regime !== 'CH' && (
              <Badge tone={country.dta ? 'positive' : 'neutral'}>
                {country.dta ? 'CDI en vigueur' : 'Pas de CDI'}
              </Badge>
            )}
            {data.hasUnverified && <Badge tone="warning">À confirmer</Badge>}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche"
            className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-sunken"
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
        )}
      </div>
      <dl className="m-0 flex flex-col gap-3">
        {ROWS.map(([key, label]) => (
          <div key={key} className="grid grid-cols-[44px_1fr] gap-2">
            <dt className="pt-0.5 text-sm font-bold text-ink">{label}</dt>
            <dd className="m-0">
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {sheet[key].map((b) => (
                  <BulletLine key={b.text} b={b} />
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
      <div className="rounded-[14px] bg-sunken p-3">
        <p className="m-0 text-xs font-bold tracking-wide text-ink-muted uppercase">Bon à savoir</p>
        <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
          {sheet.tip.map((b) => (
            <BulletLine key={b.text} b={b} />
          ))}
        </ul>
      </div>
      <p className="m-0 text-xs text-ink-muted">
        Source :{' '}
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-accent underline-offset-2 hover:underline"
        >
          {data.sourceLabel}
        </a>
        . Vérifié le {verified}.
      </p>
      <Button
        variant="secondary"
        className="self-start"
        onClick={() => void shareSheetPng(data, flagEmoji(iso2Of(country.iso3)))}
      >
        Partager cette fiche
      </Button>
    </div>
  );
}

function BulletLine({ b }: { b: Bullet }) {
  return (
    <li className="flex gap-2 text-sm text-ink">
      <span role="img" aria-label={ICON_LABEL[b.status]} className="shrink-0">
        {ICON[b.status]}
      </span>
      <span>
        {b.text}
        {b.unverified && (
          <span className="ml-1 text-xs font-semibold text-warning">(à confirmer)</span>
        )}
      </span>
    </li>
  );
}
