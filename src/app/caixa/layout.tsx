import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CaixaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'caixa') redirect('/login');
  return <>{children}</>;
}
