import type { AdviceAction } from './advice';
import type { LegalParams } from './params/types';
import type { Profile, Strategy } from './profile';
import { scenarioStrategies, type ScenarioId } from './scenarios';
import { defaultStrategy } from './strategy';

/**
 * User decisions made in the report (scenario, rente/capital slider, advice applied…), kept
 * separate from the profile so that they serialise compactly in the URL.
 */
export interface Choices {
  /** Selected timing scenario; null = the desired retirement age entered in the profile. */
  scenario: ScenarioId | null;
  /** Share of the main person's LPP assets taken as capital (0..1). */
  capitalShare: number;
  partnerCapitalShare: number;
  /** AVS claim age override for the main person (null = follows the retirement age). */
  avsClaimAge: number | null;
  buyIns: Strategy['lppBuyIns'];
  amortization: Strategy['amortization'] | null;
  /** 3a withdrawal ages override for the main person. */
  p3aAges: number[] | null;
}

export const DEFAULT_CHOICES: Choices = {
  scenario: null,
  capitalShare: 0,
  partnerCapitalShare: 0,
  avsClaimAge: null,
  buyIns: [],
  amortization: null,
  p3aAges: null,
};

/** Builds the engine strategy from the profile and the user's choices. */
export function buildStrategy(profile: Profile, c: Choices, p: LegalParams): Strategy {
  const base = defaultStrategy(profile, p);
  const s: Strategy = c.scenario ? scenarioStrategies(profile, p, base)[c.scenario] : base;
  const main = { ...s.main, lppCapitalShare: c.capitalShare };
  if (c.avsClaimAge !== null) main.avsClaimAge = c.avsClaimAge;
  if (c.p3aAges && c.p3aAges.length === main.p3aWithdrawalAges.length)
    main.p3aWithdrawalAges = c.p3aAges;
  return {
    main,
    ...(s.partner ? { partner: { ...s.partner, lppCapitalShare: c.partnerCapitalShare } } : {}),
    lppBuyIns: c.buyIns,
    ...(c.amortization ? { amortization: c.amortization } : {}),
  };
}

/** Applies an advice card action. Returns the new choices and profile (unchanged objects if not applicable). */
export function applyAdviceAction(
  profile: Profile,
  c: Choices,
  action: AdviceAction,
): { profile: Profile; choices: Choices } {
  switch (action.type) {
    case 'setCapitalShare':
      return {
        profile,
        choices:
          action.person === 'main'
            ? { ...c, capitalShare: action.value }
            : { ...c, partnerCapitalShare: action.value },
      };
    case 'addBuyIns':
      return {
        profile,
        choices: {
          ...c,
          buyIns: [
            ...c.buyIns.filter((b) => b.person !== action.person),
            ...action.buyIns.map((b) => ({ ...b, person: action.person })),
          ],
        },
      };
    case 'setP3aAges':
      return { profile, choices: action.person === 'main' ? { ...c, p3aAges: action.ages } : c };
    case 'amortize':
      return {
        profile,
        choices: { ...c, amortization: { year: action.year, amount: action.amount } },
      };
    case 'setRetirementAge':
      return action.person === 'main'
        ? {
            profile: { ...profile, main: { ...profile.main, retirementAge: action.age } },
            choices: { ...c, scenario: null, avsClaimAge: null, p3aAges: null },
          }
        : { profile, choices: c };
    case 'openMap':
      return { profile, choices: c };
  }
}
