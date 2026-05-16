'use client';
// Shared UI kit — ported 1:1 from prototype ui-kit.jsx. Inline styles only.
import React from 'react';

export const T = {
  primary: '#1A1A2E',
  primaryLight: '#2B2B47',
  accent: '#E91E8C',
  accentSoft: '#F8BBD9',
  accentBg: '#FCE7F1',
  success: '#22C55E',
  successBg: '#DCFCE7',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  surface: '#FFFFFF',
  surface2: '#F5F5F5',
  surface3: '#FAFAFA',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  text: '#111827',
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
};

export const fmtBRL = (n: number) => 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',');
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const timeAgo = (iso: string) => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
};

type IconName =
  | 'search' | 'plus' | 'minus' | 'check' | 'x' | 'chevronLeft' | 'chevronRight'
  | 'chevronDown' | 'user' | 'users' | 'bag' | 'cart' | 'money' | 'phone' | 'home'
  | 'chart' | 'package' | 'grid' | 'settings' | 'refresh' | 'download' | 'upload'
  | 'bell' | 'logout' | 'edit' | 'trash' | 'arrow' | 'clock' | 'star' | 'sparkle';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12l5 5L20 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevronLeft: <path d="M15 18l-6-6 6-6" />,
  chevronRight: <path d="M9 18l6-6-6-6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /><circle cx="17" cy="6" r="3" /><path d="M21 18c0-2.8-1.7-5-4-5" /></>,
  bag: <><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 10V6a3 3 0 016 0v4" /></>,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 4h2l2.5 11h11L21 7H6" /></>,
  money: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  home: <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z" />,
  chart: <path d="M3 21h18M7 17V10M12 17V5M17 17v-7" />,
  package: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5M21 8v8l-9 5" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.4 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.4a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
  refresh: <><path d="M21 12a9 9 0 11-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  download: <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  upload: <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  bell: <><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M14 21a2 2 0 01-4 0" /></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash: <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  star: <path d="M12 2l3 7 7 .7-5.3 4.9 1.6 7L12 18l-6.3 3.6 1.6-7L2 9.7 9 9z" />,
  sparkle: <path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6l4 4M19 5l-4 4M9 15l-4 4" />,
};

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>{ICON_PATHS[name]}</svg>
  );
}

type ButtonVariant = 'primary' | 'primaryDark' | 'ghost' | 'success' | 'danger' | 'subtle';
export function Button({ children, variant = 'primary', size = 'md', icon, onClick, disabled, full, style, type = 'button' }: {
  children: React.ReactNode; variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg';
  icon?: IconName; onClick?: () => void; disabled?: boolean; full?: boolean;
  style?: React.CSSProperties; type?: 'button' | 'submit';
}) {
  const sizes = {
    sm: { h: 36, px: 12, fs: 13, gap: 6, icon: 16 },
    md: { h: 44, px: 16, fs: 14, gap: 8, icon: 18 },
    lg: { h: 52, px: 24, fs: 16, gap: 10, icon: 20 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: T.accent, color: '#fff', border: 'none', hover: '#C9197A' },
    primaryDark: { bg: T.primary, color: '#fff', border: 'none', hover: '#0F0F1F' },
    ghost: { bg: 'transparent', color: T.text, border: `1px solid ${T.border}`, hover: T.surface2 },
    success: { bg: T.success, color: '#fff', border: 'none', hover: '#16A34A' },
    danger: { bg: 'transparent', color: T.danger, border: `1px solid ${T.danger}`, hover: T.dangerBg },
    subtle: { bg: T.surface2, color: T.text, border: 'none', hover: '#E5E7EB' },
  };
  const v = variants[variant];
  const [hover, setHover] = React.useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: s.gap, height: s.h, padding: `0 ${s.px}px`, fontSize: s.fs,
        fontWeight: 600, fontFamily: 'inherit', letterSpacing: -0.1,
        background: hover && !disabled ? v.hover : v.bg, color: v.color,
        border: v.border, borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'background .12s, transform .08s',
        width: full ? '100%' : 'auto', whiteSpace: 'nowrap', ...style,
      }}>
      {icon && <Icon name={icon} size={s.icon} />}
      {children}
    </button>
  );
}

