import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const rows = await query(
    `SELECT id, name, phone, role, commission_pct, active, created_at
     FROM store_users ORDER BY role, name`
  );
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, phone, pin, role, commission_pct } = await req.json();
  if (!name || !phone || !pin || !role) {
    return NextResponse.json({ error: 'name, phone, pin, role required' }, { status: 400 });
  }

  const existing = await query(`SELECT id FROM store_users WHERE phone = $1`, [phone]);
  if (existing.length > 0) return NextResponse.json({ error: 'Telefone já cadastrado' }, { status: 409 });

  const hash = await bcrypt.hash(String(pin), 10);
  const [user] = await query(
    `INSERT INTO store_users (name, phone, password_hash, role, commission_pct)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, phone, role, commission_pct, active`,
    [name, phone, hash, role, commission_pct ?? 0]
  );
  return NextResponse.json(user, { status: 201 });
}
