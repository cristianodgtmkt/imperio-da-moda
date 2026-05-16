import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get('date_from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const dateTo = searchParams.get('date_to') ?? new Date().toISOString();

  const [summary] = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'closed') AS closed_orders,
       COUNT(*) FILTER (WHERE status = 'open') AS open_orders,
       COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
       COALESCE(SUM(total) FILTER (WHERE status = 'closed'), 0) AS total_revenue,
       COALESCE(SUM(commission_amt) FILTER (WHERE status = 'closed'), 0) AS total_commissions,
       COALESCE(AVG(total) FILTER (WHERE status = 'closed'), 0) AS avg_ticket
     FROM orders
     WHERE created_at BETWEEN $1 AND $2`,
    [dateFrom, dateTo]
  );

  const salesByDay = await query(
    `SELECT DATE(created_at) AS day, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
     FROM orders WHERE status = 'closed' AND created_at BETWEEN $1 AND $2
     GROUP BY day ORDER BY day`,
    [dateFrom, dateTo]
  );

  const commissions = await query(
    `SELECT u.id, u.name, u.commission_pct,
            COUNT(o.id) FILTER (WHERE o.status = 'closed') AS closed_orders,
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'closed'), 0) AS total_revenue,
            COALESCE(SUM(o.commission_amt) FILTER (WHERE o.status = 'closed'), 0) AS commission_amt
     FROM store_users u
     LEFT JOIN orders o ON o.seller_id = u.id AND o.created_at BETWEEN $1 AND $2
     WHERE u.role = 'vendedora' AND u.active = true
     GROUP BY u.id, u.name, u.commission_pct
     ORDER BY total_revenue DESC`,
    [dateFrom, dateTo]
  );

  return NextResponse.json({ summary, salesByDay, commissions });
}
