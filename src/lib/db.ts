import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool() {
  const raw = process.env.DATABASE_URL ?? '';

  // Parse and strip sslmode from URL so pg doesn't reject unrecognised values
  const [base, qs = ''] = raw.split('?');
  const qsParts = qs.split('&').filter(Boolean);
  const sslmodePart = qsParts.find((p) => p.startsWith('sslmode='));
  const sslmode = sslmodePart?.split('=')[1] ?? 'disable';
  const filteredQs = qsParts.filter((p) => !p.startsWith('sslmode=')).join('&');
  const connectionString = filteredQs ? `${base}?${filteredQs}` : base;

  const ssl =
    sslmode === 'require' || sslmode === 'no-verify'
      ? { rejectUnauthorized: false }
      : sslmode === 'verify-full' || sslmode === 'verify-ca'
        ? { rejectUnauthorized: true }
        : false;

  return new Pool({ connectionString, ssl, max: 10, idleTimeoutMillis: 30000 });
}

const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalThis._pgPool = pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export { pool };
