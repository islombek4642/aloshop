# AloShop — Modern Multi-Branch Phone & Gadgets Storefront

AloShop is an enterprise-grade, mobile-first e-commerce storefront and multi-branch management platform built for modern consumer electronics and smartphone retail in Uzbekistan.

Designed with Next.js 15 (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS, shadcn/ui, Prisma ORM, and PostgreSQL.

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Engineering Standards](#engineering-standards)
- [Local Development Setup](#local-development-setup)
- [Supabase PostgreSQL Setup](#supabase-postgresql-setup)
- [Vercel Deployment Guide](#vercel-deployment-guide)
- [Verification and Testing](#verification-and-testing)
- [License](#license)

---

## Architectural Overview

AloShop is partitioned into two core application layers with clean Separation of Concerns (SoC):

```
                        +---------------------------------------------+
                        |                 Next.js 15                  |
                        |      (App Router + Server Components)       |
                        +---------------------------------------------+
                                       /              \
                                      /                \
          +-------------------------------+        +-------------------------------+
          |       Customer Storefront     |        |    Multi-Branch Admin Panel   |
          |    app/[locale]/(store)       |        |      app/[locale]/admin       |
          +-------------------------------+        +-------------------------------+
          | - Mobile-First Catalog        |        | - Multi-Branch Inventory      |
          | - Color & Storage Swatches    |        | - Role-Based Access Control   |
          | - Real-time Stock per Branch  |        | - Product & Variant Mgmt      |
          | - 1-Click Fast Checkout       |        | - Order Processing & Status   |
          | - Full i18n (UZ, RU, EN)      |        | - IMEI Record Preparedness    |
          +-------------------------------+        +-------------------------------+
                                       \              /
                                        \            /
                        +---------------------------------------------+
                        |            Prisma ORM & PostgreSQL          |
                        |   (Supabase Pooler + Direct Connection)     |
                        +---------------------------------------------+
```

1. **Customer Storefront (`app/[locale]/(store)`):**
   - Optimized for mobile viewports (over 85% of shoppers in Central Asia browse on mobile).
   - High-performance Server Components with static generation and streaming.
   - Interactive variant selectors (Storage, Color swatches, Condition).
   - Branch availability indicator with live quantities per store (e.g., "Malika: 3 in stock").
   - 1-Click checkout with phone verification and anti-spam honeypot.

2. **Admin Dashboard (`app/[locale]/admin`):**
   - Role-Based Access Control (RBAC): `SUPER_ADMIN` (global access across all branches) and `BRANCH_ADMIN` (strict branch-isolated access).
   - Product and variant inventory tracking per retail branch.
   - Secure server-side authentication using HttpOnly, SameSite JWT session cookies.
   - Order management with fulfillment tracking (Pickup from Branch / Courier Delivery).

---

## Key Features

- **Multi-Branch Inventory Management:**
  Inventory is tracked independently per retail branch (`BranchInventory`). Prevents overselling and supports branch pickup logistics.
- **Phone Variant Configurator:**
  Dynamic SKU selection across Color swatches, Internal Storage (128GB, 256GB, 512GB, 1TB), and Condition (New / Used).
- **Trilingual Localization (UZ / RU / EN):**
  100% parity across Uzbek, Russian, and English with strict zero-hardcoding policy via `next-intl`.
- **Anti-Spam & Fraud Protection:**
  Invisible honeypot traps for automated bots, strict Uzbekistan phone validation (`+998 XX XXX XX XX`), and rate limiting.
- **IMEI Preparedness:**
  Database schema includes `IMEIRecord` structures ready for POS barcode scanner and device serial tracking integration.
- **Zero-Emoji Professional UI:**
  Premium aesthetic with stroke-consistent vector icons (`lucide-react`) and zero informal emojis.

---

## Tech Stack

| Domain | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions, React Server Components) |
| Language | TypeScript 5.7 (Strict Mode, 0 `any` allowance) |
| Styling & UI | Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), Lucide Icons |
| Database & ORM | PostgreSQL, Prisma ORM 6.2 |
| Localization | `next-intl` (Uzbek `uz`, Russian `ru`, English `en`) |
| Auth & Security | JOSE (JWT signed sessions), `bcryptjs`, HttpOnly Secure Cookies |
| State Management | Zustand 5 (Client shopping cart and local preferences) |
| Validation | Zod 3.24 |

---

## Directory Structure

```
alo_shop/
├── app/
│   └── [locale]/
│       ├── (store)/                 # Customer storefront pages
│       │   ├── catalog/             # Search, category and brand filters
│       │   ├── product/[slug]/      # PDP with dynamic variant selectors
│       │   ├── cart/                # Slide-out and page cart
│       │   └── checkout/            # 1-Click checkout and order review
│       ├── admin/                   # Administrative panel
│       │   ├── login/               # Secure admin login
│       │   ├── dashboard/           # KPIs, sales metrics, low-stock warnings
│       │   ├── products/            # Catalog and variant manager
│       │   ├── inventory/           # Branch stock allocations
│       │   ├── orders/              # Order status updates and fulfillment
│       │   ├── branches/            # Retail branch locations (Super Admin)
│       │   └── users/               # Staff and branch manager accounts
│       ├── layout.tsx               # Root localized layout
│       └── page.tsx                 # Storefront homepage
├── components/
│   ├── admin/                       # Admin layout, sidebar, tables, stat cards
│   ├── storefront/                  # Catalog grids, variant selector, branch badge
│   ├── shared/                      # Navbar, footer, locale switcher, modals
│   └── ui/                          # shadcn/ui atomic components
├── lib/
│   ├── auth/                        # JWT session management & RBAC utilities
│   ├── db/                          # Prisma database singleton
│   ├── utils/                       # Currency formatting, cn helper
│   └── validations/                 # Zod schemas (checkout, auth, inventory)
├── messages/                        # Localization dictionaries (uz.json, ru.json, en.json)
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Demo seed with branches, phones, variants
├── scripts/
│   ├── test-i18n.ts                 # i18n parity and quality audit
│   └── verify-all.ts                # Master verification runner
├── tests/                           # Unit and integration test suites
└── middleware.ts                    # Routing, locale detection and admin route guard
```

---

## Engineering Standards

AloShop adheres to strict production engineering rules documented in `AGENTS.md`:

1. **DRY (Don't Repeat Yourself):** Shared logic (price formatting, locale routing, auth verification) is centralized in `lib/` and reusable UI components in `components/shared/` or `components/ui/`.
2. **Zero Hardcoding Policy:** Every user-facing string is retrieved via `useTranslations()` / `getTranslations()` from `messages/*.json`.
3. **Strict TypeScript:** No `any` types. All API inputs, Prisma queries, and Server Actions are typed with compile-time verification.
4. **Zero Emojis Policy:** No Unicode emojis in buttons, banners, badges, or headers. Lucide icons are used exclusively for clean visual hierarchy.
5. **Anti-UI Slop Standards:** Minimalist, high-contrast typography, crisp borders, and purposeful whitespace designed for high conversion.

---

## Local Development Setup

### 1. Prerequisites

- Node.js 18.18 or higher (Node 20+ recommended)
- npm, pnpm, or yarn
- PostgreSQL instance (local or hosted on Supabase / Neon / Railway)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/your-org/alo_shop.git
cd alo_shop
npm install
```

### 3. Configure Environment Variables

Copy the example environment template:

```bash
cp .env.example .env
```

Edit `.env` and fill in your database and secret credentials:

```env
# Database Connection (PostgreSQL or Supabase)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aloshop?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/aloshop?schema=public"

# Admin Credentials
SUPER_ADMIN_USERNAME="admin"
SUPER_ADMIN_PASSWORD="superadmin_secret_password_change_me"

# JWT / Cookie Security Key (32+ character random string)
AUTH_SECRET="your-secure-random-32-character-secret-key-here"
```

### 4. Initialize Database and Seed Data

Push the Prisma schema to your database and load the initial seed:

```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed sample branches, smartphones, variants, and admin accounts
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Customer Storefront: `http://localhost:3000/uz`
- Admin Login: `http://localhost:3000/uz/admin/login`
- Default SuperAdmin Login: `admin` / `superadmin_secret_password_change_me`

---

## Supabase PostgreSQL Setup

AloShop is optimized for PostgreSQL hosted on Supabase. Follow these steps for cloud database setup:

1. **Create a Supabase Project:**
   - Sign in to [Supabase](https://supabase.com).
   - Create a new project, select your region (e.g., Central Europe / Frankfurt for optimal latency to Uzbekistan), and set a secure database password.

2. **Obtain Connection Strings:**
   - In your Supabase Project, navigate to **Project Settings** -> **Database**.
   - Under **Connection string**, select **URI**:
     - **Session / Transaction Pooler (Port 6543):** Copy this URI for `DATABASE_URL`. Set `?pgbouncer=true&connection_limit=1`.
     - **Direct Connection (Port 5432):** Copy this URI for `DIRECT_URL`.

3. **Update `.env`:**
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

4. **Apply Schema and Seed:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

---

## Vercel Deployment Guide

Deploy AloShop to Vercel in minutes:

### 1. Push Code to Git
Ensure your repository is pushed to GitHub, GitLab, or Bitbucket.

### 2. Import Project in Vercel
1. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your `alo_shop` repository.
3. Framework Preset: **Next.js** (detected automatically).
4. Root Directory: `./`

### 3. Configure Environment Variables
In the Vercel project configuration, add the following variables under **Environment Variables**:

| Variable Name | Description | Example / Note |
|---|---|---|
| `DATABASE_URL` | Supabase Transaction Pooler URL | Port 6543 with `?pgbouncer=true` |
| `DIRECT_URL` | Supabase Direct Connection URL | Port 5432 (for migrations) |
| `AUTH_SECRET` | 32+ character random secret for JWT | Generate with `openssl rand -hex 32` |
| `SUPER_ADMIN_USERNAME` | Default SuperAdmin login username | e.g., `admin` |
| `SUPER_ADMIN_PASSWORD` | Strong password for SuperAdmin | Minimum 12 characters |
| `NODE_ENV` | Production environment flag | `production` |

### 4. Build & Output Settings
- **Build Command:** `prisma generate && next build`
  *(Adding `prisma generate` ensures Prisma Client binaries are built inside the Vercel serverless runtime)*
- **Install Command:** `npm install`
- **Output Directory:** `.next`

### 5. Deploy
Click **Deploy**. Vercel will build the application, pre-render localized static pages, and produce optimized edge serverless functions.

---

## Verification and Testing

AloShop includes a master test and audit suite that validates translations, financial formatting, security rules, and TypeScript type safety.

### Run All Verifications

```bash
npm run verify
```

The master script executes 6 automated test suites:
1. `scripts/test-i18n.ts`: Validates 1:1 key parity across `uz.json`, `ru.json`, and `en.json`, non-empty strings, and zero emojis.
2. `tests/format-currency.test.ts`: Verifies monetary formatting for Uzbek So'm (`14 850 000 so'm`) and USD (`1 200 $`).
3. `tests/checkout-validation.test.ts`: Validates order payloads, branch pickup vs courier delivery constraints, and anti-spam honeypot detection.
4. `tests/admin-auth.test.ts`: Tests JWT session creation, tamper resistance, token expiry, and multi-branch RBAC isolation.
5. `tests/prisma-schema.test.ts`: Validates Prisma client delegates, DMMF model definitions, and enums.
6. Strict TypeScript check (`tsc --noEmit`): Compiles entire codebase with 0 errors.

### Build Verification

```bash
npm run build
```

Confirms production bundling, static generation of 39+ localized routes, and middleware tree-shaking.

---

## License

Private and proprietary. Developed for AloShop retail operations.
