import {
  avsAnnualAtAge,
  avsFullMonthly,
  avsNonEmployedContribution,
  avsReferenceAge,
  avsScaleFactor,
  coupleCapFactor,
  estimateRam,
  type AvsPersonInput,
} from './avs';
import { housingTaxItems, secondRankAmortization } from './housing';
import {
  conversionRateAt,
  conversionRateAt65,
  impliedAnnualContribution,
  legalAgeCredit,
  buyBackLockConflicts,
} from './lpp';
import { annuityPayment, indexFactor } from './money';
import type { LegalParams } from './params/types';
import { p3aMaxContribution, splitAccounts } from './pillar3';
import type {
  Assumptions,
  PersonInput,
  PersonKey,
  PersonStrategy,
  Profile,
  Strategy,
} from './profile';
import { capitalWithdrawalTax, incomeTax, wealthTax, type TaxContext } from './tax';

/**
 * Year-by-year plan from today to the horizon. Pure function of (profile, assumptions, strategy,
 * params). All amounts nominal; `deflator` converts to today's francs.
 */

/** Employee social contributions on salary (AVS/AI/APG + AC), modelling assumption ≈ 6.4 %. */
export const EMPLOYEE_SOCIAL_RATE = 0.064;

export type EventKind =
  | 'retirement'
  | 'partial'
  | 'avs'
  | 'p3a'
  | 'lppCapital'
  | 'imputedRentEnd'
  | 'amortization'
  | 'buyIn'
  | 'p3b'
  | 'partnerRetirement'
  | 'depletion';

export interface PlanEvent {
  year: number;
  age: number;
  person: PersonKey;
  kind: EventKind;
  amount?: number;
}

export interface YearRow {
  year: number;
  ages: { main: number; partner?: number };
  deflator: number;
  salary: number;
  netSalary: number;
  avs: number;
  lppAnnuity: number;
  rental: number;
  /** Gross lump sums withdrawn this year. */
  lumpSums: { lpp: number; p3a: number; p3b: number };
  expenses: number;
  taxes: { income: number; wealth: number; capital: number; total: number };
  mortgageInterest: number;
  amortization: number;
  contributions: { p3a: number; p3b: number; buyIns: number; avsNonEmployed: number };
  balances: {
    cash: number;
    investments: number;
    p3a: number;
    p3b: number;
    lpp: number;
    realEstateNet: number;
    mortgage: number;
    realEstate: number;
  };
  financialWealth: number;
  netWorth: number;
  shortfall: number;
  /** Taxable income used for the income tax. */
  taxableIncome: number;
}

export interface PersonRetirement {
  person: PersonKey;
  retirementYear: number;
  lppAssetsAtRetirement: number;
  lppCapital: number;
  lppAnnuity: number;
  conversionRate: number;
  avsMonthly: number;
  avsClaimAge: number;
  avsReferenceAge: number;
}

export interface PlanSummary {
  /** Retirement year of the main person. */
  retirementYear: number;
  /** First year in which every member of the household is retired. */
  householdRetirementYear: number;
  /** Monthly net income in the first retirement year, today's francs (pensions + drawdown − taxes). */
  monthlyNetIncome: number;
  monthlyNeed: number;
  incomeBySource: { avs: number; lpp: number; drawdown: number; rental: number; taxes: number };
  /** Net income at retirement / net income before retirement. */
  replacementRate: number;
  /** Age (main person) at which financial assets no longer cover spending; null = beyond horizon. */
  depletionAge: number | null;
  monthlyGapAfterDepletion: number;
  wealthAt85: number;
  wealthAt95: number;
  financialAt85: number;
  financialAt95: number;
  totalTaxes: number;
  totalTaxesReal: number;
  yearsFunded: number;
  horizonYears: number;
  lockAlerts: Array<{ person: PersonKey; buyInYear: number; withdrawalYear: number }>;
}

export interface PlanResult {
  rows: YearRow[];
  events: PlanEvent[];
  retirements: PersonRetirement[];
  summary: PlanSummary;
}

