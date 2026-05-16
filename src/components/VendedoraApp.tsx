'use client';
// Vendedora — mobile flow. Ported from prototype vendedora-app.jsx, wired to real APIs.
import React from 'react';
import {
  T, Icon, Button, Input, Badge, Card, Avatar, ProductImg, Chip,
  EmptyState, OrderStatus, BottomSheet, fmtBRL, fmtDate, fmtTime, timeAgo,
} from './kit';

type Seller = { id: string; name: string; commissionPct: number };
type Variant = { id: string; size: string; color: string; stock: number; price: number | null };
type Product = { id: string; name: string; category: string; price: number; variants: Variant[] };
type Profile = { sizes: string[]; colors: string[]; categories: string[]; occasions: string[]; notes: string; totalSpent: number };
type Customer = { id: string; name: string; phone: string; profile: Profile };
type Category = { id: string; name: string };
type CartItem = { variantId: string; productId: string; name: string; size: string; color: string; price: number; qty: number };
type OrderItem = { name: string; size: string; color: string; price: number; qty: number };
type Order = {
  id: string; number: string; sellerId: string; customerId: string | null;
  customerName: string | null; customerPhone: string | null; items: OrderItem[];
  total: number; status: string; payment: string | null; createdAt: string;
  closedAt: string | null; commissionAmt: number | null;
};

const SIZES_OPTS = ['PP', 'P', 'M', 'G', 'GG'];
const COLORS_OPTS = ['Rosa', 'Azul', 'Preto', 'Branco', 'Verde', 'Bege'];
const OCCASIONS = ['Trabalho', 'Festas', 'Casual', 'Esporte', 'Praia'];
const TODAY = new Date().toISOString().slice(0, 10);

