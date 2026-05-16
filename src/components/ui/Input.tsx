'use client';
import { T } from '@/lib/tokens';
import { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onChange?: (value: string) => void;
  error?: string;
}

export function Input({ label, onChange, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </label>
      )}
      <input
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          height: 44,
          padding: '0 14px',
          borderRadius: 10,
          border: `1px solid ${error ? T.danger : T.border}`,
          fontSize: 14,
          fontFamily: 'inherit',
          color: T.text,
          background: T.surface,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: T.danger }}>{error}</span>}
    </div>
  );
}
