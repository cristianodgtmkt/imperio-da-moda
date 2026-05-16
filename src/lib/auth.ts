import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queryOne } from './db';
import { authConfig } from '@/auth.config';

export type UserRole = 'vendedora' | 'caixa' | 'dono';

interface StoreUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  commission_pct: number;
  password_hash: string;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      role: UserRole;
      commissionPct: number;
    };
  }
  interface User {
    id: string;
    name: string;
    role: UserRole;
    commissionPct: number;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        phone: { label: 'Telefone', type: 'text' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        const { phone, pin } = credentials as { phone: string; pin: string };
        if (!phone || !pin) return null;

        const user = await queryOne<StoreUser>(
          'SELECT * FROM store_users WHERE phone = $1 AND active = true',
          [phone]
        );
        if (!user) return null;

        const valid = await bcrypt.compare(pin, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          commissionPct: Number(user.commission_pct),
        };
      },
    }),
  ],
});
