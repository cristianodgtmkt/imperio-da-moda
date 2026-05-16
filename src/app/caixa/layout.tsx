import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { T } from '@/lib/tokens';

export default async function CaixaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'caixa') redirect('/login');

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", system-ui, sans-serif', background: T.surface2 }}>
      <header style={{ background: T.primary, color: '#fff', padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>I</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Império da Moda</div>
          <div style={{ fontSize: 11, opacity: 0.5 }}>Caixa</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, opacity: 0.6 }}>{session.user.name}</div>
      </header>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  );
}
