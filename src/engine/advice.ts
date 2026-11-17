import type { PlanResult } from './cashflow';
import type { CapitalVsAnnuityResult } from './capitalVsAnnuity';
import type { AmortizeAnalysis } from './housing';
import type { Assumptions, PersonKey, Profile } from './profile';
import type { WithdrawalPlan } from './withdrawalOptimizer';

/**
 * Rule-based advice: 4 mandatory cards + up to 3 contextual ones. Each card: icon, 5-word title,
 * one key figure, at most 2 bullets, optional action that changes the scenario.
 */

export type AdviceAction =
  | { type: 'setCapitalShare'; person: PersonKey; value: number }
  | { type: 'addBuyIns'; person: PersonKey; buyIns: Array<{ year: number; amount: number }> }
  | { type: 'setP3aAges'; person: PersonKey; ages: number[] }
  | { type: 'amortize'; year: number; amount: number }
  | { type: 'setRetirementAge'; person: PersonKey; age: number }
  | { type: 'openMap' };

export type AdviceIcon =
  | 'scale'
  | 'inflation'
  | 'hourglass'
  | 'buckets'
  | 'alert'
  | 'piggy'
  | 'calendar'
  | 'home'
  | 'shield'
  | 'globe'
  | 'avs';

export interface AdviceCard {
  id: string;
  mandatory: boolean;
  icon: AdviceIcon;
  title: string;
  keyFigure: {
    value: number;
    unit: 'chf' | 'age' | 'percent' | 'years' | 'chfMonth';
    label: string;
  };
  bullets: string[];
  action?: AdviceAction;
  /** Data for the 3-bucket visual (investment strategy card). */
  buckets?: BucketSplit;
  /** Higher = shown first among contextual cards. */
  priority: number;
}

export interface AdviceInput {
  profile: Profile;
  assumptions: Assumptions;
  plan: PlanResult;
  capital: CapitalVsAnnuityResult | null;
  capitalShare: number;
  withdrawals: WithdrawalPlan;
  housing: { analysis: AmortizeAnalysis; ratioAtRetirement: number } | null;
  buyIn: { amountPerYear: number; years: number[]; saving: number } | null;
  /** Number formatter used inside bullet texts. */
  chf: (n: number) => string;
}

export interface BucketSplit {
  short: number;
  mid: number;
  long: number;
}

/** 3 buckets: short term = 3 years of uncovered needs (≥ emergency fund), mid = 7 more years, long = rest. */
export function splitBuckets(wealth: number, annualGap: number, emergency: number): BucketSplit {
  const w = Math.max(0, wealth);
  const short = Math.min(w, Math.max(emergency, 3 * annualGap));
  const mid = Math.min(w - short, 7 * annualGap);
  return { short, mid, long: w - short - mid };
}

