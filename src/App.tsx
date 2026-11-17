import { lazy, Suspense } from 'react';
import { Home } from '@/features/landing/Home';

// Path-based routing only: the URL hash is reserved for the encoded simulation state.
const UiPage = lazy(() => import('@/dev/UiPage'));
const AppRoute = lazy(() => import('@/features/app/AppRoute'));

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/ui')
    return (
      <Suspense fallback={null}>
        <UiPage />
      </Suspense>
    );
  if (path === '/app' || window.location.hash.startsWith('#s='))
    return (
      <Suspense fallback={null}>
        <AppRoute />
      </Suspense>
    );
  return <Home />;
}
