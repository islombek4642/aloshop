import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import {
  SnapshotSpecsView,
  type SnapshotSpecsViewProps,
} from "../components/store/snapshot-specs-view";
import {
  MobileStickyBuyBar,
  type MobileStickyBuyBarProps,
} from "../components/store/mobile-sticky-buy-bar";
import {
  BranchStockWidget,
  type BranchStockWidgetProps,
  type BranchStockItem,
} from "../components/store/branch-stock-widget";
import {
  ProductDetailsClient,
  type SerializedProduct,
} from "../components/store/product-details-client";
import type { ProductVariantData } from "../components/store/variant-selector";
import { inferDefaultRam, formatRam, formatStorage, getDeviceVitals } from "../lib/utils/specs";
import { formatCurrency } from "../lib/utils/format-currency";

import uzMessages from "../messages/uz.json";
import ruMessages from "../messages/ru.json";
import enMessages from "../messages/en.json";

const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;

function renderWithIntl(
  element: React.ReactElement,
  locale = "uz",
  messages: AbstractIntlMessages = uzMessages
): string {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      {
        locale,
        messages,
        timeZone: "Asia/Tashkent",
        children: element,
      }
    )
  );
}

// ============================================================================
// ADVERSARIAL TEST DATA MATRIX
// ============================================================================

const testBranches: BranchStockItem[] = [
  {
    id: "branch-malika",
    name: "Malika Savdo Markazi",
    slug: "malika",
    city: "Toshkent",
    address: "Navoiy shoh ko'chasi, Malika SM, A-blok 14-do'kon",
    phone: "+998 (71) 200-11-22",
    workingHours: "09:00 - 20:00",
  },
  {
    id: "branch-chilonzor",
    name: "Chilonzor filiali",
    slug: "chilonzor",
    city: "Toshkent",
    address: "Chilonzor 9-mavze, Qatortol ko'chasi 1-uy",
    phone: "+998 71 200 33 44",
    workingHours: "09:00 - 21:00",
  },
  {
    id: "branch-samarqand",
    name: "Samarqand filiali",
    slug: "samarqand",
    city: "Samarqand",
    address: "Registon ko'chasi 45-uy",
    phone: "+998 (66) 233-88-99",
    workingHours: "10:00 - 20:00",
  },
  {
    id: "branch-fargona",
    name: "Farg'ona filiali",
    slug: "fargona",
    city: "Farg'ona",
    address: "Al-Farg'oniy ko'chasi 12-uy",
    phone: "+998 (73) 244-55-66",
    workingHours: "09:00 - 19:00",
  },
];

// Apple iPhone 15 Pro Variants
const variantIPhone128: ProductVariantData = {
  id: "var-ip15p-nat-128",
  sku: "IP15P-NAT-128",
  colorNameUz: "Tabiiy titan",
  colorNameRu: "Натуральный титан",
  colorNameEn: "Natural Titanium",
  colorHex: "#9A958E",
  ram: "8GB",
  storage: "128GB",
  condition: "NEW",
  price: 14850000,
  oldPrice: 15500000,
  images: ["/images/iphone-natural.jpg"],
  inventory: [
    { branchId: "branch-malika", quantity: 5 },
    { branchId: "branch-chilonzor", quantity: 0 },
    { branchId: "branch-samarqand", quantity: 2 },
    // branch-fargona has no inventory record
  ],
};

const variantIPhone256NoRam: ProductVariantData = {
  id: "var-ip15p-blk-256",
  sku: "IP15P-BLK-256",
  colorNameUz: "Qora titan",
  colorNameRu: "Черный титан",
  colorNameEn: "Black Titanium",
  colorHex: "#2B2B2B",
  ram: null, // Fallback RAM test: Apple iPhone 15 Pro -> 8GB
  storage: "256GB",
  condition: "USED",
  price: 13900000,
  oldPrice: null,
  images: ["/images/iphone-black.jpg"],
  inventory: [
    { branchId: "branch-malika", quantity: 0 },
    { branchId: "branch-chilonzor", quantity: 0 },
    { branchId: "branch-samarqand", quantity: 0 },
  ],
};

