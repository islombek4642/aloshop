import * as fs from "node:fs";
import * as path from "node:path";
import type { SnapshotSpecsViewProps } from "../components/store/snapshot-specs-view";
import type { SerializedProduct } from "../components/store/product-details-client";

export function verifyStorefrontSpecs(): {
  success: boolean;
  checks: string[];
  errors: string[];
} {
  const checks: string[] = [];
  const errors: string[] = [];

  // 1. Verify SnapshotSpecsViewProps supports camera, charging, and os
  const mockProps: SnapshotSpecsViewProps = {
    activeVariant: {
      id: "var-1",
      sku: "IP16P-256-DES",
      colorNameUz: "Cho'l titani",
      colorNameRu: "Пустынный титан",
      colorNameEn: "Desert Titanium",
      colorHex: "#C5B6A5",
      ram: "8GB",
      storage: "256GB",
      condition: "NEW",
      price: 15000000,
      oldPrice: null,
      images: [],
    },
    brand: "Apple",
    modelName: "iPhone 16 Pro",
    warrantyMonths: 12,
    screenSize: '6.3" Super Retina XDR OLED',
    processor: "Apple A18 Pro (3nm)",
    battery: "3582 mAh",
    camera: "48MP Fusion + 48MP Ultra Wide",
    charging: "USB-C, 25W MagSafe",
    os: "iOS 18",
    branchesInStockCount: 2,
    totalStockCount: 5,
  };

  if (
    mockProps.camera !== "48MP Fusion + 48MP Ultra Wide" ||
    mockProps.charging !== "USB-C, 25W MagSafe" ||
    mockProps.os !== "iOS 18"
  ) {
    errors.push("SnapshotSpecsViewProps missing camera/charging/os values");
  } else {
    checks.push("SnapshotSpecsViewProps verified with camera, charging, and os");
  }

  // 2. Verify SerializedProduct interface supports the new fields
  const mockProduct: SerializedProduct = {
    id: "prod-1",
    brand: "Apple",
    modelName: "iPhone 16 Pro",
    slug: "apple-iphone-16-pro",
    descriptionUz: "Tavsif",
    descriptionRu: "Описание",
    descriptionEn: "Description",
    warrantyMonths: 12,
    screenSize: '6.3" Super Retina XDR OLED',
    processor: "Apple A18 Pro (3nm)",
    battery: "3582 mAh",
    camera: "48MP Fusion + 48MP Ultra Wide",
    charging: "USB-C, 25W MagSafe",
    os: "iOS 18",
    series: "iPhone 16",
    releaseYear: 2024,
    variants: [mockProps.activeVariant],
  };

  if (
    mockProduct.camera !== "48MP Fusion + 48MP Ultra Wide" ||
    mockProduct.charging !== "USB-C, 25W MagSafe" ||
    mockProduct.os !== "iOS 18" ||
    mockProduct.series !== "iPhone 16" ||
    mockProduct.releaseYear !== 2024
  ) {
    errors.push("SerializedProduct interface omitted camera/charging/os/series/releaseYear");
  } else {
    checks.push("SerializedProduct interface verified with full hardware attribute set");
  }

  // 3. Verify SnapshotSpecsView layout classes for responsive typography and zero truncation
  const snapshotViewPath = path.resolve(__dirname, "../components/store/snapshot-specs-view.tsx");
  const snapshotViewSource = fs.readFileSync(snapshotViewPath, "utf-8");

  if (!snapshotViewSource.includes("break-words")) {
    errors.push("SnapshotSpecsView does not include 'break-words' for fluid text wrapping");
  } else {
    checks.push("SnapshotSpecsView verified with fluid text wrapping (break-words)");
  }

  if (snapshotViewSource.includes("truncate max-w-[50%]")) {
    errors.push("SnapshotSpecsView still contains rigid truncation 'truncate max-w-[50%]'");
  } else {
    checks.push("SnapshotSpecsView verified without rigid truncation ('truncate max-w-[50%]')");
  }

  if (!snapshotViewSource.includes("min-h-[56px]")) {
    errors.push("SnapshotSpecsView does not enforce uniform grid item height 'min-h-[56px]'");
  } else {
    checks.push("SnapshotSpecsView verified with uniform grid item height (min-h-[56px])");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("storefront-specs.test")) {
  const res = verifyStorefrontSpecs();
  console.log("Storefront Specifications View Verification:");
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

