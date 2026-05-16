'use client';
import { useState, useEffect } from 'react';
import { T } from '@/lib/tokens';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  commission_pct: string;
  active: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  vendedora: 'Vendedora', caixa: 'Caixa', dono: 'Proprietário',
};
const ROLE_COLORS: Record<string, string> = {
  vendedora: '#8B5CF6', caixa: '#3B82F6', dono: '#E91E8C',
};

export default function DonoEquipe() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', pin: '', role: 'vendedora', commission_pct: '0' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.rows ?? []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleSave() {
    setError('');
    setSaving(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, commission_pct: Number(form.commission_pct) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return; }
    setShowForm(false);
    setForm({ name: '', phone: '', pin: '', role: 'vendedora', commission_pct: '0' });
    loadUsers();
  }

  async function toggleActive(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    });
    loadUsers();
  }

  async function updateCommission(user: User, newPct: string) {
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_pct: Number(newPct) }),
    });
    loadUsers();
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Equipe</div>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="md" onClick={() => setShowForm(true)}>+ Nova pessoa</Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Novo usuário</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Nome completo" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <Input label="Telefone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            <Input label="PIN (numérico)" type="password" value={form.pin} onChange={(v) => setForm((f) => ({ ...f, pin: v }))} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Função</div>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
                  fontSize: 14, fontFamily: 'inherit', background: T.surface }}>
                <option value="vendedora">Vendedora</option>
                <option value="caixa">Caixa</option>
                <option value="dono">Proprietário</option>
              </select>
            </div>
            {form.role === 'vendedora' && (
              <Input label="Comissão (%)" type="number" value={form.commission_pct}
                onChange={(v) => setForm((f) => ({ ...f, commission_pct: v }))} />
            )}
          </div>
          {error && <div style={{ color: T.danger, fontSize: 13, marginTop: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button variant="primary" size="md" loading={saving}
              disabled={!form.name || !form.phone || !form.pin} onClick={handleSave}>
              Salvar
            </Button>
            <Button variant="ghost" size="md" onClick={() => { setShowForm(false); setError(''); }}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: T.textMuted, padding: 60 }}>Carregando...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {users.map((u) => (
            <Card key={u.id} style={{ padding: 20, opacity: u.active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar name={u.name} color={ROLE_COLORS[u.role] ?? T.primary} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{u.phone}</div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                  background: ROLE_COLORS[u.role] + '20', color: ROLE_COLORS[u.role] }}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
              </div>

              {u.role === 'vendedora' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: T.textMuted }}>Comissão:</span>
                  <input
                    type="number"
                    defaultValue={u.commission_pct}
                    onBlur={(e) => {
                      if (e.target.value !== u.commission_pct) updateCommission(u, e.target.value);
                    }}
                    style={{ width: 56, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`,
                      fontSize: 14, fontFamily: 'inherit', textAlign: 'right' }}
                  />
                  <span style={{ fontSize: 13, color: T.textMuted }}>%</span>
                </div>
              )}

              <Button variant={u.active ? 'outline' : 'ghost'} size="sm" onClick={() => toggleActive(u)}>
                {u.active ? 'Desativar' : 'Reativar'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
