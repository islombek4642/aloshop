# AloShop Audit Fixes & Enhancements Design

**Date:** 2026-10-29  
**Status:** Pending Approval  
**Authors:** AloShop AI Engineering Agent  
**Scope:** Architecture & Bug Fixes for Storefront Branches, Inventory Overselling Protection, Checkout Resilience, and Dependencies.

---

## 1. Intent & Goals

### 1.1 Intent
Resolve all architectural discrepancies and missing implementations identified in `PROJECT_AUDIT_REPORT.md` while adhering strictly to `AGENTS.md` (Zero Emojis, Zero Hardcoding, Strict TypeScript, Multi-Branch Inventory Integrity, and Anti-UI Slop).

### 1.2 Goals
1. **Zero 404 on Branches:** Provide a high-performance, mobile-first customer storefront branches page (`/branches`) featuring branch locations, working hours, contact info, and live inventory status.
2. **100% Overselling Protection:** Guarantee that neither branch pickup nor delivery orders can be placed for items with insufficient stock.
3. **Smart Delivery Inventory Allocation:** Automatically locate and bind the nearest/optimal branch with sufficient stock for delivery orders, decrementing inventory atomically in Prisma transactions.
4. **Checkout Page Resilience:** Provide fallback resilience in `checkout/page.tsx` if the database connection has transient issues or before seeds are run.
5. **Clean Dependencies & Strict Zero Hardcoding:** Ensure `tsx` is declared in `devDependencies` and all footer branch descriptions use dynamic/i18n keys.

### 1.3 Anti-Goals
- No raw CSS bloat: All designs must use existing Tailwind CSS tokens and shadcn/ui primitives.
- No Unicode emojis: Strictly Lucide vector icons.
- No breaking changes to existing database models in `schema.prisma`.

---

## 2. Selected Approach: Automated Smart Inventory Allocation & Resilient Vitrina

We considered two approaches during brainstorming:
- **Approach 1 (Selected):** Automated pre-checkout branch inventory validation and atomic reservation. Pickups check the chosen branch; deliveries auto-resolve to an active branch that has stock for all order items. If no branch has stock, checkout is rejected with localized error.
- **Approach 2 (Rejected):** Deferred allocation where deliveries don't decrement stock until admin confirmation. Rejected due to overselling vulnerability when concurrent orders occur.

---

## 3. Detailed Component & Logic Design

### 3.1 Storefront Branches Page (`app/[locale]/(store)/branches/page.tsx`)
- **Route:** `/[locale]/(store)/branches`
- **Design:** Mobile-first layout with clean branch cards:
  - Header: Title (`branches.title`), Subtitle (`branches.subtitle`) via `next-intl`.
  - Branch Card Grid:
    - Branch Name & City badge.
    - Address with `MapPin` icon.
    - Working hours with `Clock` icon and "Hozir ochiq" badge.
    - Phone number with `Phone` icon and one-tap click-to-call.
    - "Tovarlar mavjud" status indicator with `CheckCircle2` icon.
    - Action buttons: "Telefon qilish" and "Katalogda tovarlarni ko'rish" filtering by this branch (`/catalog?branch={slug}`).
- **Data Fetching:** Fetch active branches via `prisma.branch.findMany({ where: { isActive: true }, include: { inventory: true } })` with fallback to `FALLBACK_BRANCHES` in case of database cold start.

### 3.2 Inventory Overselling & Delivery Allocation in `app/actions/checkout.ts`
- **Pickup Flow (`PICKUP_FROM_BRANCH`):**
  - For each cart item, query `branchInventory` for `pickupBranchId` and `variantId`.
  - If record is missing or `quantity < requestedQuantity`, abort transaction and return `{ success: false, error: "insufficientBranchStock" }`.
  - Atomically decrement `quantity: { decrement: item.quantity }`.
- **Delivery Flow (`DELIVERY`):**
  - Find all active branches.
  - Check which branch has `quantity >= item.quantity` for **all** items in `data.items`.
  - If a qualifying branch is found, set it as `order.pickupBranchId` (fulfilling branch) and decrement the inventory from that branch atomically.
  - If no single branch has all items in stock, abort transaction and return `{ success: false, error: "outOfStockDelivery" }`.

### 3.3 Checkout Form Handling (`components/store/checkout-form.tsx`)
- Map new error keys (`insufficientBranchStock`, `outOfStockDelivery`) to localized messages in `checkout.validation.*`.
- Ensure translation dictionaries (`uz.json`, `ru.json`, `en.json`) include user-friendly explanations.

### 3.4 Checkout Page Resilience (`app/[locale]/(store)/checkout/page.tsx`)
- Wrap `prisma.branch.findMany` in `try/catch` and provide fallback branch options so the page renders safely even if database connectivity is initializing.

### 3.5 Footer Dynamic Branches (`components/store/footer.tsx`)
- Replace hardcoded Tashkent address lines in `footer.tsx` with localized dictionary strings or dynamic branch entities.

### 3.6 Dependencies (`package.json`)
- Add `"tsx": "^4.19.2"` to `devDependencies`.

---

## 4. Verification & Testing Plan
1. **i18n Parity Test:** Verify `uz.json`, `ru.json`, and `en.json` maintain 100% key parity and zero emojis.
2. **Checkout Validation Suite:** Run `tests/checkout-validation.test.ts` to verify phone, honeypot, and payload schemas.
3. **Manual Route Verification:** Verify `/branches` route loads cleanly in SSR and client navigation.
4. **Overselling Test:** Verify that ordering quantity > stock returns proper error and does not decrement below zero.
