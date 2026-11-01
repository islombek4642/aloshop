import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";

import { ProductCard, type ProductCardData, type ProductCardVariant } from "../components/store/product-card";
import { inferDefaultRam, formatRam, formatStorage } from "../lib/utils/specs";
import { formatCurrency } from "../lib/utils/format-currency";

import uzMessages from "../messages/uz.json";
import ruMessages from "../messages/ru.json";
import enMessages from "../messages/en.json";

const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;

function renderCard(product: ProductCardData, locale = "uz", messages: any = uzMessages): string {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      {
        locale,
        messages,
        timeZone: "Asia/Tashkent",
        children: React.createElement(ProductCard, { product }),
      }
    )
  );
}

// ============================================================================
// SUITE 1: 2-COLUMN MOBILE VITRINA GRID AUDIT (HOMEPAGE & CATALOG)
// ============================================================================
function testGridCssClasses(): void {
  console.log("--> Suite 1: 2-Column Mobile Vitrina Grid Layout Audit");

  // 1.1 Homepage Grid Check
  const homePath = path.join(process.cwd(), "app", "[locale]", "(store)", "page.tsx");
  assert.ok(fs.existsSync(homePath), "Homepage file must exist");
  const homeContent = fs.readFileSync(homePath, "utf-8");

  // Check zero emojis on homepage
  assert.equal(EMOJI_REGEX.test(homeContent), false, "Homepage must contain zero Unicode emojis");

  // Check 2-column mobile grid on showcase
  const homeGridMatch = homeContent.match(
    /className=["'][^"']*grid\s+grid-cols-2\s+sm:grid-cols-2\s+md:grid-cols-3\s+lg:grid-cols-4\s+gap-2\.5\s+sm:gap-4\s+md:gap-6[^"']*["']/
  );
  assert.ok(
    homeGridMatch,
    "Homepage featured products must use mobile 2-column grid: grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6"
  );

  // 1.2 Catalog Grid Check
  const catalogPath = path.join(process.cwd(), "app", "[locale]", "(store)", "catalog", "page.tsx");
  assert.ok(fs.existsSync(catalogPath), "Catalog file must exist");
  const catalogContent = fs.readFileSync(catalogPath, "utf-8");

  // Check zero emojis on catalog
  assert.equal(EMOJI_REGEX.test(catalogContent), false, "Catalog must contain zero Unicode emojis");

  // Check 2-column mobile grid on catalog
  const catalogGridMatch = catalogContent.match(
    /className=["'][^"']*grid\s+grid-cols-2\s+sm:grid-cols-2\s+lg:grid-cols-3\s+gap-2\.5\s+sm:gap-4\s+md:gap-6[^"']*["']/
  );
  assert.ok(
    catalogGridMatch,
    "Catalog products must use mobile 2-column grid: grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6"
  );

  console.log("    [PASS] Verified 2-column mobile layout grid-cols-2 on both homepage and catalog.");
}

// ============================================================================
// SUITE 2: PRODUCT CARD VARIANT SPECTRUM & MISSING ASSETS RESILIENCE
// ============================================================================
function testCardVariantVariations(): void {
  console.log("--> Suite 2: Product Card Variant Spectrum & Image Resilience");

  // 2.1 Card with EMPTY variants array
  const emptyVariantProduct: ProductCardData = {
    id: "prod-empty",
    brand: "Apple",
    modelName: "iPhone 15 Pro",
    slug: "iphone-15-pro-empty",
    variants: [],
  };
  const htmlEmpty = renderCard(emptyVariantProduct);
  assert.ok(htmlEmpty.includes("0 so&#x27;m") || htmlEmpty.includes("0 so'm"), "Empty variants card renders 0 so'm without crashing");
  assert.ok(htmlEmpty.includes("Mavjud emas"), "Empty variants card renders out of stock");
  assert.ok(htmlEmpty.includes("lucide-smartphone") || htmlEmpty.includes("stroke-[1.25]"), "Empty variants card renders fallback Smartphone icon");
  assert.ok(htmlEmpty.includes("8GB"), "Empty variants card infers RAM (8GB) from model name");

  // 2.2 Card with missing images array (empty array)
  const noImageProduct: ProductCardData = {
    id: "prod-no-image",
    brand: "Samsung",
    modelName: "Galaxy S24 Ultra",
    slug: "galaxy-s24-ultra",
    variants: [
      {
        id: "v-no-img",
        sku: "S24U-NOIMG",
        colorHex: "#2B2B2B",
        ram: "12GB",
        storage: "256GB",
        condition: "NEW",
        price: 15200000,
        images: [],
        inventory: [{ quantity: 3 }],
      },
    ],
  };
  const htmlNoImage = renderCard(noImageProduct);
  assert.ok(!htmlNoImage.includes("<img"), "Card with empty images array must NOT render an img tag");
  assert.ok(htmlNoImage.includes("lucide-smartphone") || htmlNoImage.includes("stroke-[1.25]"), "Card with empty images must render Smartphone fallback icon");
  assert.ok(htmlNoImage.includes("12GB"), "Renders 12GB RAM badge");

  // 2.3 Single Variant Card
  const singleVariantProduct: ProductCardData = {
    id: "prod-single",
    brand: "Xiaomi",
    modelName: "Xiaomi 14",
    slug: "xiaomi-14",
    variants: [
      {
        id: "v-single",
        sku: "MI14-256",
        colorHex: "#000000",
        ram: "12GB",
        storage: "256GB",
        condition: "NEW",
        price: 9500000,
        images: ["/xiaomi14.jpg"],
        inventory: [{ quantity: 5 }],
      },
    ],
  };
  const htmlSingle = renderCard(singleVariantProduct);
  // Single variant has only 1 storage, so storage selector buttons should NOT appear
  assert.ok(!htmlSingle.includes('aria-pressed="true"'), "Single variant product must not render storage selection pills");
  assert.ok(htmlSingle.includes("12GB"), "Renders 12GB RAM");
  assert.ok(htmlSingle.includes("256GB"), "Renders 256GB storage");

  // 2.4 Multi-Variant Card with different storages and colors
  const multiVariantProduct: ProductCardData = {
    id: "prod-multi",
    brand: "Apple",
    modelName: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    variants: [
      {
        id: "v-1",
        sku: "IP15P-128-BLK",
        colorHex: "#1C1C1E",
        ram: "8GB",
        storage: "128GB",
        condition: "NEW",
        price: 14000000,
        images: ["/iphone15pro-black.jpg"],
        inventory: [{ quantity: 2 }],
      },
      {
        id: "v-2",
        sku: "IP15P-256-BLK",
        colorHex: "#1C1C1E",
        ram: "8GB",
        storage: "256GB",
        condition: "NEW",
        price: 15500000,
        images: ["/iphone15pro-black.jpg"],
        inventory: [{ quantity: 3 }],
      },
      {
        id: "v-3",
        sku: "IP15P-512-WHT",
        colorHex: "#F2F2F7",
        ram: "8GB",
        storage: "512GB",
        condition: "NEW",
        price: 17500000,
        images: ["/iphone15pro-white.jpg"],
        inventory: [{ quantity: 1 }],
      },
    ],
  };
  const htmlMulti = renderCard(multiVariantProduct);
  // Multi storages: 128GB, 256GB, 512GB
  assert.ok(htmlMulti.includes("128GB"), "Multi-variant contains 128GB button");
  assert.ok(htmlMulti.includes("256GB"), "Multi-variant contains 256GB button");
  assert.ok(htmlMulti.includes("512GB"), "Multi-variant contains 512GB button");
  // Multi colors: #1C1C1E and #F2F2F7
  assert.ok(htmlMulti.includes("#1c1c1e") || htmlMulti.includes("#1C1C1E"), "Multi-variant contains black color swatch");
  assert.ok(htmlMulti.includes("#f2f2f7") || htmlMulti.includes("#F2F2F7"), "Multi-variant contains white color swatch");

  console.log("    [PASS] Product card successfully tested with 0 variants, missing images, single variant, and multi variants.");
}

// ============================================================================
// SUITE 3: RAM MANDATORY DISPLAY & LUCIDE CPU ICON AUDIT
// ============================================================================
function testRamRenderingAndCpuIcon(): void {
  console.log("--> Suite 3: RAM Rendering and Lucide Cpu Icon Audit");

  const testCases = [
    {
      name: "Explicit RAM (8GB)",
      product: {
        id: "p1",
        brand: "Apple",
        modelName: "iPhone 15 Pro",
        slug: "ip15p",
        variants: [
          {
            id: "v1",
            sku: "SKU1",
            colorHex: "#000",
            ram: "8GB",
            storage: "128GB",
            condition: "NEW",
            price: 14000000,
            images: ["/test.jpg"],
            inventory: [{ quantity: 1 }],
          },
        ],
      },
      expectedRam: "8GB",
    },
    {
      name: "Lowercase RAM (12gb)",
      product: {
        id: "p2",
        brand: "Samsung",
        modelName: "Galaxy S24 Ultra",
        slug: "s24u",
        variants: [
          {
            id: "v2",
            sku: "SKU2",
            colorHex: "#000",
            ram: "12gb",
            storage: "256GB",
            condition: "NEW",
            price: 15000000,
            images: ["/test.jpg"],
            inventory: [{ quantity: 1 }],
          },
        ],
      },
      expectedRam: "12GB",
    },
    {
      name: "Numeric RAM string (6)",
      product: {
        id: "p3",
        brand: "Apple",
        modelName: "iPhone 14",
        slug: "ip14",
        variants: [
          {
            id: "v3",
            sku: "SKU3",
            colorHex: "#000",
            ram: "6",
            storage: "128GB",
            condition: "NEW",
            price: 10000000,
            images: ["/test.jpg"],
            inventory: [{ quantity: 1 }],
          },
        ],
      },
      expectedRam: "6GB",
    },
    {
      name: "Null RAM (Fallback via inferDefaultRam for iPhone 15 Pro)",
      product: {
        id: "p4",
        brand: "Apple",
        modelName: "iPhone 15 Pro",
        slug: "ip15p-null",
        variants: [
          {
            id: "v4",
            sku: "SKU4",
            colorHex: "#000",
            ram: null,
            storage: "128GB",
            condition: "NEW",
            price: 14000000,
            images: ["/test.jpg"],
            inventory: [{ quantity: 1 }],
          },
        ],
      },
      expectedRam: "8GB",
    },
    {
      name: "Undefined RAM (Fallback via inferDefaultRam for Galaxy S24 Ultra)",
      product: {
        id: "p5",
        brand: "Samsung",
        modelName: "Galaxy S24 Ultra",
        slug: "s24u-undef",
        variants: [
          {
            id: "v5",
            sku: "SKU5",
            colorHex: "#000",
            storage: "256GB",
            condition: "NEW",
            price: 15000000,
            images: ["/test.jpg"],
            inventory: [{ quantity: 1 }],
          },
        ],
      },
      expectedRam: "12GB",
    },
    {
      name: "Unknown Brand & Model with null RAM (Fallback to 8GB)",
      product: {
        id: "p6",
        brand: "GenericBrand",
        modelName: "ModelX",
        slug: "model-x",
        variants: [
          {
            id: "v6",
            sku: "SKU6",
            colorHex: "#000",
            ram: null,
            storage: "128GB",
            condition: "NEW",
            price: 5000000,
            images: ["/test.jpg"],
            inventory: [{ quantity: 1 }],
          },
        ],
      },
      expectedRam: "8GB",
    },
  ];

  for (const tc of testCases) {
    const html = renderCard(tc.product);
    // 1. Must contain expected RAM string
    assert.ok(
      html.includes(tc.expectedRam),
      `Test case "${tc.name}" must contain RAM "${tc.expectedRam}" in rendered HTML`
    );
    // 2. Must contain localized "Operativ xotira" (or translation key)
    assert.ok(
      html.includes("Operativ xotira"),
      `Test case "${tc.name}" must contain localized RAM label`
    );
    // 3. Must contain Lucide Cpu icon svg
    assert.ok(
      html.includes("lucide-cpu"),
      `Test case "${tc.name}" must render Lucide Cpu icon svg for RAM badge`
    );
  }

  // Also verify across ru and en locales
  const ruHtml = renderCard(testCases[0].product, "ru", ruMessages);
  assert.ok(ruHtml.includes("Оперативная память"), "Russian locale renders 'Оперативная память' for RAM label");
  assert.ok(ruHtml.includes("lucide-cpu"), "Russian locale renders Lucide Cpu icon");

  const enHtml = renderCard(testCases[0].product, "en", enMessages);
  assert.ok(enHtml.includes("RAM"), "English locale renders 'RAM' for RAM label");
  assert.ok(enHtml.includes("lucide-cpu"), "English locale renders Lucide Cpu icon");

  console.log("    [PASS] Verified RAM is always rendered on every card with Lucide Cpu icon across all cases & locales.");
}

// ============================================================================
// SUITE 4: EDGE CASES: 0 PRICE, DISCOUNTS, STOCK INDICATORS & TYPES
// ============================================================================
function testEdgeCases(): void {
  console.log("--> Suite 4: Edge Cases: 0 Price, Discounts, Stock Indicators");

  // 4.1 Price = 0
  const zeroPriceProduct: ProductCardData = {
    id: "p-zero",
    brand: "Apple",
    modelName: "iPhone 15",
    slug: "iphone-15",
    variants: [
      {
        id: "v-zero",
        sku: "ZERO",
        colorHex: "#000",
        ram: "6GB",
        storage: "128GB",
        condition: "NEW",
        price: 0,
        images: ["/test.jpg"],
        inventory: [{ quantity: 2 }],
      },
    ],
  };
  const htmlZero = renderCard(zeroPriceProduct);
  assert.ok(htmlZero.includes("0 so&#x27;m") || htmlZero.includes("0 so'm"), "Price = 0 formats as 0 so'm without NaN");
  assert.ok(!htmlZero.includes("-%"), "Price = 0 does not render NaN% discount");

  // 4.2 Discount > 0 (oldPrice = 15,000,000; price = 12,000,000 -> 20% discount)
  const discountProduct: ProductCardData = {
    id: "p-disc",
    brand: "Apple",
    modelName: "iPhone 15",
    slug: "iphone-15",
    variants: [
      {
        id: "v-disc",
        sku: "DISC",
        colorHex: "#000",
        ram: "6GB",
        storage: "128GB",
        condition: "NEW",
        price: 12000000,
        oldPrice: 15000000,
        images: ["/test.jpg"],
        inventory: [{ quantity: 2 }],
      },
    ],
  };
  const htmlDisc = renderCard(discountProduct);
  assert.ok(htmlDisc.includes("-20%"), "Discount > 0 renders -20% badge");
  assert.ok(htmlDisc.includes("line-through"), "Discount > 0 renders old price with line-through");
  assert.ok(htmlDisc.includes("15 000 000"), "Renders formatted old price");
  assert.ok(htmlDisc.includes("12 000 000"), "Renders formatted current price");

  // 4.3 Inverted / Invalid Discount (oldPrice < price or oldPrice = price)
  const invalidDiscProduct: ProductCardData = {
    id: "p-inv-disc",
    brand: "Apple",
    modelName: "iPhone 15",
    slug: "iphone-15",
    variants: [
      {
        id: "v-inv-disc",
        sku: "INV-DISC",
        colorHex: "#000",
        ram: "6GB",
        storage: "128GB",
        condition: "NEW",
        price: 15000000,
        oldPrice: 12000000, // oldPrice is less than price
        images: ["/test.jpg"],
        inventory: [{ quantity: 2 }],
      },
    ],
  };
  const htmlInvDisc = renderCard(invalidDiscProduct);
  assert.ok(!htmlInvDisc.includes("-%"), "Inverted discount does not render negative discount badge");

  // 4.4 Stock = 0 vs Stock > 0
  const outOfStockProduct: ProductCardData = {
    id: "p-oos",
    brand: "Apple",
    modelName: "iPhone 15",
    slug: "iphone-15",
    variants: [
      {
        id: "v-oos",
        sku: "OOS",
        colorHex: "#000",
        ram: "6GB",
        storage: "128GB",
        condition: "USED",
        price: 9000000,
        images: ["/test.jpg"],
        inventory: [{ quantity: 0 }],
      },
    ],
  };
  const htmlOos = renderCard(outOfStockProduct);
  assert.ok(htmlOos.includes("Mavjud emas"), "Stock = 0 renders 'Mavjud emas'");
  assert.ok(!htmlOos.includes("animate-pulse"), "Stock = 0 does NOT render pulsing dot");
  assert.ok(htmlOos.includes("B/U (Ishlatilgan)"), "USED condition badge rendered");

  const inStockProduct: ProductCardData = {
    id: "p-in-stock",
    brand: "Apple",
    modelName: "iPhone 15",
    slug: "iphone-15",
    variants: [
      {
        id: "v-in-stock",
        sku: "IN-STOCK",
        colorHex: "#000",
        ram: "6GB",
        storage: "128GB",
        condition: "NEW",
        price: 11000000,
        images: ["/test.jpg"],
        inventory: [{ quantity: 10 }],
      },
    ],
  };
  const htmlInStock = renderCard(inStockProduct);
  assert.ok(htmlInStock.includes("Mavjud"), "Stock > 0 renders 'Mavjud'");
  assert.ok(htmlInStock.includes("animate-pulse"), "Stock > 0 renders green pulsing dot");
  assert.ok(htmlInStock.includes("bg-emerald-500"), "Stock > 0 uses bg-emerald-500");

  // 4.5 Prisma Decimal-like object price support ({ toString(): "14500000" })
  const decimalPriceProduct: ProductCardData = {
    id: "p-decimal",
    brand: "Apple",
    modelName: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    variants: [
      {
        id: "v-dec",
        sku: "DEC",
        colorHex: "#000",
        ram: "8GB",
        storage: "128GB",
        condition: "NEW",
        price: { toString: () => "14500000" },
        oldPrice: { toString: () => "16000000" },
        images: ["/test.jpg"],
        inventory: [{ quantity: 4 }],
      },
    ],
  };
  const htmlDecimal = renderCard(decimalPriceProduct);
  assert.ok(htmlDecimal.includes("14 500 000"), "Decimal price object correctly renders 14 500 000");
  assert.ok(htmlDecimal.includes("-9%"), "Decimal price object discount correctly computes -9%");

  console.log("    [PASS] Edge cases verified: price 0, positive & invalid discounts, stock 0 vs > 0, and Decimal objects.");
}

// ============================================================================
// SUITE 5: AGENTS.MD COMPLIANCE & STATIC CODE QUALITY AUDIT
// ============================================================================
function testAgentsMdCompliance(): void {
  console.log("--> Suite 5: AGENTS.md Standards & Anti-UI Slop Audit");

  const cardPath = path.join(process.cwd(), "components", "store", "product-card.tsx");
  const content = fs.readFileSync(cardPath, "utf-8");

  // Zero emojis check
  assert.equal(EMOJI_REGEX.test(content), false, "components/store/product-card.tsx must contain ZERO Unicode emojis");

  // Only Lucide Icons used
  assert.match(content, /from\s+["']lucide-react["']/, "Only lucide-react used for icons");

  // Calibrated compact mobile padding
  assert.match(content, /p-2\.5\s+sm:p-3\.5\s+md:p-4/, "Container must use compact mobile padding");

  // Touch target expanders on swatches
  assert.match(
    content,
    /before:inset-\[-6px\]/,
    "Color swatches must have touch expanders (before:inset-[-6px])"
  );

  // Event isolation on interactive chips/swatches
  const stopPropMatches = content.match(/e\.stopPropagation\(\)/g) || [];
  assert.ok(stopPropMatches.length >= 2, "Both storage pills and color swatches must isolate clicks with stopPropagation()");

  const prevDefMatches = content.match(/e\.preventDefault\(\)/g) || [];
  assert.ok(prevDefMatches.length >= 2, "Both storage pills and color swatches must isolate clicks with preventDefault()");

  // ARIA labels on buttons and images
  assert.match(content, /aria-label=/, "Accessible aria-label attributes present");
  assert.match(content, /aria-pressed=/, "Accessible aria-pressed attribute present on storage pills");

  console.log("    [PASS] Zero emojis, touch targets, event isolation, and ARIA attributes strictly comply with AGENTS.md.");
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
function runAllEmpiricalTests(): void {
  console.log("===============================================================================");
  console.log("CHALLENGER 1: Milestone 2 Empirical Stress & Layout Verification Harness");
  console.log("===============================================================================\n");

  testGridCssClasses();
  testCardVariantVariations();
  testRamRenderingAndCpuIcon();
  testEdgeCases();
  testAgentsMdCompliance();

  console.log("\n===============================================================================");
  console.log("ALL 5 CHALLENGER 1 M2 EMPIRICAL SUITES PASSED WITH ZERO ERRORS!");
  console.log("===============================================================================");
}

runAllEmpiricalTests();
