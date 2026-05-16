import { T } from '@/lib/tokens';

type Variant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  variant?: Variant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  default: { background: T.surface2, color: T.textMuted },
  accent: { background: T.accentBg, color: T.accent },
  success: { background: T.successBg, color: T.success },
  warning: { background: T.warningBg, color: T.warning },
  danger: { background: T.dangerBg, color: T.danger },
};

export function Badge({ variant = 'default', size = 'md', children }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 20,
        fontWeight: 600,
        fontSize: size === 'sm' ? 10 : 12,
        padding: size === 'sm' ? '2px 6px' : '3px 8px',
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
}
