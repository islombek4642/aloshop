# Visual Admin Device Studio, Full Model Image Gallery, and Stacked Specs View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform smartphone hardware vitals to a vertical stacked layout eliminating truncation, enable full model multi-photo image gallery and auto-carousel, build an intuitive Visual Device Studio for admin product management, and harden Server Actions against 500 errors.

**Architecture:**
- `SnapshotSpecsView` transitions to a vertical stacked card architecture (`flex-col justify-between min-h-[72px]`), giving both label and value 100% width.
- `ProductDetailsClient` aggregates all color variant images into a unified model gallery for `ProductGallery`, enabling multi-photo auto-carousel.
- `ProductPresetMatrixForm` implements Approach A (Visual Device Studio) featuring a Hero Device Passport and responsive interactive variant card grid.
- `createOrUpdateProductFromPresetAction` isolates revalidation and wraps operations with structured error responses to eliminate 500 crashes.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, next-intl, Lucide Icons.

**Spec:** [`docs/superpowers/specs/2026-11-03-visual-admin-studio-specs-gallery-design.md`](file:///c:/alo_shop/docs/superpowers/specs/2026-11-03-visual-admin-studio-specs-gallery-design.md)

## Global Constraints

- Zero emojis policy: No Unicode emojis in any UI, commit message, code, or logs (AGENTS.md Rule 3.4).
- Tailwind CSS only: No standalone CSS files (AGENTS.md Rule 3.4).
- Strict TypeScript: No `any` types (AGENTS.md Rule 4).
- Multi-language parity: All strings localized across `uz`, `ru`, `en` (AGENTS.md Rule 3.3).

## Review Focus

1. **Label & Value Truncation Zero-Tolerance:** No hardware vitals label (`PROTSESSOR`, `BATAREYA`, `ASOSIY KAMERA`, `QUVVATLASH`, `OPERATSION TIZIM`) may have `truncate` or ellipsis on any viewport. (Tested in Task 1).
2. **Multi-Image Carousel Autoplay:** A device with 4 colors must pass at least 4 photos into `ProductGallery`, enabling the 4000ms auto-carousel to advance between photos. (Tested in Task 2).
3. **Variant Swatch Focus Sync:** Clicking a color swatch must immediately navigate the gallery to that color's image while preserving the full image set in the carousel. (Tested in Task 2).
4. **Server Action 500 Immunity:** When database or Next.js revalidation errors occur, the action must return `{ success: false, error: ... }` instead of an unhandled 500 exception. (Tested in Task 3).
5. **Visual Studio Responsiveness:** Device Passport and interactive variant cards must render cleanly on mobile (1 col), tablet (2 col), and desktop (3 col) screens. (Tested in Task 4).

---

### Task 1: Stacked Non-Truncated Hardware Vitals Layout

**Files:**
- Modify: `components/store/snapshot-specs-view.tsx`
- Modify: `tests/storefront-specs.test.ts`

**Interfaces:**
- Consumes: `SnapshotSpecsViewProps`
- Produces: Vertical stacked cards with `min-h-[72px]`, zero label truncation, and full width values.

- [x] **Step 1: Update `tests/storefront-specs.test.ts` to assert stacked card layout**

Add test assertions verifying:
1. `SnapshotSpecsView` source contains `min-h-[72px]`.
2. `SnapshotSpecsView` source contains `flex-col justify-between`.
3. Does NOT contain `truncate` on labels.

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/storefront-specs.test.ts`
Expected: FAIL

- [x] **Step 3: Implement stacked layout in `components/store/snapshot-specs-view.tsx`**

- Change each item container to:
  `className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40"`
- Top row:
  `div className="flex items-center gap-2 mb-1.5"`
  Icon + `<span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>`
- Bottom row:
  `<span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">{value}</span>`
- Ensure no label or value uses `truncate`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/storefront-specs.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add components/store/snapshot-specs-view.tsx tests/storefront-specs.test.ts
git commit -m "feat(storefront): redesign hardware vitals with stacked non-truncated card layout"
```

---

### Task 2: Multi-Photo Model Image Aggregation & Carousel Experience

**Files:**
- Modify: `components/store/product-details-client.tsx:275-290`
- Modify: `components/store/product-gallery.tsx`
- Modify: `tests/storefront-gallery.test.ts`

**Interfaces:**
- Produces: Aggregated multi-image array passed to `ProductGallery` with swatch-to-index jump support.

- [x] **Step 1: Write failing test in `tests/storefront-gallery.test.ts`**

Assert that image aggregation collects unique images across all product variants and that selecting a variant image index updates the active index.

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/storefront-gallery.test.ts`
Expected: FAIL

- [x] **Step 3: Implement image aggregation and swatch focus**

- In `product-details-client.tsx`:
  Aggregate all unique images across all variants:
  ```ts
  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (activeVariant?.images?.[0]) list.push(activeVariant.images[0]);
    for (const v of product.variants) {
      for (const img of v.images) {
        if (img && !list.includes(img)) list.push(img);
      }
    }
    return list.length > 0 ? list : ["/images/products/placeholder.webp"];
  }, [product.variants, activeVariant]);
  ```
  Pass `images={allImages}` and `initialIndex={activeImageIndex}` to `ProductGallery`.
- In `product-gallery.tsx`:
  Support `initialIndex?: number` to sync with variant changes without resetting the carousel.

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/storefront-gallery.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add components/store/product-details-client.tsx components/store/product-gallery.tsx tests/storefront-gallery.test.ts
git commit -m "feat(storefront): aggregate all variant images into multi-photo carousel with swatch sync"
```

---

### Task 3: Server Action 500 Hardening & Isolated Path Revalidation

**Files:**
- Modify: `app/actions/admin-products.ts`
- Modify: `tests/admin-crud-actions.test.ts`

**Interfaces:**
- Produces: Resilient `createOrUpdateProductFromPresetAction` with isolated revalidation and zero 500 crashes.

- [x] **Step 1: Write test asserting robust error handling and isolated revalidation**

In `tests/admin-crud-actions.test.ts`, test that invalid inputs or unexpected server conditions return `{ success: false, error: ... }` rather than throwing unhandled rejections.

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-crud-actions.test.ts`
Expected: FAIL

- [x] **Step 3: Implement hardening in `app/actions/admin-products.ts`**

- Wrap `revalidatePath` inside `try...catch` and avoid full root revalidations (`/`) that crash RSC renders on Vercel.
- Isolate revalidations: only revalidate `/admin/products` and `/catalog`.
- Catch all transaction errors and return `{ success: false, error: err instanceof Error ? err.message : "failedToUpsert" }`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-crud-actions.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add app/actions/admin-products.ts tests/admin-crud-actions.test.ts
git commit -m "fix(admin): harden preset upsert action with isolated path revalidation"
```

---

### Task 4: Visual Admin Device Studio & Interactive Variant Cards

**Files:**
- Modify: `components/admin/product-preset-matrix-form.tsx`
- Modify: `tests/admin-crud-ui.test.ts`

**Interfaces:**
- Produces: Intuitive Visual Device Studio with Hero Passport preview and responsive card grid for variants.

- [x] **Step 1: Write test in `tests/admin-crud-ui.test.ts` asserting Visual Device Studio elements**

Verify presence of:
1. Device Passport with Hero Image (`currentPreset.colors[0]?.imageUrl`).
2. Hardware specifications summary pills.
3. Interactive variant cards grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`).
4. Toggle states and price/stock inputs.

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-crud-ui.test.ts`
Expected: FAIL

- [x] **Step 3: Implement Visual Device Studio in `product-preset-matrix-form.tsx`**

- **Device Passport Block:**
  - Card with background gradient, showing phone hero image (`Image` component with priority, 180px height), model name, release year, warranty, and 4 hardware chips (Chipset, Camera, Screen, Battery).
- **Variant Card Grid Block:**
  - Replace flat table with responsive card grid.
  - Each card has:
    - Top header: Checkbox + Color circle (`colorHex`) + Localized color name + Storage pill.
    - When checked: Active border, Suggested Price input (prefilled), and branch stock inputs (Malika, Chilonzor, Buyuk Ipak Yo'li).
    - When unchecked: Muted border, collapsed inputs.
- Quick actions: "Select All" / "Deselect All".
- Prominent CTA button: "Mahsulotni do'konga joylash" (Save Product to Store).

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-crud-ui.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add components/admin/product-preset-matrix-form.tsx tests/admin-crud-ui.test.ts
git commit -m "feat(admin): build visual device studio with hero passport and interactive variant cards"
```

---

### Task 5: Master Engineering Verification & Audit

**Files:**
- Modify: `scripts/verify-all.ts`
- Run: `npm run verify`

- [x] **Step 1: Run comprehensive verification**

Run: `npm run verify`
Expected: All 14 suites pass with 0 errors and strict TypeScript passes.

- [x] **Step 2: Commit and push**

```bash
git add .
git commit -m "chore: verify stacked specs, model gallery, and visual admin studio"
git push origin main
```

