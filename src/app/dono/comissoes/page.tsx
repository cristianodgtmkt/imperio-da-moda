import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { fmtBRL } from '@/lib/format';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

export const dynamic = 'force-dynamic';

interface SellerCommission {
  id: string;
  name: string;
  commission_pct: string;
  closed_orders: string;
  total_revenue: string;
  commission_amt: string;
}

export default async function DonoComissoes() {
  await auth();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const sellers = await query<SellerCommission>(
    `SELECT u.id, u.name, u.commission_pct,
            COUNT(o.id) FILTER (WHERE o.status = 'closed') AS closed_orders,
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'closed'), 0) AS total_revenue,
            COALESCE(SUM(o.commission_amt) FILTER (WHERE o.status = 'closed'), 0) AS commission_amt
     FROM store_users u
     LEFT JOIN orders o ON o.seller_id = u.id AND o.created_at BETWEEN $1 AND $2
     WHERE u.role = 'vendedora' AND u.active = true
     GROUP BY u.id, u.name, u.commission_pct
     ORDER BY total_revenue DESC`,
    [firstDay, lastDay]
  );

  const totalComm = sellers.reduce((s, r) => s + Number(r.commission_amt), 0);
  const totalRev = sellers.reduce((s, r) => s + Number(r.total_revenue), 0);
  const currentMonth = today.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Comissões</div>
        <div style={{ fontSize: 14, color: T.textMuted, marginTop: 2, textTransform: 'capitalize' }}>{currentMonth}</div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Total Vendido
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>{fmtBRL(totalRev)}</div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Total Comissões
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4, color: T.accent }}>{fmtBRL(totalComm)}</div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Vendedoras Ativas
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>{sellers.length}</div>
        </Card>
      </div>

      {/* Per-seller cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {sellers.map((s) => (
          <Card key={s.id} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Avatar name={s.name} color="#8B5CF6" size={40} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>{s.commission_pct}% comissão</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pedidos</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.closed_orders}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vendido</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtBRL(Number(s.total_revenue))}</div>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: T.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>A receber</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.accent, letterSpacing: -0.4 }}>
                {fmtBRL(Number(s.commission_amt))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sellers.length === 0 && (
        <div style={{ textAlign: 'center', color: T.textMuted, padding: 60 }}>
          Nenhuma vendedora ativa cadastrada.
        </div>
      )}
    </div>
  );
}
