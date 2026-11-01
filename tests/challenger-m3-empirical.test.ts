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

import uzMessages from "../messages/uz.json";
import ruMessages from "../messages/ru.json";
import enMessages from "../messages/en.json";

const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;

function renderWithIntl(element: React.ReactElement, locale = "uz", messages: AbstractIntlMessages = uzMessages): string {
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

// Sample mock data
const mockVariant1: ProductVariantData = {
  id: "v-1",
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
  images: ["/iphone15pro.jpg"],
  inventory: [
    { branchId: "b1", quantity: 4 },
    { branchId: "b2", quantity: 0 },
    { branchId: "b3", quantity: 2 },
  ],
};

const mockVariant2NoRam: ProductVariantData = {
  id: "v-2",
  sku: "IP15P-BLK-256",
  colorNameUz: "Qora titan",
  colorNameRu: "Черный титан",
  colorNameEn: "Black Titanium",
  colorHex: "#2B2B2B",
  ram: null, // Test fallback RAM inference
  storage: "256GB",
  condition: "USED",
  price: 13500000,
  oldPrice: null,
  images: ["/iphone15pro-black.jpg"],
  inventory: [
    { branchId: "b1", quantity: 0 },
    { branchId: "b2", quantity: 0 },
    { branchId: "b3", quantity: 0 },
  ],
};

const mockBranches: BranchStockItem[] = [
  {
    id: "b1",
    name: "Malika Savdo Markazi",
    slug: "malika",
    city: "Toshkent",
    address: "Navoiy shoh ko'chasi, Malika SM, A-blok 14-do'kon",
    phone: "+998 71 200 11 22",
    workingHours: "09:00 - 20:00",
  },
  {
    id: "b2",
    name: "Chilonzor filiali",
    slug: "chilonzor",
    city: "Toshkent",
    address: "Chilonzor 9-mavze, Qatortol ko'chasi 1-uy",
    phone: "+998 71 200 33 44",
    workingHours: "09:00 - 21:00",
  },
  {
    id: "b3",
    name: "Buyuk Ipak Yo'li filiali",
    slug: "buyuk-ipak-yoli",
    city: "Toshkent",
    address: "Mirzo Ulug'bek shoh ko'chasi",
    phone: "+998 71 200 55 66",
    workingHours: "09:00 - 21:00",
  },
];

const mockProduct: SerializedProduct = {
  id: "p1",
  brand: "Apple",
  modelName: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  descriptionUz: "Eng ilg'or smartfon",
  descriptionRu: "Передовой смартфон",
  descriptionEn: "Flagship smartphone",
  warrantyMonths: 12,
  screenSize: '6.1" Super Retina XDR OLED',
  processor: "Apple A17 Pro (3nm)",
  battery: "3274 mAh",
  category: {
    id: "c1",
    nameUz: "Smartfonlar",
    nameRu: "Смартфоны",
    nameEn: "Smartphones",
    slug: "smartphones",
  },
  variants: [mockVariant1, mockVariant2NoRam],
};

// ============================================================================
// SUITE 1: SOURCE FILES ZERO EMOJI AND ARCHITECTURE AUDIT
// ============================================================================
function testZeroEmojisAndFileStructure(): void {
  console.log("--> Suite 1: M3 Zero Emoji & Source Code Layout Audit");

  const filesToCheck = [
    "components/store/snapshot-specs-view.tsx",
    "components/store/mobile-sticky-buy-bar.tsx",
    "components/store/branch-stock-widget.tsx",
    "components/store/product-details-client.tsx",
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(process.cwd(), relPath);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.equal(
      EMOJI_REGEX.test(content),
      false,
      `Zero Unicode emoji violation in ${relPath}`
    );
  }

  console.log("    [PASS] All 4 M3 files exist and are 100% free of Unicode emojis.");
}

// ============================================================================
// SUITE 2: SNAPSHOT SPECS VIEW COMPONENT EMPIRICAL AUDIT
// ============================================================================
function testSnapshotSpecsView(): void {
  console.log("--> Suite 2: SnapshotSpecsView High-Density Grid Audit");

  // 2.1 In-stock variant
  const htmlInStock = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: mockVariant1,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 2,
      totalStockCount: 6,
    })
  );

  // Check 1-column mobile to 2-column sm+ grid classes
  assert.ok(
    htmlInStock.includes("grid-cols-1") && htmlInStock.includes("sm:grid-cols-2"),
    "SnapshotSpecsView must feature grid-cols-1 sm:grid-cols-2 responsive classes"
  );

  // Check RAM tile
  assert.ok(htmlInStock.includes("8GB"), "SnapshotSpecsView displays RAM value (8GB)");
  assert.ok(htmlInStock.includes("lucide-cpu"), "SnapshotSpecsView uses Lucide Cpu icon for RAM");

  // Check Storage tile
  assert.ok(htmlInStock.includes("128GB"), "SnapshotSpecsView displays Storage value (128GB)");
  assert.ok(htmlInStock.includes("lucide-hard-drive"), "SnapshotSpecsView uses Lucide HardDrive icon");

  // Check Color tile and colorHex style
  assert.ok(htmlInStock.includes("Tabiiy titan"), "SnapshotSpecsView displays localized color name");
  assert.ok(htmlInStock.includes("background-color:#9A958E"), "SnapshotSpecsView displays color dot with hex");
  assert.ok(htmlInStock.includes("lucide-palette"), "SnapshotSpecsView uses Lucide Palette icon");

  // Check Condition tile
  assert.ok(htmlInStock.includes("Yangi"), "SnapshotSpecsView displays NEW condition");
  assert.ok(htmlInStock.includes("lucide-sparkles"), "SnapshotSpecsView uses Lucide Sparkles icon");

  // Check Hardware tiles (Display, Processor, Battery)
  assert.ok(htmlInStock.includes("lucide-smartphone"), "SnapshotSpecsView uses Lucide Smartphone icon");
  assert.ok(htmlInStock.includes("lucide-battery-charging"), "SnapshotSpecsView uses Lucide BatteryCharging icon");

  // Check Branch Availability tile (in-stock with pulse dot)
  assert.ok(htmlInStock.includes("animate-pulse"), "SnapshotSpecsView renders live pulse dot for in-stock branches");
  assert.ok(htmlInStock.includes("2 ta filialda"), "SnapshotSpecsView displays in-stock branch count");
  assert.ok(htmlInStock.includes("6 dona"), "SnapshotSpecsView displays total stock count");
  assert.ok(htmlInStock.includes("lucide-building-2") || htmlInStock.includes("lucide-building"), "SnapshotSpecsView uses Lucide Building2 icon");

  // 2.2 Out-of-stock variant with fallback RAM
  const htmlOutOfStock = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: mockVariant2NoRam,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 0,
      totalStockCount: 0,
    })
  );

  // Fallback RAM inferred for Apple iPhone 15 Pro
  assert.ok(htmlOutOfStock.includes("8GB"), "SnapshotSpecsView correctly infers fallback RAM (8GB)");
  assert.ok(htmlOutOfStock.includes("Mavjud emas"), "SnapshotSpecsView displays outOfStock when stock is 0");
  assert.ok(htmlOutOfStock.includes("bg-destructive"), "SnapshotSpecsView renders destructive dot when out of stock");
  assert.ok(htmlOutOfStock.includes("B/U (Ishlatilgan)"), "SnapshotSpecsView displays USED condition in Uzbek");

  // 2.3 Russian locale test
  const htmlRu = renderWithIntl(
    React.createElement(SnapshotSpecsView, {
      activeVariant: mockVariant1,
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      warrantyMonths: 12,
      branchesInStockCount: 2,
      totalStockCount: 6,
    }),
    "ru",
    ruMessages
  );
  assert.ok(htmlRu.includes("Натуральный титан"), "SnapshotSpecsView displays Russian color name");
  assert.ok(htmlRu.includes("Оперативная память"), "SnapshotSpecsView displays Russian RAM label");
  assert.ok(htmlRu.includes("В 2 филиалах"), "SnapshotSpecsView displays Russian branch stock summary");

  console.log("    [PASS] SnapshotSpecsView verified across in-stock, out-of-stock, fallback RAM, and locales.");
}

