import { m, useReducedMotion } from 'motion/react';
import { arc } from 'd3-shape';
import { springSoft } from '@/lib/motion';

interface GaugeProps {
  /** 0..1 (values above 1 are clamped visually). */
  value: number;
  size?: number;
  /** Colour thresholds (§7 hero): red < 60 %, orange 60–80 %, green > 80 %. */
  thresholds?: [number, number];
  label: string;
  display: string;
}

const START = -Math.PI * 0.75;
const SPAN = Math.PI * 1.5;

export function Gauge({ value, size = 180, thresholds = [0.6, 0.8], label, display }: GaugeProps) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(1, value));
  const r = size / 2;
  const track =
    arc().cornerRadius(7)({
      innerRadius: r - 14,
      outerRadius: r,
      startAngle: START,
      endAngle: START + SPAN,
    }) ?? '';
  const color =
    v < thresholds[0] ? 'var(--red-ch)' : v < thresholds[1] ? '#d98a00' : 'var(--meadow-ink)';
  // pathLength-based fill animates via transform-free stroke; the arc is drawn as a stroked path.
  const mid = r - 7;
  const a0 = START - Math.PI / 2;
  const a1 = START + SPAN - Math.PI / 2;
  const sweepPath = `M ${r + mid * Math.cos(a0)} ${r + mid * Math.sin(a0)} A ${mid} ${mid} 0 1 1 ${r + mid * Math.cos(a1)} ${r + mid * Math.sin(a1)}`;
  return (
    <svg
      width={size}
      height={size * 0.86}
      viewBox={`0 0 ${size} ${size * 0.86}`}
      role="img"
      aria-label={`${label} : ${display}`}
    >
      <path d={track} transform={`translate(${r},${r})`} fill="var(--surface-sunken)" />
      <m.path
        d={sweepPath}
        fill="none"
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
        initial={{ pathLength: reduce ? v : 0 }}
        animate={{ pathLength: Math.max(0.001, v) }}
        transition={reduce ? { duration: 0.1 } : springSoft}
      />
      <text
        x={r}
        y={r + 4}
        textAnchor="middle"
        className="tabular"
        style={{ font: `600 ${size * 0.2}px var(--font-serif)`, fill: 'var(--ink)' }}
      >
        {display}
      </text>
      <text
        x={r}
        y={r + size * 0.16}
        textAnchor="middle"
        style={{ font: `500 ${size * 0.075}px var(--font-sans)`, fill: 'var(--ink-muted)' }}
      >
        {label}
      </text>
    </svg>
  );
}
