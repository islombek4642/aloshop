import assert from "node:assert";
import { BasicInfoSection } from "../components/admin/product-editor/basic-info-section";
import { SpecsSection } from "../components/admin/product-editor/specs-section";
import { VariantsSection } from "../components/admin/product-editor/variants-section";
import { MediaSection } from "../components/admin/product-editor/media-section";
import { DescriptionSeoSection } from "../components/admin/product-editor/description-seo-section";
import { StickySidebarSummary } from "../components/admin/product-editor/sticky-sidebar-summary";

export function testProductEditorComponents() {
  console.log("Testing Admin Product Editor modular sub-components exports...");

  assert.strictEqual(typeof BasicInfoSection, "function", "BasicInfoSection must be a functional component");
  assert.strictEqual(typeof SpecsSection, "function", "SpecsSection must be a functional component");
  assert.strictEqual(typeof VariantsSection, "function", "VariantsSection must be a functional component");
  assert.strictEqual(typeof MediaSection, "function", "MediaSection must be a functional component");
  assert.strictEqual(typeof DescriptionSeoSection, "function", "DescriptionSeoSection must be a functional component");
  assert.strictEqual(typeof StickySidebarSummary, "function", "StickySidebarSummary must be a functional component");

  console.log("All 6 modular sub-components verified successfully!");
}

testProductEditorComponents();
