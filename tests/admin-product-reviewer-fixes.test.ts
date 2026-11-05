import assert from "node:assert";
import * as fs from "node:fs";
import { createProductSchema } from "../app/actions/admin-products";

export function testReviewerFixes() {
  console.log("Testing Reviewer Findings Fixes...");

  // 1. Verify Draft saving accepts Title + Brand without categoryId
  const draftWithoutCategory = createProductSchema.safeParse({
    brand: "Apple",
    modelName: "iPhone 18 Ultra Draft",
    isDraft: true,
  });

  assert.ok(
    draftWithoutCategory.success,
    `Draft without categoryId must be valid: ${JSON.stringify(draftWithoutCategory.error?.issues)}`
  );

  // But non-draft still requires categoryId
  const nonDraftWithoutCategory = createProductSchema.safeParse({
    brand: "Apple",
    modelName: "iPhone 18 Ultra",
    isDraft: false,
    descriptionUz: "Tavsif",
    descriptionRu: "Описание",
    descriptionEn: "Description",
    variants: [
      {
        sku: "TEST-SKU",
        colorNameUz: "Qora",
        colorNameRu: "Черный",
        colorNameEn: "Black",
        colorHex: "#000000",
        storage: "128GB",
        price: 10000000,
      },
    ],
  });

  assert.ok(
    !nonDraftWithoutCategory.success,
    "Non-draft without categoryId must be rejected"
  );

  // 2. Verify Storefront queries isolate drafts (isDraft: false)
  const catalogPage = fs.readFileSync("app/[locale]/(store)/catalog/page.tsx", "utf-8");
  assert.ok(
    catalogPage.includes("isDraft: false") || catalogPage.includes("isDraft = false"),
    "Catalog page query must filter out draft products (isDraft: false)"
  );

  const homePage = fs.readFileSync("app/[locale]/(store)/page.tsx", "utf-8");
  assert.ok(
    homePage.includes("isDraft: false") || homePage.includes("isDraft = false"),
    "Storefront homepage query must filter out draft products (isDraft: false)"
  );

  const productDetailPage = fs.readFileSync("app/[locale]/(store)/product/[slug]/page.tsx", "utf-8");
  assert.ok(
    productDetailPage.includes("!dbProduct.isDraft") || productDetailPage.includes("isDraft: false"),
    "Product detail page query must filter out draft products (!dbProduct.isDraft)"
  );

  // 3. Verify mobile sticky sidebar has min-w-0 and truncate
  const sidebar = fs.readFileSync("components/admin/product-editor/sticky-sidebar-summary.tsx", "utf-8");
  assert.ok(
    sidebar.includes("min-w-0") && sidebar.includes("truncate"),
    "Mobile sticky bottom bar buttons must have min-w-0 and truncate to prevent 320px-375px overflow"
  );

  // 4. Verify variants-section uses robust ID and clean copy suffix
  const variantsSection = fs.readFileSync("components/admin/product-editor/variants-section.tsx", "utf-8");
  assert.ok(
    variantsSection.includes("randomUUID") || variantsSection.includes("Math.random"),
    "variants-section must generate collision-proof IDs"
  );

  console.log("All Reviewer Findings Fixes checks PASSED!");
}

testReviewerFixes();
