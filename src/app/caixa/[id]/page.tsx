'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fmtBRL } from '@/lib/format';
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
  customer_name: string | null;
  customer_phone: string | null;
  seller_name: string;
  payment_method: string | null;
  items: OrderItem[];
}

const PAYMENT_OPTIONS = [
  { value: 'pix', label: 'Pix', emoji: '📱' },
  { value: 'dinheiro', label: 'Dinheiro', emoji: '💵' },
  { value: 'debito', label: 'Débito', emoji: '💳' },
  { value: 'credito', label: 'Crédito', emoji: '💳' },
  { value: 'outro', label: 'Outro', emoji: '📋' },
];

export default function CaixaDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [closing, setClosing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d); setLoading(false); });
  }, [params.id]);

  async function handleClose() {
    if (!payment) return;
    setClosing(true);
    const res = await fetch(`/api/orders/${params.id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method: payment, payment_notes: paymentNotes }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push('/caixa'), 2500);
    } else {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Carregando...</div>
    );
  }

  if (!order) {
    return <div style={{ padding: 40, textAlign: 'center', color: T.danger }}>Pedido não encontrado.</div>;
  }

  if (done) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <CheckCircle size={64} color={T.success} style={{ margin: '0 auto 16px' }} />
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Pedido fechado!</div>
        <div style={{ fontSize: 14, color: T.textMuted }}>Redirecionando...</div>
      </div>
    );
  }

  const items: OrderItem[] = order.items ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/caixa')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.text, padding: 4 }}>‹</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Fechar Pedido</div>
          <div style={{ fontSize: 12, color: T.textMuted, fontFamily: 'monospace' }}>{order.order_number}</div>
        </div>
      </div>

      {/* Customer + Seller */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{order.customer_name ?? 'Sem cliente'}</div>
        {order.customer_phone && (
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{order.customer_phone}</div>
        )}
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8 }}>
          Vendedora: <strong>{order.seller_name}</strong>
        </div>
      </Card>

      {/* Items */}
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

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `2px solid ${T.primary}`, paddingTop: 12, margin: '16px 0' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.textMuted }}>Total</span>
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6 }}>{fmtBRL(Number(order.total))}</span>
      </div>

      {/* Payment method */}
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        Forma de Pagamento
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {PAYMENT_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setPayment(opt.value)} style={{
            padding: '14px 8px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            border: `2px solid ${payment === opt.value ? T.accent : T.border}`,
            background: payment === opt.value ? T.accentBg : T.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 22 }}>{opt.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: payment === opt.value ? T.accent : T.text }}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {payment === 'credito' && (
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Nº de parcelas (ex: 3x)"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      <Button variant="success" size="lg" full disabled={!payment} loading={closing} onClick={handleClose}>
        Confirmar Fechamento → {payment ? fmtBRL(Number(order.total)) : ''}
      </Button>

      <div style={{ marginTop: 12 }}>
        <Button variant="ghost" size="md" full onClick={async () => {
          await fetch(`/api/orders/${params.id}/cancel`, { method: 'POST' });
          router.push('/caixa');
        }}>
          Cancelar Pedido
        </Button>
      </div>
    </div>
  );
}