interface PersonState {
  key: PersonKey;
  input: PersonInput;
  strat: PersonStrategy;
  refAge: number;
  lpp: number;
  lppContribution: number;
  annuity: number;
  partialDone: boolean;
  retired: boolean;
  p3a: number[];
  p3aDone: boolean[];
  avsInput: AvsPersonInput;
  conversion65: number;
  retirement?: PersonRetirement;
}

function initPerson(
  key: PersonKey,
  input: PersonInput,
  strat: PersonStrategy,
  profile: Profile,
  a: Assumptions,
  p: LegalParams,
): PersonState {
  const partnerIncome = key === 'main' ? profile.partner?.grossIncome : profile.main.grossIncome;
  const ram =
    input.ramOverride ??
    estimateRam(input.grossIncome, profile.status === 'married' ? partnerIncome : undefined);
  const age0 = a.startYear - input.birthYear;
  const yearsTo65 = Math.max(0, 65 - age0);
  const lppContribution = input.lpp.projectedAt65
    ? impliedAnnualContribution(
        input.lpp.balance,
        input.lpp.projectedAt65,
        yearsTo65,
        p.lpp.minInterestRate,
      )
    : legalAgeCredit(input.grossIncome, age0, p.lpp);
  return {
    key,
    input,
    strat,
    refAge: avsReferenceAge(input.birthYear, input.sex),
    lpp: input.lpp.balance,
    lppContribution,
    annuity: 0,
    partialDone: false,
    retired: false,
    p3a: splitAccounts(input.pillar3a.balance, input.pillar3a.accounts),
    p3aDone: Array.from({ length: Math.max(1, Math.round(input.pillar3a.accounts)) }, () => false),
    avsInput: {
      ram,
      missingYears: input.avsMissingYears,
      birthYear: input.birthYear,
      sex: input.sex,
      claimAge: strat.avsClaimAge,
    },
    conversion65: conversionRateAt65(input.lpp, p.lpp),
  };
}

