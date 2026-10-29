# AloShop Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 4 architectural discrepancies identified in `PROJECT_AUDIT_REPORT.md`: create the missing storefront `/branches` page, prevent inventory overselling for both pickup and delivery, add resilient fallbacks to the checkout page, and clean dependencies.

**Architecture:** A robust server-side inventory verification and allocation engine within Prisma transactions in Next.js Server Actions (`app/actions/checkout.ts`), combined with a mobile-first, zero-hardcoded customer branches page (`app/[locale]/(store)/branches/page.tsx`) and resilient UI handling in `checkout-form.tsx` and `checkout/page.tsx`.

**Tech Stack:** Next.js 15 (App Router, Server Actions), TypeScript (Strict), Tailwind CSS, Lucide Icons, Prisma ORM, next-intl (`uz`, `ru`, `en`), Zod.

**Spec:** [`docs/superpowers/specs/2026-10-29-aloshop-audit-fixes-design.md`](file:///d:/aloshop/docs/superpowers/specs/2026-10-29-aloshop-audit-fixes-design.md)

## Global Constraints

- **Zero Hardcoding Policy:** Absolutely no raw UI text; all labels, branch attributes, and errors must be resolved through `messages/{uz,ru,en}.json`.
- **Zero Emojis Policy:** No Unicode emojies anywhere in UI or dictionaries; use Lucide vector icons exclusively.
- **Strict TypeScript:** No `any` type allowed.
- **Prisma Transaction Safety:** Inventory checks and updates must occur atomically inside `prisma.$transaction`.
- **Anti-UI Slop Standards:** Mobile-first responsive layout matching the established design system tokens.

## Review Focus

1. **Pickup Overselling Condition:** Attempting to place an order at Branch A when requested quantity > available quantity returns `insufficientBranchStock` and records no order.
2. **Delivery Allocation Condition:** Delivery order automatically sets `pickupBranchId` to an active branch with sufficient stock for all items; if no branch has stock, returns `outOfStockDelivery`.
3. **Storefront /branches Route:** Clicking "Filiallar" in header, footer, or mobile navigation renders the new `/branches` page cleanly with 200 OK.
4. **Checkout Fallback Condition:** If the database connection is unseeded or down, `/checkout` renders without 500 server crashes.
5. **Multilingual Key Parity:** All new translation keys match 1:1 across `uz.json`, `ru.json`, and `en.json`.

---

### Task 1: Dependencies & Multilingual Error Dictionary Entries

**Files:**
- Modify: `package.json`
- Modify: `messages/uz.json`
- Modify: `messages/ru.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: `"tsx"` in `devDependencies` in `package.json`
- Produces: `checkout.validation.insufficientBranchStock` and `checkout.validation.outOfStockDelivery` keys in all 3 language dictionaries

- [ ] **Step 1: Add `tsx` to `devDependencies` in `package.json`**
Add `"tsx": "^4.19.2"` under `devDependencies`.

- [ ] **Step 2: Add translation keys for new inventory errors to `messages/uz.json`**
Under `checkout.validation`, add:
- `"insufficientBranchStock": "Tanlangan filialda ushbu mahsulot zaxirasi yetarli emas"`
- `"outOfStockDelivery": "Afsuski, yetkazib berish uchun barcha tovarlar mavjud bo'lgan filial topilmadi"`

- [ ] **Step 3: Add matching translation keys to `messages/ru.json` and `messages/en.json`**
Under `checkout.validation`, add:
- Russian: `"insufficientBranchStock": "В выбранном филиале недостаточно товара в наличии"`, `"outOfStockDelivery": "К сожалению, не найден филиал с полным наличием товаров для доставки"`
- English: `"insufficientBranchStock": "Insufficient stock available in the selected branch"`, `"outOfStockDelivery": "Unfortunately, no branch has all requested items in stock for delivery"`

- [ ] **Step 4: Run Node parity check script to verify 1:1 parity and zero emojis**
Run node inline verification to confirm parity across all 3 dictionary files.

---

### Task 2: Server Action: Branch Overselling Protection & Delivery Smart Allocation

**Files:**
- Modify: `app/actions/checkout.ts`

**Interfaces:**
- Consumes: `prisma`, `CheckoutInput`, `cleanUzPhone`
- Produces: `createOrderAction(rawInput: CheckoutInput): Promise<CreateOrderResult>` with strict stock validation

- [ ] **Step 1: Implement pickup stock validation in `app/actions/checkout.ts`**
Inside `prisma.$transaction`:
When `data.fulfillmentType === "PICKUP_FROM_BRANCH"`:
For each item in `data.items`, query `tx.branchInventory.findUnique` for `branchId_variantId`.
If inventory is null or `inventory.quantity < item.quantity`, throw error `"INSUFFICIENT_BRANCH_STOCK"`.
Atomically decrement inventory: `tx.branchInventory.update({ where: { id: inventory.id }, data: { quantity: { decrement: item.quantity } } })`.

- [ ] **Step 2: Implement smart nearest branch inventory allocation for `DELIVERY` in `app/actions/checkout.ts`**
Inside `prisma.$transaction`:
When `data.fulfillmentType === "DELIVERY"`:
Fetch all active branches with their inventories for the requested variant IDs.
Find the first active branch where for **all** items in `data.items`, `branchInventory.quantity >= item.quantity`.
If no qualifying branch exists, throw error `"OUT_OF_STOCK_DELIVERY"`.
Assign the qualifying branch's ID as `order.pickupBranchId` (fulfilling branch).
Atomically decrement inventory from that qualifying branch.

- [ ] **Step 3: Return typed error codes in `createOrderAction` error handler**
Catch `"INSUFFICIENT_BRANCH_STOCK"` -> return `{ success: false, error: "insufficientBranchStock" }`.
Catch `"OUT_OF_STOCK_DELIVERY"` -> return `{ success: false, error: "outOfStockDelivery" }`.

---

### Task 3: Storefront Branches Page & Navigation Polish

**Files:**
- Create: `app/[locale]/(store)/branches/page.tsx`
- Modify: `components/store/footer.tsx`

**Interfaces:**
- Produces: Storefront Branches Page `/[locale]/branches`
- Consumes: `prisma.branch`, `useTranslations("branches")`, `useTranslations("common")`

- [ ] **Step 1: Create `app/[locale]/(store)/branches/page.tsx`**
Implement the customer-facing branches view:
- Server Component with `generateMetadata` and `setRequestLocale(locale)`.
- Fetch active branches with their `inventory` counts, safely wrapped with `FALLBACK_BRANCHES` in case of initial setup.
- Display hero banner: `branches.title`, `branches.subtitle`.
- Responsive grid of branch cards with `Building2`, `MapPin`, `Clock`, `Phone`, `ShieldCheck` icons.
- Working hours badge ("Hozir ochiq"), direct phone call button, and link to view filtered catalog (`/catalog?branch=${slug}`).

- [ ] **Step 2: Clean `components/store/footer.tsx` hardcoded branch details**
Replace the static branches array with dynamic fallback or localized strings aligned with `AGENTS.md 3.3`.

---

### Task 4: Checkout Page Resilience & Client Error Mapping

**Files:**
- Modify: `app/[locale]/(store)/checkout/page.tsx`
- Modify: `components/store/checkout-form.tsx`

**Interfaces:**
- Produces: Resilient `CheckoutPage` with DB error handling and fallbacks
- Produces: Clear user-facing error banners for `insufficientBranchStock` and `outOfStockDelivery`

- [ ] **Step 1: Add DB try/catch and fallback in `app/[locale]/(store)/checkout/page.tsx`**
Wrap `prisma.branch.findMany` in `try ... catch`. If DB error occurs (e.g. cold start), provide `FALLBACK_BRANCHES` so the user still sees the form cleanly.

- [ ] **Step 2: Map new error codes in `components/store/checkout-form.tsx`**
Inside `handleSubmit`, map `response.error === "insufficientBranchStock"` to `tCheckout("validation.insufficientBranchStock")` and `response.error === "outOfStockDelivery"` to `tCheckout("validation.outOfStockDelivery")`.

---

### Task 5: Final Audits, Verification & Consistency Check

**Files:**
- Test: `tests/checkout-validation.test.ts`
- Test: `tests/i18n-parity.test.ts`

**Interfaces:**
- Verification: 100% i18n parity, Zero Emojis check, Zero TypeScript errors, Zero broken links.

- [ ] **Step 1: Run i18n parity & zero emoji audit**
Verify all dictionary keys across `uz`, `ru`, `en` have 0 parity errors and 0 emojis.

- [ ] **Step 2: Run raw text audit across all TSX files**
Confirm zero hardcoded strings introduced into TSX files.

- [ ] **Step 3: Update `PROJECT_AUDIT_REPORT.md` status**
Document that all identified discrepancies have been resolved.
