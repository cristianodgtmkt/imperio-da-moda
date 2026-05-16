'use client';
import { cn } from '@/lib/utils';
import { Loader2, LucideIcon } from 'lucide-react';
import { forwardRef } from 'react';

type Variant = 'primary' | 'primaryDark' | 'ghost' | 'success' | 'danger' | 'subtle' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-[#C9197A]',
  primaryDark: 'bg-primary text-white hover:bg-[#0F0F1F]',
  ghost: 'bg-transparent text-textc border border-border hover:bg-surface-2',
  success: 'bg-success text-white hover:bg-[#16A34A]',
  danger: 'bg-transparent text-danger border border-danger hover:bg-danger-bg',
  subtle: 'bg-surface-2 text-textc hover:bg-border',
  outline: 'bg-transparent text-accent border-[1.5px] border-accent hover:bg-accent-bg',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-11 px-4 text-[14px] gap-2',
  lg: 'h-13 px-6 text-[16px] gap-2.5',
};

const iconSizes: Record<Size, number> = { sm: 16, md: 18, lg: 20 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', full, loading, icon: Icon, iconRight: IconRight, children, className, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-btn font-semibold tracking-[-0.01em]',
        'transition-[background,transform] duration-100 active:scale-[.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 size={iconSizes[size]} className="animate-spin" />}
      {!loading && Icon && <Icon size={iconSizes[size]} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight size={iconSizes[size]} strokeWidth={2} />}
    </button>
  );
});