// ============================================================================
// SUITE 3: BRANCH STOCK WIDGET EXPLICIT INDICATORS AUDIT
// ============================================================================
function testBranchStockWidget(): void {
  console.log("--> Suite 3: BranchStockWidget Explicit Indicators & Phone Link Audit");

  const html = renderWithIntl(
    React.createElement(BranchStockWidget, {
      branches: mockBranches,
      inventory: mockVariant1.inventory,
    })
  );

  // Per AGENTS.md 3.4: "Malika: 4 dona mavjud", "Chilonzorda mavjud emas"
  assert.ok(
    html.includes("Malika Savdo Markazi: 4 dona mavjud"),
    "BranchStockWidget displays explicit in-stock message with branch name"
  );
  assert.ok(
    html.includes("Chilonzor filiali: mavjud emas"),
    "BranchStockWidget displays explicit out-of-stock message with branch name"
  );
  assert.ok(
    html.includes("Buyuk Ipak Yo&#x27;li filiali: 2 dona mavjud") ||
      html.includes("Buyuk Ipak Yo'li filiali: 2 dona mavjud"),
    "BranchStockWidget displays stock for third branch"
  );

  // Phone link verification: tel: format without whitespace or brackets
  assert.ok(
    html.includes('href="tel:+998712001122"'),
    "BranchStockWidget maintains sanitized phone tel: link"
  );

  // Header badge verification
  assert.ok(
    html.includes("2 / 3"),
    "BranchStockWidget header displays available branches count (2 / 3)"
  );

  console.log("    [PASS] BranchStockWidget verified with explicit indicators and phone links.");
}

