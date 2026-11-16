import { useState, type ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Marmot } from '@/components/brand/Marmot';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { Gauge } from '@/components/charts/Gauge';
import { Footer } from '@/components/layout/Footer';
import {
  Accordion,
  Badge,
  Button,
  Card,
  InfoTip,
  Kpi,
  Segmented,
  Sheet,
  Slider,
  Stepper,
  Toggle,
} from '@/components/ui';
import { formatCHF, formatPercent } from '@/lib/format';

/** Internal "storybook" (/ui). Demo values only — no legal or computed figure is shown here. */

const SWATCHES: Array<{ token: string; hex: string; use: string; dark?: boolean }> = [
  { token: '--navy', hex: '#1A2A49', use: 'Texte, contours', dark: true },
  { token: '--blue-fr', hex: '#0055A3', use: 'Actions, LPP', dark: true },
  { token: '--red-ch', hex: '#DA281B', use: 'Suisse, AVS, alertes', dark: true },
  { token: '--sky', hex: '#E6F0F8', use: 'Fonds de section' },
  { token: '--alp', hex: '#C7D8E9', use: 'Secondaire, liquidités' },
  { token: '--meadow', hex: '#A3C67D', use: 'Positif, 3e pilier' },
  { token: '--marmot', hex: '#9B6B40', use: 'Accent rare, placements', dark: true },
  { token: '--paper', hex: '#FCFBF8', use: 'Fond principal' },
];
const TEXT_TOKENS = [
  { token: '--ink-muted', cls: 'text-ink-muted' },
  { token: '--red-ink', cls: 'text-red-ink' },
  { token: '--meadow-ink', cls: 'text-meadow-ink' },
  { token: '--marmot-ink', cls: 'text-marmot-ink' },
  { token: '--alp-ink', cls: 'text-alp-ink' },
];

