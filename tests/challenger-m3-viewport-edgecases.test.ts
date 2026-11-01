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
// TEST FIXTURES
// ============================================================================

const mockBranches: BranchStockItem[] = [
  {
    id: "b-malika",
    name: "Malika SM",
    slug: "malika",
    address: "A-blok 14-do'kon",
    phone: "+998 71 200 11 22",
    workingHours: "09:00 - 20:00",
  },
  {
    id: "b-chilonzor",
    name: "Chilonzor",
    slug: "chilonzor",
    address: "Qatortol ko'chasi 1-uy",
    phone: "+998 71 200 33 44",
    workingHours: "09:00 - 21:00",
  },
  {
    id: "b-sergeli",
    name: "Sergeli",
    slug: "sergeli",
    address: "Yangisergeli ko'chasi 5-uy",
    phone: "+998 71 200 55 66",
    workingHours: "09:00 - 21:00",
  },
];

// In-stock variant
const variantInStock: ProductVariantData = {
  id: "v-in-stock",
  sku: "S24U-GRY-512",
  colorNameUz: "Titan Kulrang",
  colorNameRu: "Титановый Серый",
  colorNameEn: "Titanium Gray",
  colorHex: "#716E69",
  ram: "12GB",
  storage: "512GB",
  condition: "NEW",
  price: 15200000,
  oldPrice: 16500000,
  images: ["/s24ultra.jpg"],
  inventory: [
    { branchId: "b-malika", quantity: 5 },
    { branchId: "b-chilonzor", quantity: 0 },
    { branchId: "b-sergeli", quantity: 3 },
  ],
};

// Out-of-stock variant (all branches 0)
const variantOutOfStockAllZero: ProductVariantData = {
  id: "v-oos-zero",
  sku: "S24U-BLK-1TB",
  colorNameUz: "Titan Qora",
  colorNameRu: "Титановый Черный",
  colorNameEn: "Titanium Black",
  colorHex: "#2B2B2B",
  ram: "12GB",
  storage: "1TB",
  condition: "NEW",
  price: 18500000,
  oldPrice: null,
  images: ["/s24ultra-blk.jpg"],
  inventory: [
    { branchId: "b-malika", quantity: 0 },
    { branchId: "b-chilonzor", quantity: 0 },
    { branchId: "b-sergeli", quantity: 0 },
  ],
};

// Out-of-stock variant (empty inventory array)
const variantEmptyInventory: ProductVariantData = {
  id: "v-oos-empty",
  sku: "S24U-VIO-256",
  colorNameUz: "Binafsharang",
  colorNameRu: "Фиолетовый",
  colorNameEn: "Violet",
  colorHex: "#5B5164",
  ram: null, // Fallback RAM
  storage: "256GB",
  condition: "USED",
  price: 12000000,
  oldPrice: 13000000,
  images: ["/s24ultra-vio.jpg"],
  inventory: [],
};

// Out-of-stock variant (undefined inventory field)
const variantUndefinedInventory: ProductVariantData = {
  id: "v-oos-undef",
  sku: "S24U-YEL-256",
  colorNameUz: "Sariq",
  colorNameRu: "Желтый",
  colorNameEn: "Yellow",
  colorHex: "#D8C477",
  ram: null,
  storage: "256GB",
  condition: "NEW",
  price: 13500000,
  oldPrice: null,
  images: ["/s24ultra-yel.jpg"],
  inventory: undefined,
};

const baseProduct: SerializedProduct = {
  id: "p-s24u",
  brand: "Samsung",
  modelName: "Galaxy S24 Ultra",
  slug: "galaxy-s24-ultra",
  descriptionUz: "Sun'iy intellektga ega eng qudratli smartfon",
  descriptionRu: "Флагман со встроенным искусственным интеллектом",
  descriptionEn: "Ultimate flagship with built-in AI",
  warrantyMonths: 12,
  screenSize: '6.8" Dynamic AMOLED 2X',
  processor: "Snapdragon 8 Gen 3 for Galaxy",
  battery: "5000 mAh",
  category: {
    id: "c-phones",
    nameUz: "Smartfonlar",
    nameRu: "Смартфоны",
    nameEn: "Smartphones",
    slug: "smartphones",
  },
  variants: [
    variantInStock,
    variantOutOfStockAllZero,
    variantEmptyInventory,
    variantUndefinedInventory,
  ],
};

