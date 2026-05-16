import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { fmtBRL } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { T } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export default async function VendedoraComissoes() {
  const session = await auth();
  const seller = session!.user;

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [stats] = await query<{ sold: string; commission: string; orders: string }>(
    `SELECT
       COALESCE(SUM(total), 0) AS sold,
       COALESCE(SUM(commission_amt), 0) AS commission,
       COUNT(*) AS orders
     FROM orders WHERE seller_id = $1 AND status = 'closed' AND created_at >= $2`,
    [seller.id, firstDay]
  );

  const orders = await query<{ order_number: string; total: string; commission_amt: string; closed_at: string; customer_name: string | null }>(
    `SELECT o.order_number, o.total, o.commission_amt, o.closed_at, c.name AS customer_name
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.seller_id = $1 AND o.status = 'closed'
     ORDER BY o.closed_at DESC LIMIT 30`,
    [seller.id]
  );

  return (
    <div style={{ padding: '56px 20px 20px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Minhas Comissões</div>

      <Card style={{ marginBottom: 16, padding: 20, background: `linear-gradient(135deg, ${T.primary} 0%, #2D2D54 100%)` }}>
        <div style={{ color: '#fff' }}>
          <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Este mês</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>{fmtBRL(Number(stats.sold))}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>vendido em {stats.orders} pedidos</div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.15)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Comissão ({seller.commissionPct}%)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: T.accentSoft, letterSpacing: -0.8, marginTop: 4 }}>
            {fmtBRL(Number(stats.commission))}
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Últimas vendas</div>
      {orders.map((o) => (
        <Card key={o.order_number} style={{ marginBottom: 8, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{o.customer_name ?? 'Sem cliente'}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{o.order_number}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtBRL(Number(o.total))}</div>
              <div style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>
                +{fmtBRL(Number(o.commission_amt))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
