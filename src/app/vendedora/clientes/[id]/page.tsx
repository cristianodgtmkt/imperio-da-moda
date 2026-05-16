'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  preferred_sizes: string[] | null;
  preferred_categories: string[] | null;
  preferred_colors: string[] | null;
  notes: string | null;
}

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
const CATEGORIES = ['Vestidos', 'Blusas', 'Calças', 'Saias', 'Acessórios'];
const COLORS = ['Preto', 'Branco', 'Rosa', 'Azul', 'Verde', 'Vermelho', 'Amarelo', 'Bege', 'Cinza'];

function ToggleChip({
  label, selected, onToggle,
}: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      border: 'none', fontFamily: 'inherit',
      background: selected ? T.accent : T.surface,
      color: selected ? '#fff' : T.textMuted,
      outline: selected ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
    }}>
      {label}
    </button>
  );
}

export default function ClientePerfil({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sizes, setSizes] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setCustomer(d);
        setSizes(d.preferred_sizes ?? []);
        setCats(d.preferred_categories ?? []);
        setColors(d.preferred_colors ?? []);
        setNotes(d.notes ?? '');
        setLoading(false);
      });
  }, [params.id]);

  function toggle(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/customers/${params.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_sizes: sizes, preferred_categories: cats, preferred_colors: colors, notes }),
    });
    setSaving(false);
    router.push(`/vendedora/novo-pedido?cliente=${params.id}`);
  }

  if (loading || !customer) {
    return <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '56px 20px 100px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.text, padding: 4 }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Perfil do Cliente</div>
      </div>

      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={customer.name} color={T.accent} size={48} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{customer.name}</div>
            <div style={{ fontSize: 14, color: T.textMuted }}>{customer.phone}</div>
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 10 }}>Tamanhos preferidos</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {SIZES.map((s) => (
          <ToggleChip key={s} label={s} selected={sizes.includes(s)} onToggle={() => toggle(sizes, s, setSizes)} />
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 10 }}>Categorias preferidas</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {CATEGORIES.map((c) => (
          <ToggleChip key={c} label={c} selected={cats.includes(c)} onToggle={() => toggle(cats, c, setCats)} />
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 10 }}>Cores preferidas</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {COLORS.map((c) => (
          <ToggleChip key={c} label={c} selected={colors.includes(c)} onToggle={() => toggle(colors, c, setColors)} />
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 10 }}>Observações</div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anotações sobre a cliente..."
        rows={3}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`,
          fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          marginBottom: 20, boxSizing: 'border-box',
        }}
      />

      <Button variant="primary" size="lg" full loading={saving} onClick={handleSave}>
        Salvar e Montar Pedido →
      </Button>
    </div>
  );
}
