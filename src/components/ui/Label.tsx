import { cn } from '@/lib/utils';

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2 mt-1 mx-1 text-[12px] font-semibold uppercase tracking-wider text-textc-muted', className)}>
      {children}
    </div>
  );
}