/* eslint-disable @typescript-eslint/no-explicit-any */
const normProduct = (r: any): Product => ({
  id: r.id, name: r.name, category: r.category_name || '—', price: Number(r.base_price),
  variants: (r.variants || []).map((v: any) => ({
    id: v.id, size: v.size || '—', color: v.color || '—', stock: v.stock_qty ?? 0,
    price: v.price_override != null ? Number(v.price_override) : null,
  })),
});
const normCustomer = (r: any): Customer => ({
  id: r.id, name: r.name, phone: r.phone || '',
  profile: {
    sizes: r.preferred_sizes || [], colors: r.preferred_colors || [],
    categories: r.preferred_categories || [], occasions: r.preferred_occasions || [],
    notes: r.notes || '', totalSpent: Number(r.total_spent || 0),
  },
});
const normOrder = (r: any): Order => ({
  id: r.id, number: r.order_number, sellerId: r.seller_id,
  customerId: r.customer_id, customerName: r.customer_name, customerPhone: r.customer_phone,
  items: (r.items || []).map((it: any) => ({
    name: it.product_name, size: it.size, color: it.color,
    price: Number(it.unit_price), qty: it.quantity,
  })),
  total: Number(r.total), status: r.status, payment: r.payment_method,
  createdAt: r.created_at, closedAt: r.closed_at,
  commissionAmt: r.commission_amt != null ? Number(r.commission_amt) : null,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

type Screen = 'home' | 'customers' | 'newCustomer' | 'profile' | 'products' | 'cart' | 'confirm' | 'orders' | 'orderDetail' | 'commissions';

export function VendedoraApp({ seller }: { seller: Seller }) {
  const [screen, setScreen] = React.useState<Screen>('home');
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [profileEditId, setProfileEditId] = React.useState<string | null>(null);
  const [viewOrderId, setViewOrderId] = React.useState<string | null>(null);
  const [lastOrder, setLastOrder] = React.useState<Order | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const loadCatalog = React.useCallback(async () => {
    const [pr, cu, ca] = await Promise.all([
      fetch('/api/products?pageSize=200').then((r) => r.json()),
      fetch('/api/customers?pageSize=200').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]);
    setProducts((pr.rows || []).map(normProduct));
    setCustomers((cu.rows || []).map(normCustomer));
    setCategories(ca.rows || []);
  }, []);
  const loadOrders = React.useCallback(async () => {
    const r = await fetch('/api/orders?pageSize=200').then((x) => x.json());
    setOrders((r.rows || []).map(normOrder));
  }, []);

  React.useEffect(() => { loadCatalog(); loadOrders(); }, [loadCatalog, loadOrders]);

  const goCustomers = () => { setCart([]); setSelectedCustomerId(null); setScreen('customers'); };
  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ customer_id: selectedCustomerId }),
      });
      const created = await res.json();
      for (const it of cart) {
        await fetch(`/api/orders/${created.id}/items`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ variant_id: it.variantId, quantity: it.qty }),
        });
      }
      const full = await fetch(`/api/orders/${created.id}`).then((r) => r.json());
      setLastOrder(normOrder(full));
      setCart([]);
      await loadOrders();
      await loadCatalog();
      setScreen('confirm');
    } finally {
      setSubmitting(false);
    }
  };

  const showTabs = ['home', 'orders', 'commissions'].includes(screen);
  let body: React.ReactNode;
  switch (screen) {
    case 'home':
      body = <VHome seller={seller} orders={orders} setScreen={setScreen}
        openOrder={(id) => { setViewOrderId(id); setScreen('orderDetail'); }} onNew={goCustomers} />;
      break;
    case 'customers':
      body = <VCustomers customers={customers} onBack={() => setScreen('home')}
        onPick={(id) => { setCart([]); setSelectedCustomerId(id); setScreen('products'); }}
        onProfile={(id) => { setProfileEditId(id); setScreen('profile'); }}
        onNew={() => setScreen('newCustomer')} />;
      break;
    case 'newCustomer':
      body = <VNewCustomer onBack={() => setScreen('customers')}
        onCreated={async (id) => { await loadCatalog(); setProfileEditId(id); setSelectedCustomerId(id); setScreen('profile'); }} />;
      break;
    case 'profile':
      body = <VProfile customerId={profileEditId!} customers={customers} categories={categories}
        onBack={() => setScreen('customers')}
        onSaved={async (id) => { await loadCatalog(); setCart([]); setSelectedCustomerId(id); setScreen('products'); }} />;
      break;
    case 'products':
      body = <VProducts products={products} categories={categories}
        customer={customers.find((c) => c.id === selectedCustomerId) || null}
        cart={cart} setCart={setCart}
        onBack={() => setScreen('customers')} onCart={() => setScreen('cart')}
        onProfile={(id) => { setProfileEditId(id); setScreen('profile'); }} />;
      break;
    case 'cart':
      body = <VCart cart={cart} setCart={setCart}
        customer={customers.find((c) => c.id === selectedCustomerId) || null}
        submitting={submitting}
        onBack={() => setScreen('products')} onSubmit={submitOrder} />;
      break;
    case 'confirm':
      body = <VConfirm order={lastOrder} onNew={goCustomers} onOrders={() => setScreen('orders')} />;
      break;
    case 'orders':
      body = <VOrders orders={orders} openOrder={(id) => { setViewOrderId(id); setScreen('orderDetail'); }} />;
      break;
    case 'orderDetail':
      body = <VOrderDetail order={orders.find((o) => o.id === viewOrderId) || null} onBack={() => setScreen('orders')} />;
      break;
    case 'commissions':
      body = <VCommissions seller={seller} orders={orders} />;
      break;
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.surface2,
      fontFamily: 'Inter, system-ui, sans-serif', color: T.text, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: showTabs ? 80 : 0 }}>{body}</div>
      {showTabs && <VTabBar active={screen} onNav={setScreen} />}
    </div>
  );
}

