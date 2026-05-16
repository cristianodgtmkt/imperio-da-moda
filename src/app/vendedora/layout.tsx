import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VendedoraTabBar } from './VendedoraTabBar';

export default async function VendedoraLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'vendedora') redirect('/login');

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", system-ui, sans-serif', background: '#F5F5F5', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {children}
      </div>
      <VendedoraTabBar />
    </div>
  );
}
