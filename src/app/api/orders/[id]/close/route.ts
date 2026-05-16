import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'vendedora') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { payment_method, payment_notes } = await req.json();
  if (!payment_method) return NextResponse.json({ error: 'payment_method required' }, { status: 400 });

  const order = await queryOne<{ id: string; seller_id: string; total: number; status: string }>(
    'SELECT * FROM orders WHERE id = $1',
    [params.id]
  );
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (order.status !== 'open') return NextResponse.json({ error: 'Order not open' }, { status: 409 });

  const seller = await queryOne<{ commission_pct: number }>(
    'SELECT commission_pct FROM store_users WHERE id = $1',
    [order.seller_id]
  );

  const commissionPct = Number(seller?.commission_pct ?? 0);
  const commissionAmt = parseFloat((Number(order.total) * commissionPct / 100).toFixed(2));

  const [closed] = await query(
    `UPDATE orders SET
       status = 'closed',
       cashier_id = $1,
       payment_method = $2,
       payment_notes = $3,
       commission_pct = $4,
       commission_amt = $5,
       closed_at = now(),
       updated_at = now()
     WHERE id = $6 AND status = 'open'
     RETURNING *`,
    [session.user.id, payment_method, payment_notes || null, commissionPct, commissionAmt, params.id]
  );

  return NextResponse.json(closed);
}
