# AloShop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, high-performance, multi-branch smartphone e-commerce storefront and admin dashboard in Next.js 15 (App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL/Supabase, and next-intl).

**Architecture:** A unified fullstack Next.js 15 application housing both the mobile-first customer storefront (`app/[locale]/(store)`) and the secure multi-branch admin portal (`app/[locale]/admin`). Data is modeled relationally via Prisma with strict branch-level inventory separation, zero hardcoded UI strings across 3 languages (`uz`, `ru`, `en`), and anti-slop design standards.

**Tech Stack:** Next.js 15 (App Router, Server Actions), TypeScript (Strict), Tailwind CSS, shadcn/ui (Radix primitives), Lucide Icons, Prisma ORM, PostgreSQL (Supabase compatible), `next-intl` (Uzbek/Russian/English), Zustand (Cart state), Zod (Validation), bcryptjs & Jose (Admin session auth).

**Spec:** [`docs/superpowers/specs/2026-10-29-aloshop-architecture-design.md`](file:///c:/alo_shop/docs/superpowers/specs/2026-10-29-aloshop-architecture-design.md)  
**Standards:** [`AGENTS.md`](file:///c:/alo_shop/AGENTS.md)

---

## Global Constraints

- **Zero Hardcoding Policy:** Absolutely no raw UI text inside TSX components; all labels, buttons, errors, and badges must be resolved via `useTranslations()` / `getTranslations()` from `messages/uz.json`, `messages/ru.json`, and `messages/en.json`.
- **Zero Emojis Policy:** No Unicode emojies (📱, 🛒, 🔥, ⚡) anywhere in the UI; only clean, consistent vector icons from `lucide-react`.
- **Strict TypeScript:** No `any` type allowed. All database records, props, server action inputs, and API responses must have explicit TypeScript types.
- **Microcopy Standards:** No marketing fluff or verbose AI text. Short, factual, informative microcopy (Model, RAM/Storage, Price in UZS, Warranty, Branch availability).
- **Security Floor:** All server actions and API inputs must be validated with Zod. Admin routes must be protected via middleware and secure HTTP-only cookies. No secrets in client components.

## Review Focus

1. **Multi-Branch Inventory Overselling:** Placing an order for a variant whose quantity in the chosen branch is zero or insufficient must be blocked during checkout validation.
2. **Multilingual Key Parity:** Every translation key in `messages/uz.json` must exist identically in `messages/ru.json` and `messages/en.json` with no missing keys.
3. **IDOR on Branch Admin:** A branch admin assigned to Branch A must not be able to view, edit, or confirm orders or inventory belonging to Branch B.
4. **Variant Price & Image Synchronization:** Switching storage (e.g. 128GB -> 256GB) or color swatches on the product page must reactively update price, old price, SKU, active image gallery, and branch stock badge without page reloads.
5. **Zero Hydration Mismatch on Currency & Dates:** Formatting UZS currency and localized dates must be deterministic and safe across SSR and client hydration.

---

### Task 1: Scaffolding, Core Dependencies & Design System

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `components.json` (shadcn config)
- Create: `app/globals.css`
- Create: `lib/utils/cn.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/table.tsx`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` utility in `lib/utils/cn.ts`
- Produces: Base atomic components in `components/ui/*`

- [ ] **Step 1: Create `package.json` with Next.js 15, TypeScript, Tailwind, Lucide, Prisma and Zod**
- [ ] **Step 2: Run `npm install` to install all dependencies cleanly**
- [ ] **Step 3: Setup `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs` and `app/globals.css` with security headers and Inter font variables**
- [ ] **Step 4: Create `lib/utils/cn.ts` and core shadcn UI components (`button`, `input`, `badge`, `card`, `dialog`, `select`, `table`)**
- [ ] **Step 5: Verify build with `npm run build` or Next.js check**

---

### Task 2: Internationalization Engine (`next-intl`) with Zero Hardcode

**Files:**
- Create: `i18n/routing.ts`
- Create: `i18n/request.ts`
- Create: `middleware.ts`
- Create: `messages/uz.json`
- Create: `messages/ru.json`
- Create: `messages/en.json`
- Create: `components/shared/language-switcher.tsx`
- Create: `lib/constants/locales.ts`
- Create: `tests/i18n-parity.test.ts`

**Interfaces:**
- Consumes: Locales (`uz`, `ru`, `en`)
- Produces: `routing` from `i18n/routing.ts`, `middleware` for locale routing, `LanguageSwitcher` component

- [ ] **Step 1: Write i18n key parity test in `tests/i18n-parity.test.ts` verifying that `uz.json`, `ru.json`, and `en.json` have identical key trees**
- [ ] **Step 2: Run test to verify it fails before dictionary creation**
- [ ] **Step 3: Create `i18n/routing.ts`, `i18n/request.ts`, `middleware.ts`, and comprehensive dictionary files (`messages/uz.json`, `messages/ru.json`, `messages/en.json`) covering navigation, catalog, product specs, branch availability, cart, checkout, and admin**
- [ ] **Step 4: Implement `LanguageSwitcher` component in `components/shared/language-switcher.tsx` using Lucide icons**
- [ ] **Step 5: Run i18n parity test and verify it passes**

---

### Task 3: Prisma Schema & Supabase PostgreSQL Database Setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db/prisma.ts`
- Create: `prisma/seed.ts`
- Create: `.env.example`
- Create: `.env` (with local/supabase fallback)

**Interfaces:**
- Produces: `prisma` client instance from `lib/db/prisma.ts`
- Models: `Branch`, `Category`, `Product`, `ProductVariant`, `BranchInventory`, `IMEIRecord`, `User`, `Order`, `OrderItem`

- [ ] **Step 1: Create `prisma/schema.prisma` defining all entities according to Section 4 of the design doc with relations, indexes, and cascades**
- [ ] **Step 2: Create `lib/db/prisma.ts` as a global singleton client safe for Next.js hot-reloading**
- [ ] **Step 3: Create `prisma/seed.ts` seeding 3 Tashkent branches ("Malika Savdo Markazi", "Chilonzor filiali", "Buyuk Ipak Yo'li") and realistic smartphones (iPhone 15 Pro, iPhone 15, Samsung Galaxy S24 Ultra, Xiaomi 14) with colors, storage variants, UZS pricing, and stock per branch**
- [ ] **Step 4: Generate Prisma Client via `npx prisma generate`**
- [ ] **Step 5: Verify seed script runs and populates database records cleanly**

---

### Task 4: Storefront Layout, Navigation & Catalog Filtering

**Files:**
- Create: `app/[locale]/layout.tsx`
- Create: `app/[locale]/(store)/layout.tsx`
- Create: `app/[locale]/(store)/page.tsx`
- Create: `app/[locale]/(store)/catalog/page.tsx`
- Create: `components/store/header.tsx`
- Create: `components/store/footer.tsx`
- Create: `components/store/mobile-nav.tsx`
- Create: `components/store/product-card.tsx`
- Create: `components/store/filter-sidebar.tsx`
- Create: `lib/utils/format-currency.ts`

**Interfaces:**
- Consumes: `prisma`, `useTranslations`, `formatCurrency(amount: number): string`
- Produces: `ProductCard`, `FilterSidebar`, `StoreHeader`, `MobileNav`

- [ ] **Step 1: Write unit test for `formatCurrency(14850000)` ensuring output is formatted as `14 850 000 so'm`**
- [ ] **Step 2: Implement `lib/utils/format-currency.ts` and verify test passes**
- [ ] **Step 3: Build Storefront Header, Mobile Bottom Navigation bar (Home, Catalog, Cart, Branches) and Footer using Lucide icons and `messages/*.json`**
- [ ] **Step 4: Implement `ProductCard` displaying brand, model, price, old price discount badge, color swatches preview, and branch availability badge**
- [ ] **Step 5: Build Home page (`page.tsx`) with Hero section, Brand filters (Apple, Samsung, Xiaomi), and Top smartphones grid**
- [ ] **Step 6: Build Catalog page (`catalog/page.tsx`) with dynamic server-side filters (Brand, Storage, Price, Branch)**

---

### Task 5: Product Details, Reactive Variant Selector & Branch Stock Breakdown

**Files:**
- Create: `app/[locale]/(store)/product/[slug]/page.tsx`
- Create: `components/store/variant-selector.tsx`
- Create: `components/store/branch-stock-widget.tsx`
- Create: `components/store/product-gallery.tsx`

**Interfaces:**
- Consumes: Product with variants and branch inventory relations
- Produces: Interactive client components `VariantSelector` and `BranchStockWidget`

- [ ] **Step 1: Implement `ProductGallery` with thumbnail previews and zoom preview**
- [ ] **Step 2: Implement `VariantSelector` with color swatch circles and storage buttons (128GB, 256GB, 512GB), updating active variant state**
- [ ] **Step 3: Implement `BranchStockWidget` showing real-time stock per branch (e.g. "Malika: 3 dona bor", "Chilonzor: Mavjud emas") with green/muted indicators**
- [ ] **Step 4: Assemble dynamic Product Details page (`app/[locale]/(store)/product/[slug]/page.tsx`) with warranty badge, technical specs table, and 1-Click Buy CTA**
- [ ] **Step 5: Verify switching variants immediately updates price, SKU, gallery, and branch stock**

---

### Task 6: Shopping Cart & 1-Click Fast Checkout Flow

**Files:**
- Create: `lib/store/use-cart.ts`
- Create: `app/[locale]/(store)/cart/page.tsx`
- Create: `app/[locale]/(store)/checkout/page.tsx`
- Create: `components/store/cart-item-row.tsx`
- Create: `components/store/checkout-form.tsx`
- Create: `app/actions/checkout.ts`
- Create: `lib/validations/checkout.ts`

**Interfaces:**
- Produces: `useCart` Zustand hook with `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- Produces: `createOrderAction(formData: CheckoutInput)` Server Action validating with Zod and creating Prisma `Order` + `OrderItem` records

- [ ] **Step 1: Write unit test for `lib/validations/checkout.ts` testing Uzbek phone format (+998...) and branch/delivery requirements**
- [ ] **Step 2: Implement `lib/store/use-cart.ts` with local storage synchronization and stock limit validation**
- [ ] **Step 3: Build Cart page (`cart/page.tsx`) displaying selected phones, variant details (color, storage), quantity stepper, and total sum**
- [ ] **Step 4: Build Checkout page (`checkout/page.tsx`) with Fulfillment Toggle: "Filialdan olib ketish" (select branch) vs "Yetkazib berish" (enter address)**
- [ ] **Step 5: Implement `createOrderAction` in `app/actions/checkout.ts`: validate Zod schema, check branch stock, create order in database, decrement `BranchInventory`, and return success order number**
- [ ] **Step 6: Verify end-to-end checkout flow produces an order and redirects to Order Confirmation view**

---

### Task 7: Admin Authentication, RBAC & Multi-Branch Shell

**Files:**
- Create: `lib/auth/session.ts`
- Create: `lib/auth/admin.ts`
- Create: `app/[locale]/admin/login/page.tsx`
- Create: `app/[locale]/admin/layout.tsx`
- Create: `app/[locale]/admin/dashboard/page.tsx`
- Create: `components/admin/admin-sidebar.tsx`
- Create: `components/admin/admin-header.tsx`
- Create: `app/actions/auth.ts`

**Interfaces:**
- Produces: `verifyAdminSession()`, `loginAdminAction()`, `logoutAdminAction()`
- Middleware protection for all `/admin/*` paths (except `/admin/login`)

- [ ] **Step 1: Implement `lib/auth/session.ts` managing signed JWT session cookies with `httpOnly`, `sameSite: 'lax'`, and `secure` flags**
- [ ] **Step 2: Implement `loginAdminAction` supporting SuperAdmin via `.env` (`SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD`) and Branch Admins via `User` table**
- [ ] **Step 3: Update `middleware.ts` to redirect unauthenticated requests from `/admin/*` to `/admin/login`**
- [ ] **Step 4: Build Admin Login Page (`app/[locale]/admin/login/page.tsx`) with clean shadcn Card and Input**
- [ ] **Step 5: Build Admin Shell (`layout.tsx`, `admin-sidebar.tsx`, `admin-header.tsx`) with branch indicator badge and navigation**
- [ ] **Step 6: Build Admin Dashboard (`dashboard/page.tsx`) showing Total Revenue, Total Orders, Active Branches, and Low Stock Alerts**

---

### Task 8: Admin Management: Products, Branch Stock & Orders

**Files:**
- Create: `app/[locale]/admin/products/page.tsx`
- Create: `app/[locale]/admin/products/new/page.tsx`
- Create: `app/[locale]/admin/branches/page.tsx`
- Create: `app/[locale]/admin/orders/page.tsx`
- Create: `app/[locale]/admin/users/page.tsx`
- Create: `components/admin/stock-transfer-modal.tsx`
- Create: `components/admin/order-status-selector.tsx`
- Create: `app/actions/admin-products.ts`
- Create: `app/actions/admin-orders.ts`
- Create: `app/actions/admin-inventory.ts`

**Interfaces:**
- Consumes: `verifyAdminSession()` ensuring branch admins only access their own branch data
- Produces: Server actions for updating order status, adjusting stock, transferring stock between branches, and creating branch admins

- [ ] **Step 1: Build Admin Products Page with table of all smartphones, variants, prices, and total stock**
- [ ] **Step 2: Build Branch Inventory Manager (`branches/page.tsx`) allowing stock adjustments and inter-branch stock transfers**
- [ ] **Step 3: Build Admin Orders Manager (`orders/page.tsx`) showing customer phone, fulfillment type, pickup branch, and real-time status switcher (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`)**
- [ ] **Step 4: Build SuperAdmin User Management (`users/page.tsx`) allowing creation of Branch Admin accounts tied to specific branches**
- [ ] **Step 5: Verify branch admin permissions: branch admin can only view orders and stock for their assigned branch**

---

### Task 9: Final Audits, Mobile Polish & Vercel Deployment Documentation

**Files:**
- Create: `README.md`
- Create: `scripts/verify-i18n.ts`
- Modify: `docs/superpowers/specs/2026-10-29-aloshop-architecture-design.md`

**Interfaces:**
- Verification of: 3-language zero hardcoding, strict TypeScript compilation, mobile UX responsiveness, Vercel readiness

- [ ] **Step 1: Run `npm run lint` and TypeScript `npx tsc --noEmit` to verify 0 errors**
- [ ] **Step 2: Run i18n audit script ensuring zero untranslated hardcoded strings across all components**
- [ ] **Step 3: Test mobile viewport layout (375px, 414px) ensuring touch targets, bottom bar, and variant swatches are optimal**
- [ ] **Step 4: Create comprehensive `README.md` with Supabase setup instructions, `.env` variables guide, and 1-click Vercel deploy button**
- [ ] **Step 5: Run production build `npm run build` and ensure all static and dynamic routes generate cleanly**

