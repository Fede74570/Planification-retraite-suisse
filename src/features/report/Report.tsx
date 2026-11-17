import type { Report as EngineReport } from '@/engine';
import { DISCLAIMER } from '@/components/layout/Footer';
import { formatPercent } from '@/lib/format';
import { useApp } from '@/state/store';
import { CapitalBlock, PlanBlock, ScenariosBlock } from './blocks/DecisionBlocks';
import { AdviceBlock, HousingBlock, TaxBlock } from './blocks/MoneyBlocks';
import { HeroBlock, PillarsBlock, TodayBlock } from './blocks/SummaryBlocks';
import { PrintFrame } from './PrintFrame';

/** The report: 9 short blocks (§7), each 1 KPI + 1 visual + 1 sentence. */
export function Report({ report, only }: { report: EngineReport; only?: 'scenarios' | 'advice' }) {
  if (only === 'scenarios')
    return (
      <div className="flex flex-col gap-4">
        <ScenariosBlock report={report} index={0} />
        <CapitalBlock report={report} index={1} />
      </div>
    );
  if (only === 'advice')
    return (
      <div className="flex flex-col gap-4">
        <AdviceBlock report={report} index={0} />
        <ReportFooter report={report} />
      </div>
    );
  return (
    <PrintFrame>
      <div className="flex flex-col gap-4">
        <HeroBlock report={report} />
        <TodayBlock report={report} index={1} />
        <PillarsBlock report={report} index={2} />
        <CapitalBlock report={report} index={3} />
        <ScenariosBlock report={report} index={4} />
        <PlanBlock report={report} index={5} />
        <TaxBlock report={report} index={6} />
        <HousingBlock report={report} index={7} />
        <AdviceBlock report={report} index={8} />
        <ReportFooter report={report} />
      </div>
    </PrintFrame>
  );
}

function ReportFooter({ report }: { report: EngineReport }) {
  const a = useApp((s) => s.assumptions);
  const m = report.params.meta;
  const verified = new Date(m.verifiedOn).toLocaleDateString('fr-CH');
  return (
    <footer className="px-1 pt-2 text-xs text-ink-muted">
      <p className="m-0">
        Hypothèses : inflation {formatPercent(a.inflation)}, rendement{' '}
        {formatPercent(a.returns[a.returnProfile])} (
        {a.returnProfile === 'prudent'
          ? 'prudent'
          : a.returnProfile === 'balanced'
            ? 'équilibré'
            : 'dynamique'}
        ), horizon {a.horizonAge} ans. Paramètres légaux {m.year} vérifiés le {verified}.
      </p>
      {m.pending.length > 0 && <p className="m-0 mt-1">À confirmer : {m.pending.join(' ')}</p>}
      <p className="m-0 mt-2">{DISCLAIMER}</p>
    </footer>
  );
}
