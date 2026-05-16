import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/lib/auth';

export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.commissionPct = (user as { commissionPct?: number }).commissionPct;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.commissionPct = token.commissionPct as number;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
