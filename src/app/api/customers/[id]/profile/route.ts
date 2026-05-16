import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profile = await queryOne('SELECT * FROM customer_profiles WHERE customer_id = $1', [params.id]);
  return NextResponse.json(profile ?? { customer_id: params.id, preferred_sizes: [], preferred_categories: [], preferred_colors: [], notes: '' });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { preferred_sizes, preferred_categories, preferred_colors, notes } = await req.json();

  const [profile] = await query(
    `INSERT INTO customer_profiles (customer_id, preferred_sizes, preferred_categories, preferred_colors, notes, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (customer_id) DO UPDATE SET
       preferred_sizes = EXCLUDED.preferred_sizes,
       preferred_categories = EXCLUDED.preferred_categories,
       preferred_colors = EXCLUDED.preferred_colors,
       notes = EXCLUDED.notes,
       updated_at = now()
     RETURNING *`,
    [params.id, preferred_sizes ?? [], preferred_categories ?? [], preferred_colors ?? [], notes ?? '']
  );
  return NextResponse.json(profile);
}
