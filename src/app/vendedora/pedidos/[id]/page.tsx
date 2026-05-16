'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { OrderStatus } from '@/components/OrderStatus';
import { fmtBRL, fmtDate } from '@/lib/format';
import { Suspense } from 'react';
import { CheckCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  commission_pct: number | null;
  commission_amt: number | null;
  payment_method: string | null;
  created_at: string;
  closed_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  items: OrderItem[];
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito', outro: 'Outro',
};

function PedidoDetailInner({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConfirmed = searchParams.get('confirmado') === '1';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Carregando...</div>;
  }
  if (!order) {
    return <div style={{ padding: 40, textAlign: 'center', color: T.danger }}>Pedido não encontrado.</div>;
  }

  const items: OrderItem[] = order.items ?? [];

  return (
    <div style={{ padding: '56px 20px 100px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/vendedora/pedidos')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.text, padding: 4 }}>‹</button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Pedido</div>
          <div style={{ fontSize: 12, color: T.textMuted, fontFamily: 'monospace' }}>{order.order_number}</div>
        </div>
      </div>

      {isConfirmed && order.status === 'open' && (
        <Card style={{ padding: 16, marginBottom: 16, background: T.successBg, border: `1px solid ${T.success}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={20} color={T.success} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.success }}>Pedido enviado ao caixa!</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>Aguardando atendimento.</div>
            </div>
          </div>
        </Card>
      )}

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <OrderStatus status={order.status as 'open' | 'closed' | 'cancelled'} />
          <div style={{ fontSize: 12, color: T.textMuted }}>{fmtDate(order.created_at)}</div>
        </div>
        <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>
          {order.customer_name ?? 'Sem cliente'}
        </div>
        {order.customer_phone && (
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{order.customer_phone}</div>
        )}
        {order.payment_method && (
          <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
            Pagamento: <strong>{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</strong>
          </div>
        )}
      </Card>

      <div style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        Itens ({items.length})
      </div>
      {items.map((item) => (
        <Card key={item.id} style={{ padding: '10px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.product_name}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{item.size} · {item.color} · {item.quantity}x</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtBRL(Number(item.subtotal))}</div>
          </div>
        </Card>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `2px solid ${T.primary}`, paddingTop: 12, margin: '16px 0' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.textMuted }}>Total</span>
        <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>{fmtBRL(Number(order.total))}</span>
      </div>

      {order.status === 'closed' && order.commission_amt != null && (
        <Card style={{ padding: 14, background: T.accentBg, border: `1px solid ${T.accentSoft}` }}>
          <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Sua comissão ({order.commission_pct}%)
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.accent, marginTop: 4 }}>
            {fmtBRL(Number(order.commission_amt))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function PedidoDetail({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <PedidoDetailInner params={params} />
    </Suspense>
  );
}