export function buildAdvice(i: AdviceInput): AdviceCard[] {
  const { profile, assumptions: a, plan, chf } = i;
  const s = plan.summary;
  const main = profile.main;
  const retAge = plan.retirements.find((r) => r.person === 'main')?.retirementYear
    ? plan.retirements.find((r) => r.person === 'main')!.retirementYear - main.birthYear
    : main.retirementAge;
  const cards: AdviceCard[] = [];

  // 1. Annuity or capital (mandatory).
  if (i.capital) {
    const c = i.capital;
    const lifeAge = Math.round(65 + a.lifeExpectancy65[main.sex]);
    const be = c.breakEvenAge;
    const favourAnnuity = be !== null && be <= lifeAge;
    cards.push({
      id: 'capital-vs-annuity',
      mandatory: true,
      icon: 'scale',
      priority: 100,
      title: 'Rente ou capital, chiffré',
      keyFigure:
        be !== null
          ? { value: be, unit: 'age', label: 'Âge d’équilibre' }
          : { value: c.netCapital, unit: 'chf', label: 'Capital net' },
      bullets: [
        `Capital restant à 85 ans : ${chf(c.paths.prudent.at85)} à ${chf(c.paths.dynamic.at85)} selon le rendement.`,
        favourAnnuity
          ? `La rente gagne si vous vivez au-delà de ${be} ans. Le mixte limite le risque.`
          : 'Le capital offre souplesse et transmission. Le mixte reste souvent optimal.',
      ],
      action:
        i.capitalShare < 0.5
          ? { type: 'setCapitalShare', person: 'main', value: 0.5 }
          : { type: 'setCapitalShare', person: 'main', value: 0 },
    });
  }

  // 2. Inflation (mandatory).
  const need = s.monthlyNeed;
  const in20 = need / (1 + a.inflation) ** 20;
  cards.push({
    id: 'inflation',
    mandatory: true,
    icon: 'inflation',
    priority: 90,
    title: 'L’inflation grignote votre rente',
    keyFigure: {
      value: in20,
      unit: 'chfMonth',
      label: `Pouvoir d’achat de ${chf(need)} dans 20 ans`,
    },
    bullets: [
      `Avec ${(a.inflation * 100).toLocaleString('fr-CH')} % d’inflation, ${chf(need)} aujourd’hui valent ${chf(in20)} dans 20 ans.`,
      'La rente LPP ne suit pas les prix. Gardez une part indexée.',
    ],
  });

  // 3. Horizon and reserves (mandatory).
  const lifeAge = 65 + a.lifeExpectancy65[main.sex];
  const emergency = a.emergencyMonths * need;
  cards.push({
    id: 'horizon',
    mandatory: true,
    icon: 'hourglass',
    priority: 80,
    title: 'Planifiez plus loin que prévu',
    keyFigure: { value: a.horizonAge, unit: 'age', label: 'Horizon de planification' },
    bullets: [
      `Espérance de vie moyenne : ${lifeAge.toLocaleString('fr-CH', { maximumFractionDigits: 0 })} ans. Une personne sur deux vit plus longtemps.`,
      `Fonds d’urgence conseillé : ${chf(emergency)}, soit ${a.emergencyMonths} mois de dépenses.`,
    ],
  });

  // 4. Buckets (mandatory).
  const retRow =
    plan.rows.find((r) => r.year === s.householdRetirementYear + 1) ??
    plan.rows[plan.rows.length - 1]!;
  const wealth = retRow.financialWealth * retRow.deflator;
  const annualGap = Math.max(
    0,
    (retRow.expenses + retRow.mortgageInterest - retRow.avs - retRow.lppAnnuity - retRow.rental) *
      retRow.deflator,
  );
  const b = splitBuckets(wealth, annualGap, emergency);
  cards.push({
    id: 'buckets',
    buckets: b,
    mandatory: true,
    icon: 'buckets',
    priority: 70,
    title: 'Placez votre épargne par tranches',
    keyFigure: { value: b.long, unit: 'chf', label: 'À placer à long terme' },
    bullets: [
      `Court terme ${chf(b.short)} en liquidités, moyen terme ${chf(b.mid)} en placements équilibrés.`,
      'Long terme au-delà de 10 ans : actions, pour viser plus de rendement.',
    ],
  });

  // Contextual rules.
  const ctx: AdviceCard[] = [];
  if (s.depletionAge !== null) {
    ctx.push({
      id: 'depletion',
      mandatory: false,
      icon: 'alert',
      priority: 100,
      title: 'Patrimoine épuisé trop tôt',
      keyFigure: { value: s.depletionAge, unit: 'age', label: 'Épuisement du patrimoine' },
      bullets: [
        `Il manquerait environ ${chf(s.monthlyGapAfterDepletion)} par mois ensuite.`,
        'Partir plus tard ou réduire les dépenses comble l’écart.',
      ],
      action: {
        type: 'setRetirementAge',
        person: 'main',
        age: Math.min(70, Math.round(retAge) + 1),
      },
    });
  }
  if (i.buyIn && i.buyIn.saving > 0) {
    ctx.push({
      id: 'lpp-buy-in',
      mandatory: false,
      icon: 'piggy',
      priority: 90,
      title: 'Rachat LPP : impôts en moins',
      keyFigure: { value: i.buyIn.saving, unit: 'chf', label: 'Économie d’impôt estimée' },
      bullets: [
        `Racheter ${chf(i.buyIn.amountPerYear)} par an pendant ${i.buyIn.years.length} ans.`,
        'Aucun retrait en capital dans les 3 ans suivant un rachat.',
      ],
      action: {
        type: 'addBuyIns',
        person: 'main',
        buyIns: i.buyIn.years.map((year) => ({ year, amount: i.buyIn!.amountPerYear })),
      },
    });
  }
  if (i.withdrawals.saving > 500) {
    ctx.push({
      id: 'stagger',
      mandatory: false,
      icon: 'calendar',
      priority: 85,
      title: 'Échelonnez vos retraits',
      keyFigure: {
        value: i.withdrawals.saving,
        unit: 'chf',
        label: 'Économie vs tout la même année',
      },
      bullets: [
        'Retirez 3a et capital LPP sur plusieurs années fiscales.',
        'Les retraits d’un couple la même année s’additionnent.',
      ],
    });
  }
  if (main.pillar3a.balance > 0 && main.pillar3a.accounts < 2) {
    ctx.push({
      id: 'p3a-accounts',
      mandatory: false,
      icon: 'piggy',
      priority: 60,
      title: 'Ouvrez un deuxième compte 3a',
      keyFigure: { value: main.pillar3a.accounts, unit: 'years', label: 'Compte 3a aujourd’hui' },
      bullets: [
        'Plusieurs comptes permettent d’étaler les retraits.',
        'Jusqu’à 5 comptes, chacun retiré en une fois.',
      ],
    });
  }
  if (i.housing && i.housing.ratioAtRetirement > 1 / 3) {
    ctx.push({
      id: 'housing',
      mandatory: false,
      icon: 'home',
      priority: 80,
      title: 'Logement : charges trop lourdes',
      keyFigure: {
        value: i.housing.analysis.suggestedAmount,
        unit: 'chf',
        label: 'Amortissement conseillé',
      },
      bullets: [
        `Tenue des charges à la retraite : ${Math.round(i.housing.ratioAtRetirement * 100)} % (max. 33 %).`,
        'Dès 2029, les intérêts du logement ne sont plus déductibles.',
      ],
      ...(i.housing.analysis.suggestedAmount > 0
        ? {
            action: {
              type: 'amortize' as const,
              year: s.retirementYear - 1,
              amount: i.housing.analysis.suggestedAmount,
            },
          }
        : {}),
    });
  }
  if (main.avsMissingYears > 0) {
    ctx.push({
      id: 'avs-gaps',
      mandatory: false,
      icon: 'avs',
      priority: 70,
      title: 'Comblez vos lacunes AVS',
      keyFigure: { value: main.avsMissingYears, unit: 'years', label: 'Années manquantes' },
      bullets: [
        'Chaque année manquante réduit la rente d’environ 1/44.',
        'Les cotisations des 5 dernières années peuvent être rattrapées.',
      ],
    });
  }
  if (retAge < 63) {
    ctx.push({
      id: 'non-employed',
      mandatory: false,
      icon: 'shield',
      priority: 75,
      title: 'Avant 63 ans : cotisez encore',
      keyFigure: {
        value: retRow.contributions.avsNonEmployed * retRow.deflator,
        unit: 'chf',
        label: 'Cotisation AVS de non-actif / an',
      },
      bullets: [
        'Sans activité, vous cotisez à l’AVS jusqu’à l’âge de référence.',
        'Prévoyez un pont de revenus jusqu’à la rente.',
      ],
    });
  }
  if (profile.partner && profile.partner.birthYear - main.birthYear >= 3) {
    ctx.push({
      id: 'survivor',
      mandatory: false,
      icon: 'shield',
      priority: 65,
      title: 'Protégez votre conjoint plus jeune',
      keyFigure: {
        value: a.lppSurvivorRatio * 100,
        unit: 'percent',
        label: 'Rente LPP de survivant',
      },
      bullets: [
        'Le capital retiré ne verse aucune rente de survivant.',
        'Une part en rente sécurise le conjoint.',
      ],
    });
  }
  if (profile.nationality !== 'CH') {
    ctx.push({
      id: 'abroad',
      mandatory: false,
      icon: 'globe',
      priority: 40,
      title: 'Retraite à l’étranger ? Vérifiez',
      keyFigure: { value: 0, unit: 'years', label: 'Voir la carte du monde' },
      bullets: ['L’export des rentes dépend des conventions.', 'Consultez la fiche du pays visé.'],
      action: { type: 'openMap' },
    });
  }

  ctx.sort((x, y) => y.priority - x.priority);
  return [...cards, ...ctx.slice(0, 3)];
}
