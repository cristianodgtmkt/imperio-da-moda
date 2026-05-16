'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NovoCliente() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError('');
    setLoading(true);
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar.');
      return;
    }
    router.push(`/vendedora/novo-pedido?cliente=${data.id}`);
  }

  return (
    <div style={{ padding: '56px 20px 20px', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.text, padding: 4 }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Novo Cliente</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Nome completo *" placeholder="Ana Paula Silva" value={name} onChange={setName} />
        <Input label="Telefone *" type="tel" placeholder="(41) 9 9999-0000" value={phone} onChange={setPhone} />

        {error && <div style={{ fontSize: 13, color: T.danger }}>{error}</div>}

        <Button variant="primary" size="lg" full loading={loading}
          disabled={!name || !phone} onClick={handleSave}>
          Salvar e Continuar
        </Button>
      </div>
    </div>
  );
}
