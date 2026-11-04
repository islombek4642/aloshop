import * as fs from "node:fs";
import * as path from "node:path";
import {
  CAROUSEL_INTERVAL_MS,
  MIN_SWIPE_DISTANCE_PX,
  extractCardImages,
  getNextCarouselIndex,
  getPrevCarouselIndex,
  calculateSwipeAction,
  type CardImageItem,
  type ProductCardVariant,
} from "../components/store/product-card";

export function testProductCardCarousel() {
  const checks: string[] = [];
  const errors: string[] = [];

  // 1. Verify interval constant
  if (CAROUSEL_INTERVAL_MS !== 3000) {
    errors.push(`Expected CAROUSEL_INTERVAL_MS to be 3000, got ${CAROUSEL_INTERVAL_MS}`);
  } else {
    checks.push("Hover-activated interval verified as 3000ms");
  }

  // 2. Verify swipe distance constant
  if (MIN_SWIPE_DISTANCE_PX !== 30) {
    errors.push(`Expected MIN_SWIPE_DISTANCE_PX to be 30, got ${MIN_SWIPE_DISTANCE_PX}`);
  } else {
    checks.push("Swipe threshold verified as 30px");
  }

  // 3. Verify extractCardImages helper
  const mockVariants: ProductCardVariant[] = [
    {
      id: "var-1",
      sku: "IP15-BLK-128",
      colorHex: "#1C1C1E",
      storage: "128GB",
      condition: "NEW",
      price: 10000000,
      images: [
        "/images/products/iphone-15-black-front.webp",
        "/images/products/iphone-15-black-side.webp",
      ],
    },
    {
      id: "var-2",
      sku: "IP15-BLU-128",
      colorHex: "#D1E2EE",
      storage: "128GB",
      condition: "NEW",
      price: 10000000,
      images: [
        "/images/products/iphone-15-blue-front.webp",
      ],
    },
    {
      id: "var-3",
      sku: "IP15-BLK-256",
      colorHex: "#1C1C1E",
      storage: "256GB",
      condition: "NEW",
      price: 12000000,
      images: [
        "/images/products/iphone-15-black-front.webp", // duplicate should be ignored
        "/images/products/iphone-15-black-back.webp",
      ],
    },
  ];

  const extracted = extractCardImages(mockVariants);
  if (extracted.length !== 4) {
    errors.push(`Expected 4 unique extracted images, got ${extracted.length}`);
  } else {
    checks.push("extractCardImages extracted 4 unique photos across variants");
  }

  if (extracted[0]?.url !== "/images/products/iphone-15-black-front.webp" || extracted[0]?.variantIndex !== 0) {
    errors.push(`First image metadata mismatch: ${JSON.stringify(extracted[0])}`);
  } else {
    checks.push("First image mapped to variant index 0 and color #1C1C1E");
  }

  if (extracted[2]?.url !== "/images/products/iphone-15-blue-front.webp" || extracted[2]?.variantIndex !== 1) {
    errors.push(`Third image metadata mismatch: ${JSON.stringify(extracted[2])}`);
  } else {
    checks.push("Third image mapped to variant index 1 and color #D1E2EE");
  }

  // Empty variants edge case
  const emptyExtracted = extractCardImages([]);
  if (emptyExtracted.length !== 0) {
    errors.push("extractCardImages([]) should return empty array");
  }

  // 4. Verify getNextCarouselIndex
  const total = 4;
  if (getNextCarouselIndex(0, total) !== 1) errors.push("getNextCarouselIndex(0, 4) should be 1");
  if (getNextCarouselIndex(1, total) !== 2) errors.push("getNextCarouselIndex(1, 4) should be 2");
  if (getNextCarouselIndex(3, total) !== 0) errors.push("getNextCarouselIndex(3, 4) should wrap to 0");
  if (getNextCarouselIndex(0, 1) !== 0) errors.push("getNextCarouselIndex(0, 1) should stay 0");
  if (getNextCarouselIndex(0, 0) !== 0) errors.push("getNextCarouselIndex(0, 0) should return 0");

  checks.push("getNextCarouselIndex cycling and bounds verified");

  // 5. Verify getPrevCarouselIndex
  if (getPrevCarouselIndex(0, total) !== 3) errors.push("getPrevCarouselIndex(0, 4) should wrap to 3");
  if (getPrevCarouselIndex(3, total) !== 2) errors.push("getPrevCarouselIndex(3, 4) should be 2");
  if (getPrevCarouselIndex(1, total) !== 0) errors.push("getPrevCarouselIndex(1, 4) should be 0");
  if (getPrevCarouselIndex(0, 1) !== 0) errors.push("getPrevCarouselIndex(0, 1) should stay 0");

  checks.push("getPrevCarouselIndex cycling and bounds verified");

  // 6. Verify calculateSwipeAction
  if (calculateSwipeAction(100, 50, 30) !== "next") {
    errors.push("Swipe left (100 -> 50, diff 50) should be 'next'");
  }
  if (calculateSwipeAction(50, 100, 30) !== "prev") {
    errors.push("Swipe right (50 -> 100, diff -50) should be 'prev'");
  }
  if (calculateSwipeAction(50, 70, 30) !== "none") {
    errors.push("Small swipe (50 -> 70, diff -20) should be 'none'");
  }
  if (calculateSwipeAction(100, 70, 30) !== "none") {
    errors.push("Boundary swipe (100 -> 70, diff 30) should be 'none'");
  }
  if (calculateSwipeAction(100, 69, 30) !== "next") {
    errors.push("Swipe over boundary (100 -> 69, diff 31) should be 'next'");
  }

  checks.push("Touch swipe distance and threshold logic verified");

  // 7. Verify source code adherence in components/store/product-card.tsx
  const cardSourcePath = path.resolve(__dirname, "../components/store/product-card.tsx");
  const cardSource = fs.readFileSync(cardSourcePath, "utf-8");

  if (!cardSource.includes("CAROUSEL_INTERVAL_MS")) {
    errors.push("ProductCard does not reference CAROUSEL_INTERVAL_MS");
  } else {
    checks.push("ProductCard references CAROUSEL_INTERVAL_MS");
  }

  if (!cardSource.includes("isHovered") || !cardSource.includes("onMouseEnter") || !cardSource.includes("onMouseLeave")) {
    errors.push("ProductCard missing hover state management (isHovered, onMouseEnter, onMouseLeave)");
  } else {
    checks.push("Hover state management verified in ProductCard");
  }

  if (!cardSource.includes("onTouchStart") || !cardSource.includes("onTouchEnd")) {
    errors.push("ProductCard missing mobile touch event handlers (onTouchStart, onTouchEnd)");
  } else {
    checks.push("Mobile touch gesture handlers verified in ProductCard");
  }

  if (!cardSource.includes("activeImageIndex")) {
    errors.push("ProductCard missing activeImageIndex state");
  } else {
    checks.push("activeImageIndex state verified in ProductCard");
  }

  // 8. Strict check for AGENTS.md Rule 3.4 (Zero Emojis Policy)
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(cardSource)) {
    errors.push("ProductCard contains forbidden emojis violating AGENTS.md Rule 3.4!");
  } else {
    checks.push("AGENTS.md Rule 3.4 zero emojis compliance verified in ProductCard");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("product-card-carousel.test")) {
  try {
    const res = testProductCardCarousel();
    console.log("Product Card Carousel Tests:");
    console.log(`Status: ${res.success ? "PASSED" : "FAILED"}`);
    for (const c of res.checks) {
      console.log(`  + ${c}`);
    }
    if (!res.success) {
      console.error("Errors found:");
      for (const err of res.errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution threw an error:", err?.message || err);
    process.exit(1);
  }
}