export function simulatePlan(
  profile: Profile,
  a: Assumptions,
  strategy: Strategy,
  p: LegalParams,
): PlanResult {
  const r = a.returns[a.returnProfile];
  const people: PersonState[] = [initPerson('main', profile.main, strategy.main, profile, a, p)];
  if (profile.partner && strategy.partner)
    people.push(initPerson('partner', profile.partner, strategy.partner, profile, a, p));

  // Couple cap factor (applies once both pensions are paid).
  let capFactor = 1;
  if (people.length === 2 && profile.status === 'married') {
    const [m, q] = people as [PersonState, PersonState];
    const sA = avsScaleFactor(m.input.avsMissingYears, p.avs),
      sB = avsScaleFactor(q.input.avsMissingYears, p.avs);
    capFactor = coupleCapFactor(
      avsFullMonthly(m.avsInput.ram, p.avs) * sA,
      avsFullMonthly(q.avsInput.ram, p.avs) * sB,
      sA,
      sB,
      p.avs,
    );
  }

  const ctxBase: Omit<TaxContext, 'year'> = {
    canton: profile.canton,
    status: profile.status,
    children: profile.children,
    params: p,
    inflation: a.inflation,
  };
  const main = people[0]!;
  const endYear = main.input.birthYear + a.horizonAge;
  const events: PlanEvent[] = [];
  const rows: YearRow[] = [];

  let cash = profile.savings;
  let investments = profile.investments;
  let p3b = profile.pillar3b?.value ?? 0;
  let p3bDone = !profile.pillar3b;
  const housing = profile.housing ? { ...profile.housing } : undefined;
  let realEstateValue = housing?.value ?? 0;
  const yearsToMainRetirement = Math.max(
    1,
    Math.ceil(main.strat.retirementAge - (a.startYear - main.input.birthYear)),
  );
  const mandatoryAmort = housing
    ? secondRankAmortization(housing.mortgage, housing.value, yearsToMainRetirement, p.housing)
    : 0;
  let imputedEventDone = false;

  for (let year = a.startYear; year <= endYear; year++) {
    const t = year - a.startYear;
    const inflIdx = indexFactor(a.inflation, a.startYear, year);
    const avsIdx = indexFactor(a.inflation, p.meta.year, year);
    const wageIdx = (1 + a.inflation + a.realWageGrowth) ** t;
    const ctx: TaxContext = { ...ctxBase, year };

    // Returns on existing balances.
    cash *= 1 + a.cashReturn;
    const cashYield = (cash * a.cashReturn) / (1 + a.cashReturn);
    const invYield = investments * r;
    investments *= 1 + r;
    p3b *= 1 + r;

    let salary = 0,
      netSalary = 0,
      avs = 0,
      lppAnnuity = 0,
      p3aContrib = 0,
      buyIns = 0,
      avsNonEmployed = 0;
    const lump = { lpp: 0, p3a: 0, p3b: 0 };
    const allReceivingAvs = people.every((s) => year - s.input.birthYear >= s.avsInput.claimAge);

    for (const s of people) {
      const age = year - s.input.birthYear;
      for (let i = 0; i < s.p3a.length; i++) s.p3a[i]! *= 1 + r;
      const partial = s.strat.partial;
      const inPartial = !!partial && age >= partial.fromAge && age < s.strat.retirementAge;
      const working = age < s.strat.retirementAge;
      const workFactor = working ? (inPartial ? partial!.activityRate : 1) : 0;

      // Partial retirement: the share of assets matching the reduced workload retires now.
      if (inPartial && !s.partialDone) {
        s.partialDone = true;
        const share = 1 - partial!.activityRate;
        const assets = s.lpp * share;
        const conv = conversionRateAt(s.conversion65, age, a.earlyConversionCutPerYear);
        const capital =
          assets * Math.min(s.strat.lppCapitalShare, s.input.lpp.maxCapitalShare ?? 1);
        s.annuity += (assets - capital) * conv;
        s.lpp -= assets;
        lump.lpp += capital;
        events.push({ year, age, person: s.key, kind: 'partial', amount: capital });
      }

      // Employment.
      const personSalary = s.input.grossIncome * wageIdx * workFactor;
      salary += personSalary;
      if (working) {
        s.lpp *= 1 + p.lpp.minInterestRate;
        const contrib = s.lppContribution * workFactor;
        s.lpp += contrib;
        netSalary += personSalary * (1 - EMPLOYEE_SOCIAL_RATE) - contrib / 2;
        const max = p3aMaxContribution(true, personSalary, p.pillar3a) * avsIdx;
        const c = Math.min(
          max,
          (s.input.pillar3a.annualContribution ?? max) * (personSalary > 0 ? 1 : 0),
        );
        p3aContrib += c;
        if (s.p3a.length) s.p3a[s.p3a.length - 1]! += c;
      }
      for (const b of strategy.lppBuyIns) {
        if (b.person === s.key && b.year === year && working) {
          s.lpp += b.amount;
          buyIns += b.amount;
          events.push({ year, age, person: s.key, kind: 'buyIn', amount: b.amount });
        }
      }

      // Full retirement.
      if (!working && !s.retired) {
        s.retired = true;
        const conv = conversionRateAt(
          s.conversion65,
          s.strat.retirementAge,
          a.earlyConversionCutPerYear,
        );
        const capital = s.lpp * Math.min(s.strat.lppCapitalShare, s.input.lpp.maxCapitalShare ?? 1);
        const assetsAtRetirement = s.lpp;
        s.annuity += (s.lpp - capital) * conv;
        lump.lpp += capital;
        s.lpp = 0;
        const avsP =
          avsAnnualAtAge(
            s.avsInput,
            Math.max(s.avsInput.claimAge, s.refAge + 5),
            p.avs,
            capFactor,
          ) / 13;
        s.retirement = {
          person: s.key,
          retirementYear: year,
          lppAssetsAtRetirement: assetsAtRetirement,
          lppCapital: capital,
          lppAnnuity: s.annuity,
          conversionRate: conv,
          avsMonthly: avsP,
          avsClaimAge: s.avsInput.claimAge,
          avsReferenceAge: s.refAge,
        };
        events.push({
          year,
          age,
          person: s.key,
          kind: s.key === 'main' ? 'retirement' : 'partnerRetirement',
          amount: capital,
        });
        if (capital > 0)
          events.push({ year, age, person: s.key, kind: 'lppCapital', amount: capital });
      }
      if (s.annuity > 0) lppAnnuity += s.annuity;

      // AVS.
      const personAvs =
        avsAnnualAtAge(s.avsInput, age, p.avs, allReceivingAvs ? capFactor : 1) * avsIdx;
      if (personAvs > 0 && Math.floor(age) === Math.ceil(s.avsInput.claimAge))
        events.push({ year, age, person: s.key, kind: 'avs', amount: personAvs });
      avs += personAvs;

      // Non-employed AVS contributions until the reference age.
      if (!working && age < s.refAge) {
        const share = people.length === 2 ? 0.5 : 1;
        const basis = ((cash + investments + p3b) * share) / avsIdx;
        avsNonEmployed += avsNonEmployedContribution(basis, s.annuity / avsIdx, p.avs) * avsIdx;
      }

      // 3a withdrawals.
      s.strat.p3aWithdrawalAges.forEach((wAge, i) => {
        if (!s.p3aDone[i] && age >= wAge && s.p3a[i] !== undefined) {
          s.p3aDone[i] = true;
          lump.p3a += s.p3a[i]!;
          events.push({ year, age, person: s.key, kind: 'p3a', amount: s.p3a[i]! });
          s.p3a[i] = 0;
        }
      });
    }

    // 3b availability (main person).
    const ageMain = year - main.input.birthYear;
    let p3bContrib = 0;
    if (!p3bDone && profile.pillar3b) {
      if (ageMain >= profile.pillar3b.availableAge) {
        p3bDone = true;
        lump.p3b = p3b;
        investments += p3b;
        events.push({ year, age: ageMain, person: 'main', kind: 'p3b', amount: p3b });
        p3b = 0;
      } else if (ageMain < main.strat.retirementAge) {
        p3bContrib = profile.pillar3b.annualContribution * inflIdx;
        p3b += p3bContrib;
      }
    }

    // Housing.
    let mortgageInterest = 0,
      amortization = 0,
      rental = 0;
    let housingIncome = 0,
      housingDeduction = 0;
    if (housing) {
      realEstateValue = housing.value * inflIdx;
      mortgageInterest = housing.mortgage * housing.rate;
      const items = housingTaxItems(
        { ...housing, value: realEstateValue },
        year,
        a.imputedRentRate,
        p.housing,
      );
      housingIncome = items.addedIncome;
      housingDeduction = items.deduction;
      if (housing.kind === 'rental') rental = items.addedIncome;
      if (
        housing.kind === 'primary' &&
        year === p.housing.imputedRentAbolishedFrom &&
        !imputedEventDone
      ) {
        imputedEventDone = true;
        events.push({ year, age: ageMain, person: 'main', kind: 'imputedRentEnd' });
      }
      if (ageMain < main.strat.retirementAge)
        amortization += Math.min(
          mandatoryAmort,
          Math.max(0, housing.mortgage - housing.value * p.housing.firstRankLtv),
        );
      if (strategy.amortization && strategy.amortization.year === year) {
        amortization += strategy.amortization.amount;
        events.push({
          year,
          age: ageMain,
          person: 'main',
          kind: 'amortization',
          amount: strategy.amortization.amount,
        });
      }
      amortization = Math.min(amortization, housing.mortgage);
      housing.mortgage -= amortization;
    }

    // Expenses.
    const mainRetired = ageMain >= main.strat.retirementAge;
    let expenses = profile.monthlyExpenses * 12 * inflIdx;
    if (mainRetired) expenses *= 1 - a.spendingDropAtRetirement;
    if (a.spendingDropAfter80Enabled && ageMain >= 80) expenses *= 1 - a.spendingDropAfter80;

    // Taxes.
    const pensionIncome = avs + lppAnnuity;
    const taxableYield = cashYield + invYield * a.taxableYieldShare;
    const taxableIncome = Math.max(
      0,
      salary * (1 - a.employeeDeductionRate) -
        p3aContrib -
        buyIns +
        pensionIncome * (1 - a.retireeDeductionRate) +
        taxableYield +
        housingIncome -
        housingDeduction,
    );
    const incTax = incomeTax(taxableIncome, ctx).total;
    const p3aTotal = people.reduce((s, x) => s + x.p3a.reduce((u, v) => u + v, 0), 0);
    const taxableWealth = Math.max(
      0,
      cash +
        investments +
        p3b +
        realEstateValue * a.realEstateTaxValueRatio -
        (housing?.mortgage ?? 0),
    );
    const wTax = wealthTax(taxableWealth, ctx);
    const capTax = capitalWithdrawalTax(lump.lpp + lump.p3a, ctx).total;

    // Cash flow.
    investments += lump.lpp + lump.p3a - capTax;
    const net =
      netSalary +
      pensionIncome +
      rental -
      expenses -
      incTax -
      wTax -
      mortgageInterest -
      amortization -
      p3aContrib -
      buyIns -
      p3bContrib -
      avsNonEmployed;
    let shortfall = 0;
    if (net >= 0) {
      cash += net;
      const target = a.emergencyMonths * (expenses / 12);
      if (cash > target) {
        investments += cash - target;
        cash = target;
      }
    } else {
      let need = -net;
      const fromCash = Math.min(cash, need);
      cash -= fromCash;
      need -= fromCash;
      const fromInv = Math.min(investments, need);
      investments -= fromInv;
      need -= fromInv;
      const from3b = Math.min(p3b, need);
      p3b -= from3b;
      need -= from3b;
      shortfall = need;
    }

    const lppTotal = people.reduce((s, x) => s + x.lpp, 0);
    const realEstateNet = housing ? realEstateValue - housing.mortgage : 0;
    const financialWealth = cash + investments + p3b + p3aTotal;
    rows.push({
      year,
      ages: { main: ageMain, ...(people[1] ? { partner: year - people[1].input.birthYear } : {}) },
      deflator: 1 / inflIdx,
      salary,
      netSalary,
      avs,
      lppAnnuity,
      rental,
      lumpSums: lump,
      expenses,
      taxes: { income: incTax, wealth: wTax, capital: capTax, total: incTax + wTax + capTax },
      mortgageInterest,
      amortization,
      contributions: { p3a: p3aContrib, p3b: p3bContrib, buyIns, avsNonEmployed },
      balances: {
        cash,
        investments,
        p3a: p3aTotal,
        p3b,
        lpp: lppTotal,
        realEstateNet,
        mortgage: housing?.mortgage ?? 0,
        realEstate: housing ? realEstateValue : 0,
      },
      financialWealth,
      netWorth: financialWealth + lppTotal + realEstateNet,
      shortfall,
      taxableIncome,
    });
  }

  const summary = summarize(rows, people, a, strategy, p, events);
  if (summary.depletionAge !== null) {
    const row = rows.find((x) => x.ages.main === summary.depletionAge);
    if (row)
      events.push({ year: row.year, age: summary.depletionAge, person: 'main', kind: 'depletion' });
  }
  events.sort((x, y) => x.year - y.year);
  return {
    rows,
    events,
    retirements: people.flatMap((s) => (s.retirement ? [s.retirement] : [])),
    summary,
  };
}

