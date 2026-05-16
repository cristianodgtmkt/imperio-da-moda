'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { OrderStatus } from '@/components/OrderStatus';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { fmtBRL, timeAgo } from '@/lib/format';
import { RefreshCw, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  seller_name: string;
  items: Array<{ product_name: string; size: string; color: string; quantity: number }>;
}

export function CaixaList() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  async function fetchOrders() {
    const res = await fetch('/api/orders/pending');
    const data = await res.json();
    setOrders(data.rows ?? []);
    setLastUpdate(new Date());
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const secAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Pedidos aguardando</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>
            Atualizando automaticamente · há {secAgo}s
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="md" onClick={fetchOrders}>
          <RefreshCw size={16} /> Atualizar
        </Button>
      </div>

      {orders.length === 0 && (
        <Card style={{ padding: 60, textAlign: 'center' }}>
          <CheckCircle size={48} color={T.success} style={{ margin: '0 auto 16px', display: 'block' }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Nenhum pedido pendente</div>
          <div style={{ fontSize: 14, color: T.textMuted, marginTop: 4 }}>Quando uma vendedora enviar um pedido, ele aparece aqui.</div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {orders.map((o) => {
          const waited = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
          const urgent = waited >= 10;
          return (
            <div key={o.id} style={{
              background: T.surface, borderRadius: 16,
              border: `2px solid ${urgent ? T.warning : T.border}`,
              padding: 20, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: T.warning }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <OrderStatus status="open" />
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, fontFamily: 'monospace' }}>{o.order_number}</div>
                </div>
                <div style={{ fontSize: 12, color: urgent ? T.warning : T.textMuted, fontWeight: 600 }}>
                  {timeAgo(o.created_at)}
                </div>
              </div>

              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>
                {o.customer_name ?? 'Sem cliente identificado'}
              </div>
              {o.customer_phone && (
                <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{o.customer_phone}</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, color: T.textMuted }}>
                <Avatar name={o.seller_name} color="#8B5CF6" size={20} />
                <span>{o.seller_name.split(' ')[0]}</span>
                <span>·</span>
                <span>{o.items?.length ?? 0} {(o.items?.length ?? 0) > 1 ? 'itens' : 'item'}</span>
              </div>

              <div style={{ borderTop: `1px dashed ${T.border}`, margin: '14px 0 12px' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6 }}>{fmtBRL(Number(o.total))}</div>
                </div>
                <Button variant="primary" size="lg" onClick={() => router.push(`/caixa/${o.id}`)}>
                  Atender →
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
