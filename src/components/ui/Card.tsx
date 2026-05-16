'use client';
import { T } from '@/lib/tokens';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: number;
}

export function Card({ hover, padding = 16, style, children, ...props }: CardProps) {
  return (
    <div
      style={{
        background: T.surface,
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        padding,
        cursor: hover ? 'pointer' : undefined,
        transition: hover ? 'box-shadow .15s' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
