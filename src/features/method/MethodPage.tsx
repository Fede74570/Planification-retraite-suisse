import { useEffect, type ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { DISCLAIMER, Footer } from '@/components/layout/Footer';
import { SOURCES as COUNTRY_SOURCES } from '@/data/countries';
import { DEFAULT_ASSUMPTIONS, LIFE_EXPECTANCY_SOURCE } from '@/engine/assumptions';
import { EMPLOYEE_SOCIAL_RATE } from '@/engine/cashflow';
import { AVAILABLE_YEARS, getParams } from '@/engine/params';
import { CANTONAL_TAX } from '@/engine/params/cantons';
import type { Source } from '@/engine/params/types';
import { formatCHF, formatPercent } from '@/lib/format';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-CH');

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-t`}
      className="rounded-card bg-surface p-5 shadow-card sm:p-7"
    >
      <h2 id={`${id}-t`} className="m-0 mb-3 text-xl">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-[0.95rem] text-ink [&_p]:m-0 [&_li]:my-1">
        {children}
      </div>
    </section>
  );
}

function ValuesTable({ rows }: { rows: Array<[string, ...string[]]> }) {
  return (
    <div className="overflow-x-auto">
      <table className="tabular w-full min-w-[320px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-ink-muted">
            <th scope="col" className="py-1.5 pr-3 font-medium">
              Paramètre
            </th>
            {AVAILABLE_YEARS.map((y) => (
              <th key={y} scope="col" className="py-1.5 pr-3 font-medium">
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, ...vals]) => (
            <tr key={label} className="border-t border-line">
              <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                {label}
              </th>
              {vals.map((v, i) => (
                <td key={i} className="py-1.5 pr-3 font-semibold">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** « Méthode et sources »: formulas in plain language, official sources, verification dates. */
export default function MethodPage() {
  useEffect(() => {
    document.title = 'Méthode et sources — Ma retraite Franco-Suisse';
  }, []);
  const years = AVAILABLE_YEARS.map((y) => getParams(y));
  const latest = years.at(-1)!;
  const a = DEFAULT_ASSUMPTIONS;
  const col = <T,>(f: (p: (typeof years)[number]) => T) => years.map(f).map(String);
  const sources = new Map<string, Source>();
  for (const p of years) for (const s of p.meta.sources) sources.set(s.url, s);
  for (const s of Object.values(COUNTRY_SOURCES)) sources.set(s.url, s);
  sources.set(LIFE_EXPECTANCY_SOURCE.url, LIFE_EXPECTANCY_SOURCE);

  return (
    <div className="min-h-dvh">
      <header className="pt-safe mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <a href="/" aria-label="Accueil">
          <Logo height={44} />
        </a>
        <a
          href="/app"
          className="inline-flex min-h-11 items-center rounded-[14px] bg-accent px-4 text-sm font-semibold text-white"
        >
          Calculer ma retraite
        </a>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-10 sm:px-6">
        <div className="py-4">
          <h1 className="m-0 text-3xl">Méthode et sources</h1>
          <p className="m-0 mt-2 text-ink-muted">
            Comment le rapport est calculé, en langage clair. Paramètres légaux {latest.meta.year}{' '}
            vérifiés le {fmtDate(latest.meta.verifiedOn)}.
          </p>
        </div>

        <Section id="principe" title="Le principe">
          <p>
            Le calcul se fait année par année, d’aujourd’hui jusqu’à {a.horizonAge} ans : salaires,
            rentes, dépenses, impôts et patrimoine, poche par poche. Les montants futurs sont aussi
            convertis en « francs d’aujourd’hui » en retirant l’inflation.
          </p>
          <p>
            Le revenu net à la retraite additionne vos rentes et un retrait régulier de votre
            épargne calculé pour durer jusqu’à l’horizon, moins les impôts. Le rapport est lu la
            première année où tout le ménage est retraité.
          </p>
        </Section>

        <Section id="avs" title="1er pilier : AVS">
          <p>
            Votre rente dépend de votre revenu annuel moyen (RAM) et de vos années de cotisation.
            Pour un RAM jusqu’à 36 fois la rente minimale : 74 % de la rente minimale + 13/600 du
            RAM ; au-delà : 104 % de la rente minimale + 8/600 du RAM, entre le minimum et le
            maximum (art. 34 LAVS). Chaque année manquante retire 1/44 de la rente.
          </p>
          <p>
            Couple marié : les revenus sont partagés à parts égales et les deux rentes sont
            plafonnées à 150 % de la rente maximale. Une 13e rente égale à un mois de rente est
            versée chaque année, sauf tant que la rente est entièrement ajournée.
          </p>
          <ValuesTable
            rows={[
              ['Rente minimale / mois', ...col((p) => formatCHF(p.avs.minMonthly))],
              ['Rente maximale / mois', ...col((p) => formatCHF(p.avs.maxMonthly))],
              [
                'Plafond couple / mois',
                ...col((p) => formatCHF(p.avs.maxMonthly * p.avs.coupleCapRatio)),
              ],
              [
                'Anticipation 2 ans',
                ...col((p) => `−${formatPercent(p.avs.earlyReductionByMonth[24] ?? 0)}`),
              ],
              [
                'Ajournement 5 ans',
                ...col((p) => `+${formatPercent(p.avs.deferralIncrease[4]?.[0] ?? 0)}`),
              ],
              [
                'Cotisation minimale non-actif / an',
                ...col((p) => formatCHF(p.avs.nonEmployed.min)),
              ],
            ]}
          />
          <p className="text-sm text-ink-muted">
            Anticipation possible dès 63 ans (62 ans pour les femmes nées entre 1961 et 1969),
            ajournement jusqu’à 70 ans, selon les tables officielles mois par mois. L’AVS est
            indexée comme l’inflation (simplification de l’indice mixte).
          </p>
        </Section>

        <Section id="lpp" title="2e pilier : LPP">
          <p>
            Les chiffres de votre certificat de prévoyance priment : avoir actuel, avoir projeté à
            65 ans et taux de conversion de votre caisse. Sans projection, le moteur applique les
            bonifications légales (7 %, 10 %, 15 %, 18 % du salaire coordonné selon l’âge) et
            l’intérêt minimal.
          </p>
          <p>
            La rente = avoir × taux de conversion, réduit de{' '}
            {(a.earlyConversionCutPerYear * 100).toLocaleString('fr-CH')} point par année
            d’anticipation (pratique des caisses). Elle n’est pas indexée. Un rachat est déductible
            mais bloque tout retrait en capital pendant 3 ans (art. 79b LPP) : le moteur vous
            alerte.
          </p>
          <ValuesTable
            rows={[
              ['Seuil d’entrée', ...col((p) => formatCHF(p.lpp.entryThreshold))],
              ['Déduction de coordination', ...col((p) => formatCHF(p.lpp.coordinationDeduction))],
              ['Salaire coordonné max.', ...col((p) => formatCHF(p.lpp.maxCoordinated))],
              ['Taux de conversion minimal', ...col((p) => formatPercent(p.lpp.minConversionRate))],
              ['Intérêt minimal', ...col((p) => formatPercent(p.lpp.minInterestRate))],
            ]}
          />
        </Section>

        <Section id="p3" title="3e pilier">
          <ValuesTable
            rows={[
              ['3a avec caisse de pension', ...col((p) => formatCHF(p.pillar3a.maxWithLpp))],
              [
                '3a sans caisse de pension (max.)',
                ...col((p) => formatCHF(p.pillar3a.maxWithoutLpp)),
              ],
            ]}
          />
          <p>
            Le 3a se retire au plus tôt 5 ans avant l’âge de référence (au plus tard à 70 ans si
            vous travaillez encore), chaque compte en une fois. Le 3b est une épargne libre, soumise
            à l’impôt sur la fortune et sur ses rendements.
          </p>
        </Section>

        <Section id="impots" title="Impôts">
          <p>
            <strong>Impôt fédéral direct</strong> : barème officiel de l’année (art. 36 LIFD),
            personne seule ou couple marié. Les retraits en capital du 2e et du 3e pilier sont
            imposés à part, au cinquième du barème (art. 38 LIFD) ; les retraits d’un couple la même
            année s’additionnent.
          </p>
          <p>
            <strong>Impôts cantonaux et communaux</strong> : grille calculée avec le calculateur
            officiel de l’AFC pour la commune chef-lieu de chaque canton (année fiscale{' '}
            {CANTONAL_TAX.meta.taxYear}, sans impôt ecclésiastique, générée le{' '}
            {fmtDate(CANTONAL_TAX.meta.generatedOn)}), puis interpolée. Estimation ±10 %.
          </p>
          <p>
            Les années futures, les barèmes sont supposés indexés à l’inflation. L’optimiseur
            répartit vos retraits sur les années permises pour payer le moins d’impôt possible, sans
            jamais faire pire que « tout la même année ».
          </p>
        </Section>

        <Section id="logement" title="Logement">
          <p>
            Tenue des charges = (hypothèque ×{' '}
            {formatPercent(latest.housing.theoreticalInterestRate)} +{' '}
            {formatPercent(latest.housing.maintenanceRate)} de la valeur pour l’entretien +
            amortissement) ÷ revenu brut, au plus 33 %. L’hypothèque de 2e rang s’amortit jusqu’aux
            deux tiers de la valeur en 15 ans, au plus tard à la retraite (pratique bancaire).
          </p>
          <p>
            Dès {latest.housing.imputedRentAbolishedFrom}, la valeur locative est supprimée pour le
            logement occupé par son propriétaire, ainsi que la déduction des intérêts. Les intérêts
            d’un bien loué restent déductibles.
          </p>
        </Section>

        <Section id="hypotheses" title="Hypothèses par défaut">
          <ul className="m-0 pl-5">
            <li>
              Inflation {formatPercent(a.inflation)} ; rendements nets prudent{' '}
              {formatPercent(a.returns.prudent)}, équilibré {formatPercent(a.returns.balanced)},
              dynamique {formatPercent(a.returns.dynamic)} ; liquidités{' '}
              {formatPercent(a.cashReturn)}.
            </li>
            <li>
              Progression salariale réelle {formatPercent(a.realWageGrowth)} ; dépenses −
              {formatPercent(a.spendingDropAtRetirement)} à la retraite.
            </li>
            <li>
              Espérance de vie à 65 ans : {a.lifeExpectancy65.m.toString().replace('.', ',')} ans
              (hommes), {a.lifeExpectancy65.f.toString().replace('.', ',')} ans (femmes) ; horizon{' '}
              {a.horizonAge} ans.
            </li>
            <li>
              Revenu imposable ≈ salaire − {formatPercent(a.employeeDeductionRate)} (cotisations et
              déductions forfaitaires) ; rentes − {formatPercent(a.retireeDeductionRate)} ;{' '}
              {formatPercent(a.taxableYieldShare)} du rendement des placements imposable.
            </li>
            <li>
              Cotisations sociales salariales {formatPercent(EMPLOYEE_SOCIAL_RATE)} ; valeur fiscale
              de l’immobilier {formatPercent(a.realEstateTaxValueRatio)} ; valeur locative{' '}
              {formatPercent(a.imputedRentRate)} de la valeur vénale jusqu’en 2028.
            </li>
            <li>
              Décaissement : liquidités, puis placements, puis 3b ; réserve de {a.emergencyMonths}{' '}
              mois de dépenses.
            </li>
          </ul>
        </Section>

        <Section id="etranger" title="Retraite à l’étranger">
          <p>
            La carte classe chaque pays selon la coordination avec la Suisse : UE/AELE (accord sur
            la libre circulation, Convention AELE), convention bilatérale de sécurité sociale,
            convention limitée à l’assujettissement, ou aucune convention ; les conventions de
            double imposition proviennent de la liste du SFI. Ce qui n’est pas confirmé par une
            source officielle est affiché « à confirmer ».
          </p>
        </Section>

        {latest.meta.pending.length > 0 && (
          <Section id="a-confirmer" title="À confirmer">
            <ul className="m-0 pl-5">
              {latest.meta.pending.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Section>
        )}

        <Section id="sources" title="Sources officielles">
          <ul className="m-0 pl-5">
            {[...sources.values()].map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  {s.label}
                </a>
                {s.date && <span className="text-ink-muted"> ({fmtDate(s.date)})</span>}
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-muted">{DISCLAIMER}</p>
        </Section>
      </main>
      <Footer withDisclaimer={false} />
    </div>
  );
}