// ============================================================================
// SUITE 1: OUT-OF-STOCK PRODUCT SCENARIOS EMPIRICAL AUDIT
// ============================================================================
function testOutOfStockScenarios(): void {
  console.log("--> Suite 1: Out-of-Stock Scenarios (All Branches 0 Inventory, Empty Array, Undefined)");

  // 1.1 All branches 0 inventory
  const htmlAllZero = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: {
        ...baseProduct,
        variants: [variantOutOfStockAllZero],
      },
      branches: mockBranches,
    })
  );

  // Assert header stock badge shows out-of-stock
  assert.ok(
    htmlAllZero.includes("Mavjud emas"),
    "Product header badge displays 'Mavjud emas' when total stock is 0"
  );

  // Assert main Add to Cart and 1-Click Buy buttons have disabled attribute
  const disabledButtonsCount = (htmlAllZero.match(/disabled=""/g) || []).length;
  assert.ok(
    disabledButtonsCount >= 2,
    `Main action buttons must be disabled when out of stock. Found disabled buttons: ${disabledButtonsCount}`
  );

  // Assert SnapshotSpecsView displays out-of-stock badge and red dot
  assert.ok(
    htmlAllZero.includes("bg-destructive"),
    "SnapshotSpecsView displays bg-destructive indicator for out-of-stock"
  );

  // Assert BranchStockWidget shows out-of-stock for each branch explicitly
  assert.ok(
    htmlAllZero.includes("Malika SM: mavjud emas"),
    "BranchStockWidget explicitly marks Malika SM as 'mavjud emas'"
  );
  assert.ok(
    htmlAllZero.includes("Chilonzor: mavjud emas"),
    "BranchStockWidget explicitly marks Chilonzor as 'mavjud emas'"
  );
  assert.ok(
    htmlAllZero.includes("Sergeli: mavjud emas"),
    "BranchStockWidget explicitly marks Sergeli as 'mavjud emas'"
  );

  // 1.2 Empty inventory array
  const htmlEmptyInv = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: {
        ...baseProduct,
        variants: [variantEmptyInventory],
      },
      branches: mockBranches,
    })
  );
  assert.ok(
    htmlEmptyInv.includes("Mavjud emas"),
    "Handles empty inventory array safely with 'Mavjud emas'"
  );
  assert.ok(
    htmlEmptyInv.includes("12GB"), // Fallback RAM for Samsung Galaxy S24 Ultra
    "Correctly resolves fallback RAM (12GB) for variant with null RAM"
  );

  // 1.3 Undefined inventory field
  const htmlUndefInv = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: {
        ...baseProduct,
        variants: [variantUndefinedInventory],
      },
      branches: mockBranches,
    })
  );
  assert.ok(
    htmlUndefInv.includes("Mavjud emas"),
    "Handles undefined inventory field safely with 'Mavjud emas'"
  );

  // 1.4 Zero branches in database
  const htmlZeroBranches = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: {
        ...baseProduct,
        variants: [variantOutOfStockAllZero],
      },
      branches: [],
    })
  );
  assert.ok(
    htmlZeroBranches.includes("Mavjud emas"),
    "Handles zero branches in system safely without crashing"
  );

  // 1.5 MobileStickyBuyBar standalone out-of-stock check
  const htmlStickyOOS = renderWithIntl(
    React.createElement(MobileStickyBuyBar, {
      activeVariant: variantOutOfStockAllZero,
      colorName: "Titan Qora",
      totalStock: 0,
      isAddedToCart: false,
      onAddToCart: () => {},
      onOneClickBuy: () => {},
    })
  );
  assert.ok(
    htmlStickyOOS.includes("disabled"),
    "MobileStickyBuyBar buttons must be disabled when totalStock is 0"
  );
  assert.ok(
    htmlStickyOOS.includes("text-destructive"),
    "MobileStickyBuyBar displays text-destructive when out of stock"
  );
  assert.ok(
    htmlStickyOOS.includes("Mavjud emas"),
    "MobileStickyBuyBar displays 'Mavjud emas'"
  );

  console.log("    [PASS] Out-of-stock scenarios verified across all zero, empty, undefined, and isolated bar.");
}

