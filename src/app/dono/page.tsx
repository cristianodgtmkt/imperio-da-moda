import { auth } from '@/lib/auth';
import { DonoApp } from '@/components/DonoApp';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const u = (await auth())!.user;
  return <DonoApp ownerName={u.name} />;
}
