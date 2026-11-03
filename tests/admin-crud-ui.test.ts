import * as fs from "node:fs";
import * as path from "node:path";
import { CATALOG_PRESETS, getPresetsByBrand } from "../lib/catalog/presets";
import { getSuggestedPriceForModel } from "../lib/catalog/pricing";

export function testAdminCrudUI(): {
  success: boolean;
  checks: string[];
  errors: string[];
} {
  const checks: string[] = [];
  const errors: string[] = [];

  function recordCheck(name: string) {
    checks.push(name);
  }

  function recordError(msg: string) {
    errors.push(msg);
  }

  // -------------------------------------------------------------
  // 1. Verify existence of product-preset-matrix-form.tsx
  // -------------------------------------------------------------
  const matrixFormPath = path.resolve(
    __dirname,
    "../components/admin/product-preset-matrix-form.tsx"
  );

  if (!fs.existsSync(matrixFormPath)) {
    recordError("components/admin/product-preset-matrix-form.tsx does not exist");
  } else {
    recordCheck("product-preset-matrix-form.tsx file exists");
    const matrixFormContent = fs.readFileSync(matrixFormPath, "utf-8");

    // Check for essential components and hooks
    if (!matrixFormContent.includes("createOrUpdateProductFromPresetAction")) {
      recordError("product-preset-matrix-form.tsx does not invoke createOrUpdateProductFromPresetAction");
    } else {
      recordCheck("product-preset-matrix-form.tsx integrates createOrUpdateProductFromPresetAction");
    }

    if (!matrixFormContent.includes("getSuggestedPriceForModel")) {
      recordError("product-preset-matrix-form.tsx does not use getSuggestedPriceForModel");
    } else {
      recordCheck("product-preset-matrix-form.tsx integrates getSuggestedPriceForModel");
    }

    // Check for quick toggle (Select All / Deselect All)
    if (
      !matrixFormContent.toLowerCase().includes("select all") &&
      !matrixFormContent.toLowerCase().includes("hammasini tanlash") &&
      !matrixFormContent.includes("handleSelectAll") &&
      !matrixFormContent.includes("toggleAll")
    ) {
      recordError("product-preset-matrix-form.tsx does not have Select All / Deselect All controls");
    } else {
      recordCheck("product-preset-matrix-form.tsx provides Select All / Deselect All quick toggles");
    }

    // Check for model summary specs card (processor, camera, display, battery)
    const hasSummaryCard =
      matrixFormContent.includes("processor") &&
      matrixFormContent.includes("camera") &&
      matrixFormContent.includes("screenSize") &&
      matrixFormContent.includes("battery");
    if (!hasSummaryCard) {
      recordError("product-preset-matrix-form.tsx missing model specs summary card");
    } else {
      recordCheck("product-preset-matrix-form.tsx includes model specs summary card");
    }

    // Check for Visual Device Studio elements: Hero image and responsive cards grid
    if (!matrixFormContent.includes("grid-cols-1 md:grid-cols-2 xl:grid-cols-3")) {
      recordError("product-preset-matrix-form.tsx does not use responsive variant cards grid ('grid-cols-1 md:grid-cols-2 xl:grid-cols-3')");
    } else {
      recordCheck("product-preset-matrix-form.tsx uses responsive variant cards grid ('grid-cols-1 md:grid-cols-2 xl:grid-cols-3')");
    }

    if (!matrixFormContent.includes("imageUrl") || !matrixFormContent.includes("<Image")) {
      recordError("product-preset-matrix-form.tsx missing Device Passport hero preview image");
    } else {
      recordCheck("product-preset-matrix-form.tsx includes Device Passport hero preview image");
    }

    // Check for zero emojis
    const emojiRegex = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
    if (emojiRegex.test(matrixFormContent)) {
      recordError("product-preset-matrix-form.tsx contains banned Unicode emojis");
    } else {
      recordCheck("product-preset-matrix-form.tsx adheres to Zero Emojis policy");
    }
  }

  // -------------------------------------------------------------
  // 2. Verify matrix generation and price logic on catalog presets
  // -------------------------------------------------------------
  const samplePreset = CATALOG_PRESETS.find(
    (p) => p.id === "apple-iphone-16-pro"
  );
  if (!samplePreset) {
    recordError("apple-iphone-16-pro preset not found in CATALOG_PRESETS");
  } else {
    const totalPossibleVariants =
      samplePreset.colors.length * samplePreset.storageOptions.length;
    if (totalPossibleVariants < 4) {
      recordError("apple-iphone-16-pro has unexpectedly few combinations");
    } else {
      recordCheck(
        `apple-iphone-16-pro has ${totalPossibleVariants} color-storage matrix cells`
      );
    }

    for (const storage of samplePreset.storageOptions) {
      const suggested = getSuggestedPriceForModel(
        samplePreset.brand,
        samplePreset.modelName,
        storage
      );
      if (suggested.price <= 0) {
        recordError(`Invalid suggested price for ${storage}: ${suggested.price}`);
      }
    }
    recordCheck("Preset matrix prices calculated cleanly via getSuggestedPriceForModel");
  }

  // -------------------------------------------------------------
  // 3. Verify Edit & Delete integration in products-list-view.tsx
  // -------------------------------------------------------------
  const listViewPath = path.resolve(
    __dirname,
    "../components/admin/products-list-view.tsx"
  );
  if (!fs.existsSync(listViewPath)) {
    recordError("components/admin/products-list-view.tsx does not exist");
  } else {
    const listViewContent = fs.readFileSync(listViewPath, "utf-8");

    // Check for Edit button linking to /admin/products/[id]/edit
    if (
      !listViewContent.includes("/edit") ||
      !listViewContent.includes("admin/products")
    ) {
      recordError("products-list-view.tsx does not have edit link to /admin/products/[id]/edit");
    } else {
      recordCheck("products-list-view.tsx contains link to /admin/products/[id]/edit");
    }

    // Check for Delete action calling deleteProductAction
    if (!listViewContent.includes("deleteProductAction")) {
      recordError("products-list-view.tsx does not integrate deleteProductAction");
    } else {
      recordCheck("products-list-view.tsx integrates deleteProductAction");
    }

    // Check colSpan matches new column count (7 columns: expand, title, category, warranty, variants, totalStock, actions)
    if (!listViewContent.includes("colSpan={7}")) {
      recordError("products-list-view.tsx variant sub-table does not have colSpan={7}");
    } else {
      recordCheck("products-list-view.tsx variant sub-table updated to colSpan={7}");
    }

    // Check for zero emojis
    const emojiRegex = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
    if (emojiRegex.test(listViewContent)) {
      recordError("products-list-view.tsx contains banned Unicode emojis");
    } else {
      recordCheck("products-list-view.tsx adheres to Zero Emojis policy");
    }
  }

  // -------------------------------------------------------------
  // 4. Verify edit page: app/[locale]/admin/products/[id]/edit/page.tsx
  // -------------------------------------------------------------
  const editPagePath = path.resolve(
    __dirname,
    "../app/[locale]/admin/products/[id]/edit/page.tsx"
  );
  if (!fs.existsSync(editPagePath)) {
    recordError("app/[locale]/admin/products/[id]/edit/page.tsx does not exist");
  } else {
    recordCheck("app/[locale]/admin/products/[id]/edit/page.tsx file exists");
    const editPageContent = fs.readFileSync(editPagePath, "utf-8");

    if (!editPageContent.includes("ProductPresetMatrixForm")) {
      recordError("Edit page does not render ProductPresetMatrixForm");
    } else {
      recordCheck("Edit page renders ProductPresetMatrixForm");
    }

    if (!editPageContent.includes("initialData")) {
      recordError("Edit page does not pass initialData to ProductPresetMatrixForm");
    } else {
      recordCheck("Edit page prepares and passes initialData to ProductPresetMatrixForm");
    }
  }

  // -------------------------------------------------------------
  // 5. Verify new page: app/[locale]/admin/products/new/page.tsx
  // -------------------------------------------------------------
  const newPagePath = path.resolve(
    __dirname,
    "../app/[locale]/admin/products/new/page.tsx"
  );
  if (!fs.existsSync(newPagePath)) {
    recordError("app/[locale]/admin/products/new/page.tsx does not exist");
  } else {
    const newPageContent = fs.readFileSync(newPagePath, "utf-8");
    if (!newPageContent.includes("ProductPresetMatrixForm")) {
      recordError("app/[locale]/admin/products/new/page.tsx does not render ProductPresetMatrixForm");
    } else {
      recordCheck("app/[locale]/admin/products/new/page.tsx renders ProductPresetMatrixForm");
    }
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("admin-crud-ui.test")) {
  const res = testAdminCrudUI();
  console.log("Admin Single-Screen Matrix UI & CRUD Table Integration Suite:");
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
  console.log("\nAll Admin UI CRUD tests PASSED successfully!");
}
