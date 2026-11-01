# Unified Technical Specs, Full-Width Variant Selector & Responsive Action Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate redundant specs table, rename "Snapshot View" to localized "Texnik xususiyatlar", add display/processor/battery tiles, make variant selector and main action buttons full-width and touch-friendly on mobile, and remove old price from sticky bar to prevent text overflow.

**Architecture:** Refactor `components/store/snapshot-specs-view.tsx` into a unified 9-tile technical specs card, remove duplicate table from `product-details-client.tsx`, modernize `variant-selector.tsx` with responsive grid layouts, upgrade main CTA buttons with `h-13` (52px) responsive container, and streamline `mobile-sticky-buy-bar.tsx`.

**Tech Stack:** Next.js 15 (App Router, RSC + Client Components), TypeScript (strict mode, zero `any`), Tailwind CSS, Lucide Icons, `next-intl` (uz, ru, en).

**Spec:** `docs/superpowers/specs/2026-11-01-specs-and-cta-buttons-design.md`

## Global Constraints
- Zero hardcoded UI strings; all labels sourced from `messages/{uz,ru,en}.json`.
- Zero Unicode emojis; only professional Lucide vector icons with consistent stroke-width.
- Strict TypeScript: no `any` types; all Props interfaces strictly typed.
- Mobile-first responsive ergonomics (WCAG 44px+ touch targets).
- All automated checks (`npm run check-types` and `npm run verify`) must pass cleanly.

## Review Focus
- Mobile variant wrapping: on narrow viewports (320px-390px), color and storage buttons must expand cleanly across the row without clipping text or leaving awkward blank space.
- Unified specs tiles: when `screenSize`, `processor`, or `battery` are undefined in product, fallback values from `inferDeviceVitals` must render safely without crashing.
- Action button legibility: "Savatchaga qo'shish" and "1 bosishda xarid" must fit comfortably without text wrapping or clipping in uz, ru, and en.
- Sticky bottom bar price spacing: long sum currency amounts (`14 500 000 so'm`) must never push buttons out of view on 320px screens.

---

### Task 1: Responsive Full-Width Variant Selector

**Files:**
- Modify: `components/store/variant-selector.tsx`
- Test: `tests/vitrina-m2.test.ts` (or add unit test)

**Interfaces:**
- Consumes: `ProductVariantData`, `getLocalizedColorName`
- Produces: `VariantSelector` component with full-width responsive grid buttons.

- [ ] **Step 1: Check existing variant selector layout**
Inspect lines 161 and 214 in `components/store/variant-selector.tsx` where color and storage options are rendered.

- [ ] **Step 2: Update Color Buttons layout to responsive grid**
Change color options container to `grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5`.
Make each color button `h-11 px-3 justify-center text-xs font-medium rounded-xl w-full sm:w-auto` with centered color swatch dot + localized color name.

- [ ] **Step 3: Update Storage Buttons layout to responsive grid**
Change storage options container to `grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap gap-2`.
Make each storage button `h-11 px-3.5 justify-center text-xs font-semibold rounded-xl text-center w-full sm:w-auto`.

- [ ] **Step 4: Verify TypeScript compilation**
Run: `npm run check-types`
Expected: PASS with 0 errors.

---

### Task 2: Unified "Texnik xususiyatlar" Specs Grid (8 Hardware & Stock Tiles)

**Files:**
- Modify: `components/store/snapshot-specs-view.tsx`
- Modify: `messages/uz.json`, `messages/ru.json`, `messages/en.json`

**Interfaces:**
- Consumes: `SnapshotSpecsViewProps` with `screenSize`, `processor`, `battery`, `ram`, `storage`, `color`, `condition`, `branchesInStockCount`
- Produces: Unified 8-tile technical specs card component (Kafolat/Warranty removed as requested).

- [ ] **Step 1: Update header title**
Remove `tProduct("snapshotBadge")` ("Snapshot View").
Replace the header with clean localized title:
```tsx
<h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
  {tProduct("specs")}
</h3>
```

- [ ] **Step 2: Remove Warranty Tile and Add Display, Processor, and Battery tiles**
Remove the "Warranty" (Kafolat) tile completely.
Import `Smartphone` (or `Monitor`), `Cpu`, `BatteryCharging` from `lucide-react`.
Add 3 new tiles to the grid:
- **Displey**: `Smartphone` icon, label `tProduct("display")`, value `screenSize || "6.7\" OLED"`
- **Protsessor**: `Cpu` icon, label `tProduct("processor")`, value `processor || "A18 Pro"`
- **Batareya**: `BatteryCharging` icon, label `tProduct("battery")`, value `battery || "5000 mAh"`

- [ ] **Step 3: Update grid layout for 8 tiles**
Configure grid to `grid grid-cols-2 sm:grid-cols-4 gap-2.5` so all 8 tiles form a perfectly balanced 2x4 (mobile) or 4x2 (desktop) grid.

- [ ] **Step 4: Verify TypeScript compilation**
Run: `npm run check-types`
Expected: PASS with 0 errors.

---

### Task 3: Clean Product Details Page & Responsive Main CTAs

**Files:**
- Modify: `components/store/product-details-client.tsx`

**Interfaces:**
- Consumes: `SnapshotSpecsView`, `VariantSelector`
- Produces: Clean product details page without duplicate table and with spacious primary CTA buttons.

- [ ] **Step 1: Delete redundant `<Table>` specs section**
Locate lines ~456-550 containing `{/* Tech Specifications Table */}` with `<Table>` and delete the entire redundant section.

- [ ] **Step 2: Upgrade primary CTA buttons container and ergonomics**
Replace the button container:
```tsx
{/* Primary Action Buttons */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
  <Button
    type="button"
    size="lg"
    onClick={handleAddToCart}
    disabled={totalStock <= 0}
    className={cn(
      "h-13 w-full rounded-xl text-sm sm:text-base font-bold gap-2 shadow-sm transition-all",
      isAddedToCart ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
    )}
  >
    ...
  </Button>
  <Button
    type="button"
    variant="outline"
    size="lg"
    disabled={totalStock <= 0}
    onClick={() => setOneClickOpen(true)}
    className="h-13 w-full rounded-xl text-sm sm:text-base font-bold gap-2 border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
  >
    ...
  </Button>
</div>
```

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npm run check-types`
Expected: PASS with 0 errors.

---

### Task 4: Streamline Mobile Sticky Buy Bar

**Files:**
- Modify: `components/store/mobile-sticky-buy-bar.tsx`

**Interfaces:**
- Consumes: `MobileStickyBuyBarProps`
- Produces: Overflow-free mobile sticky bar displaying only current price and responsive action buttons.

- [ ] **Step 1: Remove crossed-out oldPrice from sticky bar**
Remove `activeVariant?.oldPrice && activeVariant.oldPrice > activeVariant.price` crossed-out element from lines 57-61.
Keep only the current price:
```tsx
<div className="flex items-baseline">
  <span className="text-base font-black text-foreground">
    {activeVariant ? formatCurrency(activeVariant.price) : "0 so'm"}
  </span>
</div>
```

- [ ] **Step 2: Test flex spacing on 320px-375px viewports**
Ensure left info block has `min-w-0 flex-1 pr-2` and right buttons have `shrink-0` so nothing wraps awkwardly.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npm run check-types`
Expected: PASS with 0 errors.

---

### Task 5: System Verification & Linting

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript strict check**
Run: `npm run check-types`
Expected: 0 errors.

- [ ] **Step 2: Run Master Verification Suite**
Run: `npm run verify`
Expected: 6/6 master suites PASS.

