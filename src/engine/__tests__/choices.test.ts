import { describe, expect, it } from 'vitest';
import { applyAdviceAction, buildStrategy, DEFAULT_CHOICES } from '../choices';
import { EXAMPLE_PROFILE } from '../example';
import { getParams } from '../params';

const p = getParams(2027);

describe('Choices → strategy', () => {
  it('uses the desired retirement age by default', () => {
    const s = buildStrategy(EXAMPLE_PROFILE, DEFAULT_CHOICES, p);
    expect(s.main.retirementAge).toBe(65);
    expect(s.main.lppCapitalShare).toBe(0);
    expect(s.partner?.lppCapitalShare).toBe(0);
    expect(s.amortization).toBeUndefined();
  });
  it('applies a scenario and overrides', () => {
    const s = buildStrategy(
      EXAMPLE_PROFILE,
      {
        ...DEFAULT_CHOICES,
        scenario: 'early',
        capitalShare: 0.4,
        avsClaimAge: 65,
        p3aAges: [61, 62],
        amortization: { year: 2030, amount: 1000 },
      },
      p,
    );
    expect(s.main.retirementAge).toBe(63);
    expect(s.main.avsClaimAge).toBe(65);
    expect(s.main.lppCapitalShare).toBe(0.4);
    expect(s.main.p3aWithdrawalAges).toEqual([61, 62]);
    expect(s.amortization).toEqual({ year: 2030, amount: 1000 });
    // p3a override ignored when the number of accounts differs
    expect(
      buildStrategy(EXAMPLE_PROFILE, { ...DEFAULT_CHOICES, p3aAges: [60] }, p).main
        .p3aWithdrawalAges,
    ).toHaveLength(2);
  });
  it('applies advice actions', () => {
    const c = DEFAULT_CHOICES;
    const P = EXAMPLE_PROFILE;
    expect(
      applyAdviceAction(P, c, { type: 'setCapitalShare', person: 'main', value: 0.5 }).choices
        .capitalShare,
    ).toBe(0.5);
    expect(
      applyAdviceAction(P, c, { type: 'setCapitalShare', person: 'partner', value: 0.3 }).choices
        .partnerCapitalShare,
    ).toBe(0.3);
    const bi = applyAdviceAction(P, c, {
      type: 'addBuyIns',
      person: 'main',
      buyIns: [{ year: 2028, amount: 30_000 }],
    }).choices.buyIns;
    expect(bi).toEqual([{ year: 2028, amount: 30_000, person: 'main' }]);
    expect(
      applyAdviceAction(P, c, { type: 'setP3aAges', person: 'main', ages: [60, 61] }).choices
        .p3aAges,
    ).toEqual([60, 61]);
    expect(
      applyAdviceAction(P, c, { type: 'setP3aAges', person: 'partner', ages: [60] }).choices,
    ).toBe(c);
    expect(
      applyAdviceAction(P, c, { type: 'amortize', year: 2030, amount: 100_000 }).choices
        .amortization,
    ).toEqual({ year: 2030, amount: 100_000 });
    const r = applyAdviceAction(
      P,
      { ...c, scenario: 'early' },
      { type: 'setRetirementAge', person: 'main', age: 66 },
    );
    expect(r.profile.main.retirementAge).toBe(66);
    expect(r.choices.scenario).toBeNull();
    expect(
      applyAdviceAction(P, c, { type: 'setRetirementAge', person: 'partner', age: 66 }).profile,
    ).toBe(P);
    expect(applyAdviceAction(P, c, { type: 'openMap' }).choices).toBe(c);
  });
});
