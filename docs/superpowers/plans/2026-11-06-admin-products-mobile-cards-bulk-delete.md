# Admin Products Mobile Cards & Bulk Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the admin products list page into a responsive mobile-card interface on smartphones while retaining the rich table on desktop, and introduce a secure batch selection and floating action bar for bulk product deletion with strict active-order protection and historical accounting preservation.

**Architecture:** 
1. Backend: Implement `bulkDeleteProductsAction` in `app/actions/admin-products.ts` with Zod validation in `lib/validations/admin-products.ts`, SuperAdmin RBAC check, active-order skipping, historical-order soft archiving (`isArchived: true`), and transactional hard deletion for unreferenced products.
2. Frontend: Augment `components/admin/products-list-view.tsx` with page-level selection state, desktop table row/header checkboxes, touch-friendly mobile cards (`md:hidden`) with variant accordions (>=44px targets), a floating batch action bar, and a confirmation modal.
3. i18n & Zero-Emoji: Maintain 100% parity across `uz`, `ru`, and `en` with zero emojis per `AGENTS.md`.

**Tech Stack:** Next.js 15 (App Router, Server Actions), React 19, TypeScript (strict), Prisma ORM (PostgreSQL), Tailwind CSS, Radix UI Dialog / Checkbox, Lucide Icons, next-intl.

