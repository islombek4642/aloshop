# Design Document: Visual Admin Device Studio, Full Model Image Gallery, and Stacked Specs View

- **Date:** 2026-11-03
- **Status:** Draft (Awaiting Approval)
- **Author:** Antigravity Engineering

---

## 1. Intent and Context

Following testing on the live deployment and feedback on real mobile/desktop viewports, three critical UX and operational refinements are required:

1. **Hardware Vitals Display Truncation (`SnapshotSpecsView`):**
   - On the product details page, technical specification labels (e.g. `PROTSESSOR`, `BATAREYA`, `ASOSIY KAMERA`, `QUVVATLASH`, `OPERATSION TIZIM`) currently get cut off with ellipsis (`PROT...`, `BATA...`, `ASOS...`, `QUVV...`, `OPER...`) because they share a cramped horizontal row with detailed values (e.g., *Qualcomm Snapdragon 8 Elite / Exynos 2500 (3nm)*).
   - Both the label and the value need full 100% width so that every technical parameter is immediately readable without awkward truncation.

2. **Full Model Image Gallery & Multi-Photo Carousel:**
   - Currently, each variant in the database only stores 1 image, and the details page passes only `activeVariant.images` (1 photo) to `ProductGallery`. Consequently, the carousel cannot rotate, and customers only see one static photo.
   - The product details page should aggregate all official color variants and available angles for that model (typically 3–5 high-resolution photos) into the gallery, allowing the auto-carousel to cycle through all available device colors. Changing a color swatch should jump to that specific photo while keeping the entire gallery available.
   - On the catalog page (`ProductCard`), selecting or hovering on color chips should instantly display the phone in that color.

3. **Visual Admin Studio & 500 Server Error Hardening:**
   - The previous admin matrix was a flat, dry table without visual confirmation of what device was being configured. Admins need an intuitive visual flow:
     - Selecting a model reveals a prominent **Device Passport**: a hero image of the phone, model title, release year, warranty, and key specifications.
     - Below, instead of a confusing table, each color and storage configuration appears as an **Interactive Visual Card** (color swatch dot, color name, storage badge). Clicking a card toggles it active, revealing editable price and branch stock inputs.
   - The 500 error during product saving (`Error: An error occurred in the Server Components render`) occurs when `revalidatePath` triggers server component re-rendering during action execution. The Server Action must isolate revalidation and return clean, structured error responses.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Stacked Hardware Vitals:** Transition `SnapshotSpecsView` to a vertical stacked card layout (Icon + Label on top, Value below) with `min-h-[72px]`, eliminating truncation completely across all viewports.
- **Unified Model Gallery:** Aggregate all variant images for the active model in `ProductDetailsClient` and pass them to `ProductGallery`, enabling smooth auto-carousel across all available device colors.
- **Visual Admin Studio (Approach A):** Redesign `ProductPresetMatrixForm` with a Hero image preview, specification badges, and card-based variant selectors with toggle states, suggested pricing, and branch stock inputs.
- **Server Action Hardening:** Guard `revalidatePath` and database transactions in `app/actions/admin-products.ts` so server-side errors are caught gracefully and returned as actionable JSON messages instead of Next.js 500 crashes.

### Non-Goals
- Altering the PostgreSQL database schema (the existing `Product`, `ProductVariant`, and `BranchInventory` models already support all required data).
- Modifying customer checkout or payment flows.

### Anti-Goals
- Zero emojis policy: No Unicode emojis anywhere in UI or logs (AGENTS.md Rule 3.4).
- Tailwind CSS only: No standalone CSS files (AGENTS.md Rule 3.4).
- Strict TypeScript: No `any` types (AGENTS.md Rule 4).

---

## 3. Approaches Considered

### Approach A: Visual Device Studio (Selected)
- **Concept:** Sequential, visual flow:
  1. Brand & Model Selector.
  2. Device Passport Card (Large phone picture, badge, specs summary).
  3. Interactive Variant Cards Grid (Click to toggle on/off, prefilled prices, branch stock inputs).
  4. Single "Save to Store" button.
- **Trade-offs:** Visually rich, intuitive for any admin, mobile-friendly responsive grid.
- **Decision:** Picked by user.

### Approach B: Split View (Side-by-Side)
- **Concept:** Sticky phone preview on the left, matrix on the right.
- **Trade-offs:** Cramped on tablets, laptops, and mobile screens.
- **Decision:** Rejected in favor of Approach A.

---

## 4. Technical Architecture and Detailed Changes

### 4.1. Stacked Specs View (`components/store/snapshot-specs-view.tsx`)
- Redesign each spec item into a vertical stacked card:
  - Top row: Small rounded icon container + uppercase muted label (`text-[10px] font-semibold text-muted-foreground uppercase tracking-wider`).
  - Bottom row: High-contrast value (`text-xs sm:text-sm font-bold text-foreground leading-snug break-words`).
- Apply uniform `min-h-[72px] flex flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3`.
- 2-column grid on tablets/desktop (`sm:grid-cols-2`), 1-column on narrow phones if needed.

### 4.2. Multi-Photo Gallery & Auto-Carousel (`components/store/product-details-client.tsx`)
- Collect all unique images for the product:
  ```ts
  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (activeVariant?.images?.[0]) {
      list.push(activeVariant.images[0]);
    }
    for (const v of product.variants) {
      for (const img of v.images) {
        if (img && !list.includes(img)) {
          list.push(img);
        }
      }
    }
    return list.length > 0 ? list : ["/images/products/placeholder.webp"];
  }, [product.variants, activeVariant]);
  ```
- Pass `images={allImages}` to `ProductGallery`.
- When user clicks a different color swatch, `ProductGallery` smoothly jumps to that color's index.
- Auto-advance carousel cycles through all images every 4 seconds.

### 4.3. Visual Admin Studio (`components/admin/product-preset-matrix-form.tsx`)
- **Block 1: Header & Selectors**
  - Brand selector (Apple, Samsung) & Model selector (41 presets).
- **Block 2: Device Passport Card**
  - When a model is selected:
    - Left/Top: Device hero image (`currentPreset.colors[0]?.imageUrl`) with clean backdrop.
    - Right/Bottom: Model title, release year, warranty badge, and 4 vitals pills (Processor, Camera, Display, Battery).
- **Block 3: Interactive Variant Cards**
  - Render variants as responsive cards (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5`).
  - Each card:
    - Header: Selection toggle checkbox + Color swatch circle + Localized color name + Storage badge.
    - Body (when active):
      - Suggested Price input (formatted currency, editable).
      - Multi-branch stock quantity inputs with branch badges.
  - Quick actions: "Barchasini tanlash" (Select All) / "Barchasini bekor qilish" (Deselect All).

### 4.4. Server Action Hardening (`app/actions/admin-products.ts`)
- Wrap `safeRevalidatePath` inside `try...catch` and execute asynchronously without blocking the action response.
- Isolate revalidation paths: only revalidate `/admin/products` and the specific product slug `/product/[slug]`.
- Return clear error messages if database connection or validation fails (`{ success: false, error: err.message || "failedToUpsert" }`).

---

## 5. What is Left to the Builder
- Tuning card border highlight colors when active (`border-primary bg-primary/[0.03]`).
- Empty state message when no model is selected yet.

