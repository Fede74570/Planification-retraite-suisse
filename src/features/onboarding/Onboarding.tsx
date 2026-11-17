import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Marmot } from '@/components/brand/Marmot';
import {
  Button,
  MoneyField,
  Segmented,
  SelectField,
  Slider,
  Stepper,
  Term,
  Toggle,
} from '@/components/ui';
import { CANTON_NAMES } from '@/engine/params/cantons';
import { CANTON_CODES, type CantonCode } from '@/engine/profile';
import { formatCHF } from '@/lib/format';
import { spring } from '@/lib/motion';
import { useApp } from '@/state/store';
import { CertificateIllustration } from './CertificateIllustration';

const STEPS = ['Vous', 'Revenus', 'Prévoyance', 'Patrimoine'] as const;
const CANTON_OPTIONS = CANTON_CODES.map((c) => ({
  value: c,
  label: `${CANTON_NAMES[c]} (${c})`,
})).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
const yearsLabel = (n: number) => `${n} an${n > 1 ? 's' : ''}`;

/** 4 screens, one question each, every field pre-filled: ≤ 90 seconds to a report. */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const loadExample = useApp((s) => s.loadExample);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Focus the first field on devices with a keyboard; the heading otherwise (no surprise keyboard on mobile).
    const fine = window.matchMedia('(pointer: fine)').matches;
    const first = document.querySelector<HTMLElement>(
      '[data-step-body] input, [data-step-body] select, [data-step-body] button[role="radio"][aria-checked="true"]',
    );
    (fine && first ? first : titleRef.current)?.focus({ preventScroll: true });
  }, [step]);

  const go = (d: number) => {
    setDir(d);
    if (step + d >= STEPS.length) onDone();
    else setStep(Math.max(0, step + d));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="pt-safe mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-4 py-4">
        <Logo height={40} />
        <span className="text-xs font-semibold text-ink-muted tabular">
          Étape {step + 1}/{STEPS.length}
        </span>
      </header>
      <div className="mx-auto w-full max-w-xl px-4" aria-hidden="true">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <m.div
                className="h-full origin-left rounded-full bg-accent"
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                transition={spring}
              />
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-6 pb-32">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <m.section
            key={step}
            custom={dir}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
            transition={reduce ? { duration: 0.1 } : spring}
            aria-labelledby="step-title"
            className="flex flex-col gap-6"
          >
            {step === 0 && (
              <StepYou
                titleRef={titleRef}
                onExample={() => {
                  loadExample();
                  onDone();
                }}
              />
            )}
            {step === 1 && <StepIncome titleRef={titleRef} />}
            {step === 2 && <StepPension titleRef={titleRef} />}
            {step === 3 && <StepWealth titleRef={titleRef} />}
          </m.section>
        </AnimatePresence>
      </main>

      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 backdrop-blur"
        aria-label="Navigation de l’onboarding"
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={() => go(-1)} disabled={step === 0}>
            Retour
          </Button>
          <Button size="lg" onClick={() => go(1)} className="flex-1 sm:flex-none">
            {step === STEPS.length - 1 ? 'Voir mon rapport' : 'Continuer'}
          </Button>
        </div>
      </nav>
    </div>
  );
}

function StepTitle({
  titleRef,
  children,
  sub,
}: {
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div>
      <h1 id="step-title" ref={titleRef} tabIndex={-1} className="m-0 text-2xl outline-none">
        {children}
      </h1>
      {sub && <p className="m-0 mt-2 text-ink-muted">{sub}</p>}
    </div>
  );
}

type StepProps = { titleRef: React.RefObject<HTMLHeadingElement | null> };

