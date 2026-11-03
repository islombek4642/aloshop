import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const PUBLIC_PRODUCTS_DIR = path.join(ROOT_DIR, "public", "images", "products");

// SVG Smartphone Placeholder with clean neutral aesthetic
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="#f8fafc"/>
  <rect x="120" y="50" width="160" height="300" rx="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="130" y="66" width="140" height="268" rx="18" fill="#f1f5f9"/>
  <rect x="175" y="58" width="50" height="8" rx="4" fill="#94a3b8"/>
  <circle cx="200" cy="315" r="8" fill="#cbd5e1"/>
  <path d="M170 170 L230 230 M230 170 L170 230" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
</svg>`;

function copyDirRecursive(src: string, dest: string, extensionFilter?: string): number {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });

  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath, extensionFilter);
    } else if (entry.isFile()) {
      if (!extensionFilter || entry.name.endsWith(extensionFilter)) {
        fs.copyFileSync(srcPath, destPath);
        count++;
      }
    }
  }

  return count;
}

export function syncProductAssets(): {
  appleCopied: number;
  samsungCopied: number;
  placeholderCreated: boolean;
} {
  fs.mkdirSync(PUBLIC_PRODUCTS_DIR, { recursive: true });

  // 1. Write placeholder images
  const placeholderSvgPath = path.join(PUBLIC_PRODUCTS_DIR, "placeholder.svg");
  const placeholderWebpPath = path.join(PUBLIC_PRODUCTS_DIR, "placeholder.webp");
  fs.writeFileSync(placeholderSvgPath, PLACEHOLDER_SVG, "utf-8");
  // Also write SVG content as placeholder.webp so any existing reference to placeholder.webp succeeds
  fs.writeFileSync(placeholderWebpPath, PLACEHOLDER_SVG, "utf-8");

  // 2. Sync Apple assets
  const appleSrc = path.join(DATA_DIR, "apple");
  const appleDest = path.join(PUBLIC_PRODUCTS_DIR, "apple");
  const appleCopied = copyDirRecursive(appleSrc, appleDest, ".png");

  // 3. Sync Samsung assets
  const samsungSrc = path.join(DATA_DIR, "samsung");
  const samsungDest = path.join(PUBLIC_PRODUCTS_DIR, "samsung");
  const samsungCopied = copyDirRecursive(samsungSrc, samsungDest, ".png");

  console.log(`Synced product assets:`);
  console.log(`- Apple PNGs copied: ${appleCopied}`);
  console.log(`- Samsung PNGs copied: ${samsungCopied}`);
  console.log(`- Placeholder assets created at ${PUBLIC_PRODUCTS_DIR}`);

  return {
    appleCopied,
    samsungCopied,
    placeholderCreated: true,
  };
}

if (require.main === module || process.argv[1]?.includes("sync-product-assets")) {
  syncProductAssets();
}

