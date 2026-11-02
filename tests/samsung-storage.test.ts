import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { normalizeImageUrl, saveProductToDisk } from "../scripts/lib/samsung-storage";

async function runTests() {
  console.log("Starting samsung-storage unit tests...");

  // Image URL normalization
  assert.strictEqual(
    normalizeImageUrl("//images.samsung.com/is/image/sample.png"),
    "https://images.samsung.com/is/image/sample.png"
  );
  assert.strictEqual(
    normalizeImageUrl("https://images.samsung.com/sample.jpg"),
    "https://images.samsung.com/sample.jpg"
  );

  // Disk saving mock test
  const testBaseDir = path.join("data", "test-storage");
  if (fs.existsSync(testBaseDir)) {
    fs.rmSync(testBaseDir, { recursive: true, force: true });
  }

  const mockProduct = {
    familyId: "test-fam-1",
    marketingName: "Galaxy S24 Test",
    categorySubTypeCode: "01010100",
    series: "galaxy-s" as const,
    modelCodes: ["SM-S921TEST"],
    models: [
      {
        modelCode: "SM-S921TEST",
        displayName: "Galaxy S24 Test",
        colorName: "Onyx Black",
        colorCode: "black",
        thumbUrl: "//images.samsung.com/sample-thumb.png",
        galleryImages: [],
      },
    ],
  };

  const mockSpecs = {
    screenSize: '6.2" Dynamic AMOLED 2X',
    processor: "Exynos 2400",
    battery: "4000 mAh",
    ram: "8GB",
    storage: "128GB, 256GB",
    camera: "50MP + 12MP + 10MP",
  };

  const result = await saveProductToDisk({
    baseDir: testBaseDir,
    product: mockProduct,
    specs: mockSpecs,
    downloadImages: false,
  });

  assert.ok(fs.existsSync(result.specsFile), "specs.json must exist on disk");
  const writtenSpecs = JSON.parse(fs.readFileSync(result.specsFile, "utf8"));
  assert.strictEqual(writtenSpecs.marketingName, "Galaxy S24 Test");
  assert.strictEqual(writtenSpecs.specs.processor, "Exynos 2400");

  // Clean up test dir
  fs.rmSync(testBaseDir, { recursive: true, force: true });

  console.log("All samsung-storage unit tests PASSED successfully!");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});

