import { m, type HTMLMotionProps } from 'motion/react';
import { forwardRef, type ReactNode } from 'react';
import { spring } from '@/lib/motion';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-[0_1px_2px_rgb(0_85_163/0.3),0_6px_16px_-4px_rgb(0_85_163/0.45)] hover:brightness-110',
  secondary: 'bg-surface text-ink ring-1 ring-line-strong hover:bg-sunken',
  ghost: 'bg-transparent text-accent hover:bg-sunken',
  danger: 'bg-red-ch text-white hover:brightness-110',
};
const SIZES: Record<Size, string> = {
  md: 'min-h-11 px-4 text-sm gap-2 rounded-[14px]',
  lg: 'min-h-14 px-6 text-base gap-2.5 rounded-[16px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <m.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-[filter,background-color] duration-150 disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className="-ml-0.5 inline-flex">
          {icon}
        </span>
      )}
      {children}
    </m.button>
  );
});
