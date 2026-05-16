-- Demo seed data for Império da Moda. PIN for every user = 1234.
BEGIN;

-- ── Staff ──────────────────────────────────────────────────────────────
UPDATE store_users SET name = 'Roberto Silva' WHERE phone = '00000000000';

INSERT INTO store_users (name, phone, password_hash, role, commission_pct) VALUES
  ('Patrícia Caixa', '11999990001', '$2b$10$jQUsN5zodYmvuSvVhw9aWODF8vAbapu7BPe0ZGGV7PDhBoOCQkxkq', 'caixa', 0),
  ('Mariana Oliveira', '11999990002', '$2b$10$jQUsN5zodYmvuSvVhw9aWODF8vAbapu7BPe0ZGGV7PDhBoOCQkxkq', 'vendedora', 6),
  ('Fernanda Souza',  '11999990003', '$2b$10$jQUsN5zodYmvuSvVhw9aWODF8vAbapu7BPe0ZGGV7PDhBoOCQkxkq', 'vendedora', 5),
  ('Juliana Alves',   '11999990004', '$2b$10$jQUsN5zodYmvuSvVhw9aWODF8vAbapu7BPe0ZGGV7PDhBoOCQkxkq', 'vendedora', 5)
ON CONFLICT (phone) DO NOTHING;

-- ── Categories ─────────────────────────────────────────────────────────
INSERT INTO categories (name) VALUES
  ('Vestidos'), ('Blusas'), ('Calças'), ('Saias'),
  ('Acessórios'), ('Conjuntos'), ('Bermudas')
ON CONFLICT (name) DO NOTHING;

-- ── Products ───────────────────────────────────────────────────────────
INSERT INTO products (name, category_id, base_price)
SELECT v.name, c.id, v.price
FROM (VALUES
  ('Vestido Floral Midi',      'Vestidos',   189.90),
  ('Vestido Longo de Festa',   'Vestidos',   299.90),
  ('Vestido Tubinho Preto',    'Vestidos',   159.90),
  ('Vestido Chemise de Linho', 'Vestidos',   219.90),
  ('Blusa Cropped Canelada',   'Blusas',      69.90),
  ('Blusa Manga Bufante',      'Blusas',      89.90),
  ('Camisa Social Branca',     'Blusas',     119.90),
  ('Regata Básica',            'Blusas',      39.90),
  ('Calça Wide Leg',           'Calças',     159.90),
  ('Calça Jeans Skinny',       'Calças',     139.90),
  ('Calça de Alfaiataria',     'Calças',     179.90),
  ('Legging Fitness',          'Calças',      79.90),
  ('Saia Plissada Midi',       'Saias',      109.90),
  ('Saia Jeans Curta',         'Saias',       89.90),
  ('Saia Longa Estampada',     'Saias',      129.90),
  ('Cinto de Couro Fino',      'Acessórios',  49.90),
  ('Bolsa Tiracolo',           'Acessórios', 149.90),
  ('Colar Dourado',            'Acessórios',  39.90),
  ('Óculos de Sol',            'Acessórios',  99.90),
  ('Conjunto de Tricot',       'Conjuntos',  199.90),
  ('Conjunto de Alfaiataria',  'Conjuntos',  259.90),
  ('Bermuda Ciclista',         'Bermudas',    59.90),
  ('Short Jeans',              'Bermudas',    79.90)
) AS v(name, cat, price)
JOIN categories c ON c.name = v.cat
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);

-- ── Variants (size × color per product) ────────────────────────────────
DO $$
DECLARE
  p record;
  s text;
  c text;
  v_sizes text[];
  v_colors text[];
  v_pick int;
BEGIN
  FOR p IN
    SELECT pr.id, cat.name AS catname
    FROM products pr JOIN categories cat ON cat.id = pr.category_id
  LOOP
    IF p.catname = 'Acessórios' THEN
      v_sizes := ARRAY['Único'];
    ELSE
      v_sizes := ARRAY['PP','P','M','G','GG'];
    END IF;
    v_pick := 1 + floor(random()*3);
    IF v_pick = 1 THEN
      v_colors := ARRAY['Preto','Rosa','Bege'];
    ELSIF v_pick = 2 THEN
      v_colors := ARRAY['Branco','Azul','Verde'];
    ELSE
      v_colors := ARRAY['Preto','Branco','Vinho'];
    END IF;
    FOREACH s IN ARRAY v_sizes LOOP
      FOREACH c IN ARRAY v_colors LOOP
        INSERT INTO product_variants (product_id, size, color, stock_qty)
        VALUES (p.id, s, c, floor(random()*16)::int)
        ON CONFLICT (product_id, size, color) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ── Customers ──────────────────────────────────────────────────────────