function summarize(
  rows: YearRow[],
  people: PersonState[],
  a: Assumptions,
  strategy: Strategy,
  p: LegalParams,
  events: PlanEvent[],
): PlanSummary {
  const main = people[0]!;
  const retYear = main.retirement?.retirementYear ?? rows[rows.length - 1]!.year;
  const retIdx = Math.max(
    0,
    rows.findIndex((x) => x.year === retYear),
  );
  const householdRetYear = Math.max(
    retYear,
    ...people.map((x) => x.retirement?.retirementYear ?? retYear),
  );
  const hhIdx = Math.max(
    0,
    rows.findIndex((x) => x.year === householdRetYear),
  );
  // First "steady" retirement year: one year after the last lump sums (avoids counting them as income).
  const steady = rows[Math.min(rows.length - 1, hhIdx + 1)]!;
  const before = rows[Math.max(0, retIdx - 1)]!;
  const r = a.returns[a.returnProfile];
  const yearsLeft = Math.max(1, a.horizonAge - steady.ages.main);
  const drawable =
    Math.max(0, steady.balances.cash - (a.emergencyMonths * steady.expenses) / 12) +
    steady.balances.investments +
    steady.balances.p3b +
    steady.balances.p3a;
  const drawdown = annuityPayment(drawable, r, yearsLeft);
  const recurringTaxes = steady.taxes.income + steady.taxes.wealth;
  const d = steady.deflator;
  const monthly = (v: number) => (v * d) / 12;
  const net = steady.avs + steady.lppAnnuity + steady.rental + drawdown - recurringTaxes;
  const beforeNet =
    before.netSalary +
    before.avs +
    before.lppAnnuity +
    before.rental -
    before.taxes.income -
    before.taxes.wealth;
  const replacementRate =
    beforeNet > 0 ? (net * steady.deflator) / (beforeNet * before.deflator) : 0;

  const depletionRow = rows.find((x) => x.shortfall > 1);
  const depletionAge = depletionRow ? depletionRow.ages.main : null;
  const after = rows.filter((x) => x.shortfall > 1);
  const gap = after.length
    ? after.reduce((s, x) => s + x.shortfall * x.deflator, 0) / after.length / 12
    : 0;
  const at = (age: number) => rows.find((x) => x.ages.main === age) ?? rows[rows.length - 1]!;
  const real = (row: YearRow, v: number) => v * row.deflator;
  const totalTaxes = rows.reduce((s, x) => s + x.taxes.total, 0);
  const totalTaxesReal = rows.reduce((s, x) => s + x.taxes.total * x.deflator, 0);
  const retiredRows = rows.filter((x) => x.year >= retYear);
  const funded = retiredRows.filter((x) => x.shortfall <= 1).length;

  const lockAlerts: PlanSummary['lockAlerts'] = [];
  for (const s of people) {
    const buyIns = strategy.lppBuyIns
      .filter((b) => b.person === s.key)
      .map((b) => ({ year: b.year, amount: b.amount }));
    const own = events
      .filter(
        (e) =>
          e.person === s.key &&
          (e.kind === 'lppCapital' || e.kind === 'partial') &&
          (e.amount ?? 0) > 0,
      )
      .map((e) => ({ year: e.year, amount: e.amount ?? 0 }));
    for (const c of buyBackLockConflicts(buyIns, own, p.lpp))
      lockAlerts.push({
        person: s.key,
        buyInYear: c.buyIn.year,
        withdrawalYear: c.withdrawal.year,
      });
  }

  return {
    retirementYear: retYear,
    householdRetirementYear: householdRetYear,
    monthlyNetIncome: monthly(net),
    monthlyNeed: monthly(steady.expenses + steady.mortgageInterest),
    incomeBySource: {
      avs: monthly(steady.avs),
      lpp: monthly(steady.lppAnnuity),
      drawdown: monthly(drawdown),
      rental: monthly(steady.rental),
      taxes: monthly(recurringTaxes),
    },
    replacementRate,
    depletionAge,
    monthlyGapAfterDepletion: gap,
    wealthAt85: real(at(85), at(85).netWorth),
    wealthAt95: real(at(95), at(95).netWorth),
    financialAt85: real(at(85), at(85).financialWealth),
    financialAt95: real(at(95), at(95).financialWealth),
    totalTaxes,
    totalTaxesReal,
    yearsFunded: funded,
    horizonYears: retiredRows.length,
    lockAlerts,
  };
}
