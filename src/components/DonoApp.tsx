'use client';
// Dono — desktop flow. Ported from prototype dono-app.jsx, wired to real APIs.
import React from 'react';
import { useRouter } from 'next/navigation';
import { T, Icon, Button, Input, Badge, Card, Avatar, ProductImg, OrderStatus, fmtBRL, timeAgo } from './kit';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Variant = { id: string; size: string; color: string; stock: number; priceOverride: number | null; active: boolean };
type Product = { id: string; name: string; categoryId: string | null; category: string; price: number; variants: Variant[]; active: boolean };
type Category = { id: string; name: string };
type Order = {
  id: string; number: string; customerName: string | null; sellerName: string;
  items: number; total: number; status: string; payment: string | null; createdAt: string;
};
type Person = { id: string; name: string; phone: string; role: string; commissionPct: number; active: boolean };
type CommRow = { id: string; name: string; commissionPct: number; closedOrders: number; revenue: number; commission: number };
type Summary = { closedOrders: number; openOrders: number; revenue: number; commissions: number; avgTicket: number };

const PALETTE = ['#E91E8C', '#8B5CF6', '#3B82F6', '#F59E0B', '#22C55E', '#EF4444', '#0EA5E9'];
const colorFor = (i: number) => PALETTE[i % PALETTE.length];
const SIZES_OPTS = ['PP', 'P', 'M', 'G', 'GG'];
const COLORS_OPTS = ['Rosa', 'Azul', 'Preto', 'Branco', 'Verde', 'Bege'];

