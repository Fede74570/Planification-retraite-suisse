import {
  Accordion,
  Button,
  MoneyField,
  Segmented,
  SelectField,
  Slider,
  Stepper,
  Term,
  Toggle,
} from '@/components/ui';
import { AVAILABLE_YEARS } from '@/engine/params';
import { CANTON_NAMES } from '@/engine/params/cantons';
import { CANTON_CODES, type CantonCode, type ReturnProfile } from '@/engine/profile';
import { formatPercent } from '@/lib/format';
import { useApp } from '@/state/store';

const CANTON_OPTIONS = CANTON_CODES.map((c) => ({
  value: c,
  label: `${CANTON_NAMES[c]} (${c})`,
})).sort((a, b) => a.label.localeCompare(b.label, 'fr'));

/** All criteria, grouped in collapsible sections. Every change recomputes the report live. */
export function CriteriaPanel() {
  const s = useApp();
  const { profile, assumptions: a, mode } = s;
  const expert = mode === 'expert';
  const main = profile.main;
  const partner = profile.partner;
  const h = profile.housing;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col gap-3 pb-3">
        <Segmented
          label="Niveau de détail"
          value={mode}
          onChange={s.setMode}
          options={[
            { value: 'simple', label: 'Simple' },
            { value: 'expert', label: 'Expert' },
          ]}
        />
      </div>

      <Accordion title="Vous" defaultOpen>
        <div className="flex flex-col gap-4 text-ink">
          <Slider
            label="Âge de retraite souhaité"
            value={main.retirementAge}
            min={58}
            max={70}
            onChange={(v) => {
              s.setMain({ retirementAge: v });
              s.setChoices({ scenario: null, avsClaimAge: null, p3aAges: null });
            }}
            format={(n) => `${n} ans`}
          />
          <Stepper
            label="Année de naissance"
            value={main.birthYear}
            min={1945}
            max={1990}
            onChange={(v) => s.setMain({ birthYear: v })}
          />
          <Segmented
            label="Sexe"
            value={main.sex}
            onChange={(v) => s.setMain({ sex: v })}
            options={[
              { value: 'f', label: 'Femme' },
              { value: 'm', label: 'Homme' },
            ]}
          />
          <Segmented
            label="État civil"
            value={profile.status}
            onChange={(v) => {
              s.setProfile((p) => ({
                ...p,
                status: v,
                ...(v === 'single' ? { partner: undefined } : {}),
              }));
              if (v === 'married') s.setPartner({});
            }}
            options={[
              { value: 'single', label: 'Seul·e' },
              { value: 'married', label: 'Marié·e' },
            ]}
          />
          <SelectField<CantonCode>
            label="Canton"
            value={profile.canton}
            onChange={(v) => s.setProfile((p) => ({ ...p, canton: v }))}
            options={CANTON_OPTIONS}
          />
          {partner && (
            <div className="flex flex-col gap-4 rounded-[16px] bg-sunken p-3">
              <Stepper
                label="Naissance du conjoint"
                value={partner.birthYear}
                min={1945}
                max={1995}
                onChange={(v) => s.setPartner({ birthYear: v })}
              />
              <Slider
                label="Retraite du conjoint"
                value={partner.retirementAge}
                min={58}
                max={70}
                onChange={(v) => s.setPartner({ retirementAge: v })}
                format={(n) => `${n} ans`}
              />
            </div>
          )}
          {expert && (
            <Stepper
              label="Enfants à charge"
              value={profile.children}
              min={0}
              max={6}
              onChange={(v) => s.setProfile((p) => ({ ...p, children: v }))}
            />
          )}
        </div>
      </Accordion>

      <Accordion title="Revenus et dépenses">
        <div className="flex flex-col gap-4 text-ink">
          <MoneyField
            label="Revenu brut annuel"
            suffix="/ an"
            value={main.grossIncome}
            onChange={(v) => s.setMain({ grossIncome: v })}
          />
          {partner && (
            <MoneyField
              label="Revenu brut du conjoint"
              suffix="/ an"
              value={partner.grossIncome}
              onChange={(v) => s.setPartner({ grossIncome: v })}
            />
          )}
          <MoneyField
            label="Dépenses du ménage"
            suffix="/ mois"
            hint="Hors impôts et intérêts hypothécaires."
            value={profile.monthlyExpenses}
            onChange={(v) => s.setProfile((p) => ({ ...p, monthlyExpenses: v }))}
          />
        </div>
      </Accordion>

      <Accordion title="Prévoyance">
        <div className="flex flex-col gap-4 text-ink">
          <MoneyField
            label="Avoir LPP actuel"
            value={main.lpp.balance}
            onChange={(v) => s.setMain({ lpp: { ...main.lpp, balance: v } })}
          />
          <MoneyField
            label="Avoir projeté à 65 ans"
            value={main.lpp.projectedAt65 ?? 0}
            onChange={(v) => s.setMain({ lpp: { ...main.lpp, projectedAt65: v || undefined } })}
          />
          <MoneyField
            label="Potentiel de rachat"
            info={<Term k="buyIn" />}
            value={main.lpp.buyInPotential}
            onChange={(v) => s.setMain({ lpp: { ...main.lpp, buyInPotential: v } })}
          />
          <MoneyField
            label="Total 3e pilier A"
            info={<Term k="p3a" />}
            value={main.pillar3a.balance}
            onChange={(v) => s.setMain({ pillar3a: { ...main.pillar3a, balance: v } })}
          />
          <Stepper
            label={
              <span className="inline-flex items-center gap-1.5">
                Années AVS manquantes <Term k="avsGap" />
              </span>
            }
            value={main.avsMissingYears}
            min={0}
            max={44}
            onChange={(v) => s.setMain({ avsMissingYears: v })}
          />
          {expert && (
            <>
              <MoneyField
                label="Taux de conversion de la caisse"
                info={<Term k="conversion" />}
                prefix=""
                suffix="%"
                decimals={2}
                max={10}
                value={(main.lpp.conversionRate ?? 0) * 100}
                onChange={(v) =>
                  s.setMain({ lpp: { ...main.lpp, conversionRate: v > 0 ? v / 100 : undefined } })
                }
                hint="0 = calculé depuis le certificat ou 6,8 %."
              />
              <Slider
                label="Part capital maximale (règlement)"
                value={Math.round((main.lpp.maxCapitalShare ?? 1) * 100)}
                min={25}
                max={100}
                step={5}
                onChange={(v) => s.setMain({ lpp: { ...main.lpp, maxCapitalShare: v / 100 } })}
                format={(n) => `${n} %`}
              />
              <Stepper
                label="Nombre de comptes 3a"
                value={main.pillar3a.accounts}
                min={1}
                max={5}
                onChange={(v) => {
                  s.setMain({ pillar3a: { ...main.pillar3a, accounts: v } });
                  s.setChoices({ p3aAges: null });
                }}
              />
              <MoneyField
                label="RAM (extrait de compte AVS)"
                info={<Term k="ram" />}
                hint="0 = estimé depuis le revenu."
                value={main.ramOverride ?? 0}
                onChange={(v) => s.setMain({ ramOverride: v || undefined })}
              />
            </>
          )}
          {partner && (
            <div className="flex flex-col gap-4 rounded-[16px] bg-sunken p-3">
              <MoneyField
                label="Avoir LPP du conjoint"
                value={partner.lpp.balance}
                onChange={(v) => s.setPartner({ lpp: { ...partner.lpp, balance: v } })}
              />
              <MoneyField
                label="3e pilier A du conjoint"
                value={partner.pillar3a.balance}
                onChange={(v) => s.setPartner({ pillar3a: { ...partner.pillar3a, balance: v } })}
              />
            </div>
          )}
        </div>
      </Accordion>

      <Accordion title="Patrimoine et logement">
        <div className="flex flex-col gap-4 text-ink">
          <MoneyField
            label="Épargne"
            value={profile.savings}
            onChange={(v) => s.setProfile((p) => ({ ...p, savings: v }))}
          />
          <MoneyField
            label="Placements"
            value={profile.investments}
            onChange={(v) => s.setProfile((p) => ({ ...p, investments: v }))}
          />
          {expert && (
            <MoneyField
              label="3e pilier B (valeur)"
              info={<Term k="p3b" />}
              value={profile.pillar3b?.value ?? 0}
              onChange={(v) =>
                s.setProfile((p) => ({
                  ...p,
                  pillar3b:
                    v > 0
                      ? {
                          value: v,
                          annualContribution: p.pillar3b?.annualContribution ?? 0,
                          availableAge: p.pillar3b?.availableAge ?? 65,
                        }
                      : undefined,
                }))
              }
            />
          )}
          <Toggle
            label="Propriétaire"
            checked={!!h}
            onChange={(v) =>
              s.setProfile((p) => ({
                ...p,
                housing: v
                  ? { value: 900_000, mortgage: 500_000, rate: 0.016, kind: 'primary' }
                  : undefined,
              }))
            }
          />
          {h && (
            <>
              <MoneyField
                label="Valeur du bien"
                value={h.value}
                onChange={(v) => s.setProfile((p) => ({ ...p, housing: { ...h, value: v } }))}
              />
              <MoneyField
                label="Hypothèque"
                value={h.mortgage}
                onChange={(v) => s.setProfile((p) => ({ ...p, housing: { ...h, mortgage: v } }))}
              />
              <MoneyField
                label="Taux hypothécaire"
                prefix=""
                suffix="%"
                decimals={2}
                max={15}
                value={h.rate * 100}
                onChange={(v) => s.setProfile((p) => ({ ...p, housing: { ...h, rate: v / 100 } }))}
              />
              <Segmented
                label="Type de bien"
                value={h.kind}
                onChange={(v) => s.setProfile((p) => ({ ...p, housing: { ...h, kind: v } }))}
                options={[
                  { value: 'primary', label: 'Résidence principale' },
                  { value: 'rental', label: 'Locatif' },
                ]}
              />
              {h.kind === 'rental' && (
                <MoneyField
                  label="Loyers encaissés"
                  suffix="/ an"
                  value={h.rentalIncome ?? 0}
                  onChange={(v) =>
                    s.setProfile((p) => ({ ...p, housing: { ...h, rentalIncome: v } }))
                  }
                />
              )}
            </>
          )}
        </div>
      </Accordion>

      <Accordion title="Hypothèses">
        <div className="flex flex-col gap-4 text-ink">
          <Segmented
            label="Paramètres légaux"
            value={String(a.paramYear)}
            onChange={(v) => s.setAssumptions({ paramYear: Number(v) })}
            options={AVAILABLE_YEARS.map((y) => ({ value: String(y), label: String(y) }))}
          />
          <Slider
            label="Inflation"
            value={Math.round(a.inflation * 1000) / 10}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => s.setAssumptions({ inflation: v / 100 })}
            format={(n) => formatPercent(n / 100)}
          />
          <Segmented<ReturnProfile>
            label="Profil de placement"
            value={a.returnProfile}
            onChange={(v) => s.setAssumptions({ returnProfile: v })}
            options={[
              { value: 'prudent', label: `Prudent ${formatPercent(a.returns.prudent)}` },
              { value: 'balanced', label: `Équilibré ${formatPercent(a.returns.balanced)}` },
              { value: 'dynamic', label: `Dynamique ${formatPercent(a.returns.dynamic)}` },
            ]}
          />
          <Slider
            label="Horizon de planification"
            value={a.horizonAge}
            min={85}
            max={100}
            onChange={(v) => s.setAssumptions({ horizonAge: v })}
            format={(n) => `${n} ans`}
          />
          <Toggle
            label="Dépenses −15 % après 80 ans"
            checked={a.spendingDropAfter80Enabled}
            onChange={(v) => s.setAssumptions({ spendingDropAfter80Enabled: v })}
          />
          {expert && (
            <>
              <Slider
                label="Baisse des dépenses à la retraite"
                value={Math.round(a.spendingDropAtRetirement * 100)}
                min={0}
                max={30}
                onChange={(v) => s.setAssumptions({ spendingDropAtRetirement: v / 100 })}
                format={(n) => `${n} %`}
              />
              <Slider
                label="Progression salariale réelle"
                value={Math.round(a.realWageGrowth * 1000) / 10}
                min={0}
                max={2}
                step={0.1}
                onChange={(v) => s.setAssumptions({ realWageGrowth: v / 100 })}
                format={(n) => formatPercent(n / 100)}
              />
            </>
          )}
        </div>
      </Accordion>

      <Button
        variant="ghost"
        className="mt-4 self-start"
        onClick={() => {
          if (window.confirm('Effacer vos chiffres et recommencer ?')) s.restart();
        }}
      >
        Recommencer
      </Button>
    </div>
  );
}