function StepYou({ titleRef, onExample }: StepProps & { onExample: () => void }) {
  const { profile, setMain, setPartner, setProfile } = useApp();
  const married = profile.status === 'married';
  return (
    <>
      <div className="flex items-end gap-4">
        <Marmot size={96} waving title="La marmotte vous salue" />
        <StepTitle titleRef={titleRef} sub="Quelques questions, puis votre rapport.">
          Faisons connaissance
        </StepTitle>
      </div>
      <div data-step-body className="flex flex-col gap-5">
        <Stepper
          label="Année de naissance"
          value={profile.main.birthYear}
          min={1945}
          max={1990}
          onChange={(v) => setMain({ birthYear: v })}
        />
        <Segmented
          label="Sexe"
          value={profile.main.sex}
          onChange={(v) => setMain({ sex: v })}
          options={[
            { value: 'f', label: 'Femme' },
            { value: 'm', label: 'Homme' },
          ]}
        />
        <Segmented
          label="État civil"
          value={profile.status}
          onChange={(v) => {
            setProfile((p) => ({
              ...p,
              status: v,
              ...(v === 'single' ? { partner: undefined } : {}),
            }));
            if (v === 'married') setPartner({});
          }}
          options={[
            { value: 'single', label: 'Seul·e' },
            { value: 'married', label: 'Marié·e' },
          ]}
        />
        {married && profile.partner && (
          <div className="flex flex-col gap-4 rounded-card bg-sunken p-4">
            <Stepper
              label="Naissance du conjoint"
              value={profile.partner.birthYear}
              min={1945}
              max={1995}
              onChange={(v) => setPartner({ birthYear: v })}
            />
            <MoneyField
              label="Revenu brut du conjoint"
              suffix="/ an"
              value={profile.partner.grossIncome}
              onChange={(v) => setPartner({ grossIncome: v })}
            />
          </div>
        )}
        <SelectField<CantonCode>
          label="Canton de domicile"
          value={profile.canton}
          onChange={(v) => setProfile((p) => ({ ...p, canton: v }))}
          options={CANTON_OPTIONS}
        />
        <Segmented
          label="Nationalité"
          value={profile.nationality}
          onChange={(v) => setProfile((p) => ({ ...p, nationality: v }))}
          options={[
            { value: 'CH', label: 'Suisse' },
            { value: 'EU_EFTA', label: 'UE / AELE' },
            { value: 'OTHER', label: 'Autre' },
          ]}
        />
      </div>
      <button
        type="button"
        onClick={onExample}
        className="min-h-11 self-start text-sm font-semibold text-accent underline-offset-4 hover:underline"
      >
        Essayer avec un exemple (Marc et Sophie) →
      </button>
    </>
  );
}

function StepIncome({ titleRef }: StepProps) {
  const { profile, setMain, setProfile } = useApp();
  const household = profile.main.grossIncome + (profile.partner?.grossIncome ?? 0);
  // "Je ne sais pas": 80 % of an estimated net income (≈ 75 % of gross after social charges and taxes).
  const estimate = Math.round((household * 0.75 * 0.8) / 12 / 100) * 100;
  return (
    <>
      <StepTitle titleRef={titleRef} sub="Votre salaire aujourd’hui et ce que vous dépensez.">
        Vos revenus et dépenses
      </StepTitle>
      <div data-step-body className="flex flex-col gap-5">
        <MoneyField
          label="Votre revenu brut annuel"
          suffix="/ an"
          value={profile.main.grossIncome}
          onChange={(v) => setMain({ grossIncome: v })}
        />
        <MoneyField
          label="Dépenses du ménage"
          suffix="/ mois"
          value={profile.monthlyExpenses}
          onChange={(v) => setProfile((p) => ({ ...p, monthlyExpenses: v }))}
          hint="Hors impôts et intérêts hypothécaires."
        />
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => setProfile((p) => ({ ...p, monthlyExpenses: estimate }))}
        >
          Je ne sais pas : estimer à {formatCHF(estimate)}
        </Button>
      </div>
    </>
  );
}

