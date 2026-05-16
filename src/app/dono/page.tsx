import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { fmtBRL } from '@/lib/format';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

interface KPI {
  closed_orders: string;
  open_orders: string;
  total_revenue: string;
  total_commissions: string;
  avg_ticket: string;
}

export default async function DonoDashboard() {
  await auth();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const [kpi] = await query<KPI>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'closed') AS closed_orders,
       COUNT(*) FILTER (WHERE status = 'open') AS open_orders,
       COALESCE(SUM(total) FILTER (WHERE status = 'closed'), 0) AS total_revenue,
       COALESCE(SUM(commission_amt) FILTER (WHERE status = 'closed'), 0) AS total_commissions,
       COALESCE(AVG(total) FILTER (WHERE status = 'closed'), 0) AS avg_ticket
     FROM orders WHERE created_at BETWEEN $1 AND $2`,
    [firstDay, lastDay]
  );

  const sellers = await query<{ name: string; total_revenue: string; closed_orders: string; commission_amt: string }>(
    `SELECT u.name,
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'closed'), 0) AS total_revenue,
            COUNT(o.id) FILTER (WHERE o.status = 'closed') AS closed_orders,
            COALESCE(SUM(o.commission_amt) FILTER (WHERE o.status = 'closed'), 0) AS commission_amt
     FROM store_users u
     LEFT JOIN orders o ON o.seller_id = u.id AND o.created_at BETWEEN $1 AND $2
     WHERE u.role = 'vendedora' AND u.active = true
     GROUP BY u.id, u.name ORDER BY total_revenue DESC`,
    [firstDay, lastDay]
  );

  const salesByDay = await query<{ day: string; revenue: string }>(
    `SELECT DATE(created_at) AS day, COALESCE(SUM(total), 0) AS revenue
     FROM orders WHERE status = 'closed' AND created_at BETWEEN $1 AND $2
     GROUP BY day ORDER BY day`,
    [firstDay, lastDay]
  );

  const KPIS = [
    { label: 'Faturamento', value: fmtBRL(Number(kpi.total_revenue)), color: T.primary, emoji: '💰' },
    { label: 'Pedidos fechados', value: kpi.closed_orders, color: T.success, emoji: '✅' },
    { label: 'Ticket médio', value: fmtBRL(Number(kpi.avg_ticket)), color: '#8B5CF6', emoji: '🎯' },
    { label: 'Comissões', value: fmtBRL(Number(kpi.total_commissions)), color: T.accent, emoji: '🏆' },
  ];

  const currentMonth = today.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Dashboard</div>
        <div style={{ fontSize: 14, color: T.textMuted, marginTop: 2, textTransform: 'capitalize' }}>{currentMonth}</div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {KPIS.map((k) => (
          <Card key={k.label} style={{ padding: 20 }}>
            <div style={{ fontSize: 22 }}>{k.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: k.color, letterSpacing: -0.4 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{k.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Sales chart (simple bar) */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Vendas por dia</div>
          {salesByDay.length === 0 ? (
            <div style={{ color: T.textMuted, textAlign: 'center', padding: '20px 0' }}>Sem dados ainda</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
              {(() => {
                const max = Math.max(...salesByDay.map((d) => Number(d.revenue)));
                return salesByDay.map((d) => {
                  const pct = max > 0 ? (Number(d.revenue) / max) * 100 : 0;
                  const dayNum = new Date(d.day + 'T12:00:00').getDate();
                  return (
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', background: T.accent, borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%` }} />
                      <div style={{ fontSize: 10, color: T.textMuted }}>{dayNum}</div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </Card>

        {/* Sellers ranking */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Vendedoras</div>
          {sellers.length === 0 ? (
            <div style={{ color: T.textMuted, textAlign: 'center', padding: '20px 0' }}>Sem vendedoras</div>
          ) : (
            sellers.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: i < sellers.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{s.closed_orders} pedidos</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtBRL(Number(s.total_revenue))}</div>
                  <div style={{ fontSize: 12, color: T.accent }}>+{fmtBRL(Number(s.commission_amt))}</div>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Open orders warning */}
      {Number(kpi.open_orders) > 0 && (
        <Card style={{ marginTop: 24, padding: 16, background: T.warningBg, border: `1px solid ${T.warning}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.warning }}>
            ⚠️ {kpi.open_orders} pedido(s) em aberto aguardando o caixa
          </div>
        </Card>
      )}
    </div>
  );
}
