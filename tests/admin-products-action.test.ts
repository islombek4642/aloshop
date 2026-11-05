import { createProductSchema, variantInputSchema } from "../lib/validations/admin-products";

export function verifyAdminProductAction(): {
  success: boolean;
  checks: string[];
  errors: string[];
} {
  const checks: string[] = [];
  const errors: string[] = [];

  // 1. Verify variantInputSchema includes RAM & costPrice
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
    costPrice: 8500000,
    images: ["/images/products/test.png"],
  });

  if (!variantTest.success) {
    errors.push(`variantInputSchema failed: ${JSON.stringify(variantTest.error.issues)}`);
  } else {
    if (variantTest.data.ram !== "8GB") {
      errors.push("variantInputSchema did not capture 'ram' field");
    } else if (variantTest.data.costPrice !== 8500000) {
      errors.push("variantInputSchema did not capture 'costPrice' field");
    } else {
      checks.push("variantInputSchema successfully validates and captures 'ram' and 'costPrice'");
    }
  }

  // 2. Verify createProductSchema accepts hardware specification fields & costPrice & shortDesc
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
    costPrice: 12000000,
    isDraft: false,
    shortDescUz: "Ajoyib flagman telefon",
    shortDescRu: "Отличный флагманский телефон",
    shortDescEn: "Great flagship phone",
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
        costPrice: 13000000,
        images: ["/images/products/test.png"],
      },
    ],
  });

  if (!productTest.success) {
    errors.push(`createProductSchema failed with hardware specs: ${JSON.stringify(productTest.error.issues)}`);
  } else {
    const data = productTest.data;
    if (
      data.costPrice !== 12000000 ||
      data.isDraft !== false ||
      data.shortDescUz !== "Ajoyib flagman telefon"
    ) {
      errors.push("createProductSchema omitted costPrice, isDraft or shortDescUz");
    } else {
      checks.push("createProductSchema successfully validates costPrice, isDraft, and shortDesc");
    }
  }

  // 3. Verify draft mode with minimal fields (Title, Brand, Category)
  const draftTest = createProductSchema.safeParse({
    brand: "Apple",
    modelName: "iPhone 17 Draft",
    categoryId: "cat-123",
    isDraft: true,
  });

  if (!draftTest.success) {
    errors.push(`createProductSchema failed to accept draft with minimal fields: ${JSON.stringify(draftTest.error.issues)}`);
  } else {
    if (draftTest.data.isDraft !== true) {
      errors.push("createProductSchema did not preserve isDraft=true flag");
    } else {
      checks.push("createProductSchema successfully accepts minimal draft payload");
    }
  }

  // 4. Verify USED condition accepts valid 15-digit IMEI and battery health
  const usedValidTest = createProductSchema.safeParse({
    brand: "Apple",
    modelName: "iPhone 13 B/U",
    categoryId: "cat-123",
    condition: "USED",
    imei: "123456789012345",
    batteryHealth: 88,
    usedConditionGrade: "A",
    descriptionUz: "Yaxshi holatda",
    descriptionRu: "В хорошем состоянии",
    descriptionEn: "Good condition",
    variants: [
      {
        sku: "IP13-128-USED",
        colorNameUz: "Ko'k",
        colorNameRu: "Синий",
        colorNameEn: "Blue",
        colorHex: "#0000FF",
        storage: "128GB",
        condition: "USED",
        price: 5000000,
      },
    ],
  });

  if (!usedValidTest.success) {
    errors.push(`createProductSchema failed on valid USED phone: ${JSON.stringify(usedValidTest.error.issues)}`);
  } else {
    checks.push("createProductSchema accepts valid USED device with 15-digit IMEI and battery health");
  }

  // 5. Verify USED condition rejects invalid IMEI when not a draft
  const usedInvalidTest = createProductSchema.safeParse({
    brand: "Apple",
    modelName: "iPhone 13 B/U",
    categoryId: "cat-123",
    condition: "USED",
    imei: "short-imei", // invalid, not 15 digits
    isDraft: false,
    descriptionUz: "Tavsif",
    descriptionRu: "Описание",
    descriptionEn: "Description",
    variants: [
      {
        sku: "IP13-128-USED",
        colorNameUz: "Ko'k",
        colorNameRu: "Синий",
        colorNameEn: "Blue",
        colorHex: "#0000FF",
        storage: "128GB",
        condition: "USED",
        price: 5000000,
      },
    ],
  });

  if (usedInvalidTest.success) {
    errors.push("createProductSchema erroneously accepted non-15-digit IMEI for published USED device");
  } else {
    checks.push("createProductSchema strictly rejects invalid IMEI for published USED device");
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
