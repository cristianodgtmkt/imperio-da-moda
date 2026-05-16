import { cn } from '@/lib/utils';

type Variant = 'neutral' | 'default' | 'success' | 'warning' | 'danger' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const styles: Record<Variant, { bg: string; text: string; dot: string }> = {
  neutral: { bg: 'bg-surface-2', text: 'text-textc-muted', dot: 'bg-textc-subtle' },
  default: { bg: 'bg-surface-2', text: 'text-textc-muted', dot: 'bg-textc-subtle' },
  success: { bg: 'bg-success-bg', text: 'text-[#15803D]', dot: 'bg-success' },
  warning: { bg: 'bg-warning-bg', text: 'text-[#B45309]', dot: 'bg-warning' },
  danger: { bg: 'bg-danger-bg', text: 'text-[#B91C1C]', dot: 'bg-danger' },
  accent: { bg: 'bg-accent-bg', text: 'text-[#9D174D]', dot: 'bg-accent' },
};

export function Badge({ children, variant = 'neutral', dot, size = 'md', className }: BadgeProps) {
  const s = styles[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wider uppercase whitespace-nowrap',
        size === 'sm' ? 'h-[22px] px-2 text-[11px]' : 'h-[26px] px-2.5 text-[12px]',
        s.bg, s.text, className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />}
      {children}
    </span>
  );
}
