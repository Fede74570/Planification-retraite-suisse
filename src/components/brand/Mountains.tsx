/** Alpine silhouette echoing the logo (sky → alp → meadow). Decorative. */
export function Mountains({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={className}>
      <path fill="var(--alp)" opacity="0.55" d="M0 250 L180 120 L300 200 L470 60 L640 230 L820 110 L980 210 L1160 80 L1300 180 L1440 120 V320 H0Z" />
      <path fill="#fff" opacity="0.9" d="M440 82 L470 60 L500 86 L486 92 L470 80 L454 94Z M1130 102 L1160 80 L1192 106 L1176 112 L1160 100 L1144 114Z" />
      <path fill="var(--alp)" d="M0 290 L240 170 L420 260 L600 150 L780 270 L960 170 L1180 270 L1440 180 V320 H0Z" />
      <path fill="var(--meadow)" d="M0 300 Q720 250 1440 300 V320 H0Z" />
    </svg>
  );
}
