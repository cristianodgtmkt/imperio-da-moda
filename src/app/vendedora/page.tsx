import { auth } from '@/lib/auth';
import { VendedoraApp } from '@/components/VendedoraApp';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const u = (await auth())!.user;
  return <VendedoraApp seller={{ id: u.id, name: u.name, commissionPct: u.commissionPct }} />;
}
