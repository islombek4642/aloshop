# Storefront Gallery Auto-Carousel, Fluid Specs View, and Complete Admin Product CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement auto-advancing product gallery carousel, responsive non-truncated device vitals, missing i18n translation key, and a streamlined single-screen preset-driven CRUD system for products in the admin panel.

**Architecture:** 
- Storefront components (`ProductGallery` and `SnapshotSpecsView`) receive self-managing autoplay timers and fluid, auto-wrapping layout containers.
- Shared pricing module `lib/catalog/pricing.ts` supplies authoritative suggested retail prices for the 41 catalog models.
- Transactional server actions `createOrUpdateProductFromPresetAction` and `deleteProductAction` handle preset-to-database upsert and safe cascade deletion with RBAC enforcement.
- Admin UI integrates a unified `ProductPresetMatrixForm` (for both creation and editing) and equips `ProductsListView` with interactive Edit and Delete actions.

**Tech Stack:** Next.js 15 (App Router, Server Actions, RSC), TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, next-intl, Lucide Icons.

**Spec:** [`docs/superpowers/specs/2026-11-03-store-gallery-specs-admin-preset-design.md`](file:///c:/alo_shop/docs/superpowers/specs/2026-11-03-store-gallery-specs-admin-preset-design.md)

## Global Constraints

- Zero emojis policy: No Unicode emojis in any UI, commit message, code, or logs (AGENTS.md Rule 3.4).
- Tailwind CSS only: No standalone CSS files (AGENTS.md Rule 3.4).
- Strict TypeScript: No `any` types (AGENTS.md Rule 4).
- Multi-language parity: All user-facing strings localized across `uz`, `ru`, `en` (AGENTS.md Rule 3.3).
- Branch Admin RBAC isolation: Branch Admins can only view and mutate inventory for their assigned branch (AGENTS.md Rule 5.3).

## Review Focus

1. **Preset Model Upsert Collision:** Selecting an existing model in the preset form must safely update product hardware specs and variants without crashing or creating duplicate product slugs. (Tested in Task 5).
2. **Auto-Carousel Touch Interrupt:** Touching or swiping images on mobile must pause the auto-advance timer to prevent unexpected page jumping while the user interacts. (Tested in Task 2).
3. **Hardware Specs Label Overflow:** Ultra-long values (periscope zoom cameras, 45W MagSafe charging strings) must wrap onto new lines without overflowing or breaking grid alignment on 320px–390px mobile screens. (Tested in Task 3).
4. **Delete Cascade Safety with Active Orders:** Attempting to delete a product associated with active unfulfilled orders (`PENDING`, `CONFIRMED`) must be rejected with a user-friendly error message rather than breaking database referential integrity. (Tested in Task 5).
5. **Branch Admin RBAC Tampering:** A Branch Admin attempting to submit stock quantities for unassigned branches must have those foreign stock entries discarded. (Tested in Task 5).

---

### Task 1: Missing i18n Dictionary Key & Parity

**Files:**
- Modify: `messages/uz.json:513-535`
- Modify: `messages/ru.json:513-535`
- Modify: `messages/en.json:513-535`
- Test: `scripts/test-i18n.ts`

**Interfaces:**
- Consumes: `next-intl` translation files in `messages/`
- Produces: `"users"` key inside `admin.usersManagement` namespace across `uz`, `ru`, `en`

- [ ] **Step 1: Update `scripts/test-i18n.ts` to assert `admin.usersManagement.users` exists**

Add explicit test check in `scripts/test-i18n.ts`:
```ts
const locales = ["uz", "ru", "en"];
for (const locale of locales) {
  const content = JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf-8"));
  if (!content.admin?.usersManagement?.users) {
    throw new Error(`Missing admin.usersManagement.users in ${locale}.json`);
  }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/test-i18n.ts`
Expected: FAIL with "Missing admin.usersManagement.users in uz.json"

- [ ] **Step 3: Add `users` key to `messages/uz.json`, `messages/ru.json`, and `messages/en.json`**

In `messages/uz.json`: `"users": "Foydalanuvchilar"`
In `messages/ru.json`: `"users": "Пользователи"`
In `messages/en.json`: `"users": "Users"`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/test-i18n.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add messages/ scripts/test-i18n.ts
git commit -m "fix(i18n): add missing admin.usersManagement.users translation across all locales"
```

---

### Task 2: Storefront Product Gallery Auto-Carousel

**Files:**
- Modify: `components/store/product-gallery.tsx`
- Create: `tests/storefront-gallery.test.ts`

**Interfaces:**
- Consumes: `ProductGalleryProps { images: string[]; alt: string; condition?: string; warrantyMonths?: number }`
- Produces: Smooth 4000ms auto-advance carousel with pause on hover/touch

- [ ] **Step 1: Write test in `tests/storefront-gallery.test.ts` verifying autoplay helper logic**

Create unit test verifying that `getNextGalleryIndex(current, total)` cycles from `0 -> 1 -> ... -> total - 1 -> 0`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/storefront-gallery.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement autoplay and interaction pause in `components/store/product-gallery.tsx`**

- Add `isPaused` state (`React.useState(false)`).
- Add `useEffect` with `setInterval` of 4000ms advancing `setSelectedIndex((prev) => (prev + 1) % safeImages.length)` when `safeImages.length > 1 && !isPaused`.
- Attach `onMouseEnter={() => setIsPaused(true)}` and `onMouseLeave={() => setIsPaused(false)}` to container.
- Pause on `onTouchStart` and resume on `onTouchEnd`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/storefront-gallery.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/store/product-gallery.tsx tests/storefront-gallery.test.ts
git commit -m "feat(storefront): add auto-advancing carousel with pause-on-interaction to product gallery"
```

---

### Task 3: Fluid & Responsive Snapshot Specs View

**Files:**
- Modify: `components/store/snapshot-specs-view.tsx`
- Modify: `tests/storefront-specs.test.ts`

**Interfaces:**
- Consumes: `SnapshotSpecsViewProps`
- Produces: Responsive hardware vitals cards with no truncated text and uniform grid alignment

- [ ] **Step 1: Update `tests/storefront-specs.test.ts` to assert no `truncate` or `max-w-[50%]` in vitals values**

Add test asserting that `SnapshotSpecsView` source code does not contain `truncate max-w-[50%]` and applies `break-words`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/storefront-specs.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement fluid typography and auto-wrapping in `components/store/snapshot-specs-view.tsx`**

- Remove `shrink-0 truncate max-w-[50%]` from camera, processor, charging, and display value containers.
- Use `text-xs sm:text-sm font-semibold text-foreground text-right pl-2 leading-snug break-words max-w-[60%] sm:max-w-[65%]`.
- Ensure each card has `min-h-[56px] flex items-center justify-between` so two-line text wraps cleanly while maintaining uniform row height across the 2-column grid.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/storefront-specs.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/store/snapshot-specs-view.tsx tests/storefront-specs.test.ts
git commit -m "feat(storefront): make hardware vitals fluid and responsive without text truncation"
```

---

### Task 4: Shared Catalog Pricing Utility

**Files:**
- Create: `lib/catalog/pricing.ts`
- Create: `tests/catalog-pricing.test.ts`
- Modify: `prisma/seed.ts` (import shared pricing function)

**Interfaces:**
- Produces: `getSuggestedPriceForModel(brand: string, modelName: string, storage: string): { price: number; oldPrice: number | null }`

- [ ] **Step 1: Write failing test in `tests/catalog-pricing.test.ts`**

Assert realistic prices for iPhone 16 Pro, S25 Ultra, and Galaxy A37 across 128GB, 256GB, and 512GB.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/catalog-pricing.test.ts`
Expected: FAIL with module not found

- [ ] **Step 3: Implement `lib/catalog/pricing.ts` and refactor `prisma/seed.ts` to use it**

Extract pricing calculation into pure, tested TypeScript function.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/catalog-pricing.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/catalog/pricing.ts tests/catalog-pricing.test.ts prisma/seed.ts
git commit -m "feat(catalog): create shared suggested retail pricing utility"
```

---

### Task 5: Server Actions for Complete Product CRUD & Preset Matrix

**Files:**
- Modify: `app/actions/admin-products.ts`
- Create: `tests/admin-crud-actions.test.ts`

**Interfaces:**
- Produces:
  - `createOrUpdateProductFromPresetAction(input: PresetProductInput): Promise<ActionResult>`
  - `deleteProductAction(productId: string): Promise<ActionResult>`

- [ ] **Step 1: Write failing tests in `tests/admin-crud-actions.test.ts`**

Test Zod input validation, slug generation, preset lookup, upsert behavior, and active order delete protection.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-crud-actions.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `createOrUpdateProductFromPresetAction` and `deleteProductAction` in `app/actions/admin-products.ts`**

- In `createOrUpdateProductFromPresetAction`:
  - Pull preset from `CATALOG_PRESETS`.
  - Auto-resolve `"smartphones"` category ID.
  - Upsert Product by slug.
  - Upsert ProductVariant for each selected variant and set BranchInventory.
- In `deleteProductAction`:
  - Verify `isSuperAdmin`.
  - Check for orders with `status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] }`.
  - In transaction, delete BranchInventory, IMEIRecords, ProductVariants, and Product.
  - Revalidate `/admin/products`, `/catalog`, `/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-crud-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/actions/admin-products.ts tests/admin-crud-actions.test.ts