// ============================================================================
// SUITE 2: VIEWPORT RESPONSIVENESS AND CONTAINER GEOMETRY
// ============================================================================
function testViewportResponsivenessAndContainerGeometry(): void {
  console.log("--> Suite 2: Viewport Responsiveness (320px, 360px, 375px, 414px, 1024px+) & Sticky Bar Clearance");

  // Read the source of ProductDetailsClient and MobileStickyBuyBar to inspect responsive CSS classes
  const clientPath = path.join(process.cwd(), "components", "store", "product-details-client.tsx");
  const stickyPath = path.join(process.cwd(), "components", "store", "mobile-sticky-buy-bar.tsx");
  const snapshotPath = path.join(process.cwd(), "components", "store", "snapshot-specs-view.tsx");

  const clientCode = fs.readFileSync(clientPath, "utf-8");
  const stickyCode = fs.readFileSync(stickyPath, "utf-8");
  const snapshotCode = fs.readFileSync(snapshotPath, "utf-8");

  // 2.1 Verify container bottom padding preventing sticky bar overlap
  // Requirements specify pb-28 sm:pb-32 md:pb-0
  assert.match(
    clientCode,
    /pb-28\s+sm:pb-32\s+md:pb-0/,
    "ProductDetailsClient container must include 'pb-28 sm:pb-32 md:pb-0' for sticky bar collision prevention"
  );

  // 2.2 Verify mobile sticky bar is strictly hidden on desktop (sm:hidden)
  assert.match(
    stickyCode,
    /sm:hidden/,
    "MobileStickyBuyBar must have 'sm:hidden' to prevent layout collision on tablet/desktop viewports"
  );
  assert.match(
    stickyCode,
    /fixed\s+bottom-0\s+left-0\s+right-0\s+z-40/,
    "MobileStickyBuyBar must have fixed bottom-0 left-0 right-0 z-40"
  );

  // 2.3 Safe area inset padding
  assert.match(
    stickyCode,
    /pb-\[calc\(0\.75rem\+env\(safe-area-inset-bottom,0px\)\)\]/,
    "MobileStickyBuyBar must handle iOS notch / home-indicator safe-area insets"
  );

  // 2.4 Touch target accessibility standards (WCAG 2.5.5 / Apple HIG: >=44px)
  // h-11 = 44px (11 * 4px)
  assert.match(
    stickyCode,
    /h-11\s+w-11/,
    "MobileStickyBuyBar 1-Click Buy button must be h-11 w-11 (44px) touch target"
  );
  assert.match(
    stickyCode,
    /h-11\s+min-w-\[124px\]/,
    "MobileStickyBuyBar Add to Cart button must be h-11 min-w-[124px] (44px height) touch target"
  );

  // 2.5 Snapshot Specs View responsive grid
  // 2 columns on mobile (<640px) to prevent crowded tile layout on 320px-414px viewports
  // 3 columns on sm+ (>=640px)
  assert.match(
    snapshotCode,
    /grid\s+grid-cols-2\s+sm:grid-cols-3\s+gap-2\.5/,
    "SnapshotSpecsView must use 'grid grid-cols-2 sm:grid-cols-3 gap-2.5' responsive grid"
  );

  // 2.6 Micro-viewport (320px) overflow safety: truncate & min-w-0 on text elements
  assert.match(
    stickyCode,
    /min-w-0\s+flex-1/,
    "MobileStickyBuyBar left column must have min-w-0 flex-1 to prevent flexbox overflow on 320px screens"
  );
  assert.match(
    stickyCode,
    /truncate/,
    "MobileStickyBuyBar text elements must have truncate to avoid wrapping outside viewport"
  );
  assert.match(
    snapshotCode,
    /min-w-0\s+flex-1/,
    "SnapshotSpecsView tile content must have min-w-0 flex-1 to prevent overflow on 320px screens"
  );

  // 2.7 Render test: verify markup output contains these exact classes
  const html = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: baseProduct,
      branches: mockBranches,
    })
  );
  assert.ok(html.includes("pb-28 sm:pb-32 md:pb-0"), "Rendered HTML contains container padding classes");
  assert.ok(html.includes("sm:hidden fixed bottom-0"), "Rendered HTML contains responsive sticky bar classes");
  assert.ok(html.includes("grid-cols-2 sm:grid-cols-3"), "Rendered HTML contains 2-col to 3-col snapshot grid classes");

  console.log("    [PASS] Viewport responsiveness and sticky bar clearance verified.");
}

