import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (search) {
    conditions.push(`(c.name ILIKE $${i} OR c.phone ILIKE $${i + 1})`);
    params.push(`%${search}%`, `%${search}%`);
    i += 2;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
    `SELECT c.*, cp.preferred_sizes, cp.preferred_categories, cp.preferred_colors, cp.preferred_occasions, cp.notes,
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'closed'), 0) AS total_spent
     FROM customers c
     LEFT JOIN customer_profiles cp ON cp.customer_id = c.id
     LEFT JOIN orders o ON o.customer_id = c.id
     ${where}
     GROUP BY c.id, cp.preferred_sizes, cp.preferred_categories, cp.preferred_colors, cp.preferred_occasions, cp.notes
     ORDER BY c.name
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, pageSize, offset]
  );

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM customers c ${where}`,
    params
  );

  return NextResponse.json({ rows, total: parseInt(count), page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, phone } = await req.json();
  if (!name || !phone) return NextResponse.json({ error: 'name and phone required' }, { status: 400 });

  const existing = await query('SELECT id FROM customers WHERE phone = $1', [phone]);
  if (existing.length > 0) return NextResponse.json({ error: 'Telefone já cadastrado' }, { status: 409 });

  const [customer] = await query(
    `WITH ins AS (INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING *)
     INSERT INTO customer_profiles (customer_id) SELECT id FROM ins
     RETURNING (SELECT row_to_json(ins) FROM ins) AS customer`,
    [name, phone]
  );

  const [created] = await query('SELECT * FROM customers WHERE phone = $1', [phone]);
  return NextResponse.json(created, { status: 201 });
}