function VTabBar({ active, onNav }: { active: Screen; onNav: (s: Screen) => void }) {
  const tabs: { id: Screen; label: string; icon: 'cart' | 'bag' | 'money' }[] = [
    { id: 'home', label: 'Vender', icon: 'cart' },
    { id: 'orders', label: 'Pedidos', icon: 'bag' },
    { id: 'commissions', label: 'Comissões', icon: 'money' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 72,
      background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${T.border}`, display: 'flex', zIndex: 70,
    }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onNav(t.id)} style={{
          flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, color: active === t.id ? T.accent : T.textMuted, fontFamily: 'inherit', padding: '8px 0',
        }}>
          <Icon name={t.icon} size={22} strokeWidth={active === t.id ? 2.4 : 1.8} />
          <span style={{ fontSize: 10.5, fontWeight: active === t.id ? 600 : 500, letterSpacing: 0.1 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function VHeader({ title, onBack, right, step }: {
  title: string; onBack?: () => void; right?: React.ReactNode; step?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.border}`,
          background: T.surface, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: T.text, flexShrink: 0,
        }}><Icon name="chevronLeft" size={20} /></button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{title}</div>
        {step && <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, marginTop: 2 }}>Passo {step}</div>}
      </div>
      {right}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, margin: '4px 4px 8px' }}>{children}</div>;
}

