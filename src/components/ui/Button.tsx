'use client';
import { T } from '@/lib/tokens';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'success' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  loading?: boolean;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: { background: T.accent, color: '#fff', border: 'none' },
  ghost: { background: 'transparent', color: T.text, border: `1px solid ${T.border}` },
  outline: { background: 'transparent', color: T.accent, border: `1.5px solid ${T.accent}` },
  success: { background: T.success, color: '#fff', border: 'none' },
  danger: { background: 'transparent', color: T.danger, border: `1px solid ${T.danger}` },
};

const sizes: Record<Size, React.CSSProperties> = {
  sm: { height: 32, padding: '0 12px', fontSize: 12, borderRadius: 8 },
  md: { height: 40, padding: '0 16px', fontSize: 14, borderRadius: 10 },
  lg: { height: 52, padding: '0 24px', fontSize: 15, borderRadius: 14 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  loading,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'inherit',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'opacity .15s',
        width: full ? '100%' : undefined,
        ...styles[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
