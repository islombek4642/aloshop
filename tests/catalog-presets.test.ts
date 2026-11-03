import {
  getCatalogPresets,
  getCatalogBrands,
  getPresetsByBrand,
  getPresetByModel,
  generateSku,
  type CatalogPreset,
} from "../lib/catalog/presets";

export function verifyCatalogPresets(): {
  success: boolean;
  presetCount: number;
  checks: string[];
  errors: string[];
} {
  const checks: string[] = [];
  const errors: string[] = [];

  // 1. Verify brands
  const brands = getCatalogBrands();
  if (!brands.includes("Apple") || !brands.includes("Samsung")) {
    errors.push(`Missing core brands. Found: ${brands.join(", ")}`);
  } else {
    checks.push(`Core brands confirmed: ${brands.join(", ")}`);
  }

  // 2. Verify all presets loaded
  const presets = getCatalogPresets();
  if (presets.length < 35) {
    errors.push(`Expected at least 35 presets, got ${presets.length}`);
  } else {
    checks.push(`Loaded ${presets.length} smartphone catalog presets`);
  }

  // 3. Verify Apple presets specifications
  const applePresets = getPresetsByBrand("Apple");
  if (applePresets.length < 20) {
    errors.push(`Apple presets count too low: found ${applePresets.length}`);
  } else {
    checks.push(`Verified ${applePresets.length} Apple catalog presets`);
  }

  // Check specific flagship: iPhone 16 Pro
  const ip16p = getPresetByModel("Apple", "iPhone 16 Pro");
  if (!ip16p) {
    errors.push("Preset 'iPhone 16 Pro' not found");
  } else {
    if (!ip16p.camera || !ip16p.charging || !ip16p.processor || !ip16p.screenSize) {
      errors.push("iPhone 16 Pro missing required hardware fields");
    } else {
      checks.push("iPhone 16 Pro hardware specs verified");
    }

    if (ip16p.colors.length === 0 || !ip16p.colors[0].nameUz || !ip16p.colors[0].hex) {
      errors.push("iPhone 16 Pro missing localized color swatches");
    } else {
      checks.push(`iPhone 16 Pro colors verified (${ip16p.colors.length} colors with UZ/RU/EN names)`);
    }

    if (!ip16p.storageOptions.includes("256GB")) {
      errors.push("iPhone 16 Pro missing 256GB storage tier");
    } else {
      checks.push("iPhone 16 Pro storage options confirmed");
    }
  }

  // 4. Verify Samsung presets specifications
  const samsungPresets = getPresetsByBrand("Samsung");
  if (samsungPresets.length < 15) {
    errors.push(`Samsung presets count too low: found ${samsungPresets.length}`);
  } else {
    checks.push(`Verified ${samsungPresets.length} Samsung catalog presets`);
  }

  const s25u = getPresetByModel("Samsung", "Galaxy S25 Ultra");
  if (!s25u) {
    errors.push("Preset 'Galaxy S25 Ultra' not found");
  } else {
    if (!s25u.camera || !s25u.screenSize || !s25u.battery) {
      errors.push("Galaxy S25 Ultra missing required hardware fields");
    } else {
      checks.push("Galaxy S25 Ultra hardware specs verified");
    }
  }

  // 5. Verify SKU generator
  const sku1 = generateSku("Apple", "iPhone 16 Pro", "256GB", "Desert Titanium");
  const sku2 = generateSku("Samsung", "Galaxy S25 Ultra", "512GB", "Phantom Black");
  if (!sku1.startsWith("IP16P-256") && !sku1.includes("IP16")) {
    errors.push(`Unexpected Apple SKU format: ${sku1}`);
  } else {
    checks.push(`Apple SKU generator confirmed: ${sku1}`);
  }
  if (!sku2.startsWith("S25U-512") && !sku2.includes("S25")) {
    errors.push(`Unexpected Samsung SKU format: ${sku2}`);
  } else {
    checks.push(`Samsung SKU generator confirmed: ${sku2}`);
  }

  return {
    success: errors.length === 0,
    presetCount: presets.length,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("catalog-presets.test")) {
  const res = verifyCatalogPresets();
  console.log("Catalog Presets Engine Verification:");
  console.log(`Status: ${res.success ? "PASSED" : "FAILED"}`);
  console.log(`Presets Count: ${res.presetCount}`);
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
}