// ─── V2: Home ───
function VHome({ seller, orders, openOrder, onNew }: {
  seller: Seller; orders: Order[]; setScreen: (s: Screen) => void;
  openOrder: (id: string) => void; onNew: () => void;
}) {
  const todayClosed = orders.filter((o) => o.status === 'closed' && (o.closedAt || '').startsWith(TODAY));
  const todaySold = todayClosed.reduce((s, o) => s + o.total, 0);
  const todayComm = todayClosed.reduce((s, o) => s + (o.commissionAmt || 0), 0);
  const open = orders.filter((o) => o.status === 'open');

  return (
    <div style={{ padding: '40px 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Avatar name={seller.name} color={T.accent} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.textMuted }}>Bom dia</div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{seller.name.split(' ')[0]}</div>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: T.surface,
          border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.text, cursor: 'pointer' }}><Icon name="bell" size={18} /></button>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${T.primary} 0%, #2D2D54 100%)`,
        borderRadius: 20, padding: 20, color: '#fff', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140,
          background: `radial-gradient(circle, ${T.accent}40 0%, transparent 70%)` }} />
        <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Hoje</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1 }}>{fmtBRL(todaySold)}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
          {todayClosed.length} pedidos fechados · {fmtBRL(todayComm)} de comissão
        </div>
      </div>

      <button onClick={onNew} style={{
        width: '100%', height: 88, borderRadius: 20, border: 'none',
        background: T.accent, color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
        boxShadow: '0 8px 24px rgba(233,30,140,.3)', marginBottom: 16, fontFamily: 'inherit',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={28} strokeWidth={2.4} />
        </div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Novo Pedido</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2, fontWeight: 500 }}>Buscar cliente para começar</div>
        </div>
        <Icon name="arrow" size={20} />
      </button>

      {open.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 4px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No Caixa</div>
          </div>
          {open.map((o) => (
            <Card key={o.id} onClick={() => openOrder(o.id)} hover style={{ marginBottom: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: T.warning }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{o.customerName || 'Sem cliente'}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                    {o.number} · {timeAgo(o.createdAt)} · {o.items.length} {o.items.length > 1 ? 'itens' : 'item'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtBRL(o.total)}</div>
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

// ─── V2.5: Customer search ───
function VCustomers({ customers, onBack, onPick, onProfile, onNew }: {
  customers: Customer[]; onBack: () => void; onPick: (id: string | null) => void;
  onProfile: (id: string) => void; onNew: () => void;
}) {
  const [q, setQ] = React.useState('');
  const filtered = customers.filter((c) =>
    !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));

  return (
    <div style={{ padding: '40px 0 0' }}>
      <div style={{ padding: '0 20px 16px' }}>
        <VHeader title="Cliente" onBack={onBack} step="1 de 2" />
        <Input value={q} onChange={setQ} placeholder="Buscar por nome ou telefone" icon="search" />
      </div>
      <div style={{ padding: '0 20px 24px' }}>
        {filtered.length === 0 && (
          <EmptyState icon="user" title="Nenhum cliente encontrado"
            subtitle="Tente outro nome ou cadastre um novo cliente." />
        )}
        {filtered.map((c) => (
          <Card key={c.id} hover style={{ marginBottom: 10, padding: 14 }} onClick={() => onPick(c.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={c.name} color={T.accent} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.name}
                  {c.profile.sizes.length > 0 && <Badge variant="accent" size="sm">{c.profile.sizes[0]}</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>
                  {c.phone} · Total: {fmtBRL(c.profile.totalSpent)}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onProfile(c.id); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.surface, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: T.textMuted, flexShrink: 0 }}>
                <Icon name="user" size={16} />
              </button>
            </div>
          </Card>
        ))}
        <button onClick={onNew} style={{
          width: '100%', marginTop: 12, padding: 14, borderRadius: 14,
          border: `1.5px dashed ${T.borderStrong}`, background: 'transparent',
          color: T.text, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 14, fontWeight: 600,
        }}><Icon name="plus" size={18} /> Cadastrar novo cliente</button>
        <button onClick={() => onPick(null)} style={{
          width: '100%', marginTop: 10, padding: 12, border: 'none', background: 'transparent',
          color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
          Pular — vender sem cliente
        </button>
      </div>
    </div>
  );
}

// ─── V3: New customer ───
function VNewCustomer({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true); setErr('');
    const res = await fetch('/api/customers', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
    });
    setSaving(false);
    if (!res.ok) { const e = await res.json(); setErr(e.error || 'Falha ao cadastrar'); return; }
    const c = await res.json();
    onCreated(c.id);
  };

  return (
    <div style={{ padding: '40px 20px 120px' }}>
      <VHeader title="Novo Cliente" onBack={onBack} />
      <div style={{ marginTop: 8 }}>
        <Label>Nome completo *</Label>
        <Input value={name} onChange={setName} placeholder="Ex: Ana Paula" autoFocus />
      </div>
      <div style={{ marginTop: 16 }}>
        <Label>Telefone *</Label>
        <Input value={phone} onChange={setPhone} placeholder="(41) 9 9999-0000" />
      </div>
      {err && <div style={{ color: T.danger, fontSize: 13, marginTop: 10 }}>{err}</div>}
      <div style={{ background: T.accentBg, borderRadius: 12, padding: 14, marginTop: 20,
        display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ color: T.accent, marginTop: 2 }}><Icon name="sparkle" size={18} /></div>
        <div style={{ fontSize: 13, color: '#831843', lineHeight: 1.5 }}>
          No próximo passo você poderá preencher o <b>perfil comprador</b>:
          tamanhos, cores e categorias favoritas para personalizar futuras vendas.
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
        padding: '12px 20px 28px', background: T.surface2, borderTop: `1px solid ${T.border}` }}>
        <Button variant="primary" size="lg" full disabled={!name.trim() || !phone.trim() || saving} onClick={submit}>
          {saving ? 'Salvando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
}

// ─── V4: Buyer profile ───
function VProfile({ customerId, customers, categories, onBack, onSaved }: {
  customerId: string; customers: Customer[]; categories: Category[];
  onBack: () => void; onSaved: (id: string) => void;
}) {
  const customer = customers.find((c) => c.id === customerId);
  const [draft, setDraft] = React.useState<Profile>(
    customer ? { ...customer.profile } : { sizes: [], colors: [], categories: [], occasions: [], notes: '', totalSpent: 0 });
  const [saving, setSaving] = React.useState(false);
  if (!customer) return null;

  const toggle = (key: 'sizes' | 'colors' | 'categories' | 'occasions', val: string) => {
    setDraft((d) => {
      const arr = d[key];
      return { ...d, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  };
  const save = async () => {
    setSaving(true);
    await fetch(`/api/customers/${customerId}/profile`, {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        preferred_sizes: draft.sizes, preferred_colors: draft.colors,
        preferred_categories: draft.categories, preferred_occasions: draft.occasions,
        notes: draft.notes,
      }),
    });
    setSaving(false);
    onSaved(customerId);
  };

  return (
    <div style={{ padding: '40px 20px 120px' }}>
      <VHeader title="Perfil Comprador" onBack={onBack} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
        padding: 14, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
        <Avatar name={customer.name} color={T.accent} size={48} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{customer.name}</div>
          <div style={{ fontSize: 12.5, color: T.textMuted }}>{customer.phone}</div>
        </div>
      </div>

      <Section title="Tamanhos">
        <ChipRow opts={SIZES_OPTS} selected={draft.sizes} onToggle={(v) => toggle('sizes', v)} />
      </Section>
      <Section title="Cores preferidas">
        <ChipRow opts={COLORS_OPTS} selected={draft.colors} onToggle={(v) => toggle('colors', v)} />
      </Section>
      <Section title="Categorias favoritas">
        <ChipRow opts={categories.map((c) => c.name)}
          selected={categories.filter((c) => draft.categories.includes(c.id)).map((c) => c.name)}
          onToggle={(v) => { const cat = categories.find((c) => c.name === v); if (cat) toggle('categories', cat.id); }} />
      </Section>
      <Section title="Ocasiões">
        <ChipRow opts={OCCASIONS} selected={draft.occasions} onToggle={(v) => toggle('occasions', v)} />
      </Section>
      <Section title="Observações">
        <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Aniversário, preferências, indicações..."
          style={{ width: '100%', minHeight: 80, padding: 14, fontSize: 14, fontFamily: 'inherit',
            border: `1px solid ${T.border}`, borderRadius: 12, outline: 'none', resize: 'none',
            background: T.surface, color: T.text, boxSizing: 'border-box' }} />
      </Section>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
        padding: '12px 20px 28px', background: T.surface2, borderTop: `1px solid ${T.border}` }}>
        <Button variant="primary" size="lg" full disabled={saving} onClick={save}>
          {saving ? 'Salvando...' : 'Salvar e continuar'}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 18 }}><Label>{title}</Label>{children}</div>;
}
function ChipRow({ opts, selected, onToggle }: { opts: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {opts.map((o) => <Chip key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>{o}</Chip>)}
    </div>
  );
}

// ─── V5: Products ───
function VProducts({ products, categories, customer, cart, setCart, onBack, onCart, onProfile }: {
  products: Product[]; categories: Category[]; customer: Customer | null;
  cart: CartItem[]; setCart: (c: CartItem[]) => void;
  onBack: () => void; onCart: () => void; onProfile: (id: string) => void;
}) {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState<string>('all');
  const [picker, setPicker] = React.useState<Product | null>(null);

  const catName = cat === 'all' ? null : categories.find((c) => c.id === cat)?.name;
  let list = products;
  if (catName) list = list.filter((p) => p.category === catName);
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const suggestedNames = customer
    ? categories.filter((c) => customer.profile.categories.includes(c.id)).map((c) => c.name) : [];
  const cartQty = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (p: Product, v: Variant) => {
    const price = v.price ?? p.price;
    const exists = cart.find((c) => c.variantId === v.id);
    if (exists) setCart(cart.map((c) => c.variantId === v.id ? { ...c, qty: c.qty + 1 } : c));
    else setCart([...cart, { productId: p.id, variantId: v.id, name: p.name, size: v.size, color: v.color, price, qty: 1 }]);
    setPicker(null);
  };

  return (
    <div style={{ padding: '40px 0 0' }}>
      <div style={{ padding: '0 20px 12px' }}>
        <VHeader title="Produtos" onBack={onBack} step="2 de 2"
          right={customer && (
            <button onClick={() => onProfile(customer.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999,
                border: 'none', background: T.accentBg, color: '#831843', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
              <Avatar name={customer.name} color={T.accent} size={20} />
              {customer.name.split(' ')[0]}
            </button>
          )} />
        <Input value={q} onChange={setQ} placeholder="Buscar produto" icon="search" />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 20px 14px' }} className="no-scrollbar">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>Todos</Chip>
        {categories.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>)}
      </div>

      {customer && suggestedNames.length > 0 && cat === 'all' && !q && (
        <div style={{ fontSize: 12, fontWeight: 600, color: T.accent, textTransform: 'uppercase',
          letterSpacing: 0.8, margin: '0 24px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="star" size={12} /> Sugestão para {customer.name.split(' ')[0]}
        </div>
      )}

      <div style={{ padding: '0 20px 140px', display: 'grid', gap: 10 }}>
        {list.length === 0 && <EmptyState icon="package" title="Nenhum produto" subtitle="Tente outra busca ou categoria." />}
        {list.map((p) => {
          const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
          const isSuggested = customer && suggestedNames.includes(p.category);
          return (
            <Card key={p.id} hover onClick={() => setPicker(p)} style={{ padding: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <ProductImg size={68} color={isSuggested ? T.accentSoft : '#E5E7EB'} label={p.name.split(' ')[0].toLowerCase()} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>
                    {p.category} · {p.variants.length} variantes
                    {totalStock <= 5 && <span style={{ color: T.warning, fontWeight: 600 }}> · Estoque baixo</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{fmtBRL(p.price)}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: T.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="plus" size={22} strokeWidth={2.4} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {picker && <VariantPicker product={picker} onClose={() => setPicker(null)} onPick={addToCart} />}

      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
          padding: '12px 20px 28px', background: T.surface2, borderTop: `1px solid ${T.border}` }}>
          <button onClick={onCart} style={{
            width: '100%', height: 56, borderRadius: 16, border: 'none', background: T.accent, color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, fontFamily: 'inherit',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{cartQty}</div>
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: 15 }}>Ver carrinho</span>
            <span style={{ fontWeight: 700, fontSize: 17 }}>{fmtBRL(cartTotal)}</span>
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

function VariantPicker({ product, onClose, onPick }: {
  product: Product; onClose: () => void; onPick: (p: Product, v: Variant) => void;
}) {
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const [size, setSize] = React.useState<string | null>(null);
  const [color, setColor] = React.useState<string | null>(null);
  const variant = product.variants.find((v) => v.size === size && v.color === color);

  return (
    <BottomSheet onClose={onClose} title="Escolher variante">
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <ProductImg size={70} label={product.name.split(' ')[0].toLowerCase()} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{product.name}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{fmtBRL(product.price)}</div>
        </div>
      </div>
      <Label>Tamanho</Label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {sizes.map((s) => <Chip key={s} active={size === s} onClick={() => setSize(s)}>{s}</Chip>)}
      </div>
      <Label>Cor</Label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {colors.map((c) => {
          const v = product.variants.find((x) => x.size === size && x.color === c);
          const disabled = !!size && (!v || v.stock === 0);
          return (
            <Chip key={c} active={color === c} onClick={() => !disabled && setColor(c)}
              color={disabled ? T.borderStrong : undefined}>
              {c}{disabled ? ' (esgotado)' : ''}
            </Chip>
          );
        })}
      </div>
      {variant && (
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 12 }}>
          Estoque: {variant.stock} {variant.stock <= 3 && <span style={{ color: T.warning, fontWeight: 600 }}>(baixo)</span>}
        </div>
      )}
      <Button variant="primary" size="lg" full disabled={!variant || variant.stock === 0}
        onClick={() => variant && onPick(product, variant)}>
        Adicionar ao carrinho
      </Button>
    </BottomSheet>
  );
}

// ─── V6: Cart ───
function VCart({ cart, setCart, customer, submitting, onBack, onSubmit }: {
  cart: CartItem[]; setCart: (c: CartItem[]) => void; customer: Customer | null;
  submitting: boolean; onBack: () => void; onSubmit: () => void;
}) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const updateQty = (variantId: string, delta: number) => {
    setCart(cart.map((c) => c.variantId === variantId ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
      .filter((c) => c.qty > 0));
  };
  return (
    <div style={{ padding: '40px 0 140px' }}>
      <div style={{ padding: '0 20px 16px' }}>
        <VHeader title="Carrinho" onBack={onBack} />
        {customer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12,
            background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 12 }}>
            <Avatar name={customer.name} color={T.accent} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{customer.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{customer.phone}</div>
            </div>
            <Badge variant="accent" size="sm">Cliente</Badge>
          </div>
        )}
      </div>
      <div style={{ padding: '0 20px', display: 'grid', gap: 10 }}>
        {cart.length === 0 && <EmptyState icon="cart" title="Carrinho vazio" subtitle="Volte e adicione produtos." />}
        {cart.map((item) => (
          <Card key={item.variantId} style={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ProductImg size={56} label={item.name.split(' ')[0].toLowerCase()} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Tam. {item.size} · {item.color}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{fmtBRL(item.price * item.qty)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.surface2, borderRadius: 999, padding: 4 }}>
                <button onClick={() => updateQty(item.variantId, -1)} style={qtyBtn}><Icon name="minus" size={14} /></button>
                <span style={{ minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{item.qty}</span>
                <button onClick={() => updateQty(item.variantId, 1)} style={qtyBtn}><Icon name="plus" size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
        {cart.length > 0 && (
          <Card style={{ marginTop: 6, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: T.textMuted }}>Total ({cart.length} {cart.length > 1 ? 'itens' : 'item'})</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{fmtBRL(total)}</div>
            </div>
          </Card>
        )}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
        padding: '12px 20px 28px', background: T.surface2, borderTop: `1px solid ${T.border}` }}>
        <Button variant="primary" size="lg" full icon="arrow" disabled={cart.length === 0 || submitting} onClick={onSubmit}>
          {submitting ? 'Enviando...' : 'Enviar para Caixa'}
        </Button>
      </div>
    </div>
  );
}
const qtyBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%', border: 'none', background: T.surface,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.text,
};

// ─── V7: Confirmation ───
function VConfirm({ order, onNew, onOrders }: { order: Order | null; onNew: () => void; onOrders: () => void }) {
  if (!order) return null;
  return (
    <div style={{ padding: '40px 20px 32px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: T.successBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name="check" size={48} color={T.success} strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, textAlign: 'center' }}>Pedido enviado!</div>
        <div style={{ fontSize: 14, color: T.textMuted, marginTop: 4, textAlign: 'center' }}>
          O caixa já está vendo o pedido na tela
        </div>
        <Card style={{ marginTop: 32, width: '100%', padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Número do pedido</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1, fontFamily: 'ui-monospace, SF Mono, monospace',
            color: T.accent, marginTop: 6 }}>{order.number}</div>
          <div style={{ borderTop: `1px solid ${T.border}`, margin: '16px 0', paddingTop: 16,
            display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cliente</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{order.customerName || 'Sem cliente'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{fmtBRL(order.total)}</div>
            </div>
          </div>
        </Card>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <Button variant="primary" size="lg" full onClick={onNew}>Novo Pedido</Button>
        <Button variant="ghost" size="lg" full onClick={onOrders}>Ver Meus Pedidos</Button>
      </div>
    </div>
  );
}

// ─── V8: Orders ───
function VOrders({ orders, openOrder }: { orders: Order[]; openOrder: (id: string) => void }) {
  const [tab, setTab] = React.useState<'all' | 'open' | 'closed'>('all');
  const mine = orders;
  const filtered = tab === 'all' ? mine : mine.filter((o) => o.status === tab);
  const today = mine.filter((o) => (o.createdAt || '').startsWith(TODAY));
  return (
    <div style={{ padding: '40px 0 0' }}>
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 16 }}>Meus Pedidos</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <StatPill label="Hoje" value={today.length} />
          <StatPill label="Aguardando" value={mine.filter((o) => o.status === 'open').length} accent />
          <StatPill label="Fechados" value={mine.filter((o) => o.status === 'closed').length} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {([{ id: 'all', l: 'Todos' }, { id: 'open', l: 'Aguardando' }, { id: 'closed', l: 'Fechados' }] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, height: 38, border: 'none', background: tab === t.id ? T.primary : T.surface,
              color: tab === t.id ? '#fff' : T.text, borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            }}>{t.l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 20px 24px', display: 'grid', gap: 10 }}>
        {filtered.length === 0 && <EmptyState icon="bag" title="Sem pedidos por aqui" subtitle="Faça um novo pedido para começar." />}
        {filtered.map((o) => (
          <Card key={o.id} hover onClick={() => openOrder(o.id)} style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2,
                background: o.status === 'open' ? T.warning : o.status === 'closed' ? T.success : T.danger }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{o.customerName || 'Sem cliente'}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{o.number} · {timeAgo(o.createdAt)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtBRL(o.total)}</div>
                <div style={{ marginTop: 4 }}><OrderStatus status={o.status} /></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
function StatPill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12,
      background: accent ? T.accentBg : T.surface, border: `1px solid ${accent ? 'transparent' : T.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: accent ? '#9D174D' : T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, color: accent ? '#9D174D' : T.text }}>{value}</div>
    </div>
  );
}

// ─── Order detail ───
function VOrderDetail({ order, onBack }: { order: Order | null; onBack: () => void }) {
  if (!order) return null;
  return (
    <div style={{ padding: '40px 20px 20px' }}>
      <VHeader title={order.number} onBack={onBack} right={<OrderStatus status={order.status} />} />
      {order.customerName && (
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={order.customerName} color={T.accent} size={40} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{order.customerName}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{order.customerPhone}</div>
            </div>
          </div>
        </Card>
      )}
      <Label>Itens ({order.items.length})</Label>
      {order.items.map((item, i) => (
        <Card key={i} style={{ padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ProductImg size={48} label={item.name.split(' ')[0].toLowerCase()} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>Tam. {item.size} · {item.color} · {item.qty}x</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtBRL(item.price * item.qty)}</div>
          </div>
        </Card>
      ))}
      <Card style={{ padding: 14, marginTop: 12 }}>
        <Row label="Total" value={fmtBRL(order.total)} strong />
        {order.status === 'closed' && (
          <>
            <Row label="Pagamento" value={order.payment || '—'} />
            <Row label="Comissão" value={fmtBRL(order.commissionAmt || 0)} color={T.accent} />
            {order.closedAt && <Row label="Fechado em" value={fmtTime(order.closedAt)} />}
          </>
        )}
      </Card>
    </div>
  );
}
function Row({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: strong ? 16 : 14 }}>
      <span style={{ color: T.textMuted }}>{label}</span>
      <span style={{ color: color || T.text, fontWeight: strong ? 700 : 600 }}>{value}</span>
    </div>
  );
}

// ─── V9: Commissions ───
function VCommissions({ seller, orders }: { seller: Seller; orders: Order[] }) {
  const closed = orders.filter((o) => o.status === 'closed');
  const monthSold = closed.reduce((s, o) => s + o.total, 0);
  const monthComm = closed.reduce((s, o) => s + (o.commissionAmt || 0), 0);
  return (
    <div style={{ padding: '40px 20px 20px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 4 }}>Minhas Comissões</div>
      <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>Maio 2026 · Comissão {seller.commissionPct}%</div>
      <Card style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ padding: 18, background: T.surface2 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Vendido este mês</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 4 }}>{fmtBRL(monthSold)}</div>
        </div>
        <div style={{ padding: 18, borderTop: `1px solid ${T.border}`,
          background: `linear-gradient(135deg, ${T.accent}, #C9197A)`, color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.8 }}>A receber</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, marginTop: 4 }}>{fmtBRL(monthComm)}</div>
        </div>
      </Card>
      <Label>Últimos pedidos fechados</Label>
      <div style={{ display: 'grid', gap: 8, paddingBottom: 12 }}>
        {closed.length === 0 && <EmptyState icon="money" title="Sem comissões ainda" subtitle="Feche pedidos para acumular comissão." />}
        {closed.map((o) => (
          <Card key={o.id} style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{o.customerName || 'Sem cliente'}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{o.number} · {o.closedAt ? fmtDate(o.closedAt) : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtBRL(o.total)}</div>
                <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginTop: 2 }}>+ {fmtBRL(o.commissionAmt || 0)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
