'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { OrderStatus } from '@/components/OrderStatus';
import { fmtBRL, timeAgo } from '@/lib/format';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  items: Array<{ product_name: string }>;
}

export default function VendedoraPedidos() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders?pageSize=50')
      .then((r) => r.json())
      .then((d) => { setOrders(d.rows ?? []); setLoading(false); });
  }, []);

  return (
    <div style={{ padding: '56px 20px 100px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Meus Pedidos</div>

      {loading && <div style={{ textAlign: 'center', color: T.textMuted, paddingTop: 40 }}>Carregando...</div>}

      {!loading && orders.length === 0 && (
        <Card style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Nenhum pedido ainda</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
            Crie seu primeiro pedido na aba Vender.
          </div>
        </Card>
      )}

      {orders.map((o) => (
        <Card key={o.id} hover style={{ marginBottom: 10, padding: 14 }}
          onClick={() => router.push(`/vendedora/pedidos/${o.id}`)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <OrderStatus status={o.status as 'open' | 'closed' | 'cancelled'} />
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
                {o.customer_name ?? 'Sem cliente'}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontFamily: 'monospace' }}>
                {o.order_number}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtBRL(Number(o.total))}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{timeAgo(o.created_at)}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
