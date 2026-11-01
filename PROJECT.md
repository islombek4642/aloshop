# Project: AloShop Mobile Vitrina, Product Cards, Snapshot View & Branch Inventory Polish

## Architecture
- **Framework & Runtime**: Next.js App Router (RSC + Client Components), TypeScript (strict mode, zero `any`), Tailwind CSS, shadcn/ui (Radix UI), Lucide Icons, `next-intl` (uz, ru, en).
- **Data & ORM**: PostgreSQL, Prisma ORM (`Product`, `ProductVariant`, `Branch`, `BranchInventory`).
- **Storefront Hierarchy**:
  - `app/[locale]/(store)/page.tsx`: Homepage with 2-column mobile showcase vitrina.
  - `app/[locale]/(store)/catalog/page.tsx`: Catalog with 2-column mobile grid and responsive desktop layout.
  - `components/store/product-card.tsx`: Polished card component with RAM badge, storage pills, aspect-square image, color swatches.
  - `app/[locale]/(store)/product/[slug]/page.tsx`: Product detail page with server-side fetching and fallback resilience.
  - `components/store/product-details-client.tsx`: Interactive configurator, hosting `SnapshotSpecsView`, `BranchStockWidget`, and `MobileStickyBuyBar`.
  - `components/store/snapshot-specs-view.tsx`: High-density 4–6 tile glanceable hardware specs view (RAM, Storage, Color, Condition, Warranty, Branch Stock).
  - `components/store/mobile-sticky-buy-bar.tsx`: Fixed mobile bottom bar with dual CTAs (1-Click Buy + Add to Cart), live branch stock chip, and safe-area handling.
  - `lib/utils/specs.ts`: Hardware specifications inference helper ensuring resilient fallback.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | RAM Data Schema & Types | Add `ram String?` to `ProductVariant` and vitals (`screenSize`, `processor`, `battery`) to `Product`, update seeds, TypeScript interfaces, and fallback arrays | M1 | Survey (Explorer 2) |
| 2 | RAM Fallback Helper | Create `inferDefaultRam` in `lib/utils/specs.ts` to ensure 100% resilient RAM display | M1 | Survey (Explorer 1 & 2) |
| 3 | 2-Column Mobile Showcase Grid | Update homepage and catalog grids to `grid-cols-2` on mobile (<640px) with responsive gaps | M2 | Survey (Explorer 1) & R2 |
| 4 | Polished Product Card Architecture | Calibrate padding, aspect-square image, brand/model hierarchy, interactive swatches/chips with event isolation | M2 | Survey (Explorer 1) & R2 |
| 5 | RAM & Storage Hardware Spec Badges | Prominently display RAM (`{ram} RAM` / `tProduct("ram")`) with Lucide `Cpu` and storage with `HardDrive` on product cards | M2 | Survey (Explorer 1 & 2) & R2 |
| 6 | "A Snapshot View" Specs Component | Implement compact high-density glanceable specs tile grid (RAM, Storage, Color, Condition, Warranty, Branch Stock) | M3 | Survey (Explorer 2 & 3) & R3 |
| 7 | Detail Page Reactive Specs Table | Add RAM row to full tech specs table in `product-details-client.tsx` reacting to selected variant | M3 | Survey (Explorer 2 & 3) & R3 |
| 8 | Live Branch Inventory Indication | Use explicit branch stock messages ("Malika: 4 dona mavjud", "Chilonzorda mavjud emas") in widget, Snapshot View, and sticky bar | M3 | Survey (Explorer 3) & R3 |
| 9 | Mobile Sticky Bottom Bar | Implement `MobileStickyBuyBar` with dual CTAs (1-Click `Zap` + Cart), live branch chip, 44px touch targets, and safe-area insets | M3 | Survey (Explorer 3) & R3 |
| 10 | Standards & Zero-Emoji Enforcement | Ensure zero Unicode emojis, strict TypeScript (zero `any`), Lucide icons, full 1:1 i18n dictionary parity | M4 | Survey & R4 |
| 11 | Production Build & Typecheck Gate | Complete `npm run check-types`, `npm run verify` (6/6 suites PASS), and `npm run build` | M4 | Survey & R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Data Layer & RAM Model Foundations | Schema update, seed data, TypeScript types, fallback arrays, specs helper | none | DONE |
| 2 | M2: 2-Column Mobile Vitrina & Product Card Polish | 2-column mobile layout, card polish, RAM badge, aspect-square image, interactive pills/swatches | M1 | DONE |
| 3 | M3: Product Detail "A Snapshot View", Live Branch Stock & Mobile Sticky Bar | SnapshotSpecsView component, BranchStockWidget explicit indicators, MobileStickyBuyBar | M1 | DONE |
| 4 | M4: E2E Verification, i18n Parity & Production Build | Full verification suite (6/6 PASS), typecheck, build validation, zero-emoji audit | M2, M3 | DONE |

## Interface Contracts

### ProductCardVariant Contract
```typescript
export interface ProductCardVariant {
  id: string;
  sku: string;
  colorNameUz?: string;
  colorNameRu?: string;
  colorNameEn?: string;
  colorHex: string;
  ram?: string | null;
  storage: string;
  condition: string;
  price: number | string | { toString(): string };
  oldPrice?: number | string | { toString(): string } | null;
  images: string[];
  inventory?: { quantity: number; branch?: { name: string; slug?: string } }[];
}
```

### ProductVariantData Contract
```typescript
export interface ProductVariantData {
  id: string;
  sku: string;
  colorNameUz?: string;
  colorNameRu?: string;
  colorNameEn?: string;
  colorHex: string;
  ram?: string | null;
  storage: string;
  condition: string;
  price: number;
  oldPrice?: number | null;
  images: string[];
  inventory?: ProductVariantInventory[];
}
```

### SnapshotSpecsView Contract
```typescript
export interface SnapshotSpecsViewProps {
  activeVariant: ProductVariantData;
  brand: string;
  modelName: string;
  warrantyMonths: number;
  screenSize?: string | null;
  processor?: string | null;
  battery?: string | null;
  branchesInStockCount: number;
  totalStockCount: number;
  className?: string;
}
```

### MobileStickyBuyBar Contract
```typescript
export interface MobileStickyBuyBarProps {
  activeVariant: ProductVariantData;
  colorName: string;
  totalStock: number;
  inStockBranchSummary?: string;
  isAddedToCart: boolean;
  onAddToCart: () => void;
  onOneClickBuy: () => void;
  className?: string;
}
```

## Code Layout
- `prisma/schema.prisma`: Data models (`Product`, `ProductVariant`, `Branch`, `BranchInventory`)
- `prisma/seed.ts`: Seed script with realistic RAM & hardware vitals
- `lib/utils/specs.ts`: Spec inference and formatting utility
- `components/store/product-card.tsx`: Storefront product card
- `components/store/snapshot-specs-view.tsx`: Glanceable hardware snapshot block
- `components/store/mobile-sticky-buy-bar.tsx`: Mobile sticky bottom action bar
- `components/store/branch-stock-widget.tsx`: Branch inventory list with live status
- `components/store/product-details-client.tsx`: Product detail orchestrator
- `components/store/variant-selector.tsx`: Variant configuration UI
- `app/[locale]/(store)/page.tsx`: Storefront home page
- `app/[locale]/(store)/catalog/page.tsx`: Catalog page
- `app/[locale]/(store)/product/[slug]/page.tsx`: Product detail page
- `messages/{uz,ru,en}.json`: Translation dictionaries
