'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { T } from '@/lib/tokens';
import {
  LayoutDashboard, ShoppingBag, Award, Package, Users,
} from 'lucide-react';

const NAV = [
  { href: '/dono', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/dono/vendas', label: 'Vendas', Icon: ShoppingBag },
  { href: '/dono/comissoes', label: 'Comissões', Icon: Award },
  { href: '/dono/produtos', label: 'Produtos', Icon: Package },
  { href: '/dono/equipe', label: 'Equipe', Icon: Users },
];

export function DonoNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: '8px 12px' }}>
      {NAV.map(({ href, label, Icon }) => {
        const active = href === '/dono' ? pathname === '/dono' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              color: active ? '#fff' : 'rgba(255,255,255,.55)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              marginBottom: 2,
              background: active ? 'rgba(255,255,255,.12)' : 'transparent',
              transition: 'background .15s, color .15s',
            }}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
