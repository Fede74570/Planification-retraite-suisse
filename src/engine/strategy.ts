import { avsReferenceAge } from './avs';
import type { LegalParams } from './params/types';
import { defaultStaggeredAges } from './pillar3';
import type { PersonInput, PersonStrategy, Profile, Strategy } from './profile';

/** Default decisions for a person: retire at the desired age, AVS at the same age (63..70), full annuity, staggered 3a. */
export function defaultPersonStrategy(
  person: PersonInput,
  p: LegalParams,
  overrides: Partial<PersonStrategy> = {},
): PersonStrategy {
  const ref = avsReferenceAge(person.birthYear, person.sex);
  const retirementAge = overrides.retirementAge ?? person.retirementAge;
  const avsClaimAge =
    overrides.avsClaimAge ?? Math.min(70, Math.max(p.avs.earliestAge, retirementAge));
  return {
    retirementAge,
    avsClaimAge,
    lppCapitalShare: overrides.lppCapitalShare ?? 0,
    p3aWithdrawalAges:
      overrides.p3aWithdrawalAges ??
      defaultStaggeredAges(person.pillar3a.accounts, Math.min(retirementAge, ref), ref, p.pillar3a),
    ...(overrides.partial ? { partial: overrides.partial } : {}),
  };
}

export function defaultStrategy(profile: Profile, p: LegalParams): Strategy {
  return {
    main: defaultPersonStrategy(profile.main, p),
    ...(profile.partner ? { partner: defaultPersonStrategy(profile.partner, p) } : {}),
    lppBuyIns: [],
  };
}