const variantIPhone1TB: ProductVariantData = {
  id: "var-ip15p-blu-1tb",
  sku: "IP15P-BLU-1TB",
  colorNameUz: "Moviy titan",
  colorNameRu: "Синий титан",
  colorNameEn: "Blue Titanium",
  colorHex: "#2B3C50",
  ram: "8 GB", // Test RAM formatting
  storage: "1TB",
  condition: "NEW",
  price: 18900000,
  oldPrice: 20000000,
  images: ["/images/iphone-blue.jpg"],
  inventory: [
    { branchId: "branch-malika", quantity: 1 },
    { branchId: "branch-chilonzor", quantity: 3 },
    { branchId: "branch-samarqand", quantity: 0 },
  ],
};

// Samsung Galaxy S24 Ultra Variant (12GB RAM, 512GB)
const variantS24Ultra: ProductVariantData = {
  id: "var-s24u-gry-512",
  sku: "S24U-GRY-512",
  colorNameUz: "Kulrang titan",
  colorNameRu: "Серый титан",
  colorNameEn: "Titanium Gray",
  colorHex: "#777777",
  ram: "12GB",
  storage: "512GB",
  condition: "NEW",
  price: 16500000,
  oldPrice: 17200000,
  images: ["/images/s24u-gray.jpg"],
  inventory: [
    { branchId: "branch-malika", quantity: 3 },
    { branchId: "branch-chilonzor", quantity: 2 },
  ],
};

// Xiaomi 14 Ultra Variant (16GB RAM, 1TB)
const variantXiaomi14Ultra: ProductVariantData = {
  id: "var-mi14u-wht-1tb",
  sku: "MI14U-WHT-1TB",
  colorNameUz: "Oq keramik",
  colorNameRu: "Белый керамик",
  colorNameEn: "White Ceramic",
  colorHex: "#FFFFFF",
  ram: null, // Fallback RAM test: Xiaomi 14 Ultra -> 16GB
  storage: "1TB",
  condition: "NEW",
  price: 15200000,
  oldPrice: null,
  images: ["/images/mi14u-white.jpg"],
  inventory: [
    { branchId: "branch-malika", quantity: 2 },
  ],
};

// Generic Budget Android Variant (Uncatalogued brand, 64GB storage)
const variantBudgetAndroid: ProductVariantData = {
  id: "var-budget-64",
  sku: "BUDGET-64",
  colorNameUz: "Ko'k",
  colorNameRu: "Синий",
  colorNameEn: "Blue",
  colorHex: "#0000FF",
  ram: "", // Empty string fallback
  storage: "64GB",
  condition: "USED",
  price: 1200000,
  oldPrice: 1500000,
  images: ["/images/budget-blue.jpg"],
  inventory: [],
};

// Sample multi-variant product for reactive testing
const multiVariantProduct: SerializedProduct = {
  id: "prod-ip15p",
  brand: "Apple",
  modelName: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  descriptionUz: "Titan korpusli A17 Pro chipli flagman.",
  descriptionRu: "Флагман в титановом корпусе с чипом A17 Pro.",
  descriptionEn: "Flagship phone in titanium with A17 Pro chip.",
  warrantyMonths: 12,
  screenSize: '6.1" Super Retina XDR OLED',
  processor: "Apple A17 Pro (3nm)",
  battery: "3274 mAh",
  category: {
    id: "cat-smartphones",
    nameUz: "Smartfonlar",
    nameRu: "Смартфоны",
    nameEn: "Smartphones",
    slug: "smartphones",
  },
  variants: [variantIPhone128, variantIPhone256NoRam, variantIPhone1TB],
};

