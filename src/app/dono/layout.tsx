import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DonoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'dono') redirect('/login');
  return <>{children}</>;
}
