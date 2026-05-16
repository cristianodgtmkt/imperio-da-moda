import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function VendedoraLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'vendedora') redirect('/login');
  return <>{children}</>;
}