export function Input({ value, onChange, placeholder, icon, type = 'text', style, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  icon?: IconName; type?: string; style?: React.CSSProperties; autoFocus?: boolean;
}) {
  return (
    <div style={{ position: 'relative', ...style }}>
      {icon && (
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, display: 'flex' }}>
          <Icon name={icon} size={18} />
        </div>
      )}
      <input value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} type={type} autoFocus={autoFocus}
        style={{
          width: '100%', height: 44, padding: icon ? '0 14px 0 42px' : '0 14px',
          fontSize: 15, fontFamily: 'inherit', color: T.text,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 10, outline: 'none', boxSizing: 'border-box',
          transition: 'border-color .12s, box-shadow .12s',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentBg}`; }}
        onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
export function Badge({ children, variant = 'neutral', dot, size = 'md' }: {
  children: React.ReactNode; variant?: BadgeVariant; dot?: boolean; size?: 'sm' | 'md';
}) {
  const variants = {
    neutral: { bg: T.surface2, color: T.textMuted, dot: T.textSubtle },
    success: { bg: T.successBg, color: '#15803D', dot: T.success },
    warning: { bg: T.warningBg, color: '#B45309', dot: T.warning },
    danger: { bg: T.dangerBg, color: '#B91C1C', dot: T.danger },
    accent: { bg: T.accentBg, color: '#9D174D', dot: T.accent },
  };
  const v = variants[variant];
  const s = size === 'sm' ? { h: 22, px: 8, fs: 11 } : { h: 26, px: 10, fs: 12 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: s.h, padding: `0 ${s.px}px`,
      background: v.bg, color: v.color, borderRadius: 999, fontSize: s.fs, fontWeight: 600,
      letterSpacing: 0.2, textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: v.dot }} />}
      {children}
    </span>
  );
}

export function Card({ children, padding = 16, onClick, style, hover }: {
  children: React.ReactNode; padding?: number; onClick?: () => void;
  style?: React.CSSProperties; hover?: boolean;
}) {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, padding, cursor: onClick ? 'pointer' : 'default',
        boxShadow: hover && h ? '0 4px 12px rgba(0,0,0,.08)' : '0 1px 2px rgba(0,0,0,.03)',
        transform: hover && h ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow .15s, transform .15s',
        ...style,
      }}>{children}</div>
  );
}

export function Avatar({ name, color = T.accent, size = 40 }: {
  name: string; color?: string; size?: number;
}) {
  const initials = (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 600, fontSize: size * 0.4, flexShrink: 0,
      letterSpacing: -0.3,
    }}>{initials}</div>
  );
}

export function ProductImg({ size = 56, color = '#EEE', label }: {
  size?: number; color?: string; label?: string;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: `repeating-linear-gradient(45deg, ${color}, ${color} 4px, ${T.surface2} 4px, ${T.surface2} 8px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 4, borderRadius: 6, background: T.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size > 80 ? 11 : 9, color: T.textSubtle,
        fontFamily: 'ui-monospace, "SF Mono", monospace', textAlign: 'center',
      }}>{label || 'foto'}</div>
    </div>
  );
}

export function Chip({ children, active, onClick, icon, color }: {
  children: React.ReactNode; active?: boolean; onClick?: () => void;
  icon?: IconName; color?: string;
}) {
  return (
    <button onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 34, padding: '0 14px', borderRadius: 999,
        fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
        background: active ? (color || T.accent) : T.surface,
        color: active ? '#fff' : T.text,
        border: active ? '1px solid transparent' : `1px solid ${T.border}`,
        transition: 'all .12s', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}

export function EmptyState({ icon = 'package', title, subtitle, action }: {
  icon?: IconName; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: 16, background: T.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSubtle }}>
        <Icon name={icon} size={28} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{subtitle}</div>}
      {action}
    </div>
  );
}

export function OrderStatus({ status }: { status: string }) {
  if (status === 'open') return <Badge variant="warning" dot>Aguardando</Badge>;
  if (status === 'closed') return <Badge variant="success" dot>Fechado</Badge>;
  if (status === 'cancelled') return <Badge variant="danger" dot>Cancelado</Badge>;
  return null;
}

export function BottomSheet({ children, onClose, title }: {
  children: React.ReactNode; onClose: () => void; title?: string;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 80,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.surface, width: '100%', maxWidth: 480, margin: '0 auto',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '12px 20px 28px', maxHeight: '85%', overflow: 'auto',
        animation: 'sheet-up .25s cubic-bezier(.2,.7,.3,1)',
      }}>
        <div style={{ width: 36, height: 4, background: T.borderStrong, borderRadius: 2, margin: '4px auto 14px' }} />
        {title && <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, letterSpacing: -0.3 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
