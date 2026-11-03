# Design Document: Storefront Gallery Auto-Carousel, Fluid Specs View, and Complete Admin Product CRUD with Preset Matrix

- **Date:** 2026-11-03
- **Status:** Draft (Awaiting Approval)
- **Author:** Antigravity Engineering

---

## 1. Intent and Context

AloShop operates as a high-performance modern electronics store focused on mobile-first commerce in Uzbekistan. Three operational and storefront areas require enhancement based on recent usage:

1. **Storefront Visuals & Presentation:**
   - On the product details page, users expect an engaging automatic carousel (`ProductGallery`) that smoothly cycles through official device pictures on both mobile and desktop, while pausing on user interaction.
   - In the device vitals snapshot (`SnapshotSpecsView`), detailed hardware names (e.g., *"Qualcomm Snapdragon 8 Elite (3nm)"*, *"48 MP + 48 MP + 48 MP tetraprism periscope"*, *"45W Fast Charging, MagSafe 25W"*) are currently truncated with `max-w-[50%]` and `shrink-0`, cutting off crucial specs. They must become fluid, auto-wrapping or adapting font sizes without breaking the uniform grid alignment.

2. **Internationalization Integrity:**
   - A missing dictionary key `admin.usersManagement.users` causes Next-Intl console errors (`MISSING_MESSAGE: admin.usersManagement.users (uz)`) when navigating admin views. This key must be added across all three supported locales (`uz`, `ru`, `en`).

3. **Complete Admin Product CRUD with Preset-Driven Matrix:**
   - Previously, the admin panel lacked complete CRUD operations: there was no way to edit an existing product or delete obsolete products from the UI, and creating a product required tedious multi-language manual entry.
   - The user requested:
     - **Full CRUD support** for products (Create, Read, Update, Delete).
     - **Create & Update via Smart Matrix:** Admin selects a smartphone model (from the 41-preset catalog) or clicks "Tahrirlash" on an existing product, viewing a single-screen matrix of colors and storage. The admin checks active variants, adjusts price and branch inventory, and saves.
     - **Safe Deletion:** Admin can delete a product with a confirmation dialog, ensuring database integrity and cascade cleanup of variants and inventories.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Auto-Advancing Gallery:** Auto-advance images every 4 seconds in `ProductGallery`, with pause on hover (desktop) and pause on touch/swipe (mobile), plus accessible controls.
