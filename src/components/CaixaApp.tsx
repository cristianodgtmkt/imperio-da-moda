'use client';
// Caixa — tablet flow. Ported from prototype caixa-app.jsx, wired to real APIs.
import React from 'react';
import {
  T, Icon, Button, Card, Avatar, ProductImg, EmptyState, OrderStatus, fmtBRL, timeAgo,
} from './kit';

/* eslint-disable @typescript-eslint/no-explicit-any */
type OItem = { name: string; size: string; color: string; price: number; qty: number };
type Order = {
  id: string; number: string; customerName: string | null; customerPhone: string | null;
  sellerName: string; items: OItem[]; total: number; status: string;
  payment: string | null; commissionAmt: number | null; createdAt: string;
};
const normOrder = (r: any): Order => ({
  id: r.id, number: r.order_number, customerName: r.customer_name, customerPhone: r.customer_phone,
  sellerName: r.seller_name || 'Vendedora',
  items: (r.items || []).map((it: any) => ({
    name: it.product_name, size: it.size, color: it.color, price: Number(it.unit_price), qty: it.quantity,
  })),
  total: Number(r.total), status: r.status, payment: r.payment_method,
  commissionAmt: r.commission_amt != null ? Number(r.commission_amt) : null, createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const PAYMENTS: { id: string; label: string; icon: 'sparkle' | 'money' | 'cart'; sub: string }[] = [
  { id: 'pix', label: 'PIX', icon: 'sparkle', sub: 'Aprovação instantânea' },
  { id: 'dinheiro', label: 'Dinheiro', icon: 'money', sub: 'Em espécie' },
  { id: 'debito', label: 'Cartão Débito', icon: 'cart', sub: 'À vista' },
  { id: 'credito', label: 'Cartão Crédito', icon: 'cart', sub: 'Até 3x sem juros' },
];
const TODAY = new Date().toISOString().slice(0, 10);

export function CaixaApp({ cashierName }: { cashierName: string }) {
  const [screen, setScreen] = React.useState<'list' | 'detail' | 'confirm'>('list');
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [closedToday, setClosedToday] = React.useState(0);
  const [active, setActive] = React.useState<Order | null>(null);
  const [lastClosed, setLastClosed] = React.useState<Order | null>(null);

  const load = React.useCallback(async () => {
    const [pend, closed] = await Promise.all([
      fetch('/api/orders/pending').then((r) => r.json()),
      fetch(`/api/orders?status=closed&date_from=${TODAY}&pageSize=200`).then((r) => r.json()),
    ]);
    setOrders((pend.rows || []).map(normOrder));
    setClosedToday((closed.rows || []).length);
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(() => { if (screen === 'list') load(); }, 10000);
    return () => clearInterval(id);
  }, [load, screen]);

  const closeOrder = async (payment: string) => {
    if (!active) return;
    const res = await fetch(`/api/orders/${active.id}/close`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payment_method: payment }),
    });
    if (!res.ok) return;
    const closed = await res.json();
    setLastClosed({
      ...active, payment, status: 'closed',
      total: Number(closed.total),
      commissionAmt: closed.commission_amt != null ? Number(closed.commission_amt) : null,
    });
    await load();
    setScreen('confirm');
  };
  const cancelOrder = async () => {
    if (!active) return;
    await fetch(`/api/orders/${active.id}/cancel`, { method: 'POST' });
    await load();
    setScreen('list');
  };

  return (
    <div style={{ height: '100dvh', background: T.surface2, fontFamily: 'Inter, system-ui, sans-serif',
      color: T.text, display: 'flex', flexDirection: 'column' }}>
      <CaixaHeader pending={orders.length} closedToday={closedToday} cashierName={cashierName} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {screen === 'list' && <CaixaList orders={orders} onOpen={(o) => { setActive(o); setScreen('detail'); }} onRefresh={load} />}
        {screen === 'detail' && active && (
          <CaixaDetail order={active} onBack={() => setScreen('list')} onClose={closeOrder} onCancel={cancelOrder} />
        )}
        {screen === 'confirm' && lastClosed && (
          <CaixaConfirm order={lastClosed} onNext={() => setScreen('list')} />
        )}
      </div>
    </div>
  );
}

function CaixaHeader({ pending, closedToday, cashierName }: { pending: number; closedToday: number; cashierName: string }) {
  return (
    <div style={{ background: T.primary, color: '#fff', padding: '14px 24px',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>I</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>Império da Moda</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Caixa</div>
        </div>
      </div>
      <div style={{ height: 28, width: 1, background: 'rgba(255,255,255,.15)' }} />
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Aguardando</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: pending > 0 ? T.warning : '#fff' }}>{pending}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Fechados hoje</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{closedToday}</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: T.success }} />
        <div style={{ fontSize: 12, opacity: 0.7 }}>Sincronizado</div>
      </div>
      <Avatar name={cashierName} color={T.accent} size={32} />
    </div>
  );
}

