'use client';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  onChange?: (value: string) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon: Icon, error, className, onChange, ...rest },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 ml-1 block text-[12px] font-semibold uppercase tracking-wider text-textc-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-textc-muted"
          />
        )}
        <input
          ref={ref}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'h-11 w-full rounded-input border border-border bg-surface px-3.5 text-[15px]',
            'text-textc placeholder:text-textc-subtle outline-none',
            'transition-[border-color,box-shadow] duration-100',
            'focus:border-accent focus:ring-[3px] focus:ring-accent-bg',
            Icon && 'pl-11',
            error && 'border-danger focus:ring-danger/15',
            className,
          )}
          {...rest}
        />
      </div>
      {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
    </div>
  );
});
