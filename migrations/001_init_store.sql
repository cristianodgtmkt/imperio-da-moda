CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SEQUENCE IF NOT EXISTS order_seq;

CREATE TABLE IF NOT EXISTS store_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  phone           text UNIQUE NOT NULL,
  password_hash   text NOT NULL,
  role            text NOT NULL CHECK (role IN ('vendedora','caixa','dono')),
  commission_pct  numeric(5,2) NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text UNIQUE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_name_fts ON customers USING gin(to_tsvector('portuguese', name));

CREATE TABLE IF NOT EXISTS customer_profiles (
  customer_id          uuid PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  preferred_sizes      text[] DEFAULT '{}',
  preferred_categories text[] DEFAULT '{}',
  preferred_colors     text[] DEFAULT '{}',
  notes                text DEFAULT '',
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name   text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  category_id      uuid REFERENCES categories(id) ON DELETE SET NULL,
  base_price       numeric(10,2) NOT NULL,
  active           boolean NOT NULL DEFAULT true,
  olist_product_id text UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING gin(to_tsvector('portuguese', name));

CREATE TABLE IF NOT EXISTS product_variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size           text,
  color          text,
  price_override numeric(10,2),
  stock_qty      integer NOT NULL DEFAULT 0,
  active         boolean NOT NULL DEFAULT true,
  olist_sku      text,
  UNIQUE(product_id, size, color)
);

CREATE TABLE IF NOT EXISTS orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number   text NOT NULL UNIQUE DEFAULT
                   'V-' || to_char(now(),'YYYYMMDD') || '-' || lpad(nextval('order_seq')::text,4,'0'),
  status         text NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','closed','cancelled')),
  customer_id    uuid REFERENCES customers(id) ON DELETE SET NULL,
  seller_id      uuid NOT NULL REFERENCES store_users(id),
  cashier_id     uuid REFERENCES store_users(id),
  subtotal       numeric(10,2) NOT NULL DEFAULT 0,
  total          numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text CHECK (payment_method IN ('pix','dinheiro','debito','credito','outro')),
  payment_notes  text,
  commission_pct numeric(5,2),
  commission_amt numeric(10,2),
  notes          text,
  olist_order_id text UNIQUE,
  opened_at      timestamptz NOT NULL DEFAULT now(),
  closed_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id, status);

CREATE TABLE IF NOT EXISTS order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id   uuid NOT NULL REFERENCES product_variants(id),
  product_name text NOT NULL,
  size         text,
  color        text,
  unit_price   numeric(10,2) NOT NULL,
  quantity     integer NOT NULL DEFAULT 1,
  subtotal     numeric(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id         bigserial PRIMARY KEY,
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  delta      integer NOT NULL,
  reason     text NOT NULL CHECK (reason IN ('sale','cancellation','restock','adjustment')),
  order_id   uuid REFERENCES orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Default categories
INSERT INTO categories (name) VALUES
  ('Vestidos'), ('Blusas'), ('Calças'), ('Saias'), ('Acessórios')
ON CONFLICT (name) DO NOTHING;