// ============================================================================
// TEST 1: SNAPSHOT SPECS VIEW ALL 6 TILES ACROSS MULTIPLE PRODUCTS & VARIANTS
// ============================================================================
function testSnapshotSpecsView6Tiles(): void {
  console.log("--> Challenge 1: SnapshotSpecsView 6 Tiles Exhaustive Rendering");

  // 1.1 In-stock Apple iPhone 15 Pro with explicit RAM
  const htmlApple = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantIPhone128,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 2,
      totalStockCount: 7,
    })
  );

  // Check 6 Tiles exist with appropriate Lucide icons
  // Tile 1: RAM (Cpu)
  assert.ok(htmlApple.includes("lucide-cpu"), "Tile 1 RAM must render Lucide Cpu icon");
  assert.ok(htmlApple.includes(uzMessages.product.ram), "Tile 1 RAM must render localized label");
  assert.ok(htmlApple.includes("8GB"), "Tile 1 RAM must display explicit 8GB");

  // Tile 2: Storage (HardDrive)
  assert.ok(htmlApple.includes("lucide-hard-drive"), "Tile 2 Storage must render Lucide HardDrive icon");
  assert.ok(htmlApple.includes(uzMessages.product.storage), "Tile 2 Storage must render localized label");
  assert.ok(htmlApple.includes("128GB"), "Tile 2 Storage must display 128GB");

  // Tile 3: Color (Palette)
  assert.ok(htmlApple.includes("lucide-palette"), "Tile 3 Color must render Lucide Palette icon");
  assert.ok(htmlApple.includes(uzMessages.product.color), "Tile 3 Color must render localized label");
  assert.ok(htmlApple.includes("Tabiiy titan"), "Tile 3 Color must render localized color name");
  assert.ok(htmlApple.includes("background-color:#9A958E"), "Tile 3 Color must render color swatch dot");

  // Tile 4: Condition (Sparkles)
  assert.ok(htmlApple.includes("lucide-sparkles"), "Tile 4 Condition must render Lucide Sparkles icon");
  assert.ok(htmlApple.includes(uzMessages.product.condition), "Tile 4 Condition must render localized label");
  assert.ok(htmlApple.includes(uzMessages.product.conditions.new), "Tile 4 Condition must render 'Yangi' for NEW");

  // Hardware Tiles (Display, Processor, Battery)
  assert.ok(htmlApple.includes("lucide-smartphone"), "Tile Display must render Lucide Smartphone icon");
  assert.ok(htmlApple.includes("lucide-battery-charging"), "Tile Battery must render Lucide BatteryCharging icon");

  // Tile 6: Live Branch Stock (Building2)
  assert.ok(
    htmlApple.includes("lucide-building-2") || htmlApple.includes("lucide-building"),
    "Tile 6 Branch Stock must render Lucide Building2 icon"
  );
  assert.ok(htmlApple.includes(uzMessages.product.stockInBranches), "Tile 6 Branch Stock must render localized label");
  assert.ok(htmlApple.includes("animate-pulse"), "Tile 6 in-stock must feature pulsing green dot");
  assert.ok(htmlApple.includes("2 ta filialda (7 dona)"), "Tile 6 in-stock must show branch & total count");

  // 1.2 Out-of-stock Apple iPhone 15 Pro with Fallback RAM inference & USED condition
  const htmlAppleFallback = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantIPhone256NoRam,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 6,
      branchesInStockCount: 0,
      totalStockCount: 0,
    })
  );
  // Fallback RAM should be 8GB for iPhone 15 Pro
  assert.ok(
    htmlAppleFallback.includes("8GB"),
    "SnapshotSpecsView must infer 8GB fallback RAM for iPhone 15 Pro when variant.ram is null"
  );
  assert.ok(
    htmlAppleFallback.includes("256GB"),
    "SnapshotSpecsView must render 256GB storage"
  );
  assert.ok(
    htmlAppleFallback.includes("Qora titan"),
    "SnapshotSpecsView must render Black Titanium"
  );
  assert.ok(
    htmlAppleFallback.includes("background-color:#2B2B2B"),
    "SnapshotSpecsView must render black swatch"
  );
  assert.ok(
    htmlAppleFallback.includes(uzMessages.product.conditions.used),
    "SnapshotSpecsView must render USED condition in Uzbek"
  );
  assert.ok(
    htmlAppleFallback.includes("lucide-smartphone"),
    "SnapshotSpecsView must render Smartphone icon"
  );
  assert.ok(
    htmlAppleFallback.includes(uzMessages.product.outOfStock),
    "SnapshotSpecsView must render 'Mavjud emas' when out of stock"
  );
  assert.ok(
    htmlAppleFallback.includes("bg-destructive"),
    "SnapshotSpecsView must render red destructive dot when out of stock"
  );

  // 1.3 Samsung Galaxy S24 Ultra with 12GB RAM, 512GB Storage
  const htmlSamsung = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantS24Ultra,
      brand: "Samsung",
      modelName: "Galaxy S24 Ultra",
      warrantyMonths: 12,
      branchesInStockCount: 2,
      totalStockCount: 5,
    })
  );
  assert.ok(htmlSamsung.includes("12GB"), "SnapshotSpecsView must render 12GB RAM for S24 Ultra");
  assert.ok(htmlSamsung.includes("512GB"), "SnapshotSpecsView must render 512GB storage");
  assert.ok(htmlSamsung.includes("Kulrang titan"), "SnapshotSpecsView must render Titanium Gray");

  // 1.4 Xiaomi 14 Ultra with Fallback RAM inference (16GB RAM for Ultra flagship)
  const htmlXiaomi = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantXiaomi14Ultra,
      brand: "Xiaomi",
      modelName: "Xiaomi 14 Ultra",
      warrantyMonths: 12,
      branchesInStockCount: 1,
      totalStockCount: 2,
    })
  );
  assert.ok(
    htmlXiaomi.includes("16GB"),
    "SnapshotSpecsView must infer 16GB fallback RAM for Xiaomi 14 Ultra"
  );
  assert.ok(htmlXiaomi.includes("1TB"), "SnapshotSpecsView must render 1TB storage");

  // 1.5 Generic Budget Android with empty RAM string -> storage-based fallback
  const htmlBudget = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantBudgetAndroid,
      brand: "GenericBrand",
      modelName: "BudgetPhone 1",
      warrantyMonths: 3,
      branchesInStockCount: 0,
      totalStockCount: 0,
    })
  );
  assert.ok(
    htmlBudget.includes("8GB"),
    "SnapshotSpecsView must provide safe fallback (8GB) even for unknown brands"
  );
  assert.ok(htmlBudget.includes("64GB"), "SnapshotSpecsView must render 64GB storage");

  // 1.6 Multilingual Parity in SnapshotSpecsView (Russian and English)
  const htmlRu = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantIPhone128,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 2,
      totalStockCount: 7,
    }),
    "ru",
    ruMessages
  );
  assert.ok(htmlRu.includes(ruMessages.product.ram), "Ru RAM label must be rendered");
  assert.ok(htmlRu.includes(ruMessages.product.storage), "Ru Storage label must be rendered");
  assert.ok(htmlRu.includes(ruMessages.product.color), "Ru Color label must be rendered");
  assert.ok(htmlRu.includes("Натуральный титан"), "Ru Color name must be rendered");
  assert.ok(htmlRu.includes(ruMessages.product.condition), "Ru Condition label must be rendered");
  assert.ok(htmlRu.includes(ruMessages.product.screen), "Ru Screen label must be rendered");
  assert.ok(htmlRu.includes(ruMessages.product.stockInBranches), "Ru Branch stock label must be rendered");
  assert.ok(htmlRu.includes("В 2 филиалах (7 шт.)"), "Ru Branch summary must be rendered");

  const htmlEn = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantIPhone128,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 2,
      totalStockCount: 7,
    }),
    "en",
    enMessages
  );
  assert.ok(htmlEn.includes(enMessages.product.ram), "En RAM label must be rendered");
  assert.ok(htmlEn.includes(enMessages.product.storage), "En Storage label must be rendered");
  assert.ok(htmlEn.includes(enMessages.product.color), "En Color label must be rendered");
  assert.ok(htmlEn.includes("Natural Titanium"), "En Color name must be rendered");
  assert.ok(htmlEn.includes(enMessages.product.condition), "En Condition label must be rendered");
  assert.ok(htmlEn.includes(enMessages.product.screen), "En Screen label must be rendered");
  assert.ok(htmlEn.includes(enMessages.product.stockInBranches), "En Branch stock label must be rendered");
  assert.ok(htmlEn.includes("In 2 branches (7 pcs)"), "En Branch summary must be rendered");

  console.log("    [PASS] Challenge 1: SnapshotSpecsView renders all 6 tiles across brands, variants, and locales.");
}