const normProduct = (r: any): Product => ({
  id: r.id, name: r.name, categoryId: r.category_id ?? null, category: r.category_name || '—',
  price: Number(r.base_price), active: r.active ?? true,
  variants: (r.variants || []).map((v: any) => ({
    id: v.id, size: v.size || 'M', color: v.color || 'Rosa', stock: v.stock_qty ?? 0,
    priceOverride: v.price_override != null ? Number(v.price_override) : null, active: v.active ?? true,
  })),
});
const normOrder = (r: any): Order => ({
  id: r.id, number: r.order_number, customerName: r.customer_name, sellerName: r.seller_name || '—',
  items: (r.items || []).length, total: Number(r.total), status: r.status,
  payment: r.payment_method, createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

type Page = 'dashboard' | 'vendas' | 'comissoes' | 'produtos' | 'categorias' | 'equipe' | 'integracao';

export function DonoApp({ ownerName }: { ownerName: string }) {
  const router = useRouter();
  const [page, setPage] = React.useState<Page>('dashboard');
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [salesByDay, setSalesByDay] = React.useState<{ day: string; revenue: number }[]>([]);
  const [comm, setComm] = React.useState<CommRow[]>([]);

  const load = React.useCallback(async () => {
    const [or, pr, ca, us, rep] = await Promise.all([
      fetch('/api/orders?pageSize=300').then((r) => r.json()),
      fetch('/api/products?pageSize=300&includeInactive=true').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/reports').then((r) => r.json()),
    ]);
    setOrders((or.rows || []).map(normOrder));
    setProducts((pr.rows || []).map(normProduct));
    setCategories(ca.rows || []);
    setPeople((us.rows || []).map((u: any) => ({  // eslint-disable-line @typescript-eslint/no-explicit-any
      id: u.id, name: u.name, phone: u.phone, role: u.role,
      commissionPct: Number(u.commission_pct || 0), active: u.active,
    })));
    if (rep.summary) {
      const s = rep.summary;
      setSummary({
        closedOrders: Number(s.closed_orders), openOrders: Number(s.open_orders),
        revenue: Number(s.total_revenue), commissions: Number(s.total_commissions),
        avgTicket: Number(s.avg_ticket),
      });
    }
    setSalesByDay((rep.salesByDay || []).map((d: any) => ({  // eslint-disable-line @typescript-eslint/no-explicit-any
      day: String(d.day).slice(8, 10), revenue: Number(d.revenue),
    })));
    setComm((rep.commissions || []).map((c: any) => ({  // eslint-disable-line @typescript-eslint/no-explicit-any
      id: c.id, name: c.name, commissionPct: Number(c.commission_pct || 0),
      closedOrders: Number(c.closed_orders || 0), revenue: Number(c.total_revenue || 0),
      commission: Number(c.commission_amt || 0),
    })));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const items: { id: Page; label: string; icon: 'home' | 'chart' | 'money' | 'package' | 'grid' | 'users' | 'refresh' }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'vendas', label: 'Vendas', icon: 'chart' },
    { id: 'comissoes', label: 'Comissões', icon: 'money' },
    { id: 'produtos', label: 'Produtos', icon: 'package' },
    { id: 'categorias', label: 'Categorias', icon: 'grid' },
    { id: 'equipe', label: 'Equipe', icon: 'users' },
    { id: 'integracao', label: 'Integração', icon: 'refresh' },
  ];

  return (
    <div style={{ height: '100dvh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif',
      color: T.text, background: T.surface2 }}>
      <div style={{ width: 232, background: T.primary, color: '#fff', padding: '20px 14px',
        display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 24px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>I</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>Império da Moda</div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>Painel administrativo</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((it) => (
            <button key={it.id} onClick={() => setPage(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
              border: 'none', cursor: 'pointer',
              background: page === it.id ? 'rgba(255,255,255,.08)' : 'transparent',
              color: page === it.id ? '#fff' : 'rgba(255,255,255,.6)',
              fontSize: 13.5, fontWeight: page === it.id ? 600 : 500, fontFamily: 'inherit', textAlign: 'left',
            }}>
              <Icon name={it.icon} size={18} />{it.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ padding: 12, background: 'rgba(255,255,255,.05)', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={ownerName} color={T.accent} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{ownerName}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Proprietário</div>
          </div>
          <button onClick={() => router.push('/api/auth/signout')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}>
            <Icon name="logout" size={16} color="rgba(255,255,255,.5)" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {page === 'dashboard' && <DDashboard summary={summary} salesByDay={salesByDay} comm={comm} orders={orders} products={products} onNav={setPage} />}
        {page === 'vendas' && <DVendas orders={orders} />}
        {page === 'comissoes' && <DComissoes comm={comm} />}
        {page === 'produtos' && <DProdutos products={products} categories={categories} reload={load} />}
        {page === 'categorias' && <DCategorias categories={categories} products={products} reload={load} />}
        {page === 'equipe' && <DEquipe people={people} orders={orders} comm={comm} reload={load} />}
        {page === 'integracao' && <DIntegracao />}
      </div>
    </div>
  );
}

function PageHead({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {right && <div style={{ display: 'flex', gap: 8 }}>{right}</div>}
    </div>
  );
}

function KPI({ label, value, delta, icon, accent, warn, onClick }: {
  label: string; value: string | number; delta?: string;
  icon: 'money' | 'chart' | 'bell' | 'bag' | 'users'; accent?: boolean; warn?: boolean; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      background: accent ? `linear-gradient(135deg, ${T.primary} 0%, #2D2D54 100%)` : T.surface,
      color: accent ? '#fff' : T.text, borderRadius: 16, padding: 18,
      border: accent ? 'none' : `1px solid ${T.border}`,
      cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden',
    }}>
      {accent && <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100,
        background: `radial-gradient(circle, ${T.accent}50, transparent 70%)` }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase',
          color: accent ? 'rgba(255,255,255,.7)' : T.textMuted }}>{label}</div>
        <div style={{ color: accent ? T.accent : (warn ? T.warning : T.textMuted), width: 28, height: 28, borderRadius: 8,
          background: accent ? 'rgba(255,255,255,.1)' : (warn ? T.warningBg : T.surface2),
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={16} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1 }}>{value}</div>
      {delta && <div style={{ fontSize: 12, marginTop: 6,
        color: accent ? 'rgba(255,255,255,.7)' : (warn ? T.warning : T.success), fontWeight: 600 }}>{delta}</div>}
    </div>
  );
}

function DDashboard({ summary, salesByDay, comm, orders, products, onNav }: {
  summary: Summary | null; salesByDay: { day: string; revenue: number }[]; comm: CommRow[];
  orders: Order[]; products: Product[]; onNav: (p: Page) => void;
}) {
  const s = summary || { closedOrders: 0, openOrders: 0, revenue: 0, commissions: 0, avgTicket: 0 };
  const ranking = [...comm].sort((a, b) => b.revenue - a.revenue);
  const maxRev = Math.max(...ranking.map((r) => r.revenue), 1);
  const maxBar = Math.max(...salesByDay.map((d) => d.revenue), 1);
  const recent = orders.slice(0, 5);
  const low: { p: Product; v: Variant }[] = [];
  products.forEach((p) => p.variants.forEach((v) => { if (v.stock <= 3) low.push({ p, v }); }));

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHead title="Dashboard" subtitle="Quinta, 15 de maio de 2026" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KPI label="Faturamento mês" value={fmtBRL(s.revenue)} delta={`${s.closedOrders} pedidos`} icon="money" accent />
        <KPI label="Ticket médio" value={fmtBRL(s.avgTicket)} delta="por pedido" icon="chart" />
        <KPI label="Aguardando caixa" value={s.openOrders} delta="ver vendas" icon="bell" warn={s.openOrders > 0} onClick={() => onNav('vendas')} />
        <KPI label="Comissões mês" value={fmtBRL(s.commissions)} delta="a pagar" icon="bag" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Vendas por dia</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>Pedidos fechados no mês</div>
          {salesByDay.length === 0 ? (
            <div style={{ color: T.textMuted, padding: '40px 0', textAlign: 'center', fontSize: 13 }}>Sem dados ainda</div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '20px 0 12px' }}>
              {salesByDay.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                    <div title={fmtBRL(d.revenue)} style={{ width: '70%', maxWidth: 16,
                      height: `${Math.max(d.revenue / maxBar * 100, 3)}%`, background: T.accent, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{d.day}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Top vendedoras</div>
            <button onClick={() => onNav('comissoes')} style={{ border: 'none', background: 'transparent',
              color: T.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Ver todos</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ranking.length === 0 && <div style={{ color: T.textMuted, fontSize: 13 }}>Sem vendedoras</div>}
            {ranking.map((row, i) => (
              <div key={row.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: i === 0 ? T.accent : T.surface2,
                    color: i === 0 ? '#fff' : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                  <Avatar name={row.name} color={colorFor(i)} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{row.closedOrders} pedidos · {fmtBRL(row.commission)} comissão</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtBRL(row.revenue)}</div>
                </div>
                <div style={{ height: 5, background: T.surface2, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${row.revenue / maxRev * 100}%`, height: '100%',
                    background: i === 0 ? T.accent : T.borderStrong, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Pedidos recentes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.length === 0 && <div style={{ color: T.textMuted, fontSize: 13 }}>Sem pedidos</div>}
            {recent.map((o) => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                borderBottom: `1px solid ${T.border}` }}>
                <Avatar name={o.customerName || '?'} color={T.accent} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.customerName || 'Sem cliente'}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{o.number} · {o.sellerName.split(' ')[0]} · {timeAgo(o.createdAt)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtBRL(o.total)}</div>
                  <OrderStatus status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Estoque baixo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {low.length === 0 && <div style={{ color: T.textMuted, fontSize: 13 }}>Tudo abastecido</div>}
            {low.slice(0, 6).map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                borderBottom: i < Math.min(low.length, 6) - 1 ? `1px solid ${T.border}` : 'none' }}>
                <ProductImg size={38} label={it.p.name.split(' ')[0].toLowerCase()} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{it.p.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Tam. {it.v.size} · {it.v.color}</div>
                </div>
                <Badge variant={it.v.stock === 0 ? 'danger' : 'warning'} size="sm">
                  {it.v.stock === 0 ? 'Esgotado' : `${it.v.stock} un.`}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const tdSt: React.CSSProperties = { padding: '14px 16px', fontSize: 13.5, color: T.text, verticalAlign: 'middle' };
const thSt: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${T.border}` };

function DVendas({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  let list = orders;
  if (filter !== 'all') list = list.filter((o) => o.status === filter);
  if (q) list = list.filter((o) =>
    (o.customerName || '').toLowerCase().includes(q.toLowerCase()) ||
    o.number.toLowerCase().includes(q.toLowerCase()) ||
    o.sellerName.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHead title="Vendas" subtitle={`${orders.length} pedidos`} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 14, borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Input value={q} onChange={setQ} placeholder="Buscar pedido, cliente, vendedora..." icon="search" />
          </div>
          {[{ id: 'all', l: 'Todos' }, { id: 'open', l: 'Aguardando' }, { id: 'closed', l: 'Fechados' }, { id: 'cancelled', l: 'Cancelados' }].map((t) => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              height: 36, padding: '0 14px', border: filter === t.id ? 'none' : `1px solid ${T.border}`,
              background: filter === t.id ? T.primary : T.surface, color: filter === t.id ? '#fff' : T.text,
              borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            }}>{t.l}</button>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surface3 }}>
                {['Pedido', 'Cliente', 'Vendedora', 'Itens', 'Pagamento', 'Total', 'Status', 'Data'].map((h) => (
                  <th key={h} style={thSt}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={tdSt}><span style={{ fontWeight: 600, fontFamily: 'ui-monospace, SF Mono, monospace', fontSize: 12 }}>{o.number}</span></td>
                  <td style={tdSt}>{o.customerName || <span style={{ color: T.textMuted }}>—</span>}</td>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={o.sellerName} color={T.accent} size={24} />{o.sellerName.split(' ')[0]}
                    </div>
                  </td>
                  <td style={tdSt}>{o.items}</td>
                  <td style={tdSt}>{o.payment || <span style={{ color: T.textMuted }}>—</span>}</td>
                  <td style={{ ...tdSt, fontWeight: 700 }}>{fmtBRL(o.total)}</td>
                  <td style={tdSt}><OrderStatus status={o.status} /></td>
                  <td style={{ ...tdSt, color: T.textMuted, fontSize: 12 }}>{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DComissoes({ comm }: { comm: CommRow[] }) {
  const totalSold = comm.reduce((s, d) => s + d.revenue, 0);
  const totalComm = comm.reduce((s, d) => s + d.commission, 0);
  const totalOrders = comm.reduce((s, d) => s + d.closedOrders, 0);
  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHead title="Comissões" subtitle="Maio 2026" right={<Button variant="ghost" icon="download">Exportar</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPI label="Total vendido" value={fmtBRL(totalSold)} delta={`${totalOrders} pedidos`} icon="chart" />
        <KPI label="Comissão a pagar" value={fmtBRL(totalComm)} delta="vence dia 30" icon="money" accent />
        <KPI label="Vendedoras ativas" value={comm.filter((d) => d.closedOrders > 0).length} delta={`de ${comm.length}`} icon="users" />
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surface3 }}>
                {['Vendedora', 'Pedidos', 'Vendido', 'Comissão %', 'Comissão R$'].map((h) => <th key={h} style={thSt}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {comm.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={row.name} color={colorFor(i)} size={32} />
                      <div style={{ fontWeight: 600 }}>{row.name}</div>
                    </div>
                  </td>
                  <td style={tdSt}>{row.closedOrders}</td>
                  <td style={{ ...tdSt, fontWeight: 600 }}>{fmtBRL(row.revenue)}</td>
                  <td style={tdSt}><Badge variant="accent" size="sm">{row.commissionPct}%</Badge></td>
                  <td style={{ ...tdSt, fontWeight: 700, color: T.accent }}>{fmtBRL(row.commission)}</td>
                </tr>
              ))}
              <tr style={{ background: T.primary, color: '#fff' }}>
                <td style={{ ...tdSt, color: '#fff', fontWeight: 700 }}>Total</td>
                <td style={{ ...tdSt, color: '#fff' }}>{totalOrders}</td>
                <td style={{ ...tdSt, color: '#fff', fontWeight: 700 }}>{fmtBRL(totalSold)}</td>
                <td style={{ ...tdSt, color: '#fff' }}>—</td>
                <td style={{ ...tdSt, color: T.accentSoft, fontWeight: 700 }}>{fmtBRL(totalComm)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DProdutos({ products, categories, reload }: { products: Product[]; categories: Category[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [q, setQ] = React.useState('');
  const list = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHead title="Produtos" subtitle={`${products.length} produtos cadastrados`}
        right={<Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Novo produto</Button>} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 14, borderBottom: `1px solid ${T.border}` }}>
          <Input value={q} onChange={setQ} placeholder="Buscar produto..." icon="search" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surface3 }}>
                {['Produto', 'Categoria', 'Variantes', 'Estoque', 'Preço', ''].map((h) => <th key={h} style={thSt}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={tdSt}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ProductImg size={42} label={p.name.split(' ')[0].toLowerCase()} />
                        <div style={{ fontWeight: 600 }}>{p.name}{!p.active && <span style={{ color: T.textMuted, fontWeight: 400 }}> (inativo)</span>}</div>
                      </div>
                    </td>
                    <td style={tdSt}>{p.category}</td>
                    <td style={tdSt}>{p.variants.length}</td>
                    <td style={tdSt}>
                      <Badge variant={stock === 0 ? 'danger' : stock < 10 ? 'warning' : 'success'} size="sm">{stock} un.</Badge>
                    </td>
                    <td style={{ ...tdSt, fontWeight: 700 }}>{fmtBRL(p.price)}</td>
                    <td style={tdSt}>
                      <button onClick={() => setEditing(p)} style={{ border: 'none', background: 'transparent',
                        color: T.accent, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Editar →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {(editing || creating) && (
        <ProductModal product={editing} categories={categories}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={async () => { setEditing(null); setCreating(false); await reload(); }} />
      )}
    </div>
  );
}

type DraftVariant = { id: string; size: string; color: string; stock: number; isNew: boolean };
function ProductModal({ product, categories, onClose, onSaved }: {
  product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = React.useState(product?.name || '');
  const [categoryId, setCategoryId] = React.useState(product?.categoryId || categories[0]?.id || '');
  const [price, setPrice] = React.useState(String(product?.price ?? ''));
  const [variants, setVariants] = React.useState<DraftVariant[]>(
    (product?.variants || []).map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock, isNew: false })));
  const [removed, setRemoved] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  const addVariant = () => setVariants([...variants, { id: 'new-' + Date.now(), size: 'M', color: 'Rosa', stock: 0, isNew: true }]);
  const save = async () => {
    if (!name.trim() || !price) return;
    setBusy(true);
    try {
      let productId = product?.id;
      if (productId) {
        await fetch(`/api/products/${productId}`, {
          method: 'PUT', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), category_id: categoryId, base_price: Number(price) }),
        });
      } else {
        const res = await fetch('/api/products', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), category_id: categoryId, base_price: Number(price) }),
        });
        productId = (await res.json()).id;
      }
      for (const v of variants) {
        if (v.isNew) {
          await fetch(`/api/products/${productId}/variants`, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ size: v.size, color: v.color, stock_qty: v.stock }),
          });
        } else {
          await fetch(`/api/products/${productId}/variants`, {
            method: 'PUT', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ variantId: v.id, size: v.size, color: v.color, stock_qty: v.stock }),
          });
        }
      }
      for (const vid of removed) {
        await fetch(`/api/products/${productId}/variants`, {
          method: 'PUT', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ variantId: vid, active: false }),
        });
      }
      onSaved();
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: 720,
        maxHeight: '88vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>{product ? 'Editar produto' : 'Novo produto'}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none',
            background: T.surface2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <FieldLabel>Nome do produto *</FieldLabel>
              <Input value={name} onChange={setName} placeholder="Ex: Vestido Floral Midi" />
            </div>
            <div>
              <FieldLabel>Categoria *</FieldLabel>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={selectSt}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Preço base *</FieldLabel>
              <Input value={price} onChange={setPrice} placeholder="0.00" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <FieldLabel>Variantes (Tamanho × Cor × Estoque)</FieldLabel>
            <Button variant="ghost" size="sm" icon="plus" onClick={addVariant}>Adicionar variante</Button>
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: T.surface3 }}>
                <tr>{['Tamanho', 'Cor', 'Estoque', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                    color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: 10 }}>
                      <select value={v.size} style={miniSelect}
                        onChange={(e) => { const a = [...variants]; a[i] = { ...v, size: e.target.value }; setVariants(a); }}>
                        {SIZES_OPTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 10 }}>
                      <select value={v.color} style={miniSelect}
                        onChange={(e) => { const a = [...variants]; a[i] = { ...v, color: e.target.value }; setVariants(a); }}>
                        {COLORS_OPTS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 10 }}>
                      <input type="number" value={v.stock} style={{ ...miniSelect, width: 80 }}
                        onChange={(e) => { const a = [...variants]; a[i] = { ...v, stock: +e.target.value }; setVariants(a); }} />
                    </td>
                    <td style={{ padding: 10 }}>
                      <button onClick={() => { if (!v.isNew) setRemoved([...removed, v.id]); setVariants(variants.filter((_, x) => x !== i)); }}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.danger, display: 'flex' }}>
                        <Icon name="trash" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {variants.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                    Nenhuma variante. Clique em &quot;Adicionar variante&quot;.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`,
          display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={busy || !name.trim() || !price} onClick={save}>
            {busy ? 'Salvando...' : 'Salvar produto'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DCategorias({ categories, products, reload }: { categories: Category[]; products: Product[]; reload: () => Promise<void> }) {
  const add = async () => {
    const name = window.prompt('Nome da nova categoria:');
    if (!name?.trim()) return;
    await fetch('/api/categories', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    await reload();
  };
  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHead title="Categorias" subtitle={`${categories.length} categorias`}
        right={<Button variant="primary" icon="plus" onClick={add}>Nova categoria</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {categories.map((c) => {
          const count = products.filter((p) => p.category === c.name).length;
          return (
            <Card key={c.id} hover style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                  <Icon name="grid" size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{count} produtos</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DEquipe({ people, orders, comm, reload }: { people: Person[]; orders: Order[]; comm: CommRow[]; reload: () => Promise<void> }) {
  const [modal, setModal] = React.useState(false);
  const roleLabel = (r: string) => r === 'vendedora' ? 'Vendedora' : r === 'caixa' ? 'Caixa' : 'Proprietário';
  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHead title="Equipe" subtitle={`${people.length} pessoas`}
        right={<Button variant="primary" icon="plus" onClick={() => setModal(true)}>Adicionar pessoa</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {people.map((s, i) => {
          const c = comm.find((x) => x.id === s.id);
          return (
            <Card key={s.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <Avatar name={s.name} color={colorFor(i)} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{roleLabel(s.role)} · {s.phone}</div>
                  {s.role === 'vendedora' && (
                    <div style={{ marginTop: 8 }}><Badge variant="accent" size="sm">{s.commissionPct}% comissão</Badge></div>
                  )}
                </div>
              </div>
              {s.role === 'vendedora' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Vendido mês</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{fmtBRL(c?.revenue || 0)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Comissão</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: T.accent }}>{fmtBRL(c?.commission || 0)}</div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {modal && <PersonModal onClose={() => setModal(false)} onSaved={async () => { setModal(false); await reload(); }} />}
    </div>
  );
}

function PersonModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [role, setRole] = React.useState('vendedora');
  const [pct, setPct] = React.useState('5');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    if (!name.trim() || !phone.trim() || !pin.trim()) return;
    setBusy(true); setErr('');
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim(), pin: pin.trim(), role, commission_pct: Number(pct) || 0 }),
    });
    setBusy(false);
    if (!res.ok) { const e = await res.json(); setErr(e.error || 'Falha'); return; }
    onSaved();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: 460,
        boxShadow: '0 25px 50px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Adicionar pessoa</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none',
            background: T.surface2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><FieldLabel>Nome *</FieldLabel><Input value={name} onChange={setName} placeholder="Nome completo" /></div>
          <div><FieldLabel>Telefone (login) *</FieldLabel><Input value={phone} onChange={setPhone} placeholder="11999990000" /></div>
          <div><FieldLabel>PIN *</FieldLabel><Input value={pin} onChange={setPin} placeholder="4 dígitos" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FieldLabel>Função</FieldLabel>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={selectSt}>
                <option value="vendedora">Vendedora</option>
                <option value="caixa">Caixa</option>
                <option value="dono">Proprietário</option>
              </select>
            </div>
            <div><FieldLabel>Comissão %</FieldLabel><Input value={pct} onChange={setPct} placeholder="5" /></div>
          </div>
          {err && <div style={{ color: T.danger, fontSize: 13 }}>{err}</div>}
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </div>
    </div>
  );
}

function DIntegracao() {
  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHead title="Integração" subtitle="Sincronização com Olist" />
      <Card style={{ padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: T.successBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: T.success }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Conectado</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Token válido · sincronização manual</div>
        </div>
        <Button variant="ghost" icon="settings">Configurações</Button>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
              <Icon name="download" size={20} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Importar produtos</div>
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 18, lineHeight: 1.5 }}>
            Sincroniza catálogo, variantes e estoque da Olist para o sistema da loja.
          </div>
          <Button variant="primary" full icon="download">Importar agora</Button>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.successBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.success }}>
              <Icon name="upload" size={20} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Exportar pedidos</div>
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 18, lineHeight: 1.5 }}>
            Envia pedidos fechados para a Olist para emissão de NF-e e logística.
          </div>
          <Button variant="success" full icon="upload">Exportar agora</Button>
        </Card>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>{children}</div>;
}
const selectSt: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', fontSize: 14, fontFamily: 'inherit',
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
  color: T.text, outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
};
const miniSelect: React.CSSProperties = {
  height: 34, padding: '0 10px', fontSize: 13, fontFamily: 'inherit',
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
  color: T.text, outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
};