- **Fluid Specs Cards:** Replace rigid truncation in `SnapshotSpecsView` with responsive typography and auto-wrapping layout, keeping cards vertically aligned with consistent minimum heights.
- **i18n Parity:** Provide `users` key inside `admin.usersManagement` in `messages/uz.json`, `messages/ru.json`, and `messages/en.json`.
- **Single-Screen Admin Matrix:** Create an intuitive admin workflow in `/admin/products/new`:
  - Brand selector (Apple / Samsung) -> Model selector (41 official models).
  - Matrix view of available configurations (Color Swatch + Name + Storage).
  - Editable Price input (prefilled with suggested retail price) and Branch Inventory quantity inputs (Malika, Chilonzor, Buyuk Ipak Yo'li).
  - Single "Save Product" action that persists the product, variants, and branch inventory in a transactional Server Action.

### Non-Goals
- Freeform custom hardware entry for unlisted electronics (e.g. televisions, microwaves) — user explicitly confirmed sticking strictly to the official smartphone catalog for now.
- Changes to user authentication or checkout payment pipelines.

### Anti-Goals
- Strictly NO emojis anywhere in the UI or codebase (AGENTS.md Rule 3.4).
- No hardcoded external mock links (all product images must link to local verified assets `/images/products/...`).
- No regression in existing multi-branch RBAC security (Branch Admins can only assign inventory to their own branch).

---

## 3. Approaches Considered

### Approach 1: Single-Screen Smart Matrix (Selected)
- **Concept:** Admin chooses Brand and Model. The form renders a unified matrix of all color and storage configurations for that model. The admin toggles desired variants with a checkbox, enters prices and quantities, and submits.
- **Trade-offs:** Fast single-screen workflow, minimal clicks, zero repetitive typing. Ideal for fast batch inventory loading.
- **Decision:** Picked by user.

### Approach 2: Step-by-Step Multi-Stage Wizard
- **Concept:** 3 separate wizard steps: Step 1 = Model selection, Step 2 = Multi-select chips for colors and storage, Step 3 = Input table for prices and stock.
- **Trade-offs:** Cleaner step separation, but requires multiple next/back clicks and slower operational flow.
- **Decision:** Rejected in favor of Approach 1.

---

## 4. Technical Architecture and Detailed Changes

### 4.1. Storefront Gallery Auto-Carousel (`components/store/product-gallery.tsx`)
- Maintain existing touch-swipe physics and manual thumbnail selection.
- Add autoplay interval state:
  ```ts
  const [isPaused, setIsPaused] = React.useState(false);
  ```
- Use `useEffect` with a 4000ms timer when `safeImages.length > 1` and `!isPaused`.
- Pause autoplay on `onMouseEnter` / `onTouchStart` and resume on `onMouseLeave` / `onTouchEnd`.
- When user clicks a specific thumbnail or navigates manually with arrows, reset the timer cleanly.

### 4.2. Responsive & Fluid Device Vitals (`components/store/snapshot-specs-view.tsx`)
- Remove `shrink-0 truncate max-w-[50%]` from value spans.
- Update each spec item container to a structured layout:
  - Left: Icon + Label (e.g. `PROTSESSOR`).
  - Right / Value: `text-xs sm:text-sm font-semibold text-foreground text-right pl-2 leading-snug break-words`.
  - On compact mobile viewports, allow the container to use a balanced flex layout (`flex-col sm:flex-row items-start sm:items-center justify-between min-h-[58px]`) so that longer values like periscope camera details or chipset names wrap naturally without stretching columns unevenly.
- Ensure all grid cells have uniform sizing (`min-h-[64px]` or auto-aligned grid).

### 4.3. Internationalization Correction
- In `messages/uz.json`, `messages/ru.json`, and `messages/en.json`, add:
  ```json
  "admin": {
    "usersManagement": {
      "users": "Foydalanuvchilar" // uz
      "users": "Пользователи"    // ru
      "users": "Users"           // en
    }
  }
  ```

### 4.4. Complete Admin Product CRUD with Preset-Driven Smart Matrix

1. **Pricing Utility (`lib/catalog/pricing.ts`):**
   - Extract `getSuggestedPriceForModel(preset, storage)` from `prisma/seed.ts` into a shared, tested utility.
   - Client form uses this utility to prefill suggested retail prices (UZS) whenever a model/variant is toggled, while leaving the input fully editable by the admin.

2. **Server Actions (`app/actions/admin-products.ts`):**
   - **Create / Upsert (`createOrUpdateProductFromPresetAction`):**
     - Receives `presetId` (e.g., `"apple-iphone-16-pro"`).
     - Receives list of active variants: `{ colorNameUz: string, storage: string, price: number, oldPrice?: number, initialStock: Record<string, number> }`.
     - Resolves `"smartphones"` category automatically.
     - Fetches authoritative hardware specs, descriptions, and local image paths from `CATALOG_PRESETS`.
     - Transactional Upsert: If the product already exists with that slug, updates its specifications, upserts variants and branch stock; otherwise creates the product.
     - Enforces RBAC: Branch Admin can only assign initial stock to their own assigned branch.
   - **Delete (`deleteProductAction`):**
     - Receives `productId`.
     - RBAC: Strictly restricted to `SUPER_ADMIN`.
     - Checks if product is associated with active unfulfilled orders (`PENDING`, `CONFIRMED`, `PROCESSING`). If active orders exist, prevents deletion with an informative error; if safe, deletes variants, branch inventory, and product cleanly in a transaction.
     - Calls `revalidatePath` on `/admin/products`, `/catalog`, and storefront.

3. **Admin UI Enhancements:**
   - **Products Table (`components/admin/products-list-view.tsx`):**
     - Add an "Amallar" (Actions) column to the table.
     - Provide an "Tahrirlash" (Edit) link to `/admin/products/[id]/edit`.
     - Provide an "O'chirish" (Delete) button opening an AlertDialog confirmation modal calling `deleteProductAction`.
   - **Edit Page (`app/[locale]/admin/products/[id]/edit/page.tsx`):**
     - Loads existing product, its variants, and branch stock.
     - Renders `ProductPresetMatrixForm` pre-populated with current prices and stock for seamless updating.
   - **Creation Page (`app/[locale]/admin/products/new/page.tsx`):**
     - Uses `ProductPresetMatrixForm` with empty/default state.

---

## 5. What is Left to the Builder
- Fine-tuning CSS transition duration for gallery slides (300ms ease-in-out).
- Adding "Select All" / "Deselect All" quick toggles for variants in the matrix.
- Toast notifications and validation feedback for empty stock or non-positive price.