// ============================================================================
// TEST 2: VARIANT REACTIVE SWITCHING (RAM, STORAGE, COLOR, SKU, STOCK)
// ============================================================================
function testVariantReactiveSwitching(): void {
  console.log("--> Challenge 2: Variant Reactive Switching Audit");

  // State A: Variant 1 (128GB, Natural Titanium, 8GB RAM, in stock)
  const snapA = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantIPhone128,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 2,
      totalStockCount: 7,
    })
  );
  const stickyA = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: variantIPhone128,
      colorName: "Tabiiy titan",
      totalStock: 7,
      inStockBranchSummary: "2 ta filialda (7 dona)",
      isAddedToCart: false,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );

  assert.ok(snapA.includes("8GB"), "State A: RAM must be 8GB");
  assert.ok(snapA.includes("128GB"), "State A: Storage must be 128GB");
  assert.ok(snapA.includes("Tabiiy titan"), "State A: Color must be Natural Titanium");
  assert.ok(snapA.includes("IP15P-NAT-128"), "State A: SKU must be IP15P-NAT-128");
  assert.ok(stickyA.includes("128GB"), "State A Sticky: Storage must be 128GB");
  assert.ok(stickyA.includes("Tabiiy titan"), "State A Sticky: Color must be Natural Titanium");
  assert.ok(stickyA.includes("14 850 000 so&#x27;m") || stickyA.includes("14 850 000 so'm"), "State A Sticky: Price must be 14,850,000");

  // State B: Switched to Variant 2 (256GB, Black Titanium, Fallback 8GB RAM, Out of Stock)
  const snapB = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantIPhone256NoRam,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 0,
      totalStockCount: 0,
    })
  );
  const stickyB = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: variantIPhone256NoRam,
      colorName: "Qora titan",
      totalStock: 0,
      inStockBranchSummary: undefined,
      isAddedToCart: false,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );

  assert.ok(snapB.includes("8GB"), "State B: Fallback RAM remains 8GB");
  assert.ok(snapB.includes("256GB"), "State B: Storage switches to 256GB");
  assert.ok(snapB.includes("Qora titan"), "State B: Color switches to Black Titanium");
  assert.ok(snapB.includes("IP15P-BLK-256"), "State B: SKU switches to IP15P-BLK-256");
  assert.ok(snapB.includes(uzMessages.product.outOfStock), "State B: Stock status switches to Out of Stock");
  assert.ok(stickyB.includes("256GB"), "State B Sticky: Storage switches to 256GB");
  assert.ok(stickyB.includes("Qora titan"), "State B Sticky: Color switches to Black Titanium");
  assert.ok(stickyB.includes("13 900 000 so&#x27;m") || stickyB.includes("13 900 000 so'm"), "State B Sticky: Price switches to 13,900,000");
  assert.ok(stickyB.includes("disabled"), "State B Sticky: Buttons become disabled");

  // State C: Switched to Variant 3 (1TB, Blue Titanium, 8 GB RAM, In Stock, Old Price 20,000,000)
  const snapC = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: variantIPhone1TB,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 2,
      totalStockCount: 4,
    })
  );
  const stickyC = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: variantIPhone1TB,
      colorName: "Moviy titan",
      totalStock: 4,
      inStockBranchSummary: "2 ta filialda (4 dona)",
      isAddedToCart: false,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );

  assert.ok(snapC.includes("8 GB"), "State C: RAM updates to 8 GB");
  assert.ok(snapC.includes("1TB"), "State C: Storage updates to 1TB");
  assert.ok(snapC.includes("Moviy titan"), "State C: Color updates to Blue Titanium");
  assert.ok(snapC.includes("IP15P-BLU-1TB"), "State C: SKU updates to IP15P-BLU-1TB");
  assert.ok(stickyC.includes("1TB"), "State C Sticky: Storage updates to 1TB");
  assert.ok(stickyC.includes("Moviy titan"), "State C Sticky: Color updates to Blue Titanium");
  assert.ok(stickyC.includes("18 900 000 so&#x27;m") || stickyC.includes("18 900 000 so'm"), "State C Sticky: Price updates to 18,900,000");
  assert.ok(!stickyC.includes("20 000 000"), "State C Sticky: Old Price is omitted to prevent overflow");

  // Full integration check on ProductDetailsClient
  const clientHtml = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: multiVariantProduct,
      branches: testBranches,
    })
  );
  assert.ok(clientHtml.includes("IP15P-NAT-128"), "ProductDetailsClient initializes with default variant (Variant 1)");
  assert.ok(clientHtml.includes(uzMessages.product.ram), "ProductDetailsClient specs table contains dedicated RAM row");
  assert.ok(clientHtml.includes("8GB"), "ProductDetailsClient specs table contains RAM value");

  console.log("    [PASS] Challenge 2: Variant reactive switching verified across RAM, Storage, Color, SKU, and Stock.");
}

