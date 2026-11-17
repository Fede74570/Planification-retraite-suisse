import { useMemo } from 'react';
import { buildStrategy } from '@/engine/choices';
import { computeReport, type Report } from '@/engine';
import { getParams } from '@/engine/params';
import { formatCHF } from '@/lib/format';
import { useApp } from './store';

/** The live report: recomputed (≈ 10–15 ms) whenever the profile, assumptions or choices change. */
export function useReport(): Report {
  const profile = useApp((s) => s.profile);
  const assumptions = useApp((s) => s.assumptions);
  const choices = useApp((s) => s.choices);
  return useMemo(() => {
    const strategy = buildStrategy(profile, choices, getParams(assumptions.paramYear));
    return computeReport(profile, assumptions, strategy, formatCHF);
  }, [profile, assumptions, choices]);
}
