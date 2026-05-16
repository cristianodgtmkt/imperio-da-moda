import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, phone, pin, commission_pct, active } = await req.json();

  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
  if (phone !== undefined) { updates.push(`phone = $${i++}`); values.push(phone); }
  if (commission_pct !== undefined) { updates.push(`commission_pct = $${i++}`); values.push(commission_pct); }
  if (active !== undefined) { updates.push(`active = $${i++}`); values.push(active); }
  if (pin !== undefined) {
    const hash = await bcrypt.hash(String(pin), 10);
    updates.push(`password_hash = $${i++}`);
    values.push(hash);
  }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  updates.push(`updated_at = now()`);
  values.push(params.id);

  const [user] = await query(
    `UPDATE store_users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, phone, role, commission_pct, active`,
    values
  );

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await query(`UPDATE store_users SET active = false, updated_at = now() WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}
