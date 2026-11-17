import { SERIES, type SeriesKey } from './palette';

export function Legend({
  items,
  className,
}: {
  items: Array<SeriesKey | { color: string; label: string; dashed?: boolean }>;
  className?: string;
}) {
  return (
    <ul
      className={`m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-xs text-ink-muted ${className ?? ''}`}
    >
      {items.map((it) => {
        const s =
          typeof it === 'string' ? { ...SERIES[it], dashed: false } : { dashed: false, ...it };
        return (
          <li key={s.label} className="flex items-center gap-1.5">
            {s.dashed ? (
              <svg width="14" height="4" aria-hidden="true">
                <line
                  x1="0"
                  y1="2"
                  x2="14"
                  y2="2"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              </svg>
            ) : (
              <span
                aria-hidden="true"
                className="size-2.5 rounded-[3px]"
                style={{ background: s.color }}
              />
            )}
            {s.label}
          </li>
        );
      })}
    </ul>
  );
}
