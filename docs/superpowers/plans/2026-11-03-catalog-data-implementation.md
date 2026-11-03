# Smartfonlar Katalogi Integratsiyasi va Admin Qulayliklari Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the verified 41-smartphone catalog (`data/apple` and `data/samsung`) into AloShop, expanding the Prisma schema with camera/charging/os/series, creating static asset pipelines, providing smart preset and swatch selectors for the admin product creator, and enriching the storefront specifications view.

**Architecture:** Evolution of database schema with new hardware attributes, public image asset pipeline from `data/` to `public/images/products/`, type-safe catalog preset engine (`lib/catalog/presets.ts`), upgraded Admin Server Action with strict Zod validation, streamlined admin UI with 1-click presets, smart color swatches, storage pills, auto-SKU generation, and storefront hardware vitals rendering.

**Tech Stack:** Next.js 15 (App Router), TypeScript (Strict), Tailwind CSS, shadcn/ui, Lucide Icons, Prisma ORM, PostgreSQL, next-intl (UZ, RU, EN), Zod.

**Spec:** `docs/audits/2026-11-02-catalog-data-gap-analysis.md`

## Global Constraints

- AGENTS.md Rule 3.4 (Zero Emojis Policy): Mutlaqo hech qanday Unicode emoji (📱, ⚡, 📷, va h.k.) kodda, interfeysda, xabarlarda yoki sharhlarda ishlatilmaydi.
- AGENTS.md Rule 3.3 (Qat'iy Lokalizatsiya): Barcha interfeys matnlari uchta tilda (`messages/uz.json`, `ru.json`, `en.json`) bo'lishi shart.
- AGENTS.md Rule 4 (Strict TypeScript): `any` tipi taqiqlanadi, barcha tiplar qat'iy aniqlanadi.
- AGENTS.md Rule 5.2 & 5.3 (Xavfsizlik): Zod validatsiyasi, RBAC multi-filial IDOR himoyasi saqlanadi.
- DRY va Modular arxitektura: takrorlanmas yordamchi modullar va tayyor Radix/shadcn komponentlari.

## Review Focus

1. **Prisma DMMF Schema Parity:** Baza sxemasiga yangi ustunlar qo'shilganda mavjud munosabatlar va `tests/prisma-schema.test.ts` buzilmasligi shart.
2. **Missing Public Images & 404 Prevention:** `public/images/products/placeholder.webp` va barcha ko'chirilgan rasmlar mavjud bo'lishi, Next.js remotePatterns Apple va Samsung CDN domenlarini qo'llab-quvvatlashi shart.
3. **Admin Form Resiliency & IDOR Stock Safety:** Admin forma yangi maydonlarni to'ldirmasa ham ixtiyoriy (`optional`) parametrlar xatolik keltirib chiqarmasligi, filial admini faqat o'z filialiga qoldiq yozishi qat'iy ta'minlanishi shart.
4. **Samsung Storage & Color Fallbacks:** Samsung model kodlaridan xotira hajmini aniqlovchi va xom protsessor/batareya qiymatlarini tozalovchi mantiq xatosiz ishlashi shart.
5. **i18n Key Completeness:** Yangi qo'shilgan barcha admin va storefront lug'at kalitlari UZ, RU, EN da 100% simmetrik bo'lishi shart (`scripts/test-i18n.ts` tekshiruvidan o'tishi).

---

### Task 1: Prisma Schema Evolution & Client Generation

**Files:**
- Modify: `prisma/schema.prisma:63-84`
- Modify: `tests/prisma-schema.test.ts:80-115`

**Interfaces:**
- Produces: `Product` with `camera: String?`, `charging: String?`, `os: String?`, `series: String?`, `releaseYear: Int?`, `specs: Json?`
- Consumes: Prisma ORM, PostgreSQL schema

- [ ] **Step 1: Write tests for new schema fields in `tests/prisma-schema.test.ts`**

