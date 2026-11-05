# Admin Product Creation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the AloShop admin product creation page (`/admin/products/new`) into a unified, high-efficiency e-commerce control hub with a 70/30 desktop layout, mobile stepped/accordion flow, 6 core logical blocks, dynamic new/used condition switching, draft persistence, cost price tracking, and live computed summary.

**Architecture:** A unified form component (`UnifiedProductEditor`) decomposed into 6 modular section components, driven by React state and Zod validation. The desktop view renders a responsive 2-column layout (70% main body for inputs, 30% sticky sidebar for live summary and primary actions), while mobile renders touch-friendly collapsibles with a sticky bottom action bar. Server actions update Prisma models (`Product` and `ProductVariant`) with `costPrice` and `isDraft` support.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, Lucide React, next-intl.

**Spec:** [`docs/superpowers/specs/2026-11-05-admin-product-create-redesign.md`](file:///d:/aloshop/docs/superpowers/specs/2026-11-05-admin-product-create-redesign.md)

---

## Global Constraints

- **Multi-Branch Inventory:** Stock quantities must be mapped per active AloShop branch (`BranchInventory`) keyed to `variantId`.
- **Zero Emojis:** Zero emojis in UI copy, labels, placeholders, errors, and toast notifications across all 3 locales (`uz`, `ru`, `en`).
- **Touch Target Standard:** All mobile buttons, select triggers, inputs, and toggles must be $\ge 44\text{px}$ (`h-11` or `min-h-[44px]`).
- **Draft Isolation:** Any product saved with `isDraft: true` must never be rendered on public storefront catalog queries (`where: { isDraft: false, isArchived: false }`).
- **Used Phone Invariant:** When `condition === "USED"`, the product is strictly constrained to 1 physical device (quantity = 1, exactly 1 variant, unique 15-digit IMEI saved to `IMEIRecord`).
- **Deployment Rule:** Do NOT deploy via Vercel CLI directly; git push to `main` triggers automated production deployment.

---

## Review Focus

1. **Missing Branch Stock on Variant Creation:** An operator creates 3 variants but omits branch inventory for one branch — the system must default omitted quantities to 0 rather than failing or creating orphan records.
2. **Draft Saving with Minimal Information:** An operator clicks "Qoralama sifatida saqlash" having only typed a Title and Brand — the server action must succeed, supply defensive fallbacks for required DB fields, and tag `isDraft: true`.
3. **Invalid IMEI on Used Device:** An operator chooses "Ishlatilgan (USED)" but enters an invalid or duplicate IMEI — the form must reject with localized error before saving.
4. **Variant Duplication Key Collisions:** Rapid duplication of a variant must generate guaranteed unique local IDs and auto-appended SKU suffixes (`-COPY1`, `-COPY2`).
5. **Mobile Viewport Overflow:** Large specifications or multi-branch stock tables must not cause horizontal layout blowout on small screens ($\le 375\text{px}$).

---

### Task 1: Database Schema & Safe Migration (`costPrice`, `isDraft`)

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/admin-product-schema.test.ts`

**Interfaces:**
- Consumes: Existing `Product` and `ProductVariant` models in `prisma/schema.prisma`
- Produces:
  - `Product.costPrice: Decimal?`
  - `Product.isDraft: Boolean @default(false)`
  - `Product.shortDescUz: String?`, `shortDescRu: String?`, `shortDescEn: String?`
  - `ProductVariant.costPrice: Decimal?`

- [ ] **Step 1: Write the failing schema verification test in `tests/admin-product-schema.test.ts`**

```typescript
import { Prisma } from "@prisma/client";
import assert from "node:assert";

export function testProductSchemaExtensions() {
  const productFields = Prisma.dmmf.datamodel.models.find(m => m.name === "Product")?.fields || [];
  const variantFields = Prisma.dmmf.datamodel.models.find(m => m.name === "ProductVariant")?.fields || [];

  const costPrice = productFields.find(f => f.name === "costPrice");
  const isDraft = productFields.find(f => f.name === "isDraft");
  const variantCostPrice = variantFields.find(f => f.name === "costPrice");

  assert.ok(costPrice, "Product model must include costPrice field");
  assert.ok(isDraft, "Product model must include isDraft field");
  assert.ok(variantCostPrice, "ProductVariant model must include costPrice field");
  assert.strictEqual(isDraft.default, false, "Product.isDraft must default to false");
}
testProductSchemaExtensions();
console.log("Schema extensions test passed!");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-product-schema.test.ts`
Expected: FAIL with "Product model must include costPrice field"

- [ ] **Step 3: Update `prisma/schema.prisma` with schema extensions**

Add `costPrice Decimal? @db.Decimal(12, 2)`, `isDraft Boolean @default(false)`, `shortDescUz String?`, `shortDescRu String?`, `shortDescEn String?` to `model Product`, and `costPrice Decimal? @db.Decimal(12, 2)` to `model ProductVariant`.
Then run: `npx prisma validate && npx prisma generate`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-product-schema.test.ts`
Expected: PASS with "Schema extensions test passed!"

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma tests/admin-product-schema.test.ts
git commit -m "feat(db): add costPrice, isDraft, and shortDesc fields to Product schema"
```

---

### Task 2: Server Actions & Zod Validation Layer (`app/actions/admin-products.ts`)

**Files:**
- Modify: `app/actions/admin-products.ts`
- Test: `tests/admin-products-action.test.ts`

**Interfaces:**
- Consumes: Prisma Client with updated `costPrice` and `isDraft` fields
- Produces:
  - `createProductSchema`: extended to accept `costPrice`, `isDraft`, `condition: "NEW" | "USED"`, `imei`, `batteryHealth`, `usedConditionGrade`, `shortDescUz/Ru/En`
  - `createProductAction(input: CreateProductInput)`: handles draft persistence, variant cost prices, and atomic branch stock creation

- [ ] **Step 1: Write the failing action tests in `tests/admin-products-action.test.ts`**

Add test assertions for:
1. `createProductSchema` accepting `isDraft: true` with minimal fields (Title, Brand, Category).
2. `createProductSchema` accepting and validating `costPrice` on root product and variants.
3. `createProductSchema` requiring 15-digit numeric `imei` when `condition === "USED"` and `isDraft === false`.
4. `variantInputSchema` accepting `costPrice: 8500000`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-products-action.test.ts`
Expected: FAIL on new schema checks

- [ ] **Step 3: Implement updated schemas and action logic in `app/actions/admin-products.ts`**

Update `variantInputSchema` and `createProductSchema` in `app/actions/admin-products.ts`.
In `createProductAction`:
- Check if `isDraft === true`; if true, relax required field constraints, fallback empty descriptions to `""`.
- Pass `costPrice: v.costPrice ?? null` when creating variants.
- If `condition === "USED"` and `imei` is provided, create `IMEIRecord` tied to the single variant.
- Populate `costPrice: input.costPrice ?? null`, `isDraft: input.isDraft ?? false`, and short descriptions on `Product.create`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-products-action.test.ts`
Expected: PASS with "Admin Products Action & Zod Validation Suite: Status: PASSED"

- [ ] **Step 5: Commit**

```bash
git add app/actions/admin-products.ts tests/admin-products-action.test.ts
git commit -m "feat(actions): support costPrice, isDraft, and used condition in createProductAction"
```

---

### Task 3: i18n Localization Parity (`messages/uz.json`, `ru.json`, `en.json`)

**Files:**
- Modify: `messages/uz.json`
- Modify: `messages/ru.json`
- Modify: `messages/en.json`
- Test: `scripts/test-i18n.ts`

**Interfaces:**
- Consumes: Existing translation dictionaries in `messages/`
- Produces: 1:1 translation keys under namespace `admin.productCreate` for:
  - `sectionBasicInfo`, `sectionPricing`, `sectionVariants`, `sectionSpecs`, `sectionMedia`, `sectionDescription`
  - `costPrice`, `costPriceHint`, `sellingPrice`, `discountPrice`
  - `saveDraft`, `savingDraft`, `draftSavedSuccess`
  - `liveSummaryTitle`, `startingFromPrice`, `totalBranchStock`, `variantCount`
  - `duplicateVariant`, `addVariantManual`, `colorPicker`
  - `usedConditionLabel`, `conditionNew`, `conditionUsed`, `batteryHealth`, `imeiNumber`
  - `mediaUploadCover`, `mediaUploadGallery`, `cameraCapture`

- [ ] **Step 1: Run i18n audit script to verify baseline**

Run: `npx tsx scripts/test-i18n.ts`
Expected: PASS (current baseline 796 keys)

- [ ] **Step 2: Add all new translation keys across `uz.json`, `ru.json`, and `en.json`**

Ensure zero emojis and 100% key parity across all 3 files.

- [ ] **Step 3: Run i18n audit script to verify 100% parity**

Run: `npx tsx scripts/test-i18n.ts`
Expected: PASS with "All keys match 1:1 across all locales (uz, ru, en). Zero emojis verified."

- [ ] **Step 4: Commit**

```bash
git add messages/uz.json messages/ru.json messages/en.json
git commit -m "fix(i18n): add product create 70/30 hub keys across uz, ru, and en"
```

---

### Task 4: Modular Sub-Components for 70/30 Layout (`components/admin/product-editor/`)

**Files:**
- Create: `components/admin/product-editor/types.ts`
- Create: `components/admin/product-editor/basic-info-section.tsx`
- Create: `components/admin/product-editor/specs-section.tsx`
- Create: `components/admin/product-editor/variants-section.tsx`
- Create: `components/admin/product-editor/media-section.tsx`
- Create: `components/admin/product-editor/description-seo-section.tsx`
- Create: `components/admin/product-editor/sticky-sidebar-summary.tsx`
- Test: `tests/admin-product-components.test.ts`

**Interfaces:**
- Consumes: UI primitives from `@/components/ui/` (Input, Button, Select, Card, Badge, Label)
- Produces: 6 self-contained section components communicating via controlled props and state callbacks

- [ ] **Step 1: Create `types.ts` defining editor form state interfaces**

```typescript
export interface EditorVariant {
  id: string;
  sku: string;
  colorNameUz: string;
  colorNameRu: string;
  colorNameEn: string;
  colorHex: string;
  ram: string;
  storage: string;
  price: number;
  costPrice: number | null;
  oldPrice: number | null;
  images: string[];
  stockByBranch: Record<string, number>;
}

export interface ProductEditorState {
  title: string;
  brand: string;
  categoryId: string;
  condition: "NEW" | "USED";
  skuPrefix: string;
  warrantyMonths: number;
  processor: string;
  screenSize: string;
  battery: string;
  camera: string;
  charging: string;
  os: string;
  imei: string;
  batteryHealth: number | null;
  usedConditionGrade: string;
  shortDescUz: string;
  shortDescRu: string;
  shortDescEn: string;
  descriptionUz: string;
  descriptionRu: string;
  descriptionEn: string;
  slug: string;
  thumbnail: string;
  galleryImages: string[];
  variants: EditorVariant[];
  isActive: boolean;
  isDraft: boolean;
}
```

- [ ] **Step 2: Implement `basic-info-section.tsx` and `specs-section.tsx`**

- `basic-info-section.tsx`: Title, Brand select/input, Category select, Condition dropdown (`NEW` vs `USED`), SKU prefix.
- `specs-section.tsx`: Processor, Screen size, Camera, Battery, SIM. If `condition === "USED"`, conditionally render 15-digit IMEI, battery health % slider/input, and condition grade (A+, A, B).

- [ ] **Step 3: Implement `variants-section.tsx` with duplicate action**

- Dynamic variant table/cards.
- Each variant has color (name + hex color preview), RAM, Storage, Selling price, Cost price, and Branch stock inputs.
- "Nusxalash" (Duplicate) button that clones the variant with a unique ID and new SKU.
- If `condition === "USED"`, constrain to 1 variant and hide the "Add Variant" button.

- [ ] **Step 4: Implement `media-section.tsx` and `description-seo-section.tsx`**

- `media-section.tsx`: Drag-and-drop cover image, gallery image grid, mobile camera capture input (`accept="image/*" capture="environment"`).
- `description-seo-section.tsx`: Short description inputs, full descriptions, slug generator with auto-slugification from title, Meta title and description.

- [ ] **Step 5: Implement `sticky-sidebar-summary.tsx`**

- Desktop sticky sidebar:
  - Primary cover thumbnail preview.
  - Computed summary: Lowest starting price ("10 000 000 so'm dan"), total stock aggregate with branch chips.
  - Direct price and stock inputs if single variant.
  - Status toggle (`isActive`).
  - Action buttons: "Saqlash" (Primary) and "Qoralama sifatida saqlash" (Outline).
- Mobile sticky bottom action bar: Fixed bottom bar (`fixed bottom-0 left-0 right-0 p-3 bg-background border-t z-40`) with full-width primary Save button and secondary Draft button.

- [ ] **Step 6: Write unit test in `tests/admin-product-components.test.ts` to verify exports and interfaces**

- [ ] **Step 7: Run test to verify it passes**

Run: `npx tsx tests/admin-product-components.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add components/admin/product-editor/ tests/admin-product-components.test.ts
git commit -m "feat(ui): implement modular 70/30 product editor sub-components"
```

---

### Task 5: Main Orchestrator Component & Route Integration (`app/[locale]/admin/products/new/page.tsx`)

**Files:**
- Create: `components/admin/product-editor/unified-product-editor.tsx`
- Modify: `app/[locale]/admin/products/new/page.tsx`
- Test: `tests/admin-product-unified-editor.test.ts`

**Interfaces:**
- Consumes: Modular sub-components from `components/admin/product-editor/`
- Produces: Complete responsive page rendered at `/admin/products/new`

- [ ] **Step 1: Write integration test in `tests/admin-product-unified-editor.test.ts`**

Verify that:
1. `UnifiedProductEditor` renders 70% main container and 30% sticky sidebar on desktop (`lg:grid-cols-12`).
2. Mobile collapsible sections render with touch targets $\ge 44\text{px}$.
3. Submitting triggers `createProductAction` with properly formed payload.
4. "Qoralama sifatida saqlash" dispatches with `isDraft: true`.

- [ ] **Step 2: Implement `unified-product-editor.tsx`**

- Orchestrates `basic-info-section`, `specs-section`, `variants-section`, `media-section`, `description-seo-section`, and `sticky-sidebar-summary`.
- On Desktop: `grid grid-cols-1 lg:grid-cols-12 gap-6`, where main body spans `lg:col-span-8` and sticky sidebar spans `lg:col-span-4`.
- On Mobile: Stacked collapsible accordion with touch targets $\ge 44\text{px}$ and bottom sticky action bar.
- Form validation via Zod before submit.

- [ ] **Step 3: Update `app/[locale]/admin/products/new/page.tsx`**

Replace `ProductCreationWizard` with `UnifiedProductEditor`.
Pass `branches`, `categories`, and `isSuperAdmin`.

- [ ] **Step 4: Run integration test to verify it passes**

Run: `npx tsx tests/admin-product-unified-editor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/admin/product-editor/unified-product-editor.tsx app/[locale]/admin/products/new/page.tsx tests/admin-product-unified-editor.test.ts
git commit -m "feat(ui): integrate unified 70/30 product editor into /admin/products/new"
```

---

### Task 6: End-to-End Verification & Full Regression Audit

**Files:**
- Verify all modified and new files

**Interfaces:**
- Consumes: Complete project repository
- Produces: 0 TypeScript errors, 0 test failures, 100% i18n parity, 100% build safety

- [ ] **Step 1: TypeScript type check**

Run: `npm run check-types` (`tsc --noEmit`)
Expected: Code 0, 0 errors.

- [ ] **Step 2: i18n parity and zero emoji check**

Run: `npx tsx scripts/test-i18n.ts`
Expected: Code 0, 100% parity, 0 emojis.

- [ ] **Step 3: Build safety and production migration guard**

Run: `npx tsx tests/build-safety.test.ts`
Expected: Code 0, PASS.

- [ ] **Step 4: Run all product-related test suites**

Run:
```bash
npx tsx tests/admin-product-schema.test.ts
npx tsx tests/admin-products-action.test.ts
npx tsx tests/admin-product-components.test.ts
npx tsx tests/admin-product-unified-editor.test.ts
```
Expected: All tests PASS.

- [ ] **Step 5: Commit & Push to GitHub main**

```bash
git push origin main
```
Note: Automatic Vercel deployment will trigger upon push to `main`. Do not use Vercel CLI.