// ============================================================================
// TEST 3: EXPLICIT BRANCH STOCK RENDERING ("{branch}: {count} dona mavjud" vs "{branch}: mavjud emas")
// ============================================================================
function testExplicitBranchStockRendering(): void {
  console.log("--> Challenge 3: Explicit Branch Stock Indicators Audit");

  // 3.1 Uzbek Locale
  const htmlUz = renderWithIntl(
    React.createElement(BranchStockWidget, {
      branches: testBranches,
      inventory: variantIPhone128.inventory,
    })
  );

  // Branch 1: Malika has 5 items
  assert.ok(
    htmlUz.includes("Malika Savdo Markazi: 5 dona mavjud"),
    "Explicit in-stock indicator must match '{branch}: {count} dona mavjud'"
  );

  // Branch 2: Chilonzor has 0 items
  assert.ok(
    htmlUz.includes("Chilonzor filiali: mavjud emas"),
    "Explicit out-of-stock indicator must match '{branch}: mavjud emas'"
  );

  // Branch 3: Samarqand has 2 items
  assert.ok(
    htmlUz.includes("Samarqand filiali: 2 dona mavjud"),
    "Explicit in-stock indicator must show Samarqand with 2 items"
  );

  // Branch 4: Farg'ona has NO record in inventory -> defaults to 0
  assert.ok(
    htmlUz.includes("Farg&#x27;ona filiali: mavjud emas") ||
      htmlUz.includes("Farg'ona filiali: mavjud emas"),
    "Branch with missing inventory record must render '{branch}: mavjud emas'"
  );

  // Header badge: 2 branches available out of 4 total
  assert.ok(
    htmlUz.includes("2 / 4"),
    "Header badge must show count of available branches (2 / 4)"
  );

  // Phone sanitization: tel link must strip non-digit characters except leading plus
  assert.ok(
    htmlUz.includes('href="tel:+998712001122"'),
    "Phone link for Malika '+998 (71) 200-11-22' must be sanitized to tel:+998712001122"
  );
  assert.ok(
    htmlUz.includes('href="tel:+998662338899"'),
    "Phone link for Samarqand '+998 (66) 233-88-99' must be sanitized to tel:+998662338899"
  );

  // 3.2 Russian Locale
  const htmlRu = renderWithIntl(
    React.createElement(BranchStockWidget, {
      branches: testBranches,
      inventory: variantIPhone128.inventory,
    }),
    "ru",
    ruMessages
  );
  assert.ok(
    htmlRu.includes("Malika Savdo Markazi: в наличии 5 шт."),
    "Russian explicit in-stock must render '{branch}: в наличии {count} шт.'"
  );
  assert.ok(
    htmlRu.includes("Chilonzor filiali: нет в наличии"),
    "Russian explicit out-of-stock must render '{branch}: нет в наличии'"
  );

  // 3.3 English Locale
  const htmlEn = renderWithIntl(
    React.createElement(BranchStockWidget, {
      branches: testBranches,
      inventory: variantIPhone128.inventory,
    }),
    "en",
    enMessages
  );
  assert.ok(
    htmlEn.includes("Malika Savdo Markazi: 5 pcs in stock"),
    "English explicit in-stock must render '{branch}: {count} pcs in stock'"
  );
  assert.ok(
    htmlEn.includes("Chilonzor filiali: out of stock"),
    "English explicit out-of-stock must render '{branch}: out of stock'"
  );

  // 3.4 Out of stock across all branches
  const htmlAllOutOfStock = renderWithIntl(
    React.createElement(BranchStockWidget, {
      branches: testBranches,
      inventory: variantIPhone256NoRam.inventory,
    })
  );
  assert.ok(
    htmlAllOutOfStock.includes("Malika Savdo Markazi: mavjud emas"),
    "When all branches 0, Malika shows mavjud emas"
  );
  assert.ok(
    htmlAllOutOfStock.includes("Chilonzor filiali: mavjud emas"),
    "When all branches 0, Chilonzor shows mavjud emas"
  );
  assert.ok(
    htmlAllOutOfStock.includes("Samarqand filiali: mavjud emas"),
    "When all branches 0, Samarqand shows mavjud emas"
  );
  // Header badge when all 0
  assert.ok(
    htmlAllOutOfStock.includes(uzMessages.product.outOfStock),
    "Header badge shows 'Mavjud emas' when 0 branches in stock"
  );

  console.log("    [PASS] Challenge 3: Explicit branch stock rendering verified for positive stock, zero stock, missing inventory, and phone sanitization.");
}

