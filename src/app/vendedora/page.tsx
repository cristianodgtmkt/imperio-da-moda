import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { fmtBRL } from '@/lib/format';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { OrderStatus } from '@/components/OrderStatus';
import { T } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

interface Order {
  id: string;
  order_number: string;
  status: 'open' | 'closed' | 'cancelled';
  total: number;
  customer_name: string | null;
  created_at: string;
  items_count: number;
}

export default async function VendedoraHome() {
  const session = await auth();
  const seller = session!.user;

  const today = new Date().toISOString().slice(0, 10);

  const [stats] = await query<{ sold: number; orders: number; commission: number }>(
    `SELECT
       COALESCE(SUM(total) FILTER (WHERE status = 'closed'), 0) AS sold,
       COUNT(*) FILTER (WHERE status = 'closed') AS orders,
       COALESCE(SUM(commission_amt) FILTER (WHERE status = 'closed'), 0) AS commission
     FROM orders WHERE seller_id = $1 AND DATE(created_at) = $2`,
    [seller.id, today]
  );

  const openOrders = await query<Order>(
    `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
            c.name AS customer_name,
            COUNT(oi.id) AS items_count
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.seller_id = $1 AND o.status = 'open'
     GROUP BY o.id, o.order_number, o.status, o.total, o.created_at, c.name
     ORDER BY o.created_at DESC`,
    [seller.id]
  );

  return (
    <div style={{ padding: '56px 20px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Avatar name={seller.name} color={T.accent} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.textMuted }}>Bom dia</div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>
            {seller.name.split(' ')[0]}
          </div>
        </div>
      </div>

      {/* Stats card */}
      <div style={{
        background: `linear-gradient(135deg, ${T.primary} 0%, #2D2D54 100%)`,
        borderRadius: 20, padding: 20, color: '#fff', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -30, top: -30, width: 140, height: 140,
          background: `radial-gradient(circle, ${T.accent}40 0%, transparent 70%)`,
        }} />
        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Hoje</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1 }}>
          {fmtBRL(Number(stats.sold))}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
          {Number(stats.orders)} pedidos fechados · {fmtBRL(Number(stats.commission))} de comissão
        </div>
      </div>

      {/* Main CTA */}
      <Link href="/vendedora/clientes" style={{ textDecoration: 'none' }}>
        <div style={{
          width: '100%', height: 88, borderRadius: 20,
          background: T.accent, color: '#fff',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
          boxShadow: '0 8px 24px rgba(233,30,140,.3)', marginBottom: 16,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>+</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Novo Pedido</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Buscar cliente para começar</div>
          </div>
        </div>
      </Link>

      {/* Open orders */}
      {openOrders.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 4px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No Caixa</div>
            <Link href="/vendedora/pedidos" style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>Ver todos</Link>
          </div>
          {openOrders.map((o) => (
            <Card key={o.id} hover style={{ marginBottom: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: T.warning }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{o.customer_name ?? 'Sem cliente'}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                    {o.order_number} · {Number(o.items_count)} {Number(o.items_count) > 1 ? 'itens' : 'item'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtBRL(Number(o.total))}</div>
                  <OrderStatus status={o.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
