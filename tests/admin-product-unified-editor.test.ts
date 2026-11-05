import assert from "node:assert";
import * as fs from "node:fs";

export function testUnifiedProductEditorIntegration() {
  console.log("Starting Unified Product Editor integration audit...");

  const editorPath = "components/admin/product-editor/unified-product-editor.tsx";
  assert.ok(fs.existsSync(editorPath), `${editorPath} must exist`);

  const editorContent = fs.readFileSync(editorPath, "utf-8");

  // Verify Desktop 70/30 (8 cols / 4 cols in 12-col grid)
  assert.ok(
    editorContent.includes("lg:col-span-8") && editorContent.includes("lg:col-span-4"),
    "UnifiedProductEditor must implement 70/30 grid layout (lg:col-span-8 and lg:col-span-4)"
  );

  // Verify integration with createProductAction
  assert.ok(
    editorContent.includes("createProductAction"),
    "UnifiedProductEditor must integrate createProductAction"
  );

  // Verify integration with all 5 sections
  assert.ok(editorContent.includes("BasicInfoSection"), "Must include BasicInfoSection");
  assert.ok(editorContent.includes("SpecsSection"), "Must include SpecsSection");
  assert.ok(editorContent.includes("VariantsSection"), "Must include VariantsSection");
  assert.ok(editorContent.includes("MediaSection"), "Must include MediaSection");
  assert.ok(editorContent.includes("DescriptionSeoSection"), "Must include DescriptionSeoSection");
  assert.ok(editorContent.includes("StickySidebarSummary"), "Must include StickySidebarSummary");

  // Verify zero emojis
  const emojiRegex = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
  assert.ok(!emojiRegex.test(editorContent), "UnifiedProductEditor must strictly adhere to zero emojis policy");

  // Verify page.tsx integration
  const pagePath = "app/[locale]/admin/products/new/page.tsx";
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert.ok(
    pageContent.includes("UnifiedProductEditor"),
    "app/[locale]/admin/products/new/page.tsx must render UnifiedProductEditor"
  );

  console.log("All Unified Product Editor integration checks PASSED!");
}

testUnifiedProductEditorIntegration();

