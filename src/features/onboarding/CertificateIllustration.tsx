/** Stylised pension certificate showing where to find the figures (decorative, with a text alternative). */
export function CertificateIllustration() {
  const rows: Array<[string, boolean]> = [
    ['Avoir de vieillesse au 1.1', true],
    ['Avoir projeté à 65 ans', true],
    ['Rente de vieillesse projetée', true],
    ['Rachat maximal possible', true],
    ['Prestations en cas de décès', false],
  ];
  return (
    <figure
      className="m-0 rounded-card bg-surface p-4 shadow-card"
      aria-label="Exemple de certificat : avoir actuel, avoir et rente projetés à 65 ans, rachat possible."
    >
      <div className="mb-3 flex items-center justify-between" aria-hidden="true">
        <span className="text-xs font-bold tracking-wide text-ink-muted uppercase">
          Certificat de prévoyance
        </span>
        <span className="h-2 w-12 rounded-full bg-line" />
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-hidden="true">
        {rows.map(([label, hi]) => (
          <li
            key={label}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${hi ? 'bg-[#e1ecf8] font-semibold text-blue-fr' : 'text-ink-muted'}`}
          >
            <span>{label}</span>
            <span className="tabular">CHF ···</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
