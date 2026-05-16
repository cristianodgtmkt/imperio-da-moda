import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');
  const offset = (page - 1) * pageSize;

  const includeInactive = searchParams.get('includeInactive') === 'true';
  const conditions: string[] = includeInactive ? [] : ['p.active = true'];
  const params: unknown[] = [];
  let i = 1;

  if (search) {
    conditions.push(`(p.name ILIKE $${i} OR to_tsvector('portuguese', p.name) @@ plainto_tsquery('portuguese', $${i + 1}))`);
    params.push(`%${search}%`, search);
    i += 2;
  }
  if (category) {
    conditions.push(`c.name = $${i}`);
    params.push(category);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
    `SELECT p.id, p.name, p.base_price, p.active, c.id AS category_id, c.name AS category_name,
            json_agg(json_build_object(
              'id', v.id, 'size', v.size, 'color', v.color,
              'price_override', v.price_override, 'stock_qty', v.stock_qty, 'active', v.active
            ) ORDER BY v.size, v.color) FILTER (WHERE v.id IS NOT NULL AND v.active = true) AS variants
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_variants v ON v.product_id = p.id
     ${where}
     GROUP BY p.id, p.name, p.base_price, p.active, c.id, c.name
     ORDER BY p.name
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, pageSize, offset]
  );

  const [{ count }] = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT p.id)::text AS count FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ${where}`,
    params
  );

  return NextResponse.json({ rows, total: parseInt(count), page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== 'dono') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, category_id, base_price } = body;
  if (!name || !base_price) return NextResponse.json({ error: 'name and base_price required' }, { status: 400 });

  const [product] = await query(
    `INSERT INTO products (name, category_id, base_price)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, category_id || null, base_price]
  );
  return NextResponse.json(product, { status: 201 });
}