function StepPension({ titleRef }: StepProps) {
  const { profile, setMain, setPartner } = useApp();
  const lpp = profile.main.lpp;
  return (
    <>
      <StepTitle
        titleRef={titleRef}
        sub={
          <>
            Les chiffres figurent sur votre{' '}
            <span className="inline-flex items-center gap-1">
              certificat de prévoyance <Term k="certificate" />
            </span>
            .
          </>
        }
      >
        Votre prévoyance
      </StepTitle>
      <CertificateIllustration />
      <div data-step-body className="flex flex-col gap-5">
        <MoneyField
          label="Avoir LPP actuel"
          value={lpp.balance}
          onChange={(v) => setMain({ lpp: { ...lpp, balance: v } })}
        />
        <MoneyField
          label="Avoir projeté à 65 ans"
          hint="Facultatif : laissez 0 si absent."
          value={lpp.projectedAt65 ?? 0}
          onChange={(v) => setMain({ lpp: { ...lpp, projectedAt65: v || undefined } })}
        />
        <MoneyField
          label="Rente projetée à 65 ans"
          suffix="/ an"
          info={<Term k="conversion" />}
          value={lpp.projectedAnnuityAt65 ?? 0}
          onChange={(v) => setMain({ lpp: { ...lpp, projectedAnnuityAt65: v || undefined } })}
        />
        <MoneyField
          label="Potentiel de rachat LPP"
          info={<Term k="buyIn" />}
          value={lpp.buyInPotential}
          onChange={(v) => setMain({ lpp: { ...lpp, buyInPotential: v } })}
        />
        <MoneyField
          label="Total 3e pilier A"
          info={<Term k="p3a" />}
          value={profile.main.pillar3a.balance}
          onChange={(v) => setMain({ pillar3a: { ...profile.main.pillar3a, balance: v } })}
        />
        <Stepper
          label={
            <span className="inline-flex items-center gap-1.5">
              Années AVS manquantes <Term k="avsGap" />
            </span>
          }
          value={profile.main.avsMissingYears}
          min={0}
          max={44}
          onChange={(v) => setMain({ avsMissingYears: v })}
          format={yearsLabel}
        />
        {profile.partner && (
          <div className="flex flex-col gap-4 rounded-card bg-sunken p-4">
            <p className="m-0 text-sm font-semibold">Votre conjoint</p>
            <MoneyField
              label="Avoir LPP du conjoint"
              value={profile.partner.lpp.balance}
              onChange={(v) => setPartner({ lpp: { ...profile.partner!.lpp, balance: v } })}
            />
            <MoneyField
              label="3e pilier A du conjoint"
              value={profile.partner.pillar3a.balance}
              onChange={(v) =>
                setPartner({ pillar3a: { ...profile.partner!.pillar3a, balance: v } })
              }
            />
          </div>
        )}
      </div>
    </>
  );
}

function StepWealth({ titleRef }: StepProps) {
  const { profile, setMain, setProfile } = useApp();
  const h = profile.housing;
  return (
    <>
      <StepTitle
        titleRef={titleRef}
        sub="Votre épargne, votre logement et quand vous aimeriez partir."
      >
        Votre patrimoine
      </StepTitle>
      <div data-step-body className="flex flex-col gap-5">
        <MoneyField
          label="Épargne (comptes)"
          value={profile.savings}
          onChange={(v) => setProfile((p) => ({ ...p, savings: v }))}
        />
        <MoneyField
          label="Placements (titres, fonds)"
          value={profile.investments}
          onChange={(v) => setProfile((p) => ({ ...p, investments: v }))}
        />
        <Toggle
          label="Je suis propriétaire"
          checked={!!h}
          onChange={(v) =>
            setProfile((p) => ({
              ...p,
              housing: v
                ? { value: 900_000, mortgage: 500_000, rate: 0.016, kind: 'primary' }
                : undefined,
            }))
          }
        />
        {h && (
          <div className="flex flex-col gap-4 rounded-card bg-sunken p-4">
            <MoneyField
              label="Valeur du bien"
              value={h.value}
              onChange={(v) => setProfile((p) => ({ ...p, housing: { ...h, value: v } }))}
            />
            <MoneyField
              label="Hypothèque"
              value={h.mortgage}
              onChange={(v) => setProfile((p) => ({ ...p, housing: { ...h, mortgage: v } }))}
            />
            <MoneyField
              label="Taux hypothécaire"
              prefix=""
              suffix="%"
              decimals={2}
              max={15}
              value={h.rate * 100}
              onChange={(v) => setProfile((p) => ({ ...p, housing: { ...h, rate: v / 100 } }))}
            />
            <Segmented
              label="Type de bien"
              value={h.kind}
              onChange={(v) => setProfile((p) => ({ ...p, housing: { ...h, kind: v } }))}
              options={[
                { value: 'primary', label: 'Résidence principale' },
                { value: 'rental', label: 'Locatif' },
              ]}
            />
          </div>
        )}
        <Slider
          label="Âge de retraite souhaité"
          value={profile.main.retirementAge}
          min={58}
          max={70}
          onChange={(v) => setMain({ retirementAge: v })}
          format={(n) => `${n} ans`}
          marks={[58, 63, 65, 67, 70]}
        />
      </div>
    </>
  );
}
