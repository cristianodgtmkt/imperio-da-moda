'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { fmtBRL } from '@/lib/format';
import { Search, Plus, UserX } from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  phone: string;
  preferred_sizes: string[];
  total_spent: number;
}

export default function VendedoraClientes() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}&pageSize=15`);
      const data = await res.json();
      setCustomers(data.rows ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div style={{ padding: '56px 0 0' }}>
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.text, padding: 4 }}>‹</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Selecionar Cliente</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Passo 1 de 2</div>
          </div>
        </div>
        <Input
          placeholder="Buscar por nome ou telefone"
          value={search}
          onChange={setSearch}
          style={{ paddingLeft: 40 }}
        />
      </div>

      <div style={{ padding: '0 20px' }}>
        {!loading && customers.length === 0 && search && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMuted }}>
            <UserX size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>Nenhum cliente encontrado</div>
          </div>
        )}

        {customers.map((c) => (
          <Card key={c.id} hover style={{ marginBottom: 10, padding: 14 }}
            onClick={() => router.push(`/vendedora/novo-pedido?cliente=${c.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={c.name} color={T.accent} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.name}
                  {c.preferred_sizes?.[0] && <Badge variant="accent" size="sm">{c.preferred_sizes[0]}</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>
                  {c.phone} · {fmtBRL(Number(c.total_spent))}
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Link href="/vendedora/clientes/novo" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', marginTop: 12, padding: 14, borderRadius: 14,
            border: `1.5px dashed ${T.borderStrong}`, background: 'transparent',
            color: T.text, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 14, fontWeight: 600,
          }}>
            <Plus size={18} /> Cadastrar novo cliente
          </button>
        </Link>

        <button onClick={() => router.push('/vendedora/novo-pedido')}
          style={{ width: '100%', marginTop: 10, padding: 12, border: 'none', background: 'transparent',
            color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
          Pular — vender sem cliente
        </button>
      </div>
    </div>
  );
}
