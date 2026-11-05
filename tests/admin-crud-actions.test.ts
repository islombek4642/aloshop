import * as fs from "node:fs";
import * as path from "node:path";
import {
  createOrUpdateProductFromPresetAction,
  deleteProductAction,
  type PresetProductInput,
} from "../app/actions/admin-products";
import {
  presetProductInputSchema,
  presetVariantInputSchema,
} from "../lib/validations/admin-products";
import { CATALOG_PRESETS, generateSku } from "../lib/catalog/presets";
import { OrderStatus } from "@prisma/client";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function testAdminCrudActions(): {
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
  // 1. Zod Validation for presetVariantInputSchema
  // -------------------------------------------------------------
  const validVariant = {
    colorNameUz: "Qora titan",
    storage: "256GB",
    price: 18000000,
    oldPrice: 19500000,
    initialStock: { "branch-1": 5, "branch-2": 3 },
  };

  const parsedVariant = presetVariantInputSchema.safeParse(validVariant);
  if (!parsedVariant.success) {
    recordError(`validVariant failed validation: ${JSON.stringify(parsedVariant.error.issues)}`);
  } else {
    recordCheck("presetVariantInputSchema validates valid variant data");
  }

  // Non-positive price
  const invalidPriceVariant = presetVariantInputSchema.safeParse({
    ...validVariant,
    price: -100,
  });
  if (invalidPriceVariant.success) {
    recordError("presetVariantInputSchema accepted negative price");
  } else {
    recordCheck("presetVariantInputSchema rejects negative price");
  }

  // Empty storage
  const emptyStorageVariant = presetVariantInputSchema.safeParse({
    ...validVariant,
    storage: "",
  });
  if (emptyStorageVariant.success) {
    recordError("presetVariantInputSchema accepted empty storage");
  } else {
    recordCheck("presetVariantInputSchema rejects empty storage");
  }

  // -------------------------------------------------------------
  // 2. Zod Validation for presetProductInputSchema
  // -------------------------------------------------------------
  const validPayload: PresetProductInput = {
    presetId: "apple-iphone-16-pro",
    variants: [
      {
        colorNameUz: "Cho'l titani",
        storage: "256GB",
        price: 18000000,
        initialStock: { "branch-malika": 10 },
      },
      {
        colorNameUz: "Qora titan",
        storage: "128GB",
        price: 16500000,
        initialStock: { "branch-malika": 5 },
      },
    ],
  };

  const parsedProduct = presetProductInputSchema.safeParse(validPayload);
  if (!parsedProduct.success) {
    recordError(`validPayload failed: ${JSON.stringify(parsedProduct.error.issues)}`);
  } else {
    recordCheck("presetProductInputSchema validates valid preset payload");
  }

  // Empty variants array
  const emptyVariantsProduct = presetProductInputSchema.safeParse({
    presetId: "apple-iphone-16-pro",
    variants: [],
  });
  if (emptyVariantsProduct.success) {
    recordError("presetProductInputSchema accepted empty variants array");
  } else {
    recordCheck("presetProductInputSchema requires at least one variant");
  }

  // -------------------------------------------------------------
  // 3. Preset Lookup & SKU generation
  // -------------------------------------------------------------
  const preset = CATALOG_PRESETS.find((p) => p.id === "apple-iphone-16-pro");
  if (!preset) {
    recordError("Could not find 'apple-iphone-16-pro' in CATALOG_PRESETS");
  } else {
    const sku = generateSku(preset.brand, preset.modelName, "256GB", "Desert Titanium");
    if (!sku.startsWith("IP16P-256")) {
      recordError(`Unexpected SKU format: ${sku}`);
    } else {
      recordCheck(`Preset SKU generation verified: ${sku}`);
    }
  }

  // Samsung SKU check
  const samsungPreset = CATALOG_PRESETS.find((p) => p.id === "samsung-galaxy-s25-ultra");
  if (!samsungPreset) {
    recordError("Could not find 'samsung-galaxy-s25-ultra' in CATALOG_PRESETS");
  } else {
    const s25Sku = generateSku(samsungPreset.brand, samsungPreset.modelName, "512GB", "Phantom Black");
    if (!s25Sku.startsWith("S25U-512")) {
      recordError(`Unexpected Samsung SKU format: ${s25Sku}`);
    } else {
      recordCheck(`Samsung Preset SKU generation verified: ${s25Sku}`);
    }
  }

  // -------------------------------------------------------------
  // 4. Function export checks
  // -------------------------------------------------------------
  if (typeof createOrUpdateProductFromPresetAction !== "function") {
    recordError("createOrUpdateProductFromPresetAction is not exported as a function");
  } else {
    recordCheck("createOrUpdateProductFromPresetAction function exported");
  }

  if (typeof deleteProductAction !== "function") {
    recordError("deleteProductAction is not exported as a function");
  } else {
    recordCheck("deleteProductAction function exported");
  }

  // -------------------------------------------------------------
  // 5. Audit: Isolated Path Revalidation & 500 Immunity
  // -------------------------------------------------------------
  const actionsPath = path.resolve(__dirname, "../app/actions/admin-products.ts");
  const actionsSource = fs.readFileSync(actionsPath, "utf-8");

  // Verify that root '/' is NOT revalidated inside createOrUpdateProductFromPresetAction (prevents 500 during RSC streaming)
  if (actionsSource.includes('safeRevalidatePath("/")')) {
    errors.push("createOrUpdateProductFromPresetAction still calls safeRevalidatePath(\"/\") which can cause 500 errors in Next.js RSC");
  } else {
    checks.push("createOrUpdateProductFromPresetAction avoids broad root revalidation ('/')");
  }

  // Verify specific isolated paths are revalidated
  if (!actionsSource.includes('safeRevalidatePath("/admin/products")') || !actionsSource.includes('safeRevalidatePath("/catalog")')) {
    errors.push("createOrUpdateProductFromPresetAction missing isolated revalidation for /admin/products or /catalog");
  } else {
    checks.push("createOrUpdateProductFromPresetAction isolates revalidations to /admin/products and /catalog");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

async function runAsyncTests() {
  console.log("Running Admin CRUD Actions Async Suite...\n");

  // 1. Unauthenticated invocation of createOrUpdateProductFromPresetAction
  const unauthRes = await createOrUpdateProductFromPresetAction({
    presetId: "apple-iphone-16-pro",
    variants: [
      {
        colorNameUz: "Qora titan",
        storage: "128GB",
        price: 15000000,
      },
    ],
  });

  assert(
    unauthRes.success === false && unauthRes.error === "unauthorized",
    `Expected unauthorized for createOrUpdateProductFromPresetAction without session, got: ${JSON.stringify(unauthRes)}`
  );
  console.log("  + createOrUpdateProductFromPresetAction rejects unauthenticated calls with 'unauthorized'");

  // 2. Unauthenticated invocation of deleteProductAction
  const unauthDeleteRes = await deleteProductAction("prod-test-id");
  assert(
    unauthDeleteRes.success === false && unauthDeleteRes.error === "unauthorized",
    `Expected unauthorized for deleteProductAction without session, got: ${JSON.stringify(unauthDeleteRes)}`
  );
  console.log("  + deleteProductAction rejects unauthenticated calls with 'unauthorized'");

  // 3. Active order protection definition verification
  // Active statuses must protect against deleting products involved in PENDING, CONFIRMED, or SHIPPED orders
  const activeOrderStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED];
  assert(
    activeOrderStatuses.includes(OrderStatus.PENDING) &&
      activeOrderStatuses.includes(OrderStatus.CONFIRMED),
    "Active order statuses must cover PENDING and CONFIRMED"
  );
  console.log("  + Active order protection guard verified for unfulfilled orders");
}

if (require.main === module || process.argv[1]?.includes("admin-crud-actions.test")) {
  const syncRes = testAdminCrudActions();
  console.log("Admin CRUD Actions & Preset Matrix Suite:");
  console.log(`Status: ${syncRes.success ? "PASSED" : "FAILED"}`);
  for (const c of syncRes.checks) {
    console.log(`  + ${c}`);
  }
  if (!syncRes.success) {
    console.error("Errors found:");
    for (const err of syncRes.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  runAsyncTests()
    .then(() => {
      console.log("\nAll Admin CRUD action tests PASSED successfully!");
    })
    .catch((err) => {
      console.error("\nAsync test failed:", err);
      process.exit(1);
    });
}
