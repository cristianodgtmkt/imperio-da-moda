-- Seed: proprietário inicial. PIN padrão: 1234 — TROCAR NO PRIMEIRO LOGIN
-- Gerar novo hash: node -e "const b=require('bcryptjs');b.hash('SEU_PIN',10,(e,h)=>console.log(h));"
INSERT INTO store_users (name, phone, password_hash, role, commission_pct)
VALUES (
  'Proprietário',
  '00000000000',
  '$2b$10$Q6R.p6Fl1.hfL7NWPRD7GuQr9iHxk7cdbUaicDgplue2MWt3onEfy',
  'dono',
  0
)
ON CONFLICT (phone) DO NOTHING;
