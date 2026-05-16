'use client';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, ShoppingBag, DollarSign } from 'lucide-react';
import { T } from '@/lib/tokens';

const tabs = [
  { href: '/vendedora', label: 'Vender', Icon: ShoppingCart },
  { href: '/vendedora/pedidos', label: 'Pedidos', Icon: ShoppingBag },
  { href: '/vendedora/comissoes', label: 'Comissões', Icon: DollarSign },
];

export function VendedoraTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 72,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${T.border}`, display: 'flex', zIndex: 70,
    }}>
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/vendedora' && pathname.startsWith(href));
        return (
          <button key={href} onClick={() => router.push(href)} style={{
            flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, color: active ? T.accent : T.textMuted, fontFamily: 'inherit', padding: '8px 0',
          }}>
            <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
