'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { fmtBRL } from '@/lib/format';
import { Plus, Pencil, ChevronDown, ChevronUp } from 'lucide-react';

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  price_override: number | null;
  stock_qty: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  category_name: string | null;
  active: boolean;
  variants: Variant[] | null;
}

export default function DonoProdutos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [newProduct, setNewProduct] = useState({ name: '', base_price: '', category_id: '' });
  const [newVariant, setNewVariant] = useState({ size: '', color: '', stock_qty: '0', price_override: '' });
  const [savingProduct, setSavingProduct] = useState(false);
  const [addingVariantFor, setAddingVariantFor] = useState<string | null>(null);
  const [savingVariant, setSavingVariant] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, pageSize: '50', includeInactive: 'true' });
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.rows ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.rows ?? []));
  }, []);

  async function handleAddProduct() {
    setSavingProduct(true);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProduct.name,
        base_price: Number(newProduct.base_price),
        category_id: newProduct.category_id || undefined,
      }),
    });
    setSavingProduct(false);
    if (res.ok) {
      setShowAddProduct(false);
      setNewProduct({ name: '', base_price: '', category_id: '' });
      fetchProducts();
    }
  }

  async function handleAddVariant(productId: string) {
    setSavingVariant(true);
    await fetch(`/api/products/${productId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        size: newVariant.size || null,
        color: newVariant.color || null,
        stock_qty: Number(newVariant.stock_qty),
        price_override: newVariant.price_override ? Number(newVariant.price_override) : null,
      }),
    });
    setSavingVariant(false);
    setAddingVariantFor(null);
    setNewVariant({ size: '', color: '', stock_qty: '0', price_override: '' });
    fetchProducts();
  }

  async function toggleProductActive(p: Product) {
    await fetch(`/api/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !p.active }),
    });
    fetchProducts();
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Produtos</div>
        <div style={{ flex: 1, maxWidth: 300 }}>
          <Input placeholder="Buscar produto..." value={search} onChange={setSearch} />
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="md" onClick={() => setShowAddProduct(true)}>+ Novo produto</Button>
      </div>

      {/* Add product form */}
      {showAddProduct && (
        <Card style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Novo Produto</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
            <Input label="Nome" value={newProduct.name} onChange={(v) => setNewProduct((f) => ({ ...f, name: v }))} />
            <Input label="Preço base (R$)" type="number" value={newProduct.base_price}
              onChange={(v) => setNewProduct((f) => ({ ...f, base_price: v }))} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Categoria</div>
              <select value={newProduct.category_id} onChange={(e) => setNewProduct((f) => ({ ...f, category_id: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
                  fontSize: 14, fontFamily: 'inherit', background: T.surface }}>
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button variant="primary" size="md" loading={savingProduct}
              disabled={!newProduct.name || !newProduct.base_price} onClick={handleAddProduct}>
              Salvar
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowAddProduct(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: T.textMuted, padding: 60 }}>Carregando...</div>
      ) : (
        products.map((p) => {
          const variants = p.variants ?? [];
          const totalStock = variants.filter((v) => v.active !== false).reduce((s, v) => s + v.stock_qty, 0);
          const isExpanded = expanded === p.id;

          return (
            <Card key={p.id} style={{ marginBottom: 10, padding: 0, opacity: p.active ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, cursor: 'pointer' }}
                onClick={() => setExpanded(isExpanded ? null : p.id)}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: T.surface2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {p.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                    {p.category_name ?? 'Sem categoria'} · {variants.length} variantes · {totalStock} em estoque
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtBRL(Number(p.base_price))}</div>
                </div>
                {isExpanded ? <ChevronUp size={18} color={T.textMuted} /> : <ChevronDown size={18} color={T.textMuted} />}
              </div>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${T.border}`, padding: 16 }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {['Tamanho', 'Cor', 'Preço', 'Estoque'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMuted,
                            fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '8px' }}>{v.size ?? '—'}</td>
                          <td style={{ padding: '8px' }}>{v.color ?? '—'}</td>
                          <td style={{ padding: '8px' }}>{fmtBRL(Number(v.price_override ?? p.base_price))}</td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ fontWeight: v.stock_qty === 0 ? 700 : 400, color: v.stock_qty === 0 ? T.danger : T.text }}>
                              {v.stock_qty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Add variant */}
                  {addingVariantFor === p.id ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <Input label="Tamanho" value={newVariant.size} onChange={(v) => setNewVariant((f) => ({ ...f, size: v }))} />
                        <Input label="Cor" value={newVariant.color} onChange={(v) => setNewVariant((f) => ({ ...f, color: v }))} />
                        <Input label="Estoque" type="number" value={newVariant.stock_qty}
                          onChange={(v) => setNewVariant((f) => ({ ...f, stock_qty: v }))} />
                        <Input label="Preço (opcional)" type="number" value={newVariant.price_override}
                          onChange={(v) => setNewVariant((f) => ({ ...f, price_override: v }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="primary" size="sm" loading={savingVariant} onClick={() => handleAddVariant(p.id)}>
                          Salvar variante
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setAddingVariantFor(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <Button variant="outline" size="sm" onClick={() => { setAddingVariantFor(p.id); }}>
                        <Plus size={14} /> Variante
                      </Button>
                      <Button variant={p.active ? 'ghost' : 'outline'} size="sm" onClick={() => toggleProductActive(p)}>
                        {p.active ? 'Desativar' : 'Reativar'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}

      {!loading && products.length === 0 && (
        <div style={{ textAlign: 'center', color: T.textMuted, padding: 60 }}>
          Nenhum produto encontrado.
        </div>
      )}
    </div>
  );
}
