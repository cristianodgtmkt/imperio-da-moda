'use client';
import { useState, useEffect } from 'react';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { OrderStatus } from '@/components/OrderStatus';
import { Badge } from '@/components/ui/Badge';
import { fmtBRL, fmtDate } from '@/lib/format';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  commission_amt: number | null;
  payment_method: string | null;
  created_at: string;
  closed_at: string | null;
  customer_name: string | null;
  seller_name: string;
  items: Array<{ product_name: string; quantity: number }>;
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito', outro: 'Outro',
};

export default function DonoVendas() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(page) });
    if (status) params.set('status', status);
    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.rows ?? []);
        setTotal(0);
        setLoading(false);
      });
  }, [status, page]);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Vendas</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'open', 'closed', 'cancelled'].map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: status === s ? T.primary : T.surface,
              color: status === s ? '#fff' : T.textMuted,
              border: `1px solid ${T.border}`,
            }}>
              {s === '' ? 'Todos' : s === 'open' ? 'Abertos' : s === 'closed' ? 'Fechados' : 'Cancelados'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: T.textMuted, padding: 60 }}>Carregando...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Pedido', 'Cliente', 'Vendedora', 'Itens', 'Total', 'Pagamento', 'Status', 'Data'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12,
                    color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 13 }}>{o.order_number}</td>
                  <td style={{ padding: '10px 12px' }}>{o.customer_name ?? '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{o.seller_name?.split(' ')[0]}</td>
                  <td style={{ padding: '10px 12px', color: T.textMuted }}>{o.items?.length ?? 0}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{fmtBRL(Number(o.total))}</td>
                  <td style={{ padding: '10px 12px', color: T.textMuted }}>
                    {o.payment_method ? PAYMENT_LABELS[o.payment_method] ?? o.payment_method : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <OrderStatus status={o.status as 'open' | 'closed' | 'cancelled'} />
                  </td>
                  <td style={{ padding: '10px 12px', color: T.textMuted, fontSize: 12 }}>
                    {fmtDate(o.closed_at ?? o.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div style={{ textAlign: 'center', color: T.textMuted, padding: 60 }}>Nenhum pedido encontrado.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.surface, cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          ‹ Anterior
        </button>
        <span style={{ padding: '6px 12px', fontSize: 14, color: T.textMuted }}>Pág {page}</span>
        <button disabled={orders.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}
          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.surface, cursor: orders.length < PAGE_SIZE ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          Próxima ›
        </button>
      </div>
    </div>
  );
}
