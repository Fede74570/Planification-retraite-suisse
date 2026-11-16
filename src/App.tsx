import { lazy, Suspense } from 'react';
import { Home } from '@/features/landing/Home';

// Path-based routing only: the URL hash is reserved for the encoded simulation state.
const UiPage = lazy(() => import('@/dev/UiPage'));

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/ui') {
    return (
      <Suspense fallback={null}>
        <UiPage />
      </Suspense>
    );
  }
  return <Home />;
}
