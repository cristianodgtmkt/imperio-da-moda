import { auth } from '@/lib/auth';
import { CaixaApp } from '@/components/CaixaApp';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const u = (await auth())!.user;
  return <CaixaApp cashierName={u.name} />;
}
