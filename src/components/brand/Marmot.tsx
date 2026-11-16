import { m, useReducedMotion } from 'motion/react';

/**
 * The brand marmot, redrawn from brand/logo.svg (#mrfs-marmot) with one paw raised.
 * Allowed only in onboarding, empty states and the "report ready" screen — never in the report.
 */
interface MarmotProps {
  size?: number;
  /** Wave the raised paw (onboarding greeting). */
  waving?: boolean;
  className?: string;
  title?: string;
}

const C = {
  fur: '#9B6B40', furDark: '#6E4A2B', outline: '#4E3220', belly: '#D9B48A', muzzle: '#EDD5AE',
  ear: '#E3A98A', cheek: '#F0A8A0', nose: '#3B2416', mouth: '#5A2A1E', choco: '#6B3A20',
  chocoLine: '#4A2614', wrap: '#F3EBD8', wrapRed: '#D2302A',
};

export function Marmot({ size = 160, waving = false, className, title = 'Marmotte' }: MarmotProps) {
  const reduce = useReducedMotion();
  const wave = waving && !reduce;
  return (
    <svg
      viewBox="590 640 450 730"
      width={(size * 450) / 730}
      height={size}
      role="img"
      aria-label={title}
      className={className}
    >
      <path fill={C.furDark} d="M640 1160 C600 1170 610 1250 660 1300 C700 1340 740 1340 760 1320 L760 1260 C720 1220 690 1150 640 1160 Z" />
      <ellipse cx="778" cy="1335" rx="55" ry="23" fill={C.furDark} />
      <ellipse cx="936" cy="1335" rx="55" ry="23" fill={C.furDark} />
      <ellipse cx="857" cy="1125" rx="164" ry="218" fill={C.fur} stroke={C.outline} strokeWidth="6" />
      <ellipse cx="857" cy="1165" rx="102" ry="137" fill={C.belly} />
      <circle cx="755" cy="730" r="31" fill={C.fur} stroke={C.outline} strokeWidth="6" />
      <circle cx="757" cy="732" r="14" fill={C.ear} />
      <circle cx="960" cy="730" r="31" fill={C.fur} stroke={C.outline} strokeWidth="6" />
      <circle cx="958" cy="732" r="14" fill={C.ear} />
      <ellipse cx="857" cy="815" rx="136" ry="125" fill={C.fur} stroke={C.outline} strokeWidth="6" />
      <ellipse cx="857" cy="875" rx="80" ry="62" fill={C.muzzle} />
      <path d="M780 795 Q807 765 835 795" fill="none" stroke={C.nose} strokeWidth="7" strokeLinecap="round" />
      <path d="M880 795 Q907 765 935 795" fill="none" stroke={C.nose} strokeWidth="7" strokeLinecap="round" />
      <circle cx="770" cy="861" r="23" fill={C.cheek} />
      <circle cx="944" cy="861" r="23" fill={C.cheek} />
      <ellipse cx="857" cy="849" rx="23" ry="15" fill={C.nose} />
      <path d="M818 898 Q857 935 896 898 Z" fill={C.mouth} />
      <rect x="841" y="898" width="13" height="18" fill="#fff" />
      <rect x="858" y="898" width="13" height="18" fill="#fff" />
      {/* chocolate held by the left paw */}
      <g transform="rotate(-8 860 1060)">
        <rect x="770" y="985" width="120" height="84" rx="4" fill={C.choco} />
        <path d="M830 985 V1069 M770 1027 H890" stroke={C.chocoLine} strokeWidth="4" />
        <rect x="775" y="1062" width="136" height="92" rx="6" fill={C.wrap} stroke="#D8CDB4" strokeWidth="3" />
        <rect x="775" y="1090" width="136" height="18" fill={C.wrapRed} />
      </g>
      <circle cx="790" cy="1050" r="37" fill={C.fur} stroke={C.outline} strokeWidth="6" />
      {/* raised right paw — rotates around the shoulder */}
      <m.g
        style={{ transformOrigin: '960px 990px', transformBox: 'view-box' }}
        animate={wave ? { rotate: [0, 16, -8, 16, -4, 0] } : { rotate: 0 }}
        transition={wave ? { duration: 1.4, ease: 'easeInOut', repeat: 1, repeatDelay: 0.6 } : { duration: 0 }}
      >
        <path d="M955 1000 Q990 930 1000 860" fill="none" stroke={C.outline} strokeWidth="64" strokeLinecap="round" />
        <path d="M955 1000 Q990 930 1000 860" fill="none" stroke={C.fur} strokeWidth="52" strokeLinecap="round" />
        <circle cx="1002" cy="842" r="34" fill={C.fur} stroke={C.outline} strokeWidth="6" />
      </m.g>
    </svg>
  );
}
