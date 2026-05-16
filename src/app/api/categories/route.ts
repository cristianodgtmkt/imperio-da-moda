import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query(`SELECT id, name FROM categories WHERE active = true ORDER BY name`);
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const [cat] = await query(
    `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET active = true RETURNING *`,
    [name]
  );
  return NextResponse.json(cat, { status: 201 });
}
