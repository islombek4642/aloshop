import { Prisma } from "@prisma/client";
import assert from "node:assert";

export function testProductSchemaExtensions() {
  console.log("Starting Product & ProductVariant schema extension audit...");

  const productModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "Product");
  assert.ok(productModel, "Product model must be defined in Prisma DMMF");

  const variantModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "ProductVariant");
  assert.ok(variantModel, "ProductVariant model must be defined in Prisma DMMF");

  const costPrice = productModel.fields.find((f) => f.name === "costPrice");
  assert.ok(costPrice, "Product model must include costPrice field");
  assert.strictEqual(costPrice.type, "Decimal", "Product.costPrice must be Decimal");
  assert.strictEqual(costPrice.isRequired, false, "Product.costPrice must be optional (nullable)");

  const isDraft = productModel.fields.find((f) => f.name === "isDraft");
  assert.ok(isDraft, "Product model must include isDraft field");
  assert.strictEqual(isDraft.type, "Boolean", "Product.isDraft must be Boolean");
  assert.strictEqual(isDraft.default, false, "Product.isDraft must default to false");

  const shortDescUz = productModel.fields.find((f) => f.name === "shortDescUz");
  assert.ok(shortDescUz, "Product model must include shortDescUz field");

  const variantCostPrice = variantModel.fields.find((f) => f.name === "costPrice");
  assert.ok(variantCostPrice, "ProductVariant model must include costPrice field");
  assert.strictEqual(variantCostPrice.type, "Decimal", "ProductVariant.costPrice must be Decimal");
  assert.strictEqual(variantCostPrice.isRequired, false, "ProductVariant.costPrice must be optional (nullable)");

  console.log("All Product & ProductVariant schema extensions verified successfully!");
}

testProductSchemaExtensions();
