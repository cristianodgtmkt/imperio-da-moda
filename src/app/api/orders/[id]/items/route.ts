import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { variant_id, quantity = 1 } = await req.json();
  if (!variant_id) return NextResponse.json({ error: 'variant_id required' }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock variant and check stock
    const variantRes = await client.query(
      `SELECT v.*, p.name AS product_name, p.base_price
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.id = $1 FOR UPDATE`,
      [variant_id]
    );
    const variant = variantRes.rows[0];
    if (!variant) throw new Error('Variant not found');
    if (variant.stock_qty < quantity) throw new Error('Estoque insuficiente');

    const unitPrice = Number(variant.price_override ?? variant.base_price);

    // Add item
    const itemRes = await client.query(
      `INSERT INTO order_items (order_id, variant_id, product_name, size, color, unit_price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [params.id, variant_id, variant.product_name, variant.size, variant.color,
       unitPrice, quantity, unitPrice * quantity]
    );

    // Decrement stock
    await client.query(
      'UPDATE product_variants SET stock_qty = stock_qty - $1 WHERE id = $2',
      [quantity, variant_id]
    );

    // Log movement
    await client.query(
      `INSERT INTO stock_movements (variant_id, delta, reason, order_id) VALUES ($1, $2, 'sale', $3)`,
      [variant_id, -quantity, params.id]
    );

    // Recalculate order total
    await client.query(
      `UPDATE orders SET
         subtotal = (SELECT COALESCE(SUM(subtotal),0) FROM order_items WHERE order_id = $1),
         total    = (SELECT COALESCE(SUM(subtotal),0) FROM order_items WHERE order_id = $1),
         updated_at = now()
       WHERE id = $1`,
      [params.id]
    );

    await client.query('COMMIT');
    return NextResponse.json(itemRes.rows[0], { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: msg === 'Estoque insuficiente' ? 409 : 500 });
  } finally {
    client.release();
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await query('SELECT * FROM order_items WHERE order_id = $1', [params.id]);
  return NextResponse.json({ rows });
}
