import { LucideIcon, Package } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Package, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-textc-subtle">
        <Icon size={28} strokeWidth={2} />
      </div>
      <h3 className="text-[16px] font-semibold text-textc">{title}</h3>
      {subtitle && <p className="mt-1 text-[13px] text-textc-muted">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
