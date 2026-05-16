import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'vendedora') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const order = await queryOne<{ id: string; status: string }>(
    'SELECT id, status FROM orders WHERE id = $1',
    [params.id]
  );
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (order.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 409 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Restore stock for all items
    const items = await client.query(
      'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
      [params.id]
    );
    for (const item of items.rows) {
      await client.query(
        'UPDATE product_variants SET stock_qty = stock_qty + $1 WHERE id = $2',
        [item.quantity, item.variant_id]
      );
      await client.query(
        `INSERT INTO stock_movements (variant_id, delta, reason, order_id) VALUES ($1, $2, 'cancellation', $3)`,
        [item.variant_id, item.quantity, params.id]
      );
    }

    const [cancelled] = await query(
      `UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1 RETURNING *`,
      [params.id]
    );

    await client.query('COMMIT');
    return NextResponse.json(cancelled);
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Error cancelling order' }, { status: 500 });
  } finally {
    client.release();
  }
}
