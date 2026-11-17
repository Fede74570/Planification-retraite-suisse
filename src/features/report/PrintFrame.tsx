import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';

/**
 * Print layout: a table whose <thead>/<tfoot> repeat on every printed page (Chromium/WebKit),
 * carrying the logo header and the disclaimer footer. On screen it is a plain block.
 */
export function PrintFrame({ children }: { children: ReactNode }) {
  const date = new Date().toLocaleDateString('fr-CH');
  return (
    <table className="print-frame">
      <thead>
        <tr>
          <td>
            <div className="print-head">
              <Logo height={34} />
              <span>Rapport de retraite · {date}</span>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{children}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <div className="print-foot">
              <Logo variant="mark" height={20} decorative />
              <span>
                Simulation indicative, sans valeur de conseil personnalisé. Vos données restent sur
                votre appareil.
              </span>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
