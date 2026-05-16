'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', { phone, pin, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Telefone ou PIN incorretos.');
    } else {
      router.push('/');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Inter", system-ui, sans-serif',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 18,
              background: T.accent,
              fontSize: 28,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 16,
            }}
          >
            I
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.4 }}>
            Império da Moda
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
            Sistema de gestão
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: T.surface,
              borderRadius: 20,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <Input
              label="Telefone"
              type="tel"
              placeholder="(41) 9 9999-0000"
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
            />
            <Input
              label="PIN"
              type="password"
              placeholder="••••"
              maxLength={6}
              value={pin}
              onChange={setPin}
              autoComplete="current-password"
            />
            {error && (
              <div style={{ fontSize: 13, color: T.danger, textAlign: 'center' }}>{error}</div>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              full
              loading={loading}
              disabled={!phone || !pin}
            >
              Entrar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