Update `tests/prisma-schema.test.ts` to assert that `Product` fields in DMMF include `camera`, `charging`, `os`, `series`, `releaseYear`, and `specs`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/prisma-schema.test.ts`
Expected: FAIL with missing fields on Product DMMF model.

- [ ] **Step 3: Update `prisma/schema.prisma`**

Add the missing fields to `model Product`:
```prisma
  camera         String?          // Masalan: "48MP Fusion + 48MP Ultra Wide"
  charging       String?          // Masalan: "USB-C, 25W MagSafe"
  os             String?          // Masalan: "iOS 18"
  series         String?          // Masalan: "iPhone 16" yoki "Galaxy S25"
  releaseYear    Int?             // Masalan: 2024
  specs          Json?            // Qo'shimcha moslashuvchan parametrlar
```

- [ ] **Step 4: Push database schema and generate Prisma client**

Run: `npx prisma db push --accept-data-loss`
Run: `npx prisma generate`

- [ ] **Step 5: Run tests to verify schema updates pass**

Run: `npx tsx tests/prisma-schema.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma tests/prisma-schema.test.ts
git commit -m "feat(db): add camera, charging, os, series, releaseYear, specs to Product model"
```

---

### Task 2: Static Asset Pipeline & Next.js CDN Whitelist

**Files:**
- Create: `public/images/products/placeholder.webp` (or SVG fallback)
- Create: `scripts/sync-product-assets.ts`
- Modify: `next.config.ts:7-15`
- Test: `tests/static-assets.test.ts`

**Interfaces:**
- Produces: `public/images/products/apple/*`, `public/images/products/samsung/*`, `placeholder.webp`
- Consumes: `data/apple/`, `data/samsung/`, `next.config.ts`

- [ ] **Step 1: Write test for static assets and next config remote patterns in `tests/static-assets.test.ts`**

Create test verifying:
1. `public/images/products/placeholder.webp` (or `placeholder.svg`) exists.
2. `public/images/products/apple` and `public/images/products/samsung` exist and contain images.
3. `next.config.ts` remotePatterns includes `store.storeimages.cdn-apple.com` and `images.samsung.com`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/static-assets.test.ts`
Expected: FAIL (assets and remotePatterns not yet set up).

- [ ] **Step 3: Create asset synchronization script `scripts/sync-product-assets.ts` and run it**

Script copies PNG assets from `data/apple` and `data/samsung` into `public/images/products/apple` and `public/images/products/samsung` while preserving model subdirectories, and ensures placeholder image exists.
Run: `npx tsx scripts/sync-product-assets.ts`

- [ ] **Step 4: Update `next.config.ts` remote patterns**

Add:
```typescript
      {
        protocol: "https",
        hostname: "store.storeimages.cdn-apple.com",
      },
      {
        protocol: "https",
        hostname: "images.samsung.com",
      },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx tests/static-assets.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add public/ scripts/sync-product-assets.ts next.config.ts tests/static-assets.test.ts
git commit -m "feat(assets): setup static product asset pipeline and cdn remote patterns"
```

---

### Task 3: Catalog Presets Engine (`lib/catalog/presets.ts`)

**Files:**
- Create: `lib/catalog/presets.ts`
- Create: `lib/catalog/types.ts`
- Create: `tests/catalog-presets.test.ts`

**Interfaces:**
- Produces:
  - `export interface CatalogPreset`: brand, modelName, series, releaseYear, slug, specs, descriptions, colors, storageOptions.
  - `export function getCatalogPresets(): CatalogPreset[]`
  - `export function getPresetsByBrand(brand: string): CatalogPreset[]`
  - `export function getPresetByModel(brand: string, modelName: string): CatalogPreset | undefined`
  - `export function generateSku(brand: string, modelName: string, storage: string, colorName: string): string`

- [ ] **Step 1: Write test for catalog presets engine in `tests/catalog-presets.test.ts`**

Test must verify:
- Apple presets (iPhone 13 to 18, SE) have all required specs (`screenSize`, `processor`, `ram`, `battery`, `camera`, `charging`, `os`).
- Samsung presets (Galaxy S and A series) have clean human-readable specs (not raw frequencies or video hours).
- Color swatches have localized names (Uz, Ru, En) and valid hex codes (`#xxxxxx`).
- SKU generator produces unique, clean uppercase codes.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/catalog-presets.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `lib/catalog/types.ts` and `lib/catalog/presets.ts`**

Extract and parse the 41 models from `data/` into structured presets with:
- Apple: full specs, 3-language descriptions, swatches, storage tiers.
- Samsung: clean marketing specs (e.g. Snapdragon 8 Elite, 5000 mAh, 45W quvvatlash), swatches, storage tiers.
- SKU generator: `generateSku(brand, modelName, storage, colorName)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/catalog-presets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/catalog/ types/ tests/catalog-presets.test.ts
git commit -m "feat(catalog): create type-safe smartphone presets engine and sku generator"
```

---

### Task 4: Admin Server Action Hardware Specs & Validation Upgrade

**Files:**
- Modify: `app/actions/admin-products.ts`
- Modify: `tests/admin-auth.test.ts` (or add `tests/admin-products-action.test.ts`)

**Interfaces:**
- Produces: `createProductAction` accepting `camera`, `charging`, `os`, `series`, `releaseYear`, `screenSize`, `processor`, `battery`, and `variants[].ram`.
- Consumes: Prisma client, `variantInputSchema`, `createProductSchema`

- [ ] **Step 1: Write test for hardware spec handling in `tests/admin-products-action.test.ts`**

Verify that `createProductSchema` validates hardware fields, defaults safely when optional, and persists them into the transaction.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-products-action.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `app/actions/admin-products.ts`**

1. In `variantInputSchema`:
   - Add `ram: z.string().optional()`
2. In `createProductSchema`:
   - Add `series: z.string().optional()`
   - Add `releaseYear: z.number().int().optional()`
   - Add `screenSize: z.string().optional()`
   - Add `processor: z.string().optional()`
   - Add `battery: z.string().optional()`
   - Add `camera: z.string().optional()`
   - Add `charging: z.string().optional()`
   - Add `os: z.string().optional()`
   - Add `specs: z.record(z.string(), z.any()).optional()`
3. In `tx.product.create`:
   - Save `series`, `releaseYear`, `screenSize`, `processor`, `battery`, `camera`, `charging`, `os`, `specs`.
4. In `tx.productVariant.create`:
   - Save `ram: v.ram?.trim() || null`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-products-action.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/actions/admin-products.ts tests/admin-products-action.test.ts
git commit -m "feat(admin): support camera, charging, os, ram, and specs in product creation action"
```

---

### Task 5: Admin Product Create Form UX Overhaul

**Files:**
- Modify: `components/admin/product-create-form.tsx`
- Modify: `messages/uz.json`, `messages/ru.json`, `messages/en.json`

**Interfaces:**
- Produces: Enhanced `ProductCreateForm` with:
  1. Catalog Preset Selector (Apple / Samsung / Custom dropdown with 1-click auto-fill)
  2. Hardware specifications inputs (Screen, CPU, RAM, Battery, Camera, Charging, OS)
  3. Smart Color Swatches with localized names + Custom HEX fallback
  4. Storage Pills (`128GB`, `256GB`, `512GB`, `1TB`, Custom)
  5. Live auto-SKU generation
  6. Visual Image Preview cards
- Consumes: `lib/catalog/presets.ts`, `app/actions/admin-products.ts`

- [ ] **Step 1: Add new i18n keys to `messages/uz.json`, `messages/ru.json`, `messages/en.json`**

Keys to add under `admin.productCreate`:
- `presetSelectLabel`, `presetPlaceholder`, `presetApply`, `customDevice`
- `hardwareSpecsSection`, `screenLabel`, `screenPlaceholder`
- `cpuLabel`, `cpuPlaceholder`, `batteryLabel`, `batteryPlaceholder`
- `cameraLabel`, `cameraPlaceholder`, `chargingLabel`, `chargingPlaceholder`
- `osLabel`, `osPlaceholder`, `ramLabel`, `ramPlaceholder`
- `colorPresetsLabel`, `customColorToggle`, `storageQuickSelect`
- `autoSkuNotice`, `imagePreview`
Ensure 100% key parity across UZ, RU, EN and Zero Emojis!

- [ ] **Step 2: Run i18n audit to verify parity**

Run: `npx tsx scripts/test-i18n.ts`
Expected: PASS (0 missing keys, 0 emojis).

- [ ] **Step 3: Update `components/admin/product-create-form.tsx`**

Integrate preset selection, hardware inputs, smart swatches, storage pills, live SKU generation, and image preview cards adhering to shadcn/ui and Radix UI standards with clean Lucide icons.

- [ ] **Step 4: Check TypeScript types**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/product-create-form.tsx messages/
git commit -m "feat(admin): add catalog preset selector, smart swatches, storage pills, and hardware fields"
```

---

### Task 6: Storefront Specs View & Details Client Enrichment

**Files:**
- Modify: `components/store/snapshot-specs-view.tsx`
- Modify: `components/store/product-details-client.tsx`
- Modify: `app/[locale]/(store)/product/[slug]/page.tsx`
- Modify: `messages/uz.json`, `messages/ru.json`, `messages/en.json`
- Test: `tests/storefront-specs.test.ts`

**Interfaces:**
- Produces: Storefront displaying camera, charging, battery, screen, CPU, and RAM with official badges and clean icons.
- Consumes: `Product` database record, `SnapshotSpecsViewProps`.

- [ ] **Step 1: Add i18n keys for camera and charging specs**

In `messages/*.json`:
- `product.specs.camera`: UZ: "Asosiy kamera", RU: "Основная камера", EN: "Main camera"
- `product.specs.charging`: UZ: "Quvvatlash", RU: "Зарядка", EN: "Charging"
- `product.specs.os`: UZ: "Operatsion tizim", RU: "Операционная система", EN: "Operating system"

- [ ] **Step 2: Update `components/store/snapshot-specs-view.tsx`**

Add `camera?: string | null` and `charging?: string | null` to props. Render Camera row with `Camera` icon and Charging row with `Zap` icon when values are present.

- [ ] **Step 3: Update `components/store/product-details-client.tsx` & `page.tsx`**

Pass `camera` and `charging` from `dbProduct` to `SerializedProduct` and into `SnapshotSpecsView`.

- [ ] **Step 4: Write test verifying storefront specs view mapping in `tests/storefront-specs.test.ts`**

Run: `npx tsx tests/storefront-specs.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/store/ app/[locale]/(store)/product/[slug]/ messages/ tests/storefront-specs.test.ts
git commit -m "feat(storefront): display camera and charging specs in product vitals view"
```

---

### Task 7: Master Verification & Final Regression Suite

**Files:**
- Modify: `scripts/verify-all.ts`
- Run: full test suite

- [ ] **Step 1: Register new test suites in `scripts/verify-all.ts`**

Add `catalog-presets.test.ts`, `static-assets.test.ts`, and `admin-products-action.test.ts` to `SUITES`.

- [ ] **Step 2: Run `npm run verify`**

Run: `npm run verify`
Expected: ALL test suites PASS.

- [ ] **Step 3: Run `npm run check-types`**

Run: `npm run check-types`
Expected: 0 errors.

- [ ] **Step 4: Final commit**

```bash
git add scripts/verify-all.ts
git commit -m "chore: integrate catalog and asset suites into master verification"
```

