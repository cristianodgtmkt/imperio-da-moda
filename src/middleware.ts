import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

const ROLE_PREFIXES: Record<string, string> = {
  '/vendedora': 'vendedora',
  '/caixa': 'caixa',
  '/dono': 'dono',
};

export default auth(function middleware(req: NextRequest & { auth: { user?: { role?: string } } | null }) {
  const { pathname } = req.nextUrl;

  const prefix = Object.keys(ROLE_PREFIXES).find((p) => pathname.startsWith(p));
  if (!prefix) return NextResponse.next();

  const session = req.auth;
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const requiredRole = ROLE_PREFIXES[prefix];
  if (session.user.role !== requiredRole) {
    const redirects: Record<string, string> = {
      vendedora: '/vendedora',
      caixa: '/caixa',
      dono: '/dono',
    };
    return NextResponse.redirect(new URL(redirects[session.user.role ?? ''] ?? '/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/vendedora/:path*', '/caixa/:path*', '/dono/:path*'],
};
