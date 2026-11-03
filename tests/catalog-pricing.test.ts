import { getSuggestedPriceForModel } from "../lib/catalog/pricing";
import { CATALOG_PRESETS } from "../lib/catalog/presets";

export function testCatalogPricing(): {
  success: boolean;
  checks: string[];
  errors: string[];
} {
  const checks: string[] = [];
  const errors: string[] = [];

  // Helper assertion
  function assertPrice(
    brand: string,
    modelName: string,
    storage: string,
    expectedPrice: number,
    expectedOldPrice: number | null
  ) {
    const res = getSuggestedPriceForModel(brand, modelName, storage);
    if (res.price !== expectedPrice) {
      errors.push(
        `${brand} ${modelName} (${storage}): expected price ${expectedPrice}, got ${res.price}`
      );
    }
    if (res.oldPrice !== expectedOldPrice) {
      errors.push(
        `${brand} ${modelName} (${storage}): expected oldPrice ${expectedOldPrice}, got ${res.oldPrice}`
      );
    }
  }

  // 1. Apple Flagships & Generations (13 through 18 Pro Max)
  assertPrice("Apple", "iPhone 18 Pro Max", "256GB", 23100000, null);
  assertPrice("Apple", "iPhone 18 Pro", "128GB", 18500000, null);
  assertPrice("Apple", "iPhone 17 Pro Max", "256GB", 21450000, null);
  assertPrice("Apple", "iPhone 17 Pro", "128GB", 17500000, null);
  assertPrice("Apple", "iPhone 17", "128GB", 13500000, null);
  assertPrice("Apple", "iPhone 16 Pro Max", "256GB", 20020000, null);
  assertPrice("Apple", "iPhone 16 Pro", "128GB", 16200000, 17000000);
  assertPrice("Apple", "iPhone 16 Pro", "256GB", 17820000, null);
  assertPrice("Apple", "iPhone 16 Pro", "512GB", 20250000, null);
  assertPrice("Apple", "iPhone 16 Plus", "128GB", 13200000, 14000000);
  assertPrice("Apple", "iPhone 16", "128GB", 11800000, 12600000);
  assertPrice("Apple", "iPhone 15 Pro Max", "256GB", 17380000, null);
  assertPrice("Apple", "iPhone 15 Pro", "128GB", 13800000, 14600000);
  assertPrice("Apple", "iPhone 15", "128GB", 10400000, 11200000);
  assertPrice("Apple", "iPhone 14 Pro Max", "128GB", 13500000, null);
  assertPrice("Apple", "iPhone 14 Pro", "128GB", 12000000, 12800000);
  assertPrice("Apple", "iPhone 14", "128GB", 9200000, 10000000);
  assertPrice("Apple", "iPhone 13 Pro Max", "128GB", 11500000, null);
  assertPrice("Apple", "iPhone 13 Pro", "128GB", 10200000, 11000000);
  assertPrice("Apple", "iPhone 13 mini", "128GB", 7800000, 8600000);
  assertPrice("Apple", "iPhone 13", "128GB", 8200000, 9000000);
  assertPrice("Apple", "iPhone SE (3-avlod)", "64GB", 5800000, 6600000);

  if (errors.length === 0) {
    checks.push("Apple iPhone models 13 through 18 pricing verified across all tiers");
  }

  // 2. Samsung Models (S25, S26, A07-A57)
  assertPrice("Samsung", "Galaxy S26 Ultra", "256GB", 20350000, null);
  assertPrice("Samsung", "Galaxy S26+", "256GB", 17050000, null);
  assertPrice("Samsung", "Galaxy S26", "128GB", 12500000, null);
  assertPrice("Samsung", "Galaxy S26 FE", "128GB", 8500000, null);
  assertPrice("Samsung", "Galaxy S25 Ultra", "256GB", 18480000, null);
  assertPrice("Samsung", "Galaxy S25 Ultra", "512GB", 21000000, 21800000);
  assertPrice("Samsung", "Galaxy S25+", "256GB", 15620000, null);
  assertPrice("Samsung", "Galaxy S25", "128GB", 11200000, 12000000);
  assertPrice("Samsung", "Galaxy S25 FE", "128GB", 8500000, null);
  assertPrice("Samsung", "Galaxy A57 5G", "128GB", 5200000, 6000000);
  assertPrice("Samsung", "Galaxy A57 5G", "256GB", 5720000, null);
  assertPrice("Samsung", "Galaxy A37 5G", "128GB", 4100000, null);
  assertPrice("Samsung", "Galaxy A37 5G", "256GB", 4510000, null);
  assertPrice("Samsung", "Galaxy A27 5G", "128GB", 3200000, 4000000);
  assertPrice("Samsung", "Galaxy A18", "128GB", 2400000, 3200000);
  assertPrice("Samsung", "Galaxy A08", "64GB", 1600000, 2400000);
  assertPrice("Samsung", "Galaxy A07", "64GB", 1600000, 2400000);

  if (errors.length === 0) {
    checks.push("Samsung S-series and A-series pricing verified across all tiers");
  }

  // 3. Storage multiplier checks
  const p128 = getSuggestedPriceForModel("Apple", "iPhone 16 Pro", "128GB");
  const p256 = getSuggestedPriceForModel("Apple", "iPhone 16 Pro", "256GB");
  const p512 = getSuggestedPriceForModel("Apple", "iPhone 16 Pro", "512GB");
  const p1tb = getSuggestedPriceForModel("Apple", "iPhone 16 Pro", "1TB");

  if (p256.price <= p128.price) {
    errors.push("256GB storage price should be higher than 128GB");
  }
  if (p512.price <= p256.price) {
    errors.push("512GB storage price should be higher than 256GB");
  }
  if (p1tb.price <= p512.price) {
    errors.push("1TB storage price should be higher than 512GB");
  }

  if (errors.length === 0) {
    checks.push("Storage scaling monotonicity confirmed (128GB < 256GB < 512GB < 1TB)");
  }

  // 4. Case-insensitivity & whitespace resilience
  const resLower = getSuggestedPriceForModel("apple", "iphone 16 pro", "128gb");
  const resUpper = getSuggestedPriceForModel("APPLE", "IPHONE 16 PRO", "128GB");
  const resSpaces = getSuggestedPriceForModel("  Apple  ", "  iPhone 16 Pro  ", " 128GB ");

  if (resLower.price !== p128.price || resUpper.price !== p128.price || resSpaces.price !== p128.price) {
    errors.push("Pricing function should be case-insensitive and trim whitespace");
  } else {
    checks.push("Case-insensitivity and whitespace trimming verified");
  }

  // 5. Check all 41 presets produce positive, realistic prices
  let presetCheckedCount = 0;
  for (const preset of CATALOG_PRESETS) {
    for (const storage of preset.storageOptions) {
      const result = getSuggestedPriceForModel(preset.brand, preset.modelName, storage);
      presetCheckedCount++;
      if (result.price < 1000000 || result.price > 50000000) {
        errors.push(
          `Unrealistic price for ${preset.brand} ${preset.modelName} ${storage}: ${result.price}`
        );
      }
      if (result.oldPrice !== null && result.oldPrice <= result.price) {
        errors.push(
          `Invalid discount for ${preset.brand} ${preset.modelName} ${storage}: oldPrice ${result.oldPrice} <= price ${result.price}`
        );
      }
    }
  }

  if (errors.length === 0) {
    checks.push(
      `Verified all 41 catalog presets across storage options (${presetCheckedCount} price combinations checked)`
    );
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("catalog-pricing.test")) {
  try {
    const res = testCatalogPricing();
    console.log("Catalog Pricing Utility Verification:");
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
  } catch (err: unknown) {
    console.error("Test execution threw an exception:", err);
    process.exit(1);
  }
}