// ============================================================================
// TEST 4: MOBILE STICKY BUY BAR TOUCH TARGETS, PRICE FORMATTING & DISABLED STATES
// ============================================================================
function testMobileStickyBuyBarHarness(): void {
  console.log("--> Challenge 4: MobileStickyBuyBar Touch Targets (44px), Price & State Audit");

  // 4.1 In stock state with old price
  const htmlInStock = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: variantIPhone128,
      colorName: "Tabiiy titan",
      totalStock: 7,
      inStockBranchSummary: "2 ta filialda (7 dona)",
      isAddedToCart: false,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );

  // Viewport & Safe-area assertions
  assert.ok(
    htmlInStock.includes("sm:hidden fixed bottom-0 left-0 right-0 z-40"),
    "MobileStickyBuyBar must be hidden on sm+ (desktop) and fixed at bottom-0 z-40 on mobile"
  );
  assert.ok(
    htmlInStock.includes("pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"),
    "MobileStickyBuyBar must have safe-area-inset-bottom calculation"
  );

  // Touch Target Size Verification:
  // 1-Click Buy button: h-11 w-11 (11 * 4px = 44px height and 44px width)
  assert.ok(
    htmlInStock.includes("h-11 w-11"),
    "1-Click button must have h-11 w-11 meeting Apple HIG & WCAG 2.5.5 minimum 44px touch target"
  );
  // Add to Cart button: h-11 min-w-[124px] (44px height, >= 124px width)
  assert.ok(
    htmlInStock.includes("h-11 min-w-[124px]"),
    "Add to Cart button must have h-11 min-w-[124px] meeting 44px touch target"
  );

  // Icons check: Lucide Zap for 1-Click, Lucide ShoppingBag for Add to Cart
  assert.ok(htmlInStock.includes("lucide-zap"), "1-Click button must use Lucide Zap icon");
  assert.ok(htmlInStock.includes("lucide-shopping-bag"), "Add to Cart button must use Lucide ShoppingBag icon");

  // Price formatting check:
  // variantIPhone128: price 14,850,000, oldPrice 15,500,000
  assert.ok(
    htmlInStock.includes("14 850 000 so&#x27;m") || htmlInStock.includes("14 850 000 so'm"),
    "Price must be formatted via formatCurrency as '14 850 000 so\\'m'"
  );
  assert.ok(
    !htmlInStock.includes("line-through"),
    "Old price must NOT be displayed with line-through in sticky bar to prevent overflow"
  );

  // Live branch availability indicator check
  assert.ok(
    htmlInStock.includes("animate-pulse"),
    "In stock state must render green pulsing dot"
  );
  assert.ok(
    htmlInStock.includes("2 ta filialda (7 dona)"),
    "In stock state must render branch summary"
  );

  // 4.2 Out of stock state (totalStock = 0)
  const htmlOutOfStock = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: variantIPhone256NoRam,
      colorName: "Qora titan",
      totalStock: 0,
      isAddedToCart: false,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );

  // Disabled states
  assert.ok(
    htmlOutOfStock.includes("disabled"),
    "Buttons must have disabled attribute when totalStock is 0"
  );
  assert.ok(
    htmlOutOfStock.includes(uzMessages.product.outOfStock),
    "Out of stock state must display 'Mavjud emas'"
  );
  assert.ok(
    htmlOutOfStock.includes("bg-destructive"),
    "Out of stock state must render destructive red dot"
  );
  // Ensure old price is NOT rendered when oldPrice is null
  assert.ok(
    !htmlOutOfStock.includes("line-through"),
    "Old price line-through must NOT be rendered when oldPrice is null"
  );

  // 4.3 Added to cart feedback state
  const htmlAddedToCart = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: variantIPhone128,
      colorName: "Tabiiy titan",
      totalStock: 7,
      inStockBranchSummary: "2 ta filialda (7 dona)",
      isAddedToCart: true,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );
  assert.ok(
    htmlAddedToCart.includes("bg-emerald-600"),
    "Add to Cart button must turn emerald (bg-emerald-600) when isAddedToCart is true"
  );
  assert.ok(
    htmlAddedToCart.includes("lucide-check"),
    "Add to Cart button must switch to Lucide Check icon when added to cart"
  );
  assert.ok(
    htmlAddedToCart.includes(uzMessages.product.addedToCart) ||
      htmlAddedToCart.includes("Savatchaga qo&#x27;shildi") ||
      htmlAddedToCart.includes("Savatchaga qo'shildi"),
    "Add to Cart button must display 'Savatchaga qo\\'shildi'"
  );

  console.log("    [PASS] Challenge 4: MobileStickyBuyBar touch targets, price formatting, and disabled states verified.");
}

