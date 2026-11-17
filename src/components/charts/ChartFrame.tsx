import type { ReactNode } from 'react';
import { LogoWatermark } from '@/components/brand/Logo';

interface ChartFrameProps {
  /** Accessible name of the chart (role="img"). */
  label: string;
  children: ReactNode;
  /** Alternative data table, visually hidden (§12). */
  table?: { caption: string; columns: string[]; rows: Array<Array<string | number>> };
  className?: string;
}

/** Wraps every chart: logo watermark (8 %), accessible name, hidden data table. */
export function ChartFrame({ label, children, table, className }: ChartFrameProps) {
  return (
    <figure className={`relative m-0 ${className ?? ''}`}>
      <div role="img" aria-label={label}>
        {children}
      </div>
      <LogoWatermark />
      {table && (
        <div className="sr-only">
          <table>
            <caption>{table.caption}</caption>
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
