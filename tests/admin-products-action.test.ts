import { createProductSchema, variantInputSchema } from "../app/actions/admin-products";

export function verifyAdminProductAction(): {
  success: boolean;
  checks: string[];
  errors: string[];
} {
  const checks: string[] = [];
  const errors: string[] = [];

  // 1. Verify variantInputSchema includes RAM
  const variantTest = variantInputSchema.safeParse({
    sku: "TEST-SKU",
    colorNameUz: "Qora",
    colorNameRu: "Черный",
    colorNameEn: "Black",
    colorHex: "#000000",
    ram: "8GB",
    storage: "128GB",
    condition: "NEW",
    price: 10000000,
    images: ["/images/products/test.png"],
  });

  if (!variantTest.success) {
    errors.push(`variantInputSchema failed: ${JSON.stringify(variantTest.error.issues)}`);
  } else {
    if (variantTest.data.ram !== "8GB") {
      errors.push("variantInputSchema did not capture 'ram' field");
    } else {
      checks.push("variantInputSchema successfully validates and captures 'ram'");
    }
  }

  // 2. Verify createProductSchema accepts hardware specification fields
  const productTest = createProductSchema.safeParse({
    brand: "Apple",
    modelName: "iPhone 16 Pro",
    series: "iPhone 16",
    releaseYear: 2024,
    screenSize: '6.3" Super Retina XDR OLED',
    processor: "Apple A18 Pro (3nm)",
    battery: "3582 mAh",
    camera: "48MP Fusion + 48MP Ultra Wide",
    charging: "USB-C, 25W MagSafe",
    os: "iOS 18",
    specs: { ipRating: "IP68", nitsPeak: 2000 },
    categoryId: "cat-123",
    warrantyMonths: 12,
    descriptionUz: "Test tavsif",
    descriptionRu: "Тестовое описание",
    descriptionEn: "Test description",
    variants: [
      {
        sku: "IP16P-256-DES",
        colorNameUz: "Cho'l titani",
        colorNameRu: "Пустынный титан",
        colorNameEn: "Desert Titanium",
        colorHex: "#C5B6A5",
        ram: "8GB",
        storage: "256GB",
        condition: "NEW",
        price: 15000000,
        images: ["/images/products/test.png"],
      },
    ],
  });

  if (!productTest.success) {
    errors.push(`createProductSchema failed with hardware specs: ${JSON.stringify(productTest.error.issues)}`);
  } else {
    const data = productTest.data;
    if (
      data.camera !== "48MP Fusion + 48MP Ultra Wide" ||
      data.charging !== "USB-C, 25W MagSafe" ||
      data.os !== "iOS 18" ||
      data.series !== "iPhone 16" ||
      data.releaseYear !== 2024 ||
      data.screenSize !== '6.3" Super Retina XDR OLED' ||
      data.processor !== "Apple A18 Pro (3nm)" ||
      data.battery !== "3582 mAh"
    ) {
      errors.push("createProductSchema omitted one or more hardware fields from parsed output");
    } else {
      checks.push("createProductSchema successfully validates all 8 hardware & series fields");
    }
  }

  // 3. Verify resilient fallback when optional hardware specs are omitted
  const minimalProductTest = createProductSchema.safeParse({
    brand: "Generic",
    modelName: "Basic Phone",
    categoryId: "cat-123",
    descriptionUz: "Oddiy telefon",
    descriptionRu: "Простой телефон",
    descriptionEn: "Basic phone",
    variants: [
      {
        sku: "GEN-64-BLK",
        colorNameUz: "Qora",
        colorNameRu: "Черный",
        colorNameEn: "Black",
        colorHex: "#000000",
        storage: "64GB",
        price: 1000000,
      },
    ],
  });

  if (!minimalProductTest.success) {
    errors.push(`createProductSchema failed on minimal payload: ${JSON.stringify(minimalProductTest.error.issues)}`);
  } else {
    checks.push("createProductSchema accepts minimal payload with optional hardware specs omitted");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("admin-products-action.test")) {
  const res = verifyAdminProductAction();
  console.log("Admin Products Action & Zod Validation Suite:");
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
}