INSERT INTO customers (name, phone)
SELECT v.name, v.phone
FROM (VALUES
  ('Ana Carolina Mendes', '11988770001'),
  ('Beatriz Lima',        '11988770002'),
  ('Camila Rodrigues',    '11988770003'),
  ('Daniela Ferreira',    '11988770004'),
  ('Eduarda Castro',      '11988770005'),
  ('Fabiana Gomes',       '11988770006'),
  ('Gabriela Martins',    '11988770007'),
  ('Helena Barbosa',      '11988770008'),
  ('Isabela Cardoso',     '11988770009'),
  ('Joana Ribeiro',       '11988770010'),
  ('Karina Dias',         '11988770011'),
  ('Larissa Pinto',       '11988770012'),
  ('Marcela Azevedo',     '11988770013'),
  ('Natália Correia',     '11988770014'),
  ('Patrícia Nunes',      '11988770015'),
  ('Renata Teixeira',     '11988770016'),
  ('Sabrina Moraes',      '11988770017'),
  ('Tatiana Cunha',       '11988770018')
) AS v(name, phone)
WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.phone = v.phone);

-- ── Customer profiles (a few) ──────────────────────────────────────────
INSERT INTO customer_profiles (customer_id, preferred_sizes, preferred_categories, preferred_colors, notes)
SELECT c.id, ARRAY['M'], ARRAY['Vestidos','Blusas'], ARRAY['Rosa','Preto'], 'Prefere peças para trabalho.'
FROM customers c WHERE c.phone = '11988770001'
ON CONFLICT (customer_id) DO NOTHING;
INSERT INTO customer_profiles (customer_id, preferred_sizes, preferred_categories, preferred_colors, notes)
SELECT c.id, ARRAY['P'], ARRAY['Saias','Acessórios'], ARRAY['Bege','Branco'], 'Gosta de looks casuais.'
FROM customers c WHERE c.phone = '11988770003'
ON CONFLICT (customer_id) DO NOTHING;
INSERT INTO customer_profiles (customer_id, preferred_sizes, preferred_categories, preferred_colors, notes)
SELECT c.id, ARRAY['G'], ARRAY['Calças','Conjuntos'], ARRAY['Azul','Preto'], ''
FROM customers c WHERE c.phone = '11988770007'
ON CONFLICT (customer_id) DO NOTHING;

-- ── Orders (closed history + open queue) ───────────────────────────────
DO $$
DECLARE
  v_seller uuid;
  v_seller_pct numeric;
  v_cashier uuid;
  v_customer uuid;
  v_order uuid;
  v_var record;
  v_subtotal numeric;
  v_qty int;
  v_created timestamptz;
  v_status text;
  v_payment text;
  i int;
  j int;
  n_items int;
BEGIN
  SELECT id INTO v_cashier FROM store_users WHERE role = 'caixa' LIMIT 1;

  FOR i IN 1..68 LOOP
    SELECT id, commission_pct INTO v_seller, v_seller_pct
      FROM store_users WHERE role = 'vendedora' ORDER BY random() LIMIT 1;
    SELECT id INTO v_customer FROM customers ORDER BY random() LIMIT 1;

    -- ~88% historical closed orders, rest open today for the cashier
    IF i <= 60 THEN
      v_status := 'closed';
      v_created := now() - (random() * interval '24 days') - interval '1 hour';
    ELSE
      v_status := 'open';
      v_created := now() - (random() * interval '5 hours');
    END IF;

    v_payment := (ARRAY['pix','dinheiro','debito','credito'])[1 + floor(random()*4)];

    INSERT INTO orders (status, customer_id, seller_id, cashier_id, commission_pct,
                        opened_at, created_at, updated_at)
    VALUES (v_status, v_customer, v_seller,
            CASE WHEN v_status = 'closed' THEN v_cashier END,
            v_seller_pct, v_created, v_created, v_created)
    RETURNING id INTO v_order;

    v_subtotal := 0;
    n_items := 1 + floor(random()*3);
    FOR j IN 1..n_items LOOP
      SELECT pv.id AS vid, pv.size, pv.color,
             COALESCE(pv.price_override, p.base_price) AS price, p.name AS pname
        INTO v_var
        FROM product_variants pv JOIN products p ON p.id = pv.product_id
        ORDER BY random() LIMIT 1;
      v_qty := 1 + floor(random()*2);
      INSERT INTO order_items (order_id, variant_id, product_name, size, color,
                               unit_price, quantity, subtotal)
      VALUES (v_order, v_var.vid, v_var.pname, v_var.size, v_var.color,
              v_var.price, v_qty, v_var.price * v_qty);
      v_subtotal := v_subtotal + v_var.price * v_qty;
    END LOOP;

    UPDATE orders SET
      subtotal = v_subtotal,
      total = v_subtotal,
      commission_amt = CASE WHEN v_status = 'closed'
                            THEN round(v_subtotal * v_seller_pct / 100, 2) END,
      payment_method = CASE WHEN v_status = 'closed' THEN v_payment END,
      closed_at = CASE WHEN v_status = 'closed'
                       THEN v_created + interval '18 minutes' END
    WHERE id = v_order;
  END LOOP;
END $$;

COMMIT;

SELECT
  (SELECT count(*) FROM store_users)      AS users,
  (SELECT count(*) FROM customers)        AS customers,
  (SELECT count(*) FROM products)         AS products,
  (SELECT count(*) FROM product_variants) AS variants,
  (SELECT count(*) FROM orders)           AS orders,
  (SELECT count(*) FROM order_items)      AS order_items;
