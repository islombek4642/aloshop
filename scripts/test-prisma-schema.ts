import { Prisma } from "@prisma/client";
import { verifyPrismaSchema } from "../tests/prisma-schema.test";
import { inferDefaultRam, getDeviceVitals, formatRam, formatStorage } from "../lib/utils/specs";

function runPrismaSchemaAudit(): void {
  console.log("===============================================================");
  console.log("AloShop Prisma Schema & Specs Verification");
  console.log("===============================================================\n");

  const errors: string[] = [];

  // 1. Run base Prisma Schema verification
  const baseResult = verifyPrismaSchema();
  if (!baseResult.success) {
    for (const err of baseResult.errors) {
      errors.push(`Base Schema Error: ${err}`);
    }
  } else {
    console.log("[PASS] Base Prisma Schema & Model Delegates verified");
  }

  // 2. Verify DMMF fields on Product: screenSize, processor, battery
  const productModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "Product");
  if (!productModel) {
    errors.push("Product model not found in Prisma DMMF");
  } else {
    const fieldNames = productModel.fields.map((f) => f.name);
    const requiredProductFields = ["screenSize", "processor", "battery"];
    for (const field of requiredProductFields) {
      if (!fieldNames.includes(field)) {
        errors.push(`Field '${field}' is missing from Product model in Prisma DMMF`);
      } else {
        console.log(`[PASS] Product model field '${field}' verified`);
      }
    }
  }

  // 3. Verify DMMF field on ProductVariant: ram
  const variantModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "ProductVariant");
  if (!variantModel) {
    errors.push("ProductVariant model not found in Prisma DMMF");
  } else {
    const fieldNames = variantModel.fields.map((f) => f.name);
    if (!fieldNames.includes("ram")) {
      errors.push("Field 'ram' is missing from ProductVariant model in Prisma DMMF");
    } else {
      console.log("[PASS] ProductVariant model field 'ram' verified");
    }
  }

  // 4. Verify inferDefaultRam logic
  const testCases: { brand: string; model: string; storage?: string; expected: string }[] = [
    { brand: "Apple", model: "iPhone 15 Pro", storage: "128GB", expected: "8GB" },
    { brand: "Apple", model: "iPhone 15", storage: "128GB", expected: "6GB" },
    { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "256GB", expected: "12GB" },
    { brand: "Xiaomi", model: "Xiaomi 14", storage: "256GB", expected: "12GB" },
    { brand: "Apple", model: "iPhone 16 Pro", storage: "256GB", expected: "8GB" },
    { brand: "Apple", model: "iPhone 13", storage: "128GB", expected: "4GB" },
    { brand: "GenericBrand", model: "Phone X", storage: "128GB", expected: "8GB" },
  ];

  for (const tc of testCases) {
    const actual = inferDefaultRam(tc.brand, tc.model, tc.storage);
    if (actual !== tc.expected) {
      errors.push(
        `inferDefaultRam(${tc.brand}, ${tc.model}, ${tc.storage}) expected '${tc.expected}' but got '${actual}'`
      );
    } else {
      console.log(`[PASS] inferDefaultRam: ${tc.brand} ${tc.model} -> ${actual}`);
    }
  }

  // 5. Verify getDeviceVitals and format helpers
  const vitals = getDeviceVitals("Apple", "iPhone 15 Pro");
  if (!vitals.screenSize || !vitals.processor || !vitals.battery || !vitals.defaultRam) {
    errors.push("getDeviceVitals for iPhone 15 Pro returned incomplete specs");
  } else {
    console.log(`[PASS] getDeviceVitals: iPhone 15 Pro -> Screen: ${vitals.screenSize}, Processor: ${vitals.processor}, Battery: ${vitals.battery}, RAM: ${vitals.defaultRam}`);
  }

  if (formatRam("8gb") !== "8GB" || formatRam("8") !== "8GB") {
    errors.push("formatRam helper failed formatting test");
  } else {
    console.log("[PASS] formatRam helper verified");
  }

  if (formatStorage("256gb") !== "256GB" || formatStorage("256") !== "256GB") {
    errors.push("formatStorage helper failed formatting test");
  } else {
    console.log("[PASS] formatStorage helper verified");
  }

  console.log("\n===============================================================");
  if (errors.length > 0) {
    console.error("FAILURES DETECTED:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log("ALL PRISMA SCHEMA & SPECS CHECKS PASSED SUCCESSFULLY!");
  console.log("===============================================================");
}

runPrismaSchemaAudit();