// ============================================================================
// TEST 5: ZERO EMOJI AND ARCHITECTURAL STANDARDS AUDIT
// ============================================================================
function testZeroEmojiAudit(): void {
  console.log("--> Challenge 5: Strict Zero Unicode Emoji Audit");

  const componentFiles = [
    "components/store/snapshot-specs-view.tsx",
    "components/store/mobile-sticky-buy-bar.tsx",
    "components/store/branch-stock-widget.tsx",
    "components/store/product-details-client.tsx",
    "lib/utils/specs.ts",
  ];

  for (const relPath of componentFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    assert.ok(fs.existsSync(fullPath), `Target file must exist: ${relPath}`);
    const source = fs.readFileSync(fullPath, "utf-8");
    assert.equal(
      EMOJI_REGEX.test(source),
      false,
      `Zero Unicode emoji rule violated in source file: ${relPath}`
    );
  }

  // Audit dictionary messages for zero emojis in keys/values
  const dicts = [
    { name: "uz", data: uzMessages },
    { name: "ru", data: ruMessages },
    { name: "en", data: enMessages },
  ];

  for (const dict of dicts) {
    const jsonStr = JSON.stringify(dict.data);
    assert.equal(
      EMOJI_REGEX.test(jsonStr),
      false,
      `Zero Unicode emoji rule violated in messages/${dict.name}.json`
    );
  }

  console.log("    [PASS] Challenge 5: Zero Unicode emojis verified across all M3 components, utils, and dictionaries.");
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
function runAllAdversarialChallenges(): void {
  console.log("===============================================================");
  console.log("AloShop M3 Adversarial Empirical Challenge Suite");
  console.log("Rigorous stress test for Snapshot View, Branch Stock & Mobile Bar");
  console.log("===============================================================\n");

  testSnapshotSpecsView6Tiles();
  testVariantReactiveSwitching();
  testExplicitBranchStockRendering();
  testMobileStickyBuyBarHarness();
  testZeroEmojiAudit();

  console.log("\n===============================================================");
  console.log("ALL 5 M3 ADVERSARIAL CHALLENGES PASSED EMPIRICALLY!");
  console.log("===============================================================");
}

runAllAdversarialChallenges();
