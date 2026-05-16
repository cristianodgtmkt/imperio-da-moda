import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const customer = await queryOne(
    `SELECT c.*, cp.preferred_sizes, cp.preferred_categories, cp.preferred_colors, cp.notes
     FROM customers c
     LEFT JOIN customer_profiles cp ON cp.customer_id = c.id
     WHERE c.id = $1`,
    [params.id]
  );

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, phone } = await req.json();
  const [customer] = await query(
    `UPDATE customers SET
       name = COALESCE($1, name),
       phone = COALESCE($2, phone)
     WHERE id = $3 RETURNING *`,
    [name ?? null, phone ?? null, params.id]
  );

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}