function Section({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-xl">{title}</h2>
        {note && <p className="m-0 mt-1 text-sm text-ink-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default function UiPage() {
  const [age, setAge] = useState(65);
  const [capital, setCapital] = useState(40);
  const [profile, setProfile] = useState<'prudent' | 'equilibre' | 'dynamique'>('equilibre');
  const [real, setReal] = useState(false);
  const [accounts, setAccounts] = useState(2);
  const [sheet, setSheet] = useState(false);
  const [demo, setDemo] = useState(6420);
  const [ratio, setRatio] = useState(0.72);

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="/" aria-label="Accueil">
            <Logo height={44} />
          </a>
          <Badge tone="neutral" icon={false}>
            Design system · /ui
          </Badge>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6">
        <div>
          <h1 className="m-0 text-3xl">Alpine clarity</h1>
          <p className="m-0 mt-2 max-w-[60ch] text-ink-muted">
            Composants, tokens et identité de « Ma retraite Franco-Suisse ». Valeurs de
            démonstration uniquement.
          </p>
        </div>

        <Section
          title="Logo"
          note="Ne jamais déformer ni recolorer. Zone de protection = 1/4 de la hauteur."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="grid place-items-center">
              <Logo variant="horizontal" height={56} />
            </Card>
            <Card className="grid place-items-center">
              <Logo variant="mark" height={120} />
            </Card>
            <Card className="grid place-items-center">
              <Logo variant="stacked" height={160} />
            </Card>
          </div>
        </Section>

        <Section
          title="Couleurs"
          note="Tirées du logo. Les variantes « -ink » servent au texte (contraste AA vérifié par test)."
        >
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
            {SWATCHES.map((s) => (
              <li key={s.token} className="overflow-hidden rounded-card bg-surface shadow-card">
                <div
                  className="flex h-20 items-end p-3 text-xs font-semibold"
                  style={{ background: s.hex, color: s.dark ? '#fff' : 'var(--navy)' }}
                >
                  {s.hex}
                </div>
                <div className="p-3">
                  <code className="text-xs font-semibold">{s.token}</code>
                  <p className="m-0 text-xs text-ink-muted">{s.use}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {TEXT_TOKENS.map((t) => (
              <span key={t.token} className={`${t.cls} font-semibold`}>
                {t.token}
              </span>
            ))}
          </div>
        </Section>

        <Section
          title="Typographie"
          note="Titres : Literata (comme le logo). Interface : Inter. Montants en chiffres tabulaires."
        >
          <Card className="flex flex-col gap-3">
            <p className="m-0 font-serif text-3xl font-semibold">Votre retraite, claire.</p>
            <p className="m-0 font-serif text-2xl font-semibold">Rente ou capital ?</p>
            <p className="m-0 font-serif text-xl italic">Ma retraite</p>
            <p className="m-0 text-base">
              Texte courant Inter — rassurant, précis, jamais jargonneux.
            </p>
            <p className="m-0 text-sm text-ink-muted">Texte secondaire, légendes et aides.</p>
            <p className="tabular m-0 text-lg font-semibold">CHF 1'250 · CHF 11'111 · CHF 98'760</p>
          </Card>
        </Section>

        <Section
          title="Indicateurs"
          note="Compteur animé à chaque recalcul. Jauge : rouge < 60 %, orange 60–80 %, vert > 80 %."
        >
          <Card className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <Kpi size="xl" value={demo} label="Revenu net à la retraite (démo)" suffix="/ mois" />
              <ChartFrame label="Taux de remplacement (démo)" className="pr-10">
                <Gauge value={ratio} label="remplacement" display={formatPercent(ratio)} />
              </ChartFrame>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => setDemo(3000 + Math.round(Math.random() * 7000))}
              >
                Recalculer (démo)
              </Button>
              <Button
                variant="secondary"
                onClick={() => setRatio(Math.round((0.4 + Math.random() * 0.6) * 100) / 100)}
              >
                Changer le taux
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="positive">Votre patrimoine tient jusqu'à 93 ans</Badge>
              <Badge tone="warning">Taux à confirmer</Badge>
              <Badge tone="danger">Blocage de 3 ans</Badge>
              <Badge tone="info">Estimation ±10 %</Badge>
            </div>
          </Card>
        </Section>

        <Section title="Boutons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Calculer ma retraite</Button>
            <Button variant="secondary">Exporter PDF</Button>
            <Button variant="ghost">Voir le détail</Button>
            <Button variant="danger">Réinitialiser</Button>
            <Button size="lg">Grand bouton</Button>
            <Button disabled>Désactivé</Button>
          </div>
        </Section>

        <Section
          title="Saisie"
          note="Curseurs natifs (clavier et lecteurs d'écran), retour haptique quand disponible."
        >
          <Card className="flex flex-col gap-6">
            <Slider
              label="Âge de départ"
              info={
                <InfoTip term="Âge de référence">
                  L'âge auquel la rente AVS est versée sans réduction ni supplément.
                </InfoTip>
              }
              value={age}
              min={63}
              max={70}
              onChange={setAge}
              format={(n) => `${n} ans`}
              marks={[63, 65, 67, 70]}
            />
            <Slider
              label="Part prise en capital"
              value={capital}
              min={0}
              max={100}
              step={5}
              onChange={setCapital}
              format={(n) => `${n} %`}
            />
            <Segmented
              label="Profil de placement"
              value={profile}
              onChange={setProfile}
              options={[
                { value: 'prudent', label: 'Prudent' },
                { value: 'equilibre', label: 'Équilibré' },
                { value: 'dynamique', label: 'Dynamique' },
              ]}
            />
            <Stepper label="Comptes 3a" value={accounts} min={1} max={5} onChange={setAccounts} />
            <Toggle
              label="Afficher en francs d'aujourd'hui"
              description="Corrige l'effet de l'inflation"
              checked={real}
              onChange={setReal}
            />
          </Card>
        </Section>

        <Section title="Info-bulles et accordéon">
          <Card className="flex flex-col gap-2">
            <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
              Taux de conversion
              <InfoTip term="Taux de conversion">
                Le pourcentage de votre avoir LPP versé chaque année sous forme de rente.
              </InfoTip>
              · Déduction de coordination
              <InfoTip term="Déduction de coordination">
                La part du salaire déjà couverte par l'AVS, retirée avant de calculer la LPP.
              </InfoTip>
              · RAM
              <InfoTip term="RAM">
                Revenu annuel moyen déterminant : la moyenne de vos revenus soumis à l'AVS.
              </InfoTip>
            </p>
            <Accordion title="Voir le détail">
              Le détail de chaque bloc du rapport s'ouvre ici, sans quitter la page.
            </Accordion>
            <Accordion title="Hypothèses utilisées">
              Inflation, rendements et espérance de vie : modifiables dans « Hypothèses ».
            </Accordion>
          </Card>
        </Section>

        <Section title="Bottom sheet" note="Mobile : glisser vers le bas pour fermer.">
          <div>
            <Button variant="secondary" onClick={() => setSheet(true)}>
              Ajuster
            </Button>
          </div>
          <Sheet open={sheet} onClose={() => setSheet(false)} title="Ajuster vos critères">
            <div className="flex flex-col gap-6 pt-2">
              <Slider
                label="Âge de départ"
                value={age}
                min={63}
                max={70}
                onChange={setAge}
                format={(n) => `${n} ans`}
              />
              <Slider
                label="Part prise en capital"
                value={capital}
                min={0}
                max={100}
                step={5}
                onChange={setCapital}
                format={(n) => `${n} %`}
              />
              <p className="m-0 text-sm text-ink-muted">
                Dépenses (démo) :{' '}
                <span className="tabular font-semibold text-ink">{formatCHF(9500)}</span> / mois
              </p>
            </div>
          </Sheet>
        </Section>

        <Section
          title="Marmotte"
          note="Uniquement dans l'onboarding, les états vides et l'écran « rapport prêt ». Jamais dans le rapport."
        >
          <Card tone="sky" className="flex flex-wrap items-end justify-center gap-10">
            <Marmot size={180} waving title="Marmotte qui salue" />
            <Marmot size={120} title="Marmotte" />
          </Card>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
