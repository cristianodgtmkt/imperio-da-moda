import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { size, color, price_override, stock_qty } = await req.json();

  const [variant] = await query(
    `INSERT INTO product_variants (product_id, size, color, price_override, stock_qty)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [params.id, size || null, color || null, price_override || null, stock_qty ?? 0]
  );
  return NextResponse.json(variant, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { variantId, size, color, price_override, stock_qty, active } = await req.json();

  const [variant] = await query(
    `UPDATE product_variants SET
       size = COALESCE($1, size),
       color = COALESCE($2, color),
       price_override = $3,
       stock_qty = COALESCE($4, stock_qty),
       active = COALESCE($5, active)
     WHERE id = $6 AND product_id = $7 RETURNING *`,
    [size ?? null, color ?? null, price_override ?? null, stock_qty ?? null, active ?? null, variantId, params.id]
  );

  if (!variant) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(variant);
}
