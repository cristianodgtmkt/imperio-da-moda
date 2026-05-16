import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const product = await queryOne(
    `SELECT p.id, p.name, p.base_price, p.active, p.olist_product_id,
            c.id AS category_id, c.name AS category_name,
            json_agg(json_build_object(
              'id', v.id, 'size', v.size, 'color', v.color,
              'price_override', v.price_override, 'stock_qty', v.stock_qty, 'active', v.active
            ) ORDER BY v.size, v.color) FILTER (WHERE v.id IS NOT NULL) AS variants
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_variants v ON v.product_id = p.id
     WHERE p.id = $1
     GROUP BY p.id, p.name, p.base_price, p.active, p.olist_product_id, c.id, c.name`,
    [params.id]
  );

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, category_id, base_price, active } = body;

  const [product] = await query(
    `UPDATE products SET
       name = COALESCE($1, name),
       category_id = COALESCE($2::uuid, category_id),
       base_price = COALESCE($3, base_price),
       active = COALESCE($4, active),
       updated_at = now()
     WHERE id = $5 RETURNING *`,
    [name ?? null, category_id ?? null, base_price ?? null, active ?? null, params.id]
  );

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await query(`UPDATE products SET active = false, updated_at = now() WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}
