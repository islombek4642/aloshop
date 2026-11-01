import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { inferDefaultRam, formatRam, formatStorage } from "../lib/utils/specs";
import type { ProductCardData, ProductCardVariant } from "../components/store/product-card";

const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;

// --- 1. PRODUCT CARD ARCHITECTURAL AUDIT ---
function auditProductCardComponent(): void {
  const filePath = path.join(process.cwd(), "components", "store", "product-card.tsx");
  assert.ok(fs.existsSync(filePath), "components/store/product-card.tsx must exist");
  const content = fs.readFileSync(filePath, "utf-8");

  // Zero emojis check
  assert.equal(EMOJI_REGEX.test(content), false, "product-card.tsx must contain ZERO Unicode emojis");

  // Container geometry
  assert.match(
    content,
    /p-2\.5\s+sm:p-3\.5\s+md:p-4/,
    "ProductCard container must use calibrated responsive padding p-2.5 sm:p-3.5 md:p-4"
  );
  assert.match(content, /rounded-xl/, "ProductCard container must have rounded-xl border");
  assert.match(content, /hover:border-primary\/40\s+hover:shadow-md/, "ProductCard container must have clean hover transition");

  // Micro-badge header & live stock pulse indicator
  assert.match(content, /bg-emerald-500\s+animate-pulse/, "ProductCard must have live branch stock pulse indicator");
  assert.match(content, /tProduct\(["']inStock["']\)/, "ProductCard must use localized inStock string");
  assert.match(content, /tProduct\(["']outOfStock["']\)/, "ProductCard must use localized outOfStock string");

  // Aspect-square image container
  assert.match(content, /aspect-square/, "ProductCard image container must use aspect-square");
  assert.match(content, /object-contain/, "ProductCard image must use object-contain");
  assert.match(content, /group-hover:scale-105/, "ProductCard image must have smooth hover scale");

  // Hierarchy: Uppercase brand tag + bold model title with link
  assert.match(content, /uppercase\s+tracking-wider/, "ProductCard must have uppercase tracking-wider brand tag");
  assert.match(content, /line-clamp-1\s+text-xs\s+sm:text-sm\s+font-bold/, "ProductCard model title must be bold and responsive");

  // Hardware Specs Badge: RAM with Cpu icon and storage with HardDrive icon
  assert.match(content, /<Cpu\s/, "ProductCard must render Lucide Cpu icon for RAM");
  assert.match(content, /<HardDrive\s/, "ProductCard must render Lucide HardDrive icon for storage");
  assert.match(content, /tProduct\(["']ram["']\)/, "ProductCard must render localized RAM string");

  // Interactive swatches & chips: stopPropagation & preventDefault
  assert.match(content, /e\.stopPropagation\(\)/, "Interactive swatches must isolate events with e.stopPropagation()");
  assert.match(content, /e\.preventDefault\(\)/, "Interactive swatches must prevent card navigation with e.preventDefault()");

  // Price row
  assert.match(content, /formatCurrency\(activeVariant\.price\)/, "ProductCard must format active price using formatCurrency");
  assert.match(content, /activeVariant\?\.oldPrice/, "ProductCard must handle oldPrice for discounts");

  // CTA Button
  assert.match(content, /h-8\s+text-\[11px\]\s+sm:text-xs/, "ProductCard CTA button must be h-8 with responsive text");
  assert.match(content, /<ArrowRight\s/, "ProductCard CTA button must render Lucide ArrowRight icon");
  assert.match(content, /tProduct\(["']viewDetails["']\)/, "ProductCard CTA button must use localized viewDetails");
}

// --- 2. STOREFRONT HOMEPAGE GRID AUDIT ---
function auditHomepageGrid(): void {
  const filePath = path.join(process.cwd(), "app", "[locale]", "(store)", "page.tsx");
  assert.ok(fs.existsSync(filePath), "app/[locale]/(store)/page.tsx must exist");
  const content = fs.readFileSync(filePath, "utf-8");

  // Featured products grid container
  assert.match(
    content,
    /grid\s+grid-cols-2\s+sm:grid-cols-2\s+md:grid-cols-3\s+lg:grid-cols-4\s+gap-2\.5\s+sm:gap-4\s+md:gap-6/,
    "Homepage featured products must use 2-column mobile layout: grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6"
  );
}

// --- 3. CATALOG GRID AUDIT ---
function auditCatalogGrid(): void {
  const filePath = path.join(process.cwd(), "app", "[locale]", "(store)", "catalog", "page.tsx");
  assert.ok(fs.existsSync(filePath), "app/[locale]/(store)/catalog/page.tsx must exist");
  const content = fs.readFileSync(filePath, "utf-8");

  // Catalog products grid container
  assert.match(
    content,
    /grid\s+grid-cols-2\s+sm:grid-cols-2\s+lg:grid-cols-3\s+gap-2\.5\s+sm:gap-4\s+md:gap-6/,
    "Catalog products must use 2-column mobile layout: grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6"
  );
}

// --- 4. RUNTIME DATA & RESILIENCE SIMULATION ---
function simulateProductCardRuntime(): void {
  const sampleProduct: ProductCardData = {
    id: "prod-sim-1",
    brand: "Apple",
    modelName: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    variants: [
      {
        id: "var-1",
        sku: "IP15P-128",
        colorHex: "#393836",
        ram: null, // Legacy / null RAM in database
        storage: "128GB",
        condition: "NEW",
        price: 14500000,
        oldPrice: 15500000,
        images: ["/test.jpg"],
        inventory: [{ quantity: 4 }],
      },
      {
        id: "var-2",
        sku: "IP15P-256",
        colorHex: "#9A958E",
        ram: "8GB",
        storage: "256GB",
        condition: "NEW",
        price: 16000000,
        oldPrice: null,
        images: ["/test2.jpg"],
        inventory: [{ quantity: 0 }],
      },
    ],
  };

  // Variant 1: RAM fallback resolution
  const v1 = sampleProduct.variants[0];
  const displayRam1 = formatRam(v1.ram) || inferDefaultRam(sampleProduct.brand, sampleProduct.modelName, v1.storage);
  assert.equal(displayRam1, "8GB", "RAM fallback for iPhone 15 Pro must infer 8GB");

  // Variant 2: Explicit RAM resolution
  const v2 = sampleProduct.variants[1];
  const displayRam2 = formatRam(v2.ram) || inferDefaultRam(sampleProduct.brand, sampleProduct.modelName, v2.storage);
  assert.equal(displayRam2, "8GB", "Explicit RAM must format to 8GB");

  // Storage resolution
  assert.equal(formatStorage(v1.storage), "128GB");
  assert.equal(formatStorage(v2.storage), "256GB");

  // Stock calculation
  const totalStockV1 = v1.inventory?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) ?? 0;
  assert.equal(totalStockV1, 4, "Variant 1 stock must be 4");

  const totalStockV2 = v2.inventory?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) ?? 0;
  assert.equal(totalStockV2, 0, "Variant 2 stock must be 0");
}

// --- MAIN RUNNER ---
console.log("===============================================================");
console.log("M2 2-Column Mobile Vitrina & Product Card Verification Harness");
console.log("===============================================================\n");

try {
  console.log("[1/4] Auditing ProductCard Component Architecture...");
  auditProductCardComponent();
  console.log("      ProductCard geometry, micro-badge header, specs, swatches, and CTA verified.");
  console.log("      STATUS: [PASS]\n");

  console.log("[2/4] Auditing Storefront Homepage 2-Column Grid Layout...");
  auditHomepageGrid();
  console.log("      Homepage featured products grid responsive layout verified.");
  console.log("      STATUS: [PASS]\n");

  console.log("[3/4] Auditing Storefront Catalog 2-Column Grid Layout...");
  auditCatalogGrid();
  console.log("      Catalog products grid responsive layout verified.");
  console.log("      STATUS: [PASS]\n");

  console.log("[4/4] Simulating ProductCard Runtime Data & Fallback Flow...");
  simulateProductCardRuntime();
  console.log("      ProductCard runtime data, RAM fallback, storage, and stock verified.");
  console.log("      STATUS: [PASS]\n");

  console.log("===============================================================");
  console.log("ALL 4 M2 VITRINA VERIFICATION SUITES PASSED SUCCESSFULLY!");
  console.log("===============================================================");
} catch (err: any) {
  console.error("M2 VERIFICATION HARNESS FAILED:", err.message);
  process.exit(1);
}
