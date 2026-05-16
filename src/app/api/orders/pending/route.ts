import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === 'vendedora') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await query(
    `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone,
            u.name AS seller_name, u.id AS seller_id,
            json_agg(json_build_object(
              'id', oi.id, 'product_name', oi.product_name,
              'size', oi.size, 'color', oi.color,
              'unit_price', oi.unit_price, 'quantity', oi.quantity, 'subtotal', oi.subtotal
            )) FILTER (WHERE oi.id IS NOT NULL) AS items
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN store_users u ON u.id = o.seller_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.status = 'open'
     GROUP BY o.id, c.name, c.phone, u.name, u.id
     ORDER BY o.created_at ASC`
  );

  return NextResponse.json({ rows });
}
