'use client';
import { cn } from '@/lib/utils';

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function Chip({ children, active, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-full text-[13px] font-medium',
        'transition-colors duration-100 whitespace-nowrap',
        active
          ? 'bg-accent text-white border border-transparent'
          : 'bg-surface text-textc border border-border hover:bg-surface-2',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}
