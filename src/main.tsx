import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LazyMotion, MotionConfig } from 'motion/react';
import '@/styles/index.css';
import { App } from './App';

const loadFeatures = () => import('@/lib/motionFeatures').then((m) => m.default);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={loadFeatures} strict>
      {/* reducedMotion="user": transforms are skipped when the OS asks for less motion. */}
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