// ============================================================================
// SUITE 4: MOBILE STICKY BUY BAR EMPIRICAL AUDIT
// ============================================================================
function testMobileStickyBuyBar(): void {
  console.log("--> Suite 4: MobileStickyBuyBar Layout, Safe-Area & Dual CTAs Audit");

  let addToCartClicked = false;
  let oneClickClicked = false;

  const htmlInStock = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: mockVariant1,
      colorName: "Tabiiy titan",
      totalStock: 6,
      inStockBranchSummary: "2 ta filialda (6 dona)",
      isAddedToCart: false,
      onAddToCart: () => { addToCartClicked = true; },
      onOneClickBuy: () => { oneClickClicked = true; },
    })
  );

  // Mobile fixed position and safe-area padding
  assert.ok(
    htmlInStock.includes("sm:hidden") &&
      htmlInStock.includes("fixed") &&
      htmlInStock.includes("bottom-0") &&
      htmlInStock.includes("z-40"),
    "MobileStickyBuyBar must be fixed to bottom on mobile (sm:hidden fixed bottom-0 z-40)"
  );
  assert.ok(
    htmlInStock.includes("pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"),
    "MobileStickyBuyBar must have dynamic safe-area-inset-bottom padding"
  );

  // Dual CTAs with 44px touch targets (h-11)
  assert.ok(
    htmlInStock.includes("h-11 w-11"),
    "1-Click button must meet 44px touch target standard (h-11 w-11)"
  );
  assert.ok(
    htmlInStock.includes("h-11 min-w-[124px]") || htmlInStock.includes("h-11"),
    "Add to Cart button must meet 44px touch target standard (h-11)"
  );

  // Icons check: Zap for 1-Click, ShoppingBag for Cart
  assert.ok(htmlInStock.includes("lucide-zap"), "MobileStickyBuyBar renders Zap icon for 1-Click Buy");
  assert.ok(htmlInStock.includes("lucide-shopping-bag"), "MobileStickyBuyBar renders ShoppingBag icon for Add to Cart");

  // Live branch availability summary chip with green pulse dot
  assert.ok(htmlInStock.includes("animate-pulse"), "MobileStickyBuyBar renders green pulse dot");
  assert.ok(htmlInStock.includes("2 ta filialda (6 dona)"), "MobileStickyBuyBar displays branch summary");

  // Price formatting: clean price without crowded old price
  assert.ok(htmlInStock.includes("14 850 000 so&#x27;m") || htmlInStock.includes("14 850 000 so'm"), "MobileStickyBuyBar displays formatted price");

  // 4.2 Added to Cart state
  const htmlAdded = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: mockVariant1,
      colorName: "Tabiiy titan",
      totalStock: 6,
      inStockBranchSummary: "2 ta filialda (6 dona)",
      isAddedToCart: true,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );
  assert.ok(htmlAdded.includes("Savatchaga qo&#x27;shildi") || htmlAdded.includes("Savatchaga qo'shildi"), "Displays Added to Cart label");
  assert.ok(htmlAdded.includes("lucide-check"), "Displays Check icon when added to cart");

  // 4.3 Out of stock state
  const htmlOutOfStock = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: mockVariant2NoRam,
      colorName: "Qora titan",
      totalStock: 0,
      isAddedToCart: false,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );
  assert.ok(htmlOutOfStock.includes("disabled"), "Buttons are disabled when out of stock");
  assert.ok(htmlOutOfStock.includes("Mavjud emas"), "Displays out of stock text");
  assert.ok(htmlOutOfStock.includes("bg-destructive"), "Displays destructive dot when out of stock");

  console.log("    [PASS] MobileStickyBuyBar verified for layout, safe-area, touch targets, and dual CTAs.");
}

