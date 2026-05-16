'use client';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: number;
}

export function Card({ hover, padding = 16, className, style, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-card',
        'transition-[box-shadow,transform] duration-150',
        hover && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-px',
        className,
      )}
      style={{ padding, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
