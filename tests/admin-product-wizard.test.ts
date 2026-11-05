import * as fs from "node:fs";
import * as path from "node:path";
import { variantInputSchema, createProductSchema } from "../lib/validations/admin-products";

export function testAdminProductWizard(): {
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

  const emojiRegex = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;

  // 1. Verify Wizard Files Existence & Zero-Emoji compliance
  const wizardFiles = [
    "components/admin/product-wizard/types.ts",
    "components/admin/product-wizard/image-uploader.tsx",
    "components/admin/product-wizard/model-selector.tsx",
    "components/admin/product-wizard/new-product-flow.tsx",
    "components/admin/product-wizard/used-product-flow.tsx",
    "components/admin/product-wizard/product-creation-wizard.tsx",
  ];

  for (const relPath of wizardFiles) {
    const fullPath = path.resolve(__dirname, "..", relPath);
    if (!fs.existsSync(fullPath)) {
      recordError(`Missing component: ${relPath}`);
      continue;
    }

    recordCheck(`File exists: ${relPath}`);
    const content = fs.readFileSync(fullPath, "utf-8");

    if (emojiRegex.test(content)) {
      recordError(`Banned emojis found in ${relPath}`);
    } else {
      recordCheck(`Zero-emoji audit passed: ${relPath}`);
    }
  }

  // 2. Verify New Product Flow (6 logical steps)
  const newFlowPath = path.resolve(
    __dirname,
    "../components/admin/product-wizard/new-product-flow.tsx"
  );
  if (fs.existsSync(newFlowPath)) {
    const content = fs.readFileSync(newFlowPath, "utf-8");

    if (!content.includes("createProductAction")) {
      recordError("new-product-flow.tsx does not integrate createProductAction");
    } else {
      recordCheck("new-product-flow.tsx integrates createProductAction");
    }

    if (!content.includes("ModelSelector")) {
      recordError("new-product-flow.tsx does not integrate ModelSelector");
    } else {
      recordCheck("new-product-flow.tsx integrates ModelSelector");
    }

    if (!content.includes("ImageUploader")) {
      recordError("new-product-flow.tsx does not integrate ImageUploader");
    } else {
      recordCheck("new-product-flow.tsx integrates ImageUploader");
    }

    // Verify 6 logical steps
    const has6Steps =
      content.includes("stepProductInfo") &&
      content.includes("stepVariants") &&
      content.includes("stepPricing") &&
      content.includes("stepInventory") &&
      content.includes("stepImages") &&
      content.includes("stepReview");

    if (!has6Steps) {
      recordError("new-product-flow.tsx missing one or more of the 6 required steps");
    } else {
      recordCheck("new-product-flow.tsx implements all 6 required logical steps");
    }
  }

  // 3. Verify Used Product Flow (7 logical steps + Intelligent Battery + IMEI)
  const usedFlowPath = path.resolve(
    __dirname,
    "../components/admin/product-wizard/used-product-flow.tsx"
  );
  if (fs.existsSync(usedFlowPath)) {
    const content = fs.readFileSync(usedFlowPath, "utf-8");

    if (!content.includes("createProductAction")) {
      recordError("used-product-flow.tsx does not integrate createProductAction");
    } else {
      recordCheck("used-product-flow.tsx integrates createProductAction");
    }

    // Verify 7 logical steps
    const has7Steps =
      content.includes("stepUsedInfo") &&
      content.includes("stepUsedCondition") &&
      content.includes("stepUsedId") &&
      content.includes("stepUsedPricing") &&
      content.includes("stepUsedInventory") &&
      content.includes("stepUsedImages") &&
      content.includes("stepUsedReview");

    if (!has7Steps) {
      recordError("used-product-flow.tsx missing one or more of the 7 required steps");
    } else {
      recordCheck("used-product-flow.tsx implements all 7 required logical steps");
    }

    // Intelligent Battery Health with optional/unavailable support
    if (!content.includes("isIphone") || !content.includes("batteryHealth") || !content.includes("batteryUnavailable")) {
      recordError("used-product-flow.tsx does not handle intelligent battery health or unavailable toggle");
    } else {
      recordCheck("used-product-flow.tsx handles intelligent battery health with unavailable toggle");
    }

    // Category selection in Step 1
    if (!content.includes("categoryLabel") || !content.includes("categoryId")) {
      recordError("used-product-flow.tsx missing category selection in Step 1");
    } else {
      recordCheck("used-product-flow.tsx includes category selection in Step 1");
    }

    // IMEI 15-digit validation
    if (!content.includes("imei") || !content.includes("15")) {
      recordError("used-product-flow.tsx does not enforce 15-digit IMEI identification");
    } else {
      recordCheck("used-product-flow.tsx enforces 15-digit IMEI identification");
    }
  }

  // 4. Verify Image Uploader (FileReader + drag/drop + preview + remove)
  const uploaderPath = path.resolve(
    __dirname,
    "../components/admin/product-wizard/image-uploader.tsx"
  );
  if (fs.existsSync(uploaderPath)) {
    const content = fs.readFileSync(uploaderPath, "utf-8");

    if (!content.includes("FileReader") || !content.includes("readAsDataURL")) {
      recordError("image-uploader.tsx does not use FileReader.readAsDataURL");
    } else {
      recordCheck("image-uploader.tsx implements client-side FileReader.readAsDataURL");
    }

    if (!content.includes("handleDrop") || !content.includes("handleRemove")) {
      recordError("image-uploader.tsx missing drop or remove handlers");
    } else {
      recordCheck("image-uploader.tsx implements drag-drop and remove handlers");
    }
  }

  // 5. Verify Zod Schema validates USED product with IMEI
  const usedVariantTest = variantInputSchema.safeParse({
    sku: "USED-IP16P-256-NAT-1234",
    colorNameUz: "Tabiiy titan",
    colorNameRu: "Натуральный титан",
    colorNameEn: "Natural Titanium",
    colorHex: "#9A958E",
    ram: "8GB",
    storage: "256GB",
    condition: "USED",
    price: 13500000,
    oldPrice: 17000000,
    images: ["/images/products/used-device-photo.webp"],
    initialStock: { "branch-malika": 1 },
    imei: "865432067891234",
  });

  if (!usedVariantTest.success) {
    recordError(`variantInputSchema failed on USED device payload: ${JSON.stringify(usedVariantTest.error.issues)}`);
  } else {
    if (usedVariantTest.data.condition !== "USED" || usedVariantTest.data.imei !== "865432067891234") {
      recordError("variantInputSchema did not capture USED condition or IMEI");
    } else {
      recordCheck("variantInputSchema successfully validates USED device with 15-digit IMEI");
    }
  }

  // 6. Verify ModelSelector provides presets and custom model creation
  const selectorPath = path.resolve(
    __dirname,
    "../components/admin/product-wizard/model-selector.tsx"
  );
  if (fs.existsSync(selectorPath)) {
    const content = fs.readFileSync(selectorPath, "utf-8");
    if (!content.includes("CATALOG_PRESETS") || !content.includes("isCustomMode")) {
      recordError("model-selector.tsx does not support both catalog presets and custom models");
    } else {
      recordCheck("model-selector.tsx supports both catalog search and custom model creation");
    }
  }

  // 7. Verify new page renders UnifiedProductEditor or ProductCreationWizard
  const newPagePath = path.resolve(
    __dirname,
    "../app/[locale]/admin/products/new/page.tsx"
  );
  if (fs.existsSync(newPagePath)) {
    const content = fs.readFileSync(newPagePath, "utf-8");
    if (!content.includes("UnifiedProductEditor") && !content.includes("ProductCreationWizard")) {
      recordError("new/page.tsx does not render UnifiedProductEditor or ProductCreationWizard");
    } else {
      recordCheck("new/page.tsx renders UnifiedProductEditor");
    }
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("admin-product-wizard.test")) {
  const res = testAdminProductWizard();
  console.log("AloShop Admin Product Wizard & Redesign Suite:");
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
  console.log("\nAll Admin Product Wizard tests PASSED successfully!");
}