function CaixaList({ orders, onOpen, onRefresh }: { orders: Order[]; onOpen: (o: Order) => void; onRefresh: () => void }) {
  const pending = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Pedidos aguardando</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="refresh" size={14} /> Atualizando automaticamente a cada 10s
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" icon="refresh" size="md" onClick={onRefresh}>Atualizar</Button>
      </div>

      {pending.length === 0 && (
        <Card style={{ padding: 40 }}>
          <EmptyState icon="bag" title="Nenhum pedido pendente"
            subtitle="Quando uma vendedora enviar um pedido, ele aparece aqui." />
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {pending.map((o) => {
          const waited = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
          const urgent = waited >= 10;
          return (
            <div key={o.id} style={{ background: T.surface, borderRadius: 16,
              border: `2px solid ${urgent ? T.warning : T.border}`, padding: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: T.warning }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <OrderStatus status="open" />
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, fontFamily: 'ui-monospace, SF Mono, monospace' }}>{o.number}</div>
                </div>
                <div style={{ fontSize: 12, color: urgent ? T.warning : T.textMuted, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="clock" size={14} /> {timeAgo(o.createdAt)}
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>{o.customerName || 'Sem cliente identificado'}</div>
              {o.customerPhone && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{o.customerPhone}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 13, color: T.textMuted }}>
                <Avatar name={o.sellerName} color={T.accent} size={20} />
                <span>{o.sellerName.split(' ')[0]}</span><span>·</span>
                <span>{o.items.length} {o.items.length > 1 ? 'itens' : 'item'}</span>
              </div>
              <div style={{ borderTop: `1px dashed ${T.border}`, margin: '16px 0 14px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6 }}>{fmtBRL(o.total)}</div>
                </div>
                <Button variant="primary" size="lg" icon="arrow" onClick={() => onOpen(o)}>Atender</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CaixaDetail({ order, onBack, onClose, onCancel }: {
  order: Order; onBack: () => void; onClose: (p: string) => void; onCancel: () => void;
}) {
  const [payment, setPayment] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)',
      gap: 20, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.border}`,
            background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text }}>
            <Icon name="chevronLeft" size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4 }}>Pedido {order.number}</div>
          </div>
          <OrderStatus status={order.status} />
        </div>

        <Card style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Cliente</div>
          {order.customerName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={order.customerName} color={T.accent} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{order.customerName}</div>
                <div style={{ fontSize: 13, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Icon name="phone" size={13} /> {order.customerPhone || '—'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.textMuted }}>
              <Icon name="user" size={20} /><span>Cliente não identificado</span>
            </div>
          )}
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Itens · {order.items.length}</div>
            <div style={{ fontSize: 12, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar name={order.sellerName} color={T.accent} size={18} /> Vendedora: {order.sellerName}
            </div>
          </div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0',
              borderBottom: i < order.items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <ProductImg size={48} label={item.name.split(' ')[0].toLowerCase()} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Tam. {item.size} · {item.color}</div>
              </div>
              <div style={{ fontSize: 13, color: T.textMuted }}>{item.qty}x</div>
              <div style={{ fontSize: 15, fontWeight: 700, width: 90, textAlign: 'right' }}>{fmtBRL(item.price * item.qty)}</div>
            </div>
          ))}
          <div style={{ borderTop: `2px solid ${T.primary}`, marginTop: 12, paddingTop: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.textMuted }}>Total a pagar</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8 }}>{fmtBRL(order.total)}</div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Forma de pagamento</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PAYMENTS.map((p) => (
              <button key={p.id} onClick={() => setPayment(p.id)} style={{
                padding: 16, borderRadius: 14, cursor: 'pointer',
                background: payment === p.id ? T.accent : T.surface,
                border: payment === p.id ? '2px solid transparent' : `2px solid ${T.border}`,
                color: payment === p.id ? '#fff' : T.text, textAlign: 'left', fontFamily: 'inherit',
                transition: 'all .15s', position: 'relative',
              }}>
                <div style={{ marginBottom: 8 }}><Icon name={p.icon} size={20} /></div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{p.label}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{p.sub}</div>
                {payment === p.id && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11,
                    background: '#fff', color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={14} strokeWidth={2.6} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Observação (opcional)</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: troco de R$50, parcelas..."
            style={{ width: '100%', minHeight: 60, padding: 12, fontSize: 13, fontFamily: 'inherit',
              border: `1px solid ${T.border}`, borderRadius: 12, outline: 'none', resize: 'none',
              background: T.surface, color: T.text, boxSizing: 'border-box' }} />
        </div>

        <Card style={{ padding: 14, background: T.accentBg, border: `1px solid ${T.accentSoft}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="sparkle" size={18} color="#831843" />
            <div style={{ flex: 1, fontSize: 12.5, color: '#831843', lineHeight: 1.4 }}>
              Ao fechar, a comissão da vendedora <b>{order.sellerName.split(' ')[0]}</b> será creditada automaticamente.
            </div>
          </div>
        </Card>

        <Button variant="success" size="lg" full disabled={!payment || busy} icon="check"
          onClick={async () => { if (!payment) return; setBusy(true); await onClose(payment); }}>
          Fechar Pedido · {fmtBRL(order.total)}
        </Button>
        <Button variant="danger" size="md" full onClick={onCancel}>Cancelar pedido</Button>
      </div>
    </div>
  );
}

function CaixaConfirm({ order, onNext }: { order: Order; onNext: () => void }) {
  const payLabel = PAYMENTS.find((p) => p.id === order.payment)?.label || order.payment || '—';
  return (
    <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: 120, height: 120, borderRadius: 60, background: T.successBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Icon name="check" size={64} color={T.success} strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.7 }}>Pedido fechado!</div>
      <div style={{ fontSize: 15, color: T.textMuted, marginTop: 6 }}>
        {order.customerName || 'Cliente'} · {payLabel}
      </div>
      <Card style={{ marginTop: 32, padding: 24, minWidth: 320, maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Total recebido</div>
        <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.2, margin: '8px 0' }}>{fmtBRL(order.total)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Pedido</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, fontFamily: 'ui-monospace, SF Mono, monospace' }}>{order.number}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Vendedora</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{order.sellerName.split(' ')[0]}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Comissão</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: T.accent }}>{fmtBRL(order.commissionAmt || 0)}</div>
          </div>
        </div>
      </Card>
      <div style={{ marginTop: 32 }}>
        <Button variant="primary" size="lg" onClick={onNext} icon="arrow">Próximo atendimento</Button>
      </div>
    </div>
  );
}
