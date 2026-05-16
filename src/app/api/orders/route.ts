import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? '';
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  // Vendedora only sees own orders
  if (session.user.role === 'vendedora') {
    conditions.push(`o.seller_id = $${i++}`);
    params.push(session.user.id);
  }
  if (status) { conditions.push(`o.status = $${i++}`); params.push(status); }
  if (dateFrom) { conditions.push(`o.created_at >= $${i++}`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`o.created_at <= $${i++}`); params.push(dateTo + 'T23:59:59'); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
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
     ${where}
     GROUP BY o.id, c.name, c.phone, u.name
     ORDER BY o.created_at DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, pageSize, offset]
  );

  return NextResponse.json({ rows, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { customer_id, notes } = await req.json();

  const [order] = await query(
    `INSERT INTO orders (seller_id, customer_id, notes) VALUES ($1, $2, $3) RETURNING *`,
    [session.user.id, customer_id || null, notes || null]
  );
  return NextResponse.json(order, { status: 201 });
}