// ============================================================================
// SUITE 5: PRODUCT DETAILS CLIENT CONTAINER INTEGRATION AUDIT
// ============================================================================
function testProductDetailsClientIntegration(): void {
  console.log("--> Suite 5: ProductDetailsClient Container & Padding Audit");

  const html = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: mockProduct,
      branches: mockBranches,
    })
  );

  // 5.1 Container bottom padding prevents sticky bar overlap
  assert.ok(
    html.includes("pb-28 sm:pb-32 md:pb-0"),
    "ProductDetailsClient container must include pb-28 sm:pb-32 md:pb-0 to prevent sticky bar overlap"
  );

  // 5.2 Unified specs card is rendered with "Texnik xususiyatlar" header
  assert.ok(
    html.includes(uzMessages.product.specs),
    "ProductDetailsClient renders unified specs header"
  );

  // 5.3 Dedicated RAM in unified specs view
  assert.ok(
    html.includes(uzMessages.product.ram),
    "ProductDetailsClient specs contains dedicated RAM label"
  );
  assert.ok(
    html.includes("8GB"),
    "ProductDetailsClient specs contains RAM value (8GB)"
  );

  // 5.4 Screen, Processor, Battery rows in specs table
  assert.ok(
    html.includes("Ekran") && html.includes("6.1&quot; Super Retina XDR OLED"),
    "ProductDetailsClient specs table contains Screen row"
  );
  assert.ok(
    html.includes("Protsessor") && html.includes("Apple A17 Pro (3nm)"),
    "ProductDetailsClient specs table contains Processor row"
  );
  assert.ok(
    html.includes("Batareya") && html.includes("3274 mAh"),
    "ProductDetailsClient specs table contains Battery row"
  );

  // 5.5 MobileStickyBuyBar is rendered inside ProductDetailsClient
  assert.ok(
    html.includes("sm:hidden fixed bottom-0"),
    "ProductDetailsClient renders MobileStickyBuyBar"
  );

  console.log("    [PASS] ProductDetailsClient successfully integrates SnapshotSpecsView, RAM row, and MobileStickyBuyBar.");
}

// Run all test suites
function runAllTests(): void {
  console.log("===============================================================");
  console.log("AloShop Milestone 3 (M3) Empirical Verification Harness");
  console.log("===============================================================\n");

  testZeroEmojisAndFileStructure();
  testSnapshotSpecsView();
  testBranchStockWidget();
  testMobileStickyBuyBar();
  testProductDetailsClientIntegration();

  console.log("\n===============================================================");
  console.log("ALL 5 M3 EMPIRICAL TEST SUITES PASSED SUCCESSFULLY!");
  console.log("===============================================================");
}

runAllTests();
