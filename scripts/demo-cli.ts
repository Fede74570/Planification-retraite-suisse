// Demo: full engine report for the « Marc et Sophie » profile, printed as console tables.
// Usage: npm run demo   (runs through Vite's TS loader via vite-node)
import { computeReport, DEFAULT_ASSUMPTIONS, EXAMPLE_PROFILE } from '../src/engine';
import { formatCHF, formatPercent } from '../src/lib/format';

const t0 = performance.now();
const report = computeReport(EXAMPLE_PROFILE, DEFAULT_ASSUMPTIONS, undefined, formatCHF);
const ms = performance.now() - t0;
const s = report.plan.summary;
const chf = (n: number) => formatCHF(n);

console.log(
  `\n=== Ma retraite Franco-Suisse — « Marc et Sophie » (VD) — paramètres ${report.params.meta.year} ===`,
);
console.log(`Calcul complet : ${ms.toFixed(1)} ms\n`);

console.log('— Synthèse (francs d’aujourd’hui)');
console.table({
  'Revenu net / mois à la retraite': chf(s.monthlyNetIncome),
  'Besoin / mois': chf(s.monthlyNeed),
  'Taux de remplacement (net)': formatPercent(s.replacementRate),
  'Patrimoine tient jusqu’à':
    s.depletionAge === null
      ? `au-delà de ${DEFAULT_ASSUMPTIONS.horizonAge} ans`
      : `${s.depletionAge} ans`,
  'Patrimoine net à 85 ans': chf(s.wealthAt85),
  'Patrimoine net à 95 ans': chf(s.wealthAt95),
  'Impôts cumulés (réels)': chf(s.totalTaxesReal),
});

console.log('— Revenu mensuel à la retraite par source');
console.table(Object.fromEntries(Object.entries(s.incomeBySource).map(([k, v]) => [k, chf(v)])));

console.log('— Départs à la retraite');
console.table(
  report.plan.retirements.map((r) => ({
    personne: r.person,
    année: r.retirementYear,
    'avoir LPP': chf(r.lppAssetsAtRetirement),
    'taux conv.': formatPercent(r.conversionRate),
    'rente LPP / an': chf(r.lppAnnuity),
    'capital LPP': chf(r.lppCapital),
    'AVS / mois (base)': chf(r.avsMonthly),
    'âge AVS': r.avsClaimAge,
  })),
);

console.log('— Quand partir ? (scénarios)');
console.table(
  report.scenarios.map((x) => ({
    scénario: x.id + (x.id === report.bestScenario ? ' ★' : ''),
    âge: x.retirementAge,
    'net / mois': chf(x.kpis.monthlyNetIncome),
    remplacement: formatPercent(x.kpis.replacementRate),
    'impôts cumulés': chf(x.kpis.totalTaxesReal),
    'patrimoine 85': chf(x.kpis.wealthAt85),
    'patrimoine 95': chf(x.kpis.wealthAt95),
    épuisement: x.kpis.depletionAge ?? '—',
  })),
);

if (report.capitalVsAnnuity) {
  const c = report.capitalVsAnnuity;
  console.log('— Rente ou capital (Marc)');
  console.table({
    'Impôt sur le capital': chf(c.capitalTax),
    'Capital net': chf(c.netCapital),
    'Rente nette an 1': chf(c.firstYearNetAnnuity),
    'Âge d’équilibre': c.breakEvenAge ?? '—',
    'Épuisement prudent / équilibré / dynamique': `${c.paths.prudent.exhaustionAge ?? '—'} / ${c.paths.balanced.exhaustionAge ?? '—'} / ${c.paths.dynamic.exhaustionAge ?? '—'}`,
    'Capital restant à 85 (équilibré)': chf(c.paths.balanced.at85),
    'Capital restant à 95 (équilibré)': chf(c.paths.balanced.at95),
  });
}

console.log('— Impôts : échelonnement des retraits');
console.table(
  report.withdrawalItems.map((it) => ({
    retrait: `${it.id}`,
    montant: chf(it.amount),
    'année optimale': report.withdrawals.schedule.find((x) => x.id === it.id)?.year,
  })),
);
console.table({
  'Tout la même année': chf(report.withdrawals.sameYearTax),
  Échelonné: chf(report.withdrawals.totalTax),
  Économie: chf(report.withdrawals.saving),
  Méthode: report.withdrawals.method,
});
if (report.buyIn)
  console.log(
    `Rachat LPP : ${chf(report.buyIn.amountPerYear)}/an en ${report.buyIn.years.join(', ')} → −${chf(report.buyIn.saving)} d’impôts`,
  );

if (report.housing) {
  console.log('— Logement');
  console.table({
    'Tenue des charges aujourd’hui': formatPercent(report.housing.ratioToday),
    'Tenue des charges à la retraite': formatPercent(report.housing.ratioAtRetirement),
    Verdict: report.housing.analysis.verdict,
    'Amortissement suggéré': chf(report.housing.analysis.suggestedAmount),
  });
}

console.log('— Plan dans le temps (extrait, nominal)');
console.table(
  report.plan.rows
    .filter((r, i) => i % 3 === 0 || r.year === s.retirementYear)
    .map((r) => ({
      année: r.year,
      âge: r.ages.main,
      salaire: chf(r.salary),
      AVS: chf(r.avs),
      LPP: chf(r.lppAnnuity),
      dépenses: chf(r.expenses),
      impôts: chf(r.taxes.total),
      'patrimoine financier': chf(r.financialWealth),
      'net total': chf(r.netWorth),
    })),
);

console.log('— Conseils');
for (const a of report.advice)
  console.log(
    `${a.mandatory ? '●' : '○'} ${a.title} — ${a.keyFigure.label}: ${a.keyFigure.unit === 'age' ? a.keyFigure.value + ' ans' : chf(a.keyFigure.value)}\n    · ${a.bullets.join('\n    · ')}`,
  );
if (report.params.meta.pending.length)
  console.log('\nÀ confirmer :\n- ' + report.params.meta.pending.join('\n- '));
