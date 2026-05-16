# 🛍 Império da Moda — Especificação Técnica Completa

> Documento de implementação para o **Claude Code**. Contém estrutura de pastas, comandos, schema de banco, contratos de API, e especificação **tela por tela** dos 3 ambientes.
>
> Stack alvo: **Next.js 14 (App Router) + TypeScript + Tailwind + PostgreSQL (Prisma) + NextAuth + Zustand + Recharts**.

---

## 📑 Sumário

1. [Visão geral e arquitetura](#1-visão-geral-e-arquitetura)
2. [Comandos de setup](#2-comandos-de-setup)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Schema do banco (Prisma)](#5-schema-do-banco-prisma)
6. [Design System (tokens)](#6-design-system-tokens)
7. [Componentes compartilhados](#7-componentes-compartilhados)
8. [Autenticação e papéis](#8-autenticação-e-papéis)
9. [Ambiente VENDEDORA — telas](#9-ambiente-vendedora--telas)
10. [Ambiente CAIXA — telas](#10-ambiente-caixa--telas)
11. [Ambiente DONO — telas](#11-ambiente-dono--telas)
12. [API Routes — contratos](#12-api-routes--contratos)
13. [Lógica de negócio crítica](#13-lógica-de-negócio-crítica)
14. [Integração Olist](#14-integração-olist)
15. [Ordem de implementação sugerida](#15-ordem-de-implementação-sugerida)

---

## 1. Visão geral e arquitetura

Sistema de loja para **uma única filial** com 3 papéis bem definidos:

| Papel       | Dispositivo | Frame UI            | Responsabilidades                                      |
| ----------- | ----------- | ------------------- | ------------------------------------------------------ |
| Vendedora   | iPhone      | 390×844 (mobile)    | Tira pedidos no salão, gerencia clientes, vê comissão  |
| Caixa       | iPad        | 1024×768 (tablet)   | Fecha pedidos das vendedoras, recebe pagamento         |
| Dono/Admin  | Desktop     | 1280×800+ (web)     | Gestão completa: produtos, equipe, relatórios, Olist   |

**Fluxo principal:** Vendedora cria `Order(status=open)` → Caixa busca `orders where status=open` (polling 10s) → Caixa fecha → grava forma de pagamento, calcula comissão, decrementa estoque definitivamente, registra `stock_movement`.

**Decisão arquitetural-chave:** Estoque é **decrementado no momento que o item entra no pedido** (não no fechamento), em transação com `SELECT … FOR UPDATE`. Se o pedido é cancelado, estoque é restaurado. Isso evita oversell quando duas vendedoras tentam vender o mesmo SKU.

---

## 2. Comandos de setup

```bash
# 1. Bootstrap do projeto
npx create-next-app@14 loja-imperio --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd loja-imperio

# 2. Dependências de produção
npm install \
  @prisma/client \
  next-auth@beta \
  @auth/prisma-adapter \
  bcryptjs \
  zod \
  zustand \
  recharts \
  date-fns \
  lucide-react \
  clsx \
  tailwind-merge \
  sonner

# 3. Dev dependencies
npm install -D \
  prisma \
  @types/bcryptjs \
  tsx

# 4. Prisma init + migration
npx prisma init --datasource-provider postgresql
# (editar prisma/schema.prisma — copiar do seção 5 deste doc)
npx prisma migrate dev --name init
npx prisma generate

# 5. Seed (depois de criar prisma/seed.ts)
npx tsx prisma/seed.ts

# 6. Rodar
npm run dev
```

**Adicionar ao `package.json`:**
```json
{
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```

---

## 3. Estrutura de pastas

```
loja-imperio/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── app/
│   ├── layout.tsx                       # Layout raiz (fonts + toaster)
│   ├── page.tsx                         # Redirect por papel
│   ├── login/
│   │   └── page.tsx                     # Login com PIN (vendedora) ou e-mail (caixa/dono)
│   │
│   ├── (vendedora)/
│   │   ├── layout.tsx                   # Layout mobile + tab bar
│   │   └── vendedora/
│   │       ├── page.tsx                 # Home (V2)
│   │       ├── novo-pedido/
│   │       │   ├── page.tsx             # Step 1: cliente (V2)
│   │       │   ├── [customerId]/
│   │       │   │   └── page.tsx         # Step 2: produtos (V5)
│   │       │   └── novo-cliente/
│   │       │       └── page.tsx         # V3: cadastro
│   │       ├── clientes/
│   │       │   ├── page.tsx             # busca
│   │       │   └── [id]/
│   │       │       └── perfil/page.tsx  # V4: perfil comprador
│   │       ├── pedidos/
│   │       │   ├── page.tsx             # V8: meus pedidos
│   │       │   └── [id]/page.tsx        # detalhe
│   │       ├── carrinho/page.tsx        # V6
│   │       ├── confirmacao/[id]/page.tsx # V7
│   │       └── comissoes/page.tsx       # V9
│   │
│   ├── (caixa)/
│   │   ├── layout.tsx                   # Layout tablet (sem tab bar)
│   │   └── caixa/
│   │       ├── page.tsx                 # C1: lista de pedidos pendentes
│   │       └── [orderId]/page.tsx       # C2: fechar pedido
│   │
│   ├── (dono)/
│   │   ├── layout.tsx                   # Layout desktop com sidebar
│   │   └── dono/
│   │       ├── page.tsx                 # D1: dashboard
│   │       ├── vendas/page.tsx          # tabela de pedidos
│   │       ├── comissoes/page.tsx       # D3
│   │       ├── produtos/
│   │       │   ├── page.tsx             # lista
│   │       │   ├── novo/page.tsx        # criar
│   │       │   └── [id]/page.tsx        # D2: editar
│   │       ├── categorias/page.tsx
│   │       ├── equipe/page.tsx
│   │       └── olist/page.tsx           # D4
│   │
│   └── api/                             # Ver seção 12
│       ├── auth/[...nextauth]/route.ts
│       ├── products/...
│       ├── customers/...
│       ├── orders/...
│       ├── commissions/route.ts
│       ├── reports/route.ts
│       └── olist/...
│
├── components/
│   ├── ui/                              # Primitivos (Button, Input, Card, Badge…)
│   ├── vendedora/                       # Components específicos do mobile
│   ├── caixa/
│   └── dono/                            # KPI, charts, tables…
│
├── lib/
│   ├── db.ts                            # Prisma client singleton
│   ├── auth.ts                          # NextAuth config
│   ├── rbac.ts                          # Helpers de papel/permissão
│   ├── olist-client.ts                  # SDK da plataforma externa
│   └── utils.ts                         # cn(), fmtBRL(), timeAgo()
│
├── stores/
│   └── cart.ts                          # Zustand: carrinho da vendedora
│
├── types/
│   └── index.ts                         # Tipos compartilhados
│
├── middleware.ts                        # Guard de rotas por papel
└── tailwind.config.ts
```

---

## 4. Variáveis de ambiente

`.env.local`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/loja"
NEXTAUTH_SECRET="<gerar com: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Olist (plataforma externa)
OLIST_APP_KEY=""
OLIST_APP_SECRET=""
OLIST_API_BASE="https://api.olist.com"
```

---

## 5. Schema do banco (Prisma)

```prisma
// prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role {
  VENDEDORA
  CAIXA
  DONO
}

enum OrderStatus {
  OPEN        // Vendedora montou, aguardando caixa
  CLOSED      // Caixa fechou
  CANCELLED   // Cancelado (estoque restaurado)
}

enum PaymentMethod {
  PIX
  DINHEIRO
  DEBITO
  CREDITO
}

enum StockMovementType {
  SALE        // Venda (saída)
  RETURN      // Devolução de venda cancelada (entrada)
  ADJUST      // Ajuste manual
  IMPORT      // Sync da plataforma externa
}

model User {
  id             String    @id @default(cuid())
  email          String?   @unique
  passwordHash   String?
  pin            String?   // 4 dígitos, apenas vendedora
  name           String
  role           Role
  commissionPct  Float     @default(5)
  avatarColor    String    @default("#E91E8C")
  active         Boolean   @default(true)
  createdAt      DateTime  @default(now())

  orders         Order[]   @relation("seller_orders")
  closedOrders   Order[]   @relation("cashier_orders")
  movements      StockMovement[]
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  active    Boolean   @default(true)
  products  Product[]
}

model Product {
  id          String           @id @default(cuid())
  name        String
  description String?
  basePrice   Decimal          @db.Decimal(10, 2)
  categoryId  String
  category    Category         @relation(fields: [categoryId], references: [id])
  active      Boolean          @default(true)
  olistId     String?          @unique
  imageUrl    String?
  variants    ProductVariant[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model ProductVariant {
  id         String     @id @default(cuid())
  productId  String
  product    Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  size       String
  color      String
  sku        String     @unique
  stockQty   Int        @default(0)
  price      Decimal?   @db.Decimal(10, 2)  // null = usa basePrice do produto
  active     Boolean    @default(true)
  orderItems OrderItem[]
  movements  StockMovement[]

  @@unique([productId, size, color])
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  profile   Json?    // { sizes, colors, categories, occasions, notes }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]

  @@index([phone])
  @@index([name])
}

model Order {
  id              String       @id @default(cuid())
  number          String       @unique  // V-20260515-0042
  status          OrderStatus  @default(OPEN)

  sellerId        String
  seller          User         @relation("seller_orders", fields: [sellerId], references: [id])

  cashierId       String?
  cashier         User?        @relation("cashier_orders", fields: [cashierId], references: [id])

  customerId      String?
  customer        Customer?    @relation(fields: [customerId], references: [id])

  items           OrderItem[]

  subtotal        Decimal      @db.Decimal(10, 2)
  total           Decimal      @db.Decimal(10, 2)
  paymentMethod   PaymentMethod?
  paymentNote     String?
  commissionAmt   Decimal?     @db.Decimal(10, 2)

  olistOrderId    String?      @unique
  exportedAt      DateTime?

  createdAt       DateTime     @default(now())
  closedAt        DateTime?
  cancelledAt     DateTime?

  @@index([status])
  @@index([sellerId, status])
  @@index([createdAt])
}

model OrderItem {
  id         String         @id @default(cuid())
  orderId    String
  order      Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variantId  String
  variant    ProductVariant @relation(fields: [variantId], references: [id])
  qty        Int
  unitPrice  Decimal        @db.Decimal(10, 2)
  // Snapshot for historical accuracy
  productNameSnapshot String
  sizeSnapshot        String
  colorSnapshot       String
}

model StockMovement {
  id         String              @id @default(cuid())
  variantId  String
  variant    ProductVariant      @relation(fields: [variantId], references: [id])
  type       StockMovementType
  qty        Int                 // positivo = entrada, negativo = saída
  reason     String?
  orderId    String?             // se for SALE/RETURN
  userId     String?
  user       User?               @relation(fields: [userId], references: [id])
  createdAt  DateTime            @default(now())

  @@index([variantId, createdAt])
}

model OlistSyncLog {
  id        String   @id @default(cuid())
  type      String   // 'import_products' | 'export_orders'
  status    String   // 'ok' | 'error'
  count     Int?
  message   String?
  createdAt DateTime @default(now())
}
```

**`prisma/seed.ts`:**
```ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();

async function main() {
  // Dono
  await db.user.create({
    data: { email: 'dono@loja.com', passwordHash: await bcrypt.hash('123456', 10),
      name: 'Roberto Silva', role: Role.DONO },
  });
  // Caixa
  await db.user.create({
    data: { email: 'caixa@loja.com', passwordHash: await bcrypt.hash('123456', 10),
      name: 'Roberto Caixa', role: Role.CAIXA },
  });
  // Vendedoras
  await db.user.createMany({
    data: [
      { name: 'Mariana Silva',   pin: '1234', role: Role.VENDEDORA, commissionPct: 5, avatarColor: '#E91E8C' },
      { name: 'Fernanda Souza',  pin: '5678', role: Role.VENDEDORA, commissionPct: 5, avatarColor: '#8B5CF6' },
      { name: 'Juliana Alves',   pin: '9012', role: Role.VENDEDORA, commissionPct: 5, avatarColor: '#3B82F6' },
    ],
  });

  // Categorias
  for (const name of ['Vestidos', 'Blusas', 'Calças', 'Saias', 'Acessórios']) {
    await db.category.create({ data: { name } });
  }
  // …adicione produtos seed conforme necessário
}
main().finally(() => db.$disconnect());
```

---

## 6. Design System (tokens)

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:    { DEFAULT: '#1A1A2E', light: '#2B2B47' },
        accent:     { DEFAULT: '#E91E8C', soft: '#F8BBD9', bg: '#FCE7F1' },
        success:    { DEFAULT: '#22C55E', bg: '#DCFCE7' },
        warning:    { DEFAULT: '#F59E0B', bg: '#FEF3C7' },
        danger:     { DEFAULT: '#EF4444', bg: '#FEE2E2' },
        surface:    { DEFAULT: '#FFFFFF', 2: '#F5F5F5', 3: '#FAFAFA' },
        border:     { DEFAULT: '#E5E7EB', strong: '#D1D5DB' },
        textMuted:  '#6B7280',
        textSubtle: '#9CA3AF',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '16px', input: '10px', btn: '12px' },
      animation: {
        'sheet-up': 'sheet-up .25s cubic-bezier(.2,.7,.3,1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)', opacity: '.5' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'pulse-soft': { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.85', transform: 'scale(1.03)' } },
      },
    },
  },
} satisfies Config;
```

**Tipografia:** Inter via `next/font/google`.
- Heading LG: 24px Bold
- Heading MD: 18px SemiBold
- Body: 14px Regular
- Label: 12px Medium uppercase letter-spacing 0.05em
- Micro: 11px Regular

**Sizings:**
- Botão primary: h-12, rounded-btn
- Input: h-11, rounded-input
- Card: rounded-card, p-4, shadow-sm

---

## 7. Componentes compartilhados

`components/ui/` deve ter (todos com variantes e tamanhos):

| Componente       | Props principais                                            |
| ---------------- | ----------------------------------------------------------- |
| `Button`         | variant: primary\|ghost\|success\|danger\|subtle; size: sm\|md\|lg; icon |
| `Input`          | icon, placeholder, error                                    |
| `Badge`          | variant: neutral\|success\|warning\|danger\|accent; dot     |
| `Card`           | hover, padding, onClick                                     |
| `Avatar`         | name (gera iniciais), color, size                           |
| `Chip`           | active, onClick, icon                                       |
| `BottomSheet`    | (mobile) slide-up modal, com handle                         |
| `Modal`          | (desktop) backdrop + centered card                          |
| `Toast`          | via `sonner`                                                |
| `EmptyState`     | icon, title, subtitle, action                               |
| `ProductImage`   | placeholder listrado quando sem imagem                      |
| `OrderStatusBadge` | mapeia status → Badge                                     |
| `KPI`            | (dono) label, value, delta, icon, variant                   |
| `Sidebar`        | (dono) items configuráveis                                  |
| `MobileTabBar`   | (vendedora) 3 tabs                                          |

---

## 8. Autenticação e papéis

**Estratégias NextAuth:**

1. **Credentials (e-mail+senha)** — para CAIXA e DONO.
2. **Credentials (sellerId+pin)** — para VENDEDORA.

```ts
// lib/auth.ts (resumo)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      id: 'pin',
      credentials: { sellerId: {}, pin: {} },
      authorize: async ({ sellerId, pin }) => {
        const u = await db.user.findUnique({ where: { id: sellerId } });
        if (!u || u.role !== 'VENDEDORA' || u.pin !== pin) return null;
        return { id: u.id, name: u.name, role: u.role };
      },
    }),
    Credentials({
      id: 'email',
      credentials: { email: {}, password: {} },
      authorize: async ({ email, password }) => {
        const u = await db.user.findUnique({ where: { email } });
        if (!u || !await bcrypt.compare(password, u.passwordHash!)) return null;
        return { id: u.id, name: u.name, role: u.role };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => user ? { ...token, role: user.role, id: user.id } : token,
    session: ({ session, token }) => ({ ...session, user: { ...session.user, id: token.id, role: token.role } }),
  },
});
```

**`middleware.ts`:**
```ts
import { auth } from '@/lib/auth';

export default auth((req) => {
  const role = req.auth?.user?.role;
  const path = req.nextUrl.pathname;

  if (!req.auth && !path.startsWith('/login')) {
    return Response.redirect(new URL('/login', req.url));
  }
  if (path.startsWith('/vendedora') && role !== 'VENDEDORA') return forbid();
  if (path.startsWith('/caixa')     && role !== 'CAIXA')     return forbid();
  if (path.startsWith('/dono')      && role !== 'DONO')      return forbid();
});

export const config = { matcher: ['/((?!api/auth|_next|favicon).*)'] };
```

`app/page.tsx` redireciona conforme `role` para `/vendedora`, `/caixa` ou `/dono`.

---

## 9. Ambiente VENDEDORA — telas

**Layout base (`app/(vendedora)/layout.tsx`):** container max-w-[420px] mx-auto, fundo `surface-2`, MobileTabBar fixo no rodapé com 3 tabs: Vender | Pedidos | Comissões.

### V1 — Login (`/login` quando papel não detectado)
- **Estado:** `pin: string`, `selectedSellerId: string`
- **Componentes:** seletor de vendedora (lista visual com avatares) → ao escolher, mostra teclado numérico 3×4 + 4 dots para o PIN.
- **Validação:** PIN 4 dígitos → POST `/api/auth/signin/pin`.
- **Erro:** shake do container + reset do PIN + toast.

### V2 — Home (`/vendedora`)
- **Estado:** carrega `GET /api/orders?sellerId=me&date=today`.
- **Seções (em ordem):**
  1. Header com avatar + nome + ícone de notificação
  2. Card escuro com KPI do dia: total vendido, # pedidos, comissão acumulada
  3. CTA enorme "Novo Pedido" (h-22, accent, sombra)
  4. Lista "No Caixa" (pedidos status=OPEN do vendedor logado), com border-left colorido por status

### V2.5 — Busca de cliente (`/vendedora/novo-pedido`)
- **Estado:** `q: string`, debounce 250ms → `GET /api/customers?search=q&phone=q`.
- **UI:** Input com ícone busca + lista de cards (Avatar | Nome+badge tamanho | Telefone+total histórico | Botão perfil).
- **CTAs:** "Cadastrar novo" (dashed border button) + "Pular — vender sem cliente".

### V3 — Cadastrar cliente (`/vendedora/novo-pedido/novo-cliente`)
- **Form mínimo:** Nome (obrigatório), Telefone (opcional).
- **Após salvar:** `POST /api/customers` → redireciona para perfil comprador (V4) com hint de continuar para produtos.

### V4 — Perfil comprador (`/vendedora/clientes/[id]/perfil`)
- **Pode ser acessado:** logo após V3, OU pelo card "perfil" na busca.
- **Campos:**
  - Tamanhos: chips multi-select (PP, P, M, G, GG)
  - Cores: chips multi-select (Rosa, Azul, Preto, Branco, Verde, Bege)
  - Categorias favoritas: chips com nomes das categorias
  - Ocasiões: Trabalho, Festas, Casual, Esporte, Praia
  - Observações: textarea livre
- **Persistência:** `PUT /api/customers/[id]/profile` com `{ sizes, colors, categories, occasions, notes }`.
- **CTA fixo no rodapé:** "Salvar e continuar" → navega para V5.

### V5 — Produtos (`/vendedora/novo-pedido/[customerId]`)
- **Carrega:** `GET /api/products?active=true&page=1&pageSize=50`.
- **Filtros:** chips horizontais com scroll (Todos | Vestidos | Blusas | Calças | …).
- **Busca:** debounced.
- **Sugestões:** se cliente tem `profile.categories`, mostra seção "Sugestão para [Nome]" com produtos dessas categorias destacados (border accent-soft).
- **Card de produto:** ProductImage 68px | Nome+categoria | Preço | Botão "+" 40px accent.
- **Ao tocar +:** abre **BottomSheet** com seleção de Tamanho × Cor + stock disponível + botão "Adicionar ao carrinho".
- **Carrinho flutuante:** rodapé fixo quando `cart.length > 0`, mostrando qtd + total + arrow.

### V6 — Carrinho (`/vendedora/carrinho`)
- **Lista de itens:** ProductImage | Nome+variante | Qty stepper (-/+) | Total.
- **Card resumo:** Total destacado.
- **CTA:** "Enviar para Caixa" (size lg, full width) → `POST /api/orders` → redireciona para confirmação.

### V7 — Confirmação (`/vendedora/confirmacao/[orderId]`)
- **Hero:** ícone ✓ animado, "Pedido enviado!" + subtitle.
- **Card:** número do pedido em monospace grande, cliente, total.
- **CTAs:** "Novo Pedido" (primary) + "Ver Meus Pedidos" (ghost).

### V8 — Meus pedidos (`/vendedora/pedidos`)
- **Tabs:** Todos | Aguardando | Fechados.
- **Stats pills no topo:** Hoje | Aguardando | Fechados.
- **Lista de cards:** border-left colorido, cliente, ID, tempo, total, status badge.
- **Tap em card → detalhe** (`/vendedora/pedidos/[id]`).

### V9 — Comissões (`/vendedora/comissoes`)
- **Header KPI:** vendido este mês + a receber (card grande gradiente accent).
- **Lista:** últimos pedidos fechados com valor + comissão por pedido.

---

## 10. Ambiente CAIXA — telas

**Layout base:** Tablet landscape, fundo `surface-2`, **header fixo no topo** com logo + contador "Aguardando: N" + status online.

### C1 — Painel principal (`/caixa`)
- **Polling:** a cada 10s, `GET /api/orders/pending`.
- **Grid 2 colunas** de cards de pedido. Cada card:
  - Header: badge "AGUARDANDO" + ID monospace + tempo (vermelho se > 10min).
  - Nome do cliente (h2 grande) ou "Sem cliente identificado".
  - Vendedora (avatar pequeno + nome).
  - # itens.
  - Total grande (28px).
  - Botão "Atender" primary lg.
- **Empty state:** quando 0 pedidos pendentes.
- **Botão refresh manual** no header.

### C2 — Detalhe do pedido (`/caixa/[orderId]`)
- **Layout grid 2 cols:** Esquerda = info do pedido | Direita = pagamento.
- **Esquerda:**
  - Header: ← back | número do pedido | status badge
  - Card "Cliente": Avatar + nome + telefone + total histórico (à direita)
  - Card "Itens": tabela com produto/variante/qty/preço, total destacado embaixo
- **Direita:**
  - Forma de pagamento: 4 botões grandes 2×2 (PIX | Dinheiro | Débito | Crédito) com ícone + label + subtítulo, estado selecionado destacado em accent.
  - Textarea de observação (opcional).
  - Card informativo: comissão que será creditada para a vendedora.
  - Botão "Fechar Pedido · R$ X" (success, full, lg) — desabilitado até selecionar pagamento.
  - Botão "Cancelar pedido" (danger ghost, md).
- **Ações:**
  - Fechar: `POST /api/orders/[id]/close { paymentMethod, paymentNote }`
  - Cancelar: `POST /api/orders/[id]/cancel`

### C3 — Confirmação (renderizada em sucesso de fechar)
- Hero ✓ verde animado
- Card central: total recebido (48px), # pedido, vendedora, comissão (em accent).
- CTA "Próximo atendimento" → volta para C1.

---

## 11. Ambiente DONO — telas

**Layout base (`app/(dono)/layout.tsx`):** Sidebar à esquerda 232px (fundo primary), conteúdo à direita scrollable. Sidebar items: Dashboard | Vendas | Comissões | Produtos | Categorias | Equipe | Olist. Avatar do usuário no rodapé da sidebar.

### D1 — Dashboard (`/dono`)
- **Header:** título "Dashboard" + subtítulo com data.
- **Row de 4 KPIs:**
  - Faturamento mês (gradiente primary→accent, accent variant)
  - Hoje (default)
  - Aguardando caixa (warning se > 0)
  - Ticket médio
- **Grid 1.6:1:**
  - Esquerda: Gráfico de barras vendas por dia (últimos 14d), com comparativo semana anterior em cinza claro.
  - Direita: Ranking de top vendedoras com barras de progresso.
- **Row de 2 cards:**
  - Pedidos recentes (últimos 5)
  - Estoque baixo (variants com stock ≤ 3)

### D2 — Produto (criar/editar) (`/dono/produtos/novo` ou `/dono/produtos/[id]`)
- **Form fields:** Nome, Categoria (select), Preço base.
- **Tabela de variantes inline:**
  - Colunas: Tamanho (select), Cor (select), Estoque (input number), SKU (auto), Excluir.
  - Botão "+ Adicionar variante" no header da tabela.
- **Actions:** Salvar (primary) | Cancelar (ghost).
- **Em edição:** mostrar última atualização e botão "Desativar produto" (soft delete: active=false).

### D3 — Comissões (`/dono/comissoes`)
- **Filtro de período** no header (default: mês atual).
- **3 KPI cards:** total vendido, comissão a pagar, vendedoras ativas.
- **Tabela:** Vendedora | # Pedidos | Vendido | % | Comissão R$ | Ação (link "Ver detalhes →").
- **Linha total** destacada (fundo primary, texto branco).
- **Botões topo:** Exportar (CSV) | Fechar mês.

### D4 — Olist (`/dono/olist`)
- **Card de status conectado:** indicador verde pulsante, última sincronização, botão configurações.
- **Grid 2 cols:**
  - Importar produtos: stats (último import, # produtos, próxima auto) + botão "Importar agora".
  - Exportar pedidos: warning card com # pedidos pendentes + botão "Exportar agora".
- **Log table:** últimas 5 sincronizações com ícone status + tipo + count + data.

### Vendas (`/dono/vendas`)
- Tabela com busca + filtros de status (Todos | Aguardando | Fechados | Cancelados).
- Colunas: Pedido | Cliente | Vendedora | Itens | Pagamento | Total | Status | Data.
- Paginação 50/página.

### Categorias (`/dono/categorias`)
- Grid 3 cols de cards: ícone | nome | # produtos | botão editar.
- Botão "Nova categoria" no header.

### Equipe (`/dono/equipe`)
- Grid 3 cols de cards: Avatar 56px | Nome + papel + comissão% badge | Stats vendido mês + comissão.
- Modal de criação/edição com: Nome, Papel, E-mail (se não vendedora), PIN (se vendedora), Comissão %.

---

## 12. API Routes — contratos

Todas retornam JSON. Erros: `{ error: string, code?: string }` com status apropriado. Validação com **Zod**.

### Auth
- `POST /api/auth/[...nextauth]` — gerenciado pelo NextAuth.

### Produtos
```
GET    /api/products?search=&category=&page=1&pageSize=50&active=true
       → { items: Product[], total: number, page, pageSize }
POST   /api/products                        [DONO]
       body: { name, categoryId, basePrice, variants: [{size, color, stock, price?}] }
GET    /api/products/[id]                   → Product com variants
PUT    /api/products/[id]                   [DONO]
DELETE /api/products/[id]                   [DONO]  (soft delete: active=false)

GET    /api/products/[id]/variants          → ProductVariant[]
POST   /api/products/[id]/variants          [DONO]   body: { size, color, stock, price? }
PUT    /api/products/[id]/variants/[vId]    [DONO]
DELETE /api/products/[id]/variants/[vId]    [DONO]
```

### Categorias
```
GET    /api/categories                      → Category[]
POST   /api/categories                      [DONO]   body: { name }
PUT    /api/categories/[id]                 [DONO]
DELETE /api/categories/[id]                 [DONO]
```

### Clientes
```
GET    /api/customers?search=&phone=        → Customer[]
POST   /api/customers                       body: { name, phone }
GET    /api/customers/[id]                  → Customer + lastOrders
PUT    /api/customers/[id]                  body: { name, phone }
PUT    /api/customers/[id]/profile          body: { sizes, colors, categories, occasions, notes }
```

### Pedidos
```
GET    /api/orders?status=&sellerId=&dateFrom=&dateTo=&page=&pageSize=
POST   /api/orders                          [VENDEDORA — sellerId vem da sessão]
       body: { customerId?, items: [{ variantId, qty }] }
       → cria order OPEN + decrementa estoque em transação
       → gera number: V-YYYYMMDD-NNNN (sequencial diário)

GET    /api/orders/[id]                     → Order com items + customer + seller
PUT    /api/orders/[id]                     [VENDEDORA, mesmo dono, status=OPEN]
       body: { items: [...] }
       → recalcula estoque (delta entre versões)

POST   /api/orders/[id]/items               [VENDEDORA]   body: { variantId, qty }
DELETE /api/orders/[id]/items/[itemId]      [VENDEDORA]

POST   /api/orders/[id]/close               [CAIXA]
       body: { paymentMethod, paymentNote? }
       → status=CLOSED, define commissionAmt = ROUND(total * seller.commissionPct/100, 2)
       → marca para export Olist

POST   /api/orders/[id]/cancel              [VENDEDORA dono OR CAIXA OR DONO]
       → status=CANCELLED, restaura estoque com StockMovement type=RETURN

GET    /api/orders/pending                  [CAIXA]      → orders where status=OPEN
```

### Relatórios
```
GET    /api/reports?dateFrom=&dateTo=       [DONO]
       → { revenue, ordersCount, avgTicket, byDay: [{date, total}], topSellers, lowStock }

GET    /api/commissions?dateFrom=&dateTo=&sellerId=
       → [{ seller, ordersCount, totalSold, totalCommission, commissionPct }]
```

### Olist
```
POST   /api/olist/import-products           [DONO]
       → busca catálogo, faz upsert de Product + Variant, registra SyncLog
GET    /api/olist/status                    → { connected, lastImport, lastExport, pending }
POST   /api/olist/export-orders             [DONO ou cron]
       → exporta orders com status=CLOSED && olistOrderId=null, registra retorno
```

---

## 13. Lógica de negócio crítica

### 13.1 Numeração de pedidos
```ts
async function nextOrderNumber(db) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `V-${today}-`;
  const last = await db.order.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
  });
  const n = last ? parseInt(last.number.slice(-4)) + 1 : 1;
  return prefix + String(n).padStart(4, '0');
}
```

### 13.2 Decremento de estoque (concorrência-safe)
```ts
async function reserveStock(db, variantId: string, qty: number, orderId: string, userId: string) {
  return await db.$transaction(async (tx) => {
    // SELECT … FOR UPDATE (Postgres)
    const [v] = await tx.$queryRaw<{ stockQty: number }[]>`
      SELECT "stockQty" FROM "ProductVariant" WHERE id = ${variantId} FOR UPDATE
    `;
    if (v.stockQty < qty) throw new Error('STOCK_INSUFFICIENT');

    await tx.productVariant.update({
      where: { id: variantId },
      data: { stockQty: { decrement: qty } },
    });
    await tx.stockMovement.create({
      data: { variantId, type: 'SALE', qty: -qty, orderId, userId, reason: 'Pedido criado' },
    });
  });
}
```

### 13.3 Cálculo de comissão (no fechamento do pedido)
```ts
const commission = +(order.total * (seller.commissionPct / 100)).toFixed(2);
```
Atenção: usar `Decimal` do Prisma, não `number` puro, para evitar erros de arredondamento financeiro. Em soma agregada, sempre usar `Prisma.Decimal`.

### 13.4 Cancelar pedido (restaurar estoque)
Para cada `OrderItem`, criar `StockMovement type=RETURN, qty=+item.qty` e `productVariant.update { stockQty: { increment: qty } }`.

### 13.5 Polling no caixa
No `app/(caixa)/caixa/page.tsx`, usar SWR ou um `useEffect` simples:
```ts
useEffect(() => {
  const tick = () => fetch('/api/orders/pending').then(r => r.json()).then(setOrders);
  tick();
  const id = setInterval(tick, 10000);
  return () => clearInterval(id);
}, []);
```

**Upgrade futuro:** trocar polling por Server-Sent Events (`/api/orders/stream`) ou WebSocket (Pusher) para notificação instantânea.

---

## 14. Integração Olist

**Endpoints externos** (verificar documentação oficial atualizada — esta especificação assume API REST com OAuth2):

- `GET /v1/products?page=&limit=` → catálogo
- `POST /v1/orders` → criar pedido
- Auth: `POST /oauth2/token` com `OLIST_APP_KEY`, `OLIST_APP_SECRET`.

**`lib/olist-client.ts`** deve expor:
```ts
export async function olistImportProducts(): Promise<{ count: number, errors: string[] }>;
export async function olistExportOrder(order: Order): Promise<{ olistOrderId: string }>;
```

**Importar produtos** → para cada produto da plataforma, `upsert` por `olistId`, criando `Product` e `ProductVariant` filhos. Adicionar `StockMovement type=IMPORT` para auditar.

**Exportar pedidos** → query orders `where status=CLOSED AND olistOrderId IS NULL`, envia um a um, persiste `olistOrderId` e `exportedAt`.

**Job manual** (não automático): botão "Importar agora" / "Exportar agora" no painel D4.

---

## 15. Ordem de implementação sugerida

Implementação em ondas, cada onda **testável end-to-end**:

### 🌊 Onda 1 — Base (1-2 dias)
1. `npx create-next-app` + dependências
2. Prisma schema + migration + seed (dono, caixa, 3 vendedoras, categorias)
3. Tailwind tokens + fontes
4. `components/ui/` primitivos: Button, Input, Badge, Card, Avatar, Chip, Modal, BottomSheet, EmptyState
5. NextAuth + middleware + página de login (placeholder)

### 🌊 Onda 2 — Catálogo (1 dia)
1. CRUD de Category (API + tela `/dono/categorias`)
2. CRUD de Product + variants (API + telas `/dono/produtos`, `/dono/produtos/[id]`)
3. Stock movements registrados a cada criação/ajuste

### 🌊 Onda 3 — Vendedora MVP (2-3 dias)
1. Login PIN funcionando
2. CRUD de Customer (API + telas V2.5, V3)
3. Profile do customer (V4)
4. Lista de produtos com busca/filtro (V5)
5. Carrinho (Zustand) + variant picker (BottomSheet)
6. Criar pedido com decremento de estoque (V6 → V7)
7. Meus pedidos (V8)

### 🌊 Onda 4 — Caixa MVP (1 dia)
1. Lista de pedidos pendentes com polling (C1)
2. Detalhe + fechar pedido + escolha de pagamento (C2)
3. Confirmação (C3)
4. Cancelar pedido (restaura estoque)

### 🌊 Onda 5 — Dashboard Dono (1-2 dias)
1. Dashboard D1 com KPIs + gráficos (Recharts)
2. Tabela de Vendas
3. Tabela de Comissões D3
4. Página de Equipe (CRUD de Users)

### 🌊 Onda 6 — Comissões Vendedora (0.5 dia)
1. Página V9 puxando dados da nova API `/api/commissions`

### 🌊 Onda 7 — Olist (1-2 dias)
1. `lib/olist-client.ts` com auth OAuth
2. Importar produtos manual (D4)
3. Exportar pedidos manual (D4)
4. Log table

### 🌊 Onda 8 — Polish (1 dia)
1. Animações (BottomSheet slide-up, confirmações)
2. Estados: empty, loading skeletons, errors
3. Toasts (sonner) em todas as ações
4. Responsividade revisitada (vendedora em telas 360-420px, caixa 768+ px)
5. Acessibilidade básica (aria-label, focus rings)

---

## 🎯 Critérios de aceite

- [ ] Vendedora consegue, **do zero** (após login), criar um pedido com cliente novo, preencher perfil, adicionar 2+ produtos com variantes diferentes e enviar para o caixa em **menos de 90 segundos**.
- [ ] Caixa vê pedido novo em **no máximo 10 segundos** (polling).
- [ ] Caixa consegue fechar o pedido com qualquer forma de pagamento.
- [ ] Comissão da vendedora aparece corretamente em `/vendedora/comissoes` e em `/dono/comissoes`.
- [ ] Estoque decrementa ao criar pedido e restaura ao cancelar.
- [ ] Dois pedidos simultâneos do mesmo SKU com estoque=1 → um sucede, outro recebe erro `STOCK_INSUFFICIENT`.
- [ ] Dono vê dashboard com dados reais e consegue exportar comissões em CSV.
- [ ] Botão "Importar Olist" traz produtos da plataforma para o sistema local.

---

## 📎 Anexos úteis

### Tipos compartilhados (`types/index.ts`)
```ts
export type CustomerProfile = {
  sizes: string[];
  colors: string[];
  categories: string[];   // ids
  occasions: string[];
  notes: string;
};

export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  qty: number;
};
```

### Utilitários (`lib/utils.ts`)
```ts
export const fmtBRL = (n: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

export const timeAgo = (date: Date | string) => {
  const ms = Date.now() - new Date(date).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
};

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

---

**Referência visual:** consulte os arquivos `Loja.html` / `Vendedora.html` / `Caixa.html` / `Dono.html` deste projeto — são protótipos clicáveis com **exatamente** o visual e fluxos descritos aqui.

Ao implementar cada tela, abra o protótipo correspondente lado a lado e replique espacamentos, cores, tamanhos e estados de interação.

> Dúvidas sobre alguma tela específica? Cada seção 9, 10 e 11 já indica o estado, componentes e endpoints envolvidos — siga literalmente.
