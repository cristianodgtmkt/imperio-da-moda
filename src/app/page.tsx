import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const redirects: Record<string, string> = {
    vendedora: "/vendedora",
    caixa: "/caixa",
    dono: "/dono",
  };
  redirect(redirects[session.user.role] ?? "/login");
}
