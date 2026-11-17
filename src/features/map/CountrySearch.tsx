import { useId, useState, type KeyboardEvent } from 'react';
import { flagEmoji, searchCountries } from '@/data/countrySheet';
import { iso2Of } from './CountrySheetView';

/** Accessible combobox (ARIA 1.2 pattern): type, arrows, Enter, Escape. */
export function CountrySearch({ onSelect }: { onSelect: (iso3: string) => void }) {
  const id = useId();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const results = searchCountries(q);
  const open = q.length > 0 && results.length > 0;
  const choose = (iso3: string) => {
    onSelect(iso3);
    setQ('');
  };
  const onKey = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[active];
      if (r) choose(r.iso3);
    }
    if (e.key === 'Escape') setQ('');
  };
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Rechercher un pays
      </label>
      <div className="flex min-h-12 items-center gap-2 rounded-[14px] bg-surface px-3.5 ring-1 ring-line-strong focus-within:ring-2 focus-within:ring-accent">
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-ink-muted"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          placeholder="Rechercher un pays"
          autoComplete="off"
          className="w-full bg-transparent py-2 text-base text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label="Pays"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-30 m-0 max-h-72 list-none overflow-auto rounded-[14px] bg-surface p-1.5 shadow-float"
        >
          {results.map((c, i) => (
            <li
              key={c.iso3}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(c.iso3);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] px-3 text-sm ${i === active ? 'bg-sunken' : ''}`}
            >
              <span aria-hidden="true">{flagEmoji(iso2Of(c.iso3))}</span>
              {c.nameFr}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
