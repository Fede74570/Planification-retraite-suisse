import horizontalUrl from '@/assets/logo-horizontal.svg';
import markUrl from '@/assets/logo-mark.svg';
import stackedUrl from '@/assets/logo-stacked.svg';

type Variant = 'horizontal' | 'mark' | 'stacked';
const SRC: Record<Variant, string> = { horizontal: horizontalUrl, mark: markUrl, stacked: stackedUrl };
// Intrinsic ratios of the SVG viewBoxes (never distort the logo).
const RATIO: Record<Variant, number> = { horizontal: 4780.37 / 1336, mark: 1, stacked: 1375 / 1770 };

interface LogoProps {
  variant?: Variant;
  /** Rendered height in px; width follows the intrinsic ratio. */
  height?: number;
  className?: string;
  /** Decorative logos (next to a visible title) get an empty alt. */
  decorative?: boolean;
}

export function Logo({ variant = 'horizontal', height = 40, className, decorative }: LogoProps) {
  return (
    <img
      src={SRC[variant]}
      height={height}
      width={Math.round(height * RATIO[variant])}
      alt={decorative ? '' : 'Ma retraite Franco-Suisse'}
      className={className}
      draggable={false}
      decoding="async"
    />
  );
}

/** 8 % watermark, bottom-right of every chart (§7). */
export function LogoWatermark() {
  return (
    <img
      src={markUrl}
      alt=""
      aria-hidden="true"
      width={44}
      height={44}
      className="pointer-events-none absolute right-3 bottom-3 select-none opacity-[0.08] print:opacity-[0.12]"
      draggable={false}
    />
  );
}
