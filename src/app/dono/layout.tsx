import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { T } from '@/lib/tokens';
import Link from 'next/link';

const NAV = [
  { href: '/dono', label: 'Dashboard', emoji: '📊' },
  { href: '/dono/vendas', label: 'Vendas', emoji: '💰' },
  { href: '/dono/comissoes', label: 'Comissões', emoji: '🏆' },
  { href: '/dono/produtos', label: 'Produtos', emoji: '👗' },
  { href: '/dono/equipe', label: 'Equipe', emoji: '👥' },
];

export default async function DonoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'dono') redirect('/login');

  return (
    <div style={{ display: 'flex', height: '100dvh', fontFamily: '"Inter", system-ui, sans-serif', background: T.surface2 }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: T.primary, color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E91E8C',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>I</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Império da Moda</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Painel</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, color: 'rgba(255,255,255,.8)', textDecoration: 'none',
              fontSize: 14, fontWeight: 500, marginBottom: 2,
            }}>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.1)', fontSize: 12, opacity: 0.5 }}>
          {session.user.name}
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
