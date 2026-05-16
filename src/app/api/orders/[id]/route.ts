import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await queryOne(
    `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone,
            u.name AS seller_name,
            json_agg(json_build_object(
              'id', oi.id, 'product_name', oi.product_name,
              'size', oi.size, 'color', oi.color,
              'unit_price', oi.unit_price, 'quantity', oi.quantity, 'subtotal', oi.subtotal
            )) FILTER (WHERE oi.id IS NOT NULL) AS items
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN store_users u ON u.id = o.seller_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = $1
     GROUP BY o.id, c.name, c.phone, u.name`,
    [params.id]
  );

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.user.role === 'vendedora' && (order as { seller_id: string }).seller_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(order);
}