**Spec:** [`docs/superpowers/specs/2026-11-06-admin-products-mobile-cards-bulk-delete.md`](file:///c:/alo_shop/docs/superpowers/specs/2026-11-06-admin-products-mobile-cards-bulk-delete.md)

## Global Constraints

- Strictly adhere to `AGENTS.md` (no emojis in code, UI copy, tests, or commit messages).
- Strictly enforce RBAC: only `SUPER_ADMIN` can delete or bulk-delete products; `BRANCH_ADMIN` requests must be rejected with `{ success: false, error: "unauthorized" }`.
- Active orders guard: any product with associated order items in `PENDING`, `CONFIRMED`, `PROCESSING`, or `SHIPPED` status must NEVER be deleted or archived; they must be reported in `skippedActiveCount`.
- Historical orders guard: any product with historical order items (`DELIVERED`, `CANCELLED`) must be soft-deleted via `isArchived: true` to prevent breaking financial or sales accounting.
- Pure unreferenced products must be cleanly deleted in a database transaction along with variants and inventory.
- Next.js 15 Server Action rules: Zod schemas and non-async helper types must reside in `lib/validations/admin-products.ts`, not inside `"use server"` files.
- All 32 verification suites (`npm run verify`) and Next.js 15 production build (`npm run build`) must pass 100% green.

## Review Focus

1. **Empty Selection Submission:** Calling `bulkDeleteProductsAction` with empty array `[]` or null input must fail gracefully with validation error without executing database writes.
2. **Mixed Batch Handling:** When a batch contains a mix of unreferenced products, active-order products, and historical-order products, each item must be routed to its correct outcome (deleted, skipped, archived) without transaction rollback of valid items.
3. **BranchAdmin Privilege Escalation:** A `BRANCH_ADMIN` user attempting to invoke `bulkDeleteProductsAction` must be blocked immediately.
4. **Mobile Touch Target Accessibility:** All clickable buttons in mobile view (checkbox, accordion expand, action buttons) must meet minimum touch dimensions (>=44px height/padding) to prevent misclicks on touchscreens.
5. **Selection Reset on Page Navigation:** Switching pagination pages or changing search/filter terms must cleanly reset or handle selections to prevent accidental deletions of off-screen filtered items.

---

### Task 1: Zod Validation Schema & Bulk Delete Server Action

**Files:**
- Modify: `lib/validations/admin-products.ts`
- Modify: `app/actions/admin-products.ts`
- Create: `tests/admin-products-bulk-delete-action.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/validations/admin-products.ts
  export const bulkDeleteProductsSchema = z.object({
    productIds: z.array(z.string().min(1)).min(1, "atLeastOneProductRequired"),
  });
  export type BulkDeleteProductsInput = z.infer<typeof bulkDeleteProductsSchema>;

  // app/actions/admin-products.ts
  export type BulkDeleteResult =
    | {
        success: true;
        deletedCount: number;
        archivedCount: number;
        skippedActiveCount: number;
      }
    | { success: false; error: string };

  export async function bulkDeleteProductsAction(
    rawInput: BulkDeleteProductsInput | { productIds: string[] }
  ): Promise<BulkDeleteResult>;
  ```

- [ ] **Step 1: Write the failing unit test for `bulkDeleteProductsAction`**

```ts
// tests/admin-products-bulk-delete-action.test.ts
(process.env as Record<string, string | undefined>).NODE_ENV = "test";
import { bulkDeleteProductsAction } from "../app/actions/admin-products";
import { bulkDeleteProductsSchema } from "../lib/validations/admin-products";

async function runActionTest() {
  console.log("Running bulk delete action unit tests...");

  // 1. Validation test: empty productIds array must fail safeParse
  const emptyCheck = bulkDeleteProductsSchema.safeParse({ productIds: [] });
  if (emptyCheck.success) {
    throw new Error("Validation should fail for empty productIds");
  }

  // 2. Unauthenticated invocation must return unauthorized
  const unauthRes = await bulkDeleteProductsAction({ productIds: ["test-id-1"] });
  if (unauthRes.success || unauthRes.error !== "unauthorized") {
    throw new Error(`Expected unauthorized error, got ${JSON.stringify(unauthRes)}`);
  }

  console.log("  + Action validation and auth guards verified");
}

runActionTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-products-bulk-delete-action.test.ts`
Expected: FAIL with "bulkDeleteProductsAction is not exported" or "bulkDeleteProductsSchema is not defined".

- [ ] **Step 3: Implement `bulkDeleteProductsSchema` in `lib/validations/admin-products.ts` and `bulkDeleteProductsAction` in `app/actions/admin-products.ts`**

In `lib/validations/admin-products.ts`:
- Export `bulkDeleteProductsSchema` with `productIds: z.array(z.string().min(1)).min(1)`.
- Export type `BulkDeleteProductsInput`.

In `app/actions/admin-products.ts`:
- Import `bulkDeleteProductsSchema`.
- Export `bulkDeleteProductsAction(rawInput)`:
  - Check `getAdminSession()` and `isSuperAdmin(session)`. Return `{ success: false, error: "unauthorized" }` if invalid.
  - SafeParse with `bulkDeleteProductsSchema`. Return `{ success: false, error: "validationError" }` if invalid.
  - Query existing products for the provided IDs.
  - Loop or batch query `orderItem` count:
    - Check active statuses (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`): if count > 0, increment `skippedActiveCount`.
    - Check historical orders: if count > 0, soft-delete via `prisma.product.update({ where: { id }, data: { isArchived: true } })`, increment `archivedCount`.
    - For zero-order products, delete variants, inventory, and product in a transaction, increment `deletedCount`.
  - Call `safeRevalidatePath("/admin/products")` and `safeRevalidatePath("/catalog")`.
  - Return `{ success: true, deletedCount, archivedCount, skippedActiveCount }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-products-bulk-delete-action.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/validations/admin-products.ts app/actions/admin-products.ts tests/admin-products-bulk-delete-action.test.ts
git commit -m "feat(actions): implement bulkDeleteProductsAction with active order and historical archive guards"
```

---

### Task 2: i18n Translation Keys for Bulk Delete & Mobile Cards

**Files:**
- Modify: `messages/uz.json`
- Modify: `messages/ru.json`
- Modify: `messages/en.json`
- Test: `scripts/test-i18n.ts`

**Interfaces:**
- Consumes: `admin.productsManagement` namespace in translation dictionaries.
- Produces: 9 new keys across all 3 locales:
  - `selectAll`: "Barchasini tanlash" / "Выбрать все" / "Select all"
  - `selectedCount`: "{count} ta tanlandi" / "Выбрано: {count}" / "{count} selected"
  - `bulkDeleteBtn`: "Tanlanganlarni o'chirish" / "Удалить выбранные" / "Delete selected"
  - `bulkDeleteModalTitle`: "Tanlangan mahsulotlarni o'chirish" / "Удаление выбранных товаров" / "Delete selected products"
  - `bulkDeleteModalDesc`: "Haqiqatan ham {count} ta tanlangan mahsulotni o'chirmoqchimisiz? Faol buyurtmasi mavjud tovarlar saqlab qolinadi." / ...
  - `bulkDeleteSuccess`: "{deleted} ta tovar o'chirildi, {archived} ta arxivlandi." / ...
  - `bulkDeleteSkipped`: "{skipped} ta tovar faol buyurtmada bo'lgani sababli o'chirilmadi." / ...
  - `cancelSelection`: "Tanlovni bekor qilish" / "Отменить выбор" / "Cancel selection"
  - `viewVariants`: "Variantlar ({count})" / "Варианты ({count})" / "Variants ({count})"

- [ ] **Step 1: Add translation keys into `messages/uz.json`, `messages/ru.json`, and `messages/en.json`**

Ensure zero emojis, matching placeholders (`{count}`, `{deleted}`, `{archived}`, `{skipped}`), and 100% key parity.

- [ ] **Step 2: Run i18n audit suite to verify parity**

Run: `npx tsx scripts/test-i18n.ts`
Expected: PASS with 0 missing keys and 0 emoji violations.

- [ ] **Step 3: Commit**

```bash
git add messages/uz.json messages/ru.json messages/en.json
git commit -m "fix(i18n): add product bulk delete and mobile card translation keys across uz, ru, and en"
```

---

### Task 3: Mobile Card View with Expandable Variant Accordion

**Files:**
- Modify: `components/admin/products-list-view.tsx`
- Create: `tests/admin-products-mobile-view.test.ts`

**Interfaces:**
- Consumes: `SerializedProduct`, `SerializedVariant`, `formatCurrency`, `t` translations.
- Produces: Responsive split:
  - Desktop table wrapped in `<div className="hidden md:block">...</div>`.
  - Mobile card layout rendered in `<div className="md:hidden space-y-3">...</div>`.
  - Mobile card sub-elements:
    - Product Header: Checkbox + Model name & Brand + Category Badge + Total Stock Badge.
    - Product Pricing & Warranty Row: formatted price range + warranty info.
    - Action Row: "Variantlar ({count})" accordion button (min-h 44px) + Edit link button (min-h 44px) + Single Delete button (min-h 44px).
    - Accordion Body: Expanded variant cards with color swatch dot, color name, storage, condition badge, price (with strikethrough old price if present), and variant stock badge.

- [ ] **Step 1: Write the failing UI structural test**

```ts
// tests/admin-products-mobile-view.test.ts
import fs from "node:fs";
import path from "node:path";

function runTest() {
  const filePath = path.resolve(process.cwd(), "components/admin/products-list-view.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // Verify responsive split exists
  if (!content.includes("hidden md:block")) {
    throw new Error("Desktop table must be wrapped in 'hidden md:block'");
  }
  if (!content.includes("md:hidden")) {
    throw new Error("Mobile cards container must use 'md:hidden'");
  }

  // Verify mobile variant accordion
  if (!content.includes("viewVariants") && !content.includes("expandedProductIds")) {
    throw new Error("Mobile cards must support variant accordion expansion");
  }

  console.log("  + Mobile cards responsive structure verified");
}

runTest();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-products-mobile-view.test.ts`
Expected: FAIL with missing responsive classes or accordion structure.

- [ ] **Step 3: Implement mobile cards layout in `components/admin/products-list-view.tsx`**

In `components/admin/products-list-view.tsx`:
- Wrap the existing `<Table>` container inside `<div className="hidden md:block">...</div>`.
- Add `<div className="md:hidden space-y-3">` rendering `paginatedProducts.map(product => ...)`:
  - Render an accessible card with `bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-2xs`.
  - Header: product brand, model name, category badge, and stock badge (`totalStock > 0 ? "secondary" : "destructive"`).
  - Price & Warranty: formatted price range and warranty months badge.
  - Accordion trigger button with `min-h-[44px]` touch target showing variant count.
  - When expanded, render vertical variant items with color circle swatch, storage, condition, formatted price, and stock quantity.
  - Include Edit and Delete buttons with `h-10 w-10` touch targets.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-products-mobile-view.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/products-list-view.tsx tests/admin-products-mobile-view.test.ts
git commit -m "feat(ui): add mobile card view with touch-friendly variant accordion to products list"
```

---

### Task 4: Checkbox Selection System & Floating Batch Action Bar

**Files:**
- Modify: `components/admin/products-list-view.tsx`
- Create: `tests/admin-products-selection-bar.test.ts`

**Interfaces:**
- Consumes: `bulkDeleteProductsAction` from `@/app/actions/admin-products`.
- Produces:
  - State: `selectedProductIds: Set<string>`, `isBulkModalOpen: boolean`, `isBulkDeleting: boolean`, `bulkFeedback: string | null`, `bulkError: string | null`.
  - Methods: `toggleSelectProduct(id: string)`, `toggleSelectAllCurrentPage()`, `clearSelection()`, `handleConfirmBulkDelete()`.
  - Desktop header checkbox: checked if all current page items are in `selectedProductIds`.
  - Row & Card checkboxes: checked if item ID is in `selectedProductIds`.
  - Floating Action Bar (`fixed bottom-6 left-1/2 -translate-x-1/2 z-40`):
    - Appears when `selectedProductIds.size > 0`.
    - Counter pill: `{count} ta tanlandi`.
    - Button: "Tanlovni bekor qilish" (calls `clearSelection`).
    - Button: "Tanlanganlarni o'chirish" (opens `isBulkModalOpen`).
  - Confirmation Dialog:
    - Explains count and warns that active orders will be preserved.
    - Submit calls `handleConfirmBulkDelete()` -> calls `bulkDeleteProductsAction` -> displays result feedback banner -> clears selection -> `router.refresh()`.

- [ ] **Step 1: Write the failing test for selection system and floating bar**

```ts
// tests/admin-products-selection-bar.test.ts
import fs from "node:fs";
import path from "node:path";

function runTest() {
  const filePath = path.resolve(process.cwd(), "components/admin/products-list-view.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  if (!content.includes("bulkDeleteProductsAction")) {
    throw new Error("products-list-view.tsx must import and use bulkDeleteProductsAction");
  }
  if (!content.includes("selectedProductIds")) {
    throw new Error("products-list-view.tsx must maintain selectedProductIds state");
  }
  if (!content.includes("fixed bottom-") && !content.includes("bottom-6")) {
    throw new Error("Floating batch action bar must be fixed at the bottom");
  }

  console.log("  + Selection system and floating action bar verified");
}

runTest();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-products-selection-bar.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement selection system, floating bar, and bulk delete modal in `components/admin/products-list-view.tsx`**

Implement:
- `selectedProductIds` state management with `toggleSelectProduct`, `toggleSelectAllCurrentPage`, `clearSelection`.
- Reset selection when `currentPage`, `searchTerm`, `selectedBrand`, or `selectedCategory` changes.
- Checkbox in desktop table header and rows.
- Checkbox in mobile cards header.
- Floating Action Bar rendered with smooth transition when `selectedProductIds.size > 0`.
- Bulk Delete Confirmation Dialog with loading spinner and feedback alert.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-products-selection-bar.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/products-list-view.tsx tests/admin-products-selection-bar.test.ts
git commit -m "feat(ui): implement multi-select checkboxes, floating batch action bar, and bulk delete modal"
```

---

### Task 5: Master Verification Suite & Build Integration

**Files:**
- Create: `tests/admin-products-bulk-delete.test.ts`
- Modify: `scripts/verify-all.ts`
- Run: `npm run verify`
- Run: `npm run build`

**Interfaces:**
- Consumes: All 31 existing suites + new `admin-products-bulk-delete` suite.
- Produces: 32 green verification suites and clean Next.js 15 production build.

- [ ] **Step 1: Create comprehensive integration test `tests/admin-products-bulk-delete.test.ts`**

Include:
- SuperAdmin vs BranchAdmin RBAC checks on bulk delete action.
- Empty input validation.
- Unreferenced product hard deletion verification in test database.
- Active order product skip guard (ensuring active orders are not touched).
- Historical order soft-delete archive guard (ensuring `isArchived` becomes true).
- UI markup verification for mobile card view, checkbox selectors, and floating action bar.

- [ ] **Step 2: Register suite in `scripts/verify-all.ts`**

Add `admin-products-bulk-delete` suite before `typecheck`.

- [ ] **Step 3: Run master verification suite**

Run: `npm run verify`
Expected: 32/32 PASS with 0 errors.

- [ ] **Step 4: Run production build check**

Run: `npm run build`
Expected: Compiled successfully with all 42 static pages generated and 0 errors.

- [ ] **Step 5: Commit and push**

```bash
git add tests/admin-products-bulk-delete.test.ts scripts/verify-all.ts
git commit -m "test(verify): integrate admin products bulk delete and mobile cards suite into master verification"
git push origin main
```
