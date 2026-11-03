import fs from "node:fs";
import path from "node:path";
import nextConfig from "../next.config";

export function verifyStaticAssets(): {
  success: boolean;
  checks: string[];
  errors: string[];
} {
  const checks: string[] = [];
  const errors: string[] = [];
  const rootDir = process.cwd();

  // 1. Verify placeholder image in public directory
  const placeholderPath = path.join(rootDir, "public", "images", "products", "placeholder.webp");
  const placeholderSvgPath = path.join(rootDir, "public", "images", "products", "placeholder.svg");
  if (fs.existsSync(placeholderPath) || fs.existsSync(placeholderSvgPath)) {
    checks.push("Product placeholder image verified in public/images/products/");
  } else {
    errors.push("Missing placeholder image in public/images/products/ (placeholder.webp or placeholder.svg)");
  }

  // 2. Verify Apple public assets directory
  const applePublicDir = path.join(rootDir, "public", "images", "products", "apple");
  if (!fs.existsSync(applePublicDir)) {
    errors.push("Missing directory: public/images/products/apple");
  } else {
    const appleFiles = fs.readdirSync(applePublicDir, { recursive: true }) as string[];
    const pngFiles = appleFiles.filter((f) => f.toString().endsWith(".png"));
    if (pngFiles.length < 50) {
      errors.push(`Apple assets count too low: expected at least 50 PNGs, found ${pngFiles.length}`);
    } else {
      checks.push(`Apple assets verified (${pngFiles.length} PNG files in public/images/products/apple/)`);
    }
  }

  // 3. Verify Samsung public assets directory
  const samsungPublicDir = path.join(rootDir, "public", "images", "products", "samsung");
  if (!fs.existsSync(samsungPublicDir)) {
    errors.push("Missing directory: public/images/products/samsung");
  } else {
    const samsungFiles = fs.readdirSync(samsungPublicDir, { recursive: true }) as string[];
    const pngFiles = samsungFiles.filter((f) => f.toString().endsWith(".png"));
    if (pngFiles.length < 50) {
      errors.push(`Samsung assets count too low: expected at least 50 PNGs, found ${pngFiles.length}`);
    } else {
      checks.push(`Samsung assets verified (${pngFiles.length} PNG files in public/images/products/samsung/)`);
    }
  }

  // 4. Verify Next.js Remote Patterns for Apple & Samsung CDNs
  const remotePatterns = nextConfig.images?.remotePatterns || [];
  const hostnames = remotePatterns.map((p: { hostname?: string }) => p.hostname);

  if (hostnames.includes("store.storeimages.cdn-apple.com")) {
    checks.push("Next.js remote pattern 'store.storeimages.cdn-apple.com' confirmed");
  } else {
    errors.push("Missing remotePattern 'store.storeimages.cdn-apple.com' in next.config.ts");
  }

  if (hostnames.includes("images.samsung.com")) {
    checks.push("Next.js remote pattern 'images.samsung.com' confirmed");
  } else {
    errors.push("Missing remotePattern 'images.samsung.com' in next.config.ts");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("static-assets.test")) {
  const result = verifyStaticAssets();
  console.log("Static Assets & CDN Verification:");
  console.log(`Status: ${result.success ? "PASSED" : "FAILED"}`);
  for (const c of result.checks) {
    console.log(`  + ${c}`);
  }
  if (!result.success) {
    console.error("Errors found:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
}
