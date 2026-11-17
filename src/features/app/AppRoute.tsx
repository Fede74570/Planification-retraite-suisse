import { useState } from 'react';
import { startPersistence, useApp } from '@/state/store';
import { Onboarding } from '../onboarding/Onboarding';
import { ReportReady } from '../onboarding/ReportReady';
import { AppShell } from './AppShell';

// Mirror the state into the URL hash and localStorage as soon as the app route loads.
startPersistence();

/** /app: onboarding → « rapport prêt » → live report. A shared link (hash) opens the report directly. */
export default function AppRoute() {
  const onboarded = useApp((s) => s.onboarded);
  const completeOnboarding = useApp((s) => s.completeOnboarding);
  const [phase, setPhase] = useState<'form' | 'ready' | 'report'>(onboarded ? 'report' : 'form');
  if (phase === 'form' && !onboarded) return <Onboarding onDone={() => setPhase('ready')} />;
  if (phase === 'ready' || (phase === 'form' && onboarded)) {
    return (
      <ReportReady
        onDone={() => {
          if (!useApp.getState().onboarded) completeOnboarding();
          setPhase('report');
        }}
      />
    );
  }
  return <AppShell />;
}
