import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { T } from '@/lib/tokens';
import { DonoNav } from './DonoNav';

export default async function DonoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'dono') redirect('/login');

  return (
    <div style={{ display: 'flex', height: '100dvh', fontFamily: '"Inter", system-ui, sans-serif', background: T.surface2 }}>
      {/* Sidebar */}
      <aside style={{
        width: 224, background: T.primary, color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: -0.5,
            }}>I</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3 }}>Império da Moda</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Painel do proprietário</div>
            </div>
          </div>
        </div>

        <DonoNav />

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>Logado como</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>
            {session.user.name}
          </div>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