git commit -m "feat(admin): implement createOrUpdateProductFromPresetAction and deleteProductAction"
```

---

### Task 6: Admin Single-Screen Matrix UI & CRUD Table Integration

**Files:**
- Create: `components/admin/product-preset-matrix-form.tsx`
- Modify: `components/admin/products-list-view.tsx`
- Modify: `app/[locale]/admin/products/new/page.tsx`
- Create: `app/[locale]/admin/products/[id]/edit/page.tsx`
- Create: `tests/admin-crud-ui.test.ts`

**Interfaces:**
- Consumes: `createOrUpdateProductFromPresetAction`, `deleteProductAction`, `getSuggestedPriceForModel`, `CATALOG_PRESETS`
- Produces: Single-screen preset matrix form and interactive Edit/Delete actions in products list

- [ ] **Step 1: Write failing test in `tests/admin-crud-ui.test.ts`**

Verify that `product-preset-matrix-form` renders variant rows with color swatches, storage badges, suggested prices, and branch stock inputs.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-crud-ui.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `product-preset-matrix-form.tsx`**

- Brand selector (Apple / Samsung) and Model selector (41 presets).
- When model is selected:
  - Header card with model specs summary (Camera, Processor, Display).
  - Matrix table showing all official color and storage combinations with color dots.
  - Variant active checkbox.
  - Suggested price input prefilled via `getSuggestedPriceForModel`.
  - Branch quantity inputs for all active branches.
  - "Saqlash" button submitting to `createOrUpdateProductFromPresetAction`.

- [ ] **Step 4: Implement `/admin/products/[id]/edit/page.tsx` and wire Edit/Delete in `products-list-view.tsx`**

- In `products-list-view.tsx`: Add "Amallar" (Actions) column with "Tahrirlash" button linking to `/admin/products/[id]/edit` and "O'chirish" button triggering AlertDialog confirmation.
- In `app/[locale]/admin/products/[id]/edit/page.tsx`: Load product by ID with variants and branch inventory, pass as `initialData` into `product-preset-matrix-form.tsx`.
- In `app/[locale]/admin/products/new/page.tsx`: Render `product-preset-matrix-form.tsx`.

- [ ] **Step 5: Run tests to verify all pass**

Run: `npx tsx tests/admin-crud-ui.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/admin/ app/[locale]/admin/products/ tests/admin-crud-ui.test.ts
git commit -m "feat(admin): build single-screen preset matrix form and wire edit and delete actions"
```

---

### Task 7: Master Engineering Audit & Verification

**Files:**
- Modify: `scripts/verify-all.ts` (include new tests)

- [ ] **Step 1: Run comprehensive verification**

Run: `npm run verify`
Expected: All 10+ suites pass with 0 errors and TypeScript strict mode passes.

- [ ] **Step 2: Commit and push**

```bash
git add .
git commit -m "chore: integrate gallery, vitals, and admin crud suites into master verification"
git push origin main
```

