'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fmtBRL } from '@/lib/format';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

interface Variant { id: string; size: string; color: string; stock_qty: number; price_override?: number }
interface Product { id: string; name: string; base_price: number; category_name: string; variants: Variant[] }
interface CartItem { variantId: string; productName: string; size: string; color: string; price: number; qty: number }

const SIZES = ['PP','P','M','G','GG'];
const CATEGORIES = ['Todos','Vestidos','Blusas','Calças','Saias','Acessórios'];

function NovoPedidoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteId = searchParams.get('cliente');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [picker, setPicker] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    const cat = category === 'Todos' ? '' : category;
    const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(cat)}&pageSize=30`);
    const data = await res.json();
    setProducts(data.rows ?? []);
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function addToCart(product: Product, variant: Variant) {
    const price = Number(variant.price_override ?? product.base_price);
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) return prev.map((i) => i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { variantId: variant.id, productName: product.name, size: variant.size, color: variant.color, price, qty: 1 }];
    });
    setPicker(null);
  }

  async function submitOrder() {
    setSubmitting(true);
    // Create order
    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: clienteId }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) { setSubmitting(false); return; }

    // Add items
    for (const item of cart) {
      await fetch(`/api/orders/${order.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: item.variantId, quantity: item.qty }),
      });
    }

    router.push(`/vendedora/pedidos/${order.id}?confirmado=1`);
  }

  if (showCart) {
    return (
      <div style={{ padding: '56px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setShowCart(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.text, padding: 4 }}>‹</button>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Carrinho</div>
        </div>

        {cart.map((item) => (
          <Card key={item.variantId} style={{ marginBottom: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.productName}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>{item.size} · {item.color}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setCart((p) => p.map((i) => i.variantId === item.variantId && i.qty > 1 ? { ...i, qty: i.qty - 1 } : i).filter((i) => !(i.variantId === item.variantId && i.qty === 0)))}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={12} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => setCart((p) => p.map((i) => i.variantId === item.variantId ? { ...i, qty: i.qty + 1 } : i))}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={12} />
                </button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, minWidth: 72, textAlign: 'right' }}>{fmtBRL(item.price * item.qty)}</div>
            </div>
          </Card>
        ))}

        <div style={{ borderTop: `2px solid ${T.primary}`, margin: '16px 0 8px', paddingTop: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.textMuted }}>Total</span>
          <span style={{ fontSize: 26, fontWeight: 700 }}>{fmtBRL(cartTotal)}</span>
        </div>

        <Button variant="primary" size="lg" full loading={submitting} onClick={submitOrder}>
          Enviar para Caixa
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '56px 0 0' }}>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => router.back()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.text, padding: 4 }}>‹</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Montar Pedido</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Passo 2 de 2</div>
          </div>
        </div>
        <Input placeholder="Buscar produto..." value={search} onChange={setSearch} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: 'none', fontFamily: 'inherit',
              background: category === cat ? T.accent : T.surface,
              color: category === cat ? '#fff' : T.textMuted,
            }}>{cat}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {products.map((product) => {
          const availableVariants = product.variants?.filter((v) => v.stock_qty > 0) ?? [];
          if (availableVariants.length === 0) return null;
          return (
            <Card key={product.id} hover style={{ marginBottom: 10, padding: 14 }}
              onClick={() => setPicker(product)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: T.surface2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {product.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                    {product.category_name} · {availableVariants.length} variantes
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtBRL(Number(product.base_price))}</div>
                  <Plus size={16} color={T.accent} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Variant picker modal */}
      {picker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setPicker(null)}>
          <div style={{ background: T.surface, borderRadius: '20px 20px 0 0', padding: 24, width: '100%' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{picker.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {picker.variants?.filter((v) => v.stock_qty > 0).map((v) => (
                <button key={v.id} onClick={() => addToCart(picker, v)} style={{
                  padding: '10px 16px', borderRadius: 12, border: `1px solid ${T.border}`,
                  background: T.surface, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 600,
                }}>
                  {v.size} · {v.color}
                  <span style={{ fontSize: 11, color: T.textMuted, display: 'block', marginTop: 2 }}>
                    {fmtBRL(Number(v.price_override ?? picker.base_price))}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 80, left: 20, right: 20, zIndex: 60 }}>
          <button onClick={() => setShowCart(true)} style={{
            width: '100%', height: 52, borderRadius: 16, border: 'none',
            background: T.primary, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
            fontSize: 14, fontWeight: 600,
          }}>
            <span><ShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Ver carrinho ({cartCount})</span>
            <span>{fmtBRL(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function NovoPedido() {
  return (
    <Suspense>
      <NovoPedidoInner />
    </Suspense>
  );
}