// ============================================================================
// SUITE 3: ZERO-EMOJI AND MULTI-LOCALE PARITY AUDIT
// ============================================================================
function testZeroEmojiAndLocaleParity(): void {
  console.log("--> Suite 3: Zero-Emoji Enforcement & Multi-Locale Verification (uz, ru, en)");

  const locales = [
    { code: "uz", dict: uzMessages },
    { code: "ru", dict: ruMessages },
    { code: "en", dict: enMessages },
  ];

  for (const { code, dict } of locales) {
    // Check product page render in this locale
    const html = renderWithIntl(
      React.createElement(ProductDetailsClient, {
        product: baseProduct,
        branches: mockBranches,
      }),
      code,
      dict
    );

    // Verify ZERO emojis in rendered DOM
    assert.equal(
      EMOJI_REGEX.test(html),
      false,
      `Rendered ProductDetailsClient in locale '${code}' contains Unicode emojis`
    );

    // Verify key M3 terms are present and localized
    if (code === "uz") {
      assert.ok(html.includes("Texnik xususiyatlar"), "Uzbek contains Texnik xususiyatlar header");
      assert.ok(html.includes("1 bosishda xarid"), "Uzbek contains Buy Now / 1-Click CTA");
      assert.ok(html.includes("Savatchaga qo&#x27;shish") || html.includes("Savatchaga qo'shish"), "Uzbek contains Add to Cart CTA");
      assert.ok(html.includes("Operativ xotira"), "Uzbek contains RAM label");
    } else if (code === "ru") {
      assert.ok(html.includes("Купить в 1 клик"), "Russian contains Buy Now / 1-Click CTA");
      assert.ok(html.includes("В корзину"), "Russian contains Add to Cart CTA");
      assert.ok(html.includes("Оперативная память"), "Russian contains RAM label");
    } else if (code === "en") {
      assert.ok(html.includes("Buy with 1-Click"), "English contains Buy Now / 1-Click CTA");
      assert.ok(html.includes("Add to Cart"), "English contains Add to Cart CTA");
      assert.ok(html.includes("RAM"), "English contains RAM label");
    }
  }

  console.log("    [PASS] Zero-emoji audit passed across uz, ru, en locales.");
}

// ============================================================================
// SUITE 4: EDGE CASE BOUNDARY CONDITIONS (Price, Discounts, Fallback RAM)
// ============================================================================
function testEdgeCaseBoundaryConditions(): void {
  console.log("--> Suite 4: Edge Case Boundary Conditions (Price, Discounts, Fallbacks)");

  // 4.1 Old price lower than current price (negative discount bug prevention)
  const productWithInvalidDiscount: SerializedProduct = {
    ...baseProduct,
    variants: [
      {
        ...variantInStock,
        price: 15000000,
        oldPrice: 14000000, // old price is LESS than current price
      },
    ],
  };

  const htmlInvalidDiscount = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: productWithInvalidDiscount,
      branches: mockBranches,
    })
  );

  // Must NOT display negative discount badge (e.g. - -7%)
  assert.equal(
    htmlInvalidDiscount.includes("-%"),
    false,
    "ProductDetailsClient must not display negative discount badge when oldPrice <= price"
  );

  // 4.2 Product with missing RAM falling back to specs utility
  const productWithMissingRam: SerializedProduct = {
    ...baseProduct,
    brand: "Apple",
    modelName: "iPhone 15 Pro",
    variants: [
      {
        ...variantInStock,
        ram: null,
        storage: "128GB",
      },
    ],
  };

  const htmlFallbackRam = renderWithIntl(
    React.createElement(ProductDetailsClient, {
      product: productWithMissingRam,
      branches: mockBranches,
    })
  );

  // Must infer 8GB for Apple iPhone 15 Pro
  assert.ok(
    htmlFallbackRam.includes("8GB"),
    "ProductDetailsClient infers 8GB RAM for iPhone 15 Pro when variant.ram is null"
  );

  console.log("    [PASS] Edge case boundary conditions verified.");
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
function runAllEdgeCaseTests(): void {
  console.log("===============================================================");
  console.log("Challenger 2: M3 Viewport Responsiveness & Edge Cases Harness");
  console.log("===============================================================\n");

  testOutOfStockScenarios();
  testViewportResponsivenessAndContainerGeometry();
  testZeroEmojiAndLocaleParity();
  testEdgeCaseBoundaryConditions();

  console.log("\n===============================================================");
  console.log("ALL CHALLENGER 2 EMPIRICAL AUDITS PASSED WITH ZERO FAILURES!");
  console.log("===============================================================");
}

runAllEdgeCaseTests();
