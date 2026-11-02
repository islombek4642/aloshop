/**
 * Samsung Catalog Downloader CLI Runner
 * Automates downloading official smartphone specifications and high-res render images
 * into a structured directory tree: data/samsung/<series>/<model-slug>/
 *
 * Usage:
 *   npx tsx scripts/download-samsung.ts
 *   npx tsx scripts/download-samsung.ts --limit=2
 *   npx tsx scripts/download-samsung.ts --series=galaxy-s
 *   npx tsx scripts/download-samsung.ts --no-images
 *
 * Standards: AGENTS.md, Zero Emojis Policy, Strict TypeScript.
 */

import path from "node:path";
import {
  fetchSamsungProductList,
  fetchSamsungSpecs,
  type SamsungProductFamily,
} from "./lib/samsung-api";
import { saveProductToDisk } from "./lib/samsung-storage";

interface CommandLineOptions {
  limit?: number;
  seriesFilter?: string;
  downloadImages: boolean;
  baseDir: string;
}

function parseArgs(args: string[]): CommandLineOptions {
  let limit: number | undefined;
  let seriesFilter: string | undefined;
  let downloadImages = true;
  let baseDir = path.join("data", "samsung");

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      const val = parseInt(arg.split("=")[1], 10);
      if (!isNaN(val) && val > 0) {
        limit = val;
      }
    } else if (arg.startsWith("--series=")) {
      seriesFilter = arg.split("=")[1].trim().toLowerCase();
    } else if (arg === "--no-images") {
      downloadImages = false;
    } else if (arg.startsWith("--out=")) {
      baseDir = arg.split("=")[1].trim();
    }
  }

  return {
    limit,
    seriesFilter,
    downloadImages,
    baseDir,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("===============================================================");
  console.log("AloShop: Samsung Catalog Official Downloader");
  console.log("Source: https://www.samsung.com/uz_ru/smartphones/all-smartphones/");
  console.log(`Target directory: ${options.baseDir}`);
  console.log(`Image downloads: ${options.downloadImages ? "ENABLED" : "DISABLED"}`);
  if (options.limit) console.log(`Limit: first ${options.limit} items`);
  if (options.seriesFilter) console.log(`Series filter: ${options.seriesFilter}`);
  console.log("===============================================================\n");

  console.log("[1/3] Querying Samsung Uzbekistan Product Finder API...");
  let families: SamsungProductFamily[] = [];

  try {
    families = await fetchSamsungProductList("uz_ru");
  } catch (err) {
    console.error("FATAL: Failed to query Samsung catalog API:", err);
    process.exit(1);
  }

  console.log(`[INFO] Found ${families.length} active smartphone product families.`);

  // Apply filters
  if (options.seriesFilter) {
    families = families.filter((f) => f.series === options.seriesFilter);
    console.log(`[INFO] Filtered down to ${families.length} items for series '${options.seriesFilter}'.`);
  }

  if (options.limit && options.limit > 0) {
    families = families.slice(0, options.limit);
    console.log(`[INFO] Clamped to first ${families.length} items.`);
  }

  if (families.length === 0) {
    console.log("[WARN] No smartphone models matched criteria. Exiting.");
    return;
  }

  console.log("\n[2/3] Fetching specifications and storing assets to disk...\n");

  let totalImagesDownloaded = 0;
  let totalModelsProcessed = 0;

  for (let i = 0; i < families.length; i++) {
    const family = families[i];
    const indexStr = `[${i + 1}/${families.length}]`;
    console.log(`${indexStr} Processing: ${family.marketingName} (${family.series})`);

    // Fetch specs using the first available modelCode
    const representativeCode = family.modelCodes[0];
    let specs: {
      screenSize: string | null;
      processor: string | null;
      battery: string | null;
      ram: string | null;
      storage: string | null;
      camera: string | null;
    } = {
      screenSize: null,
      processor: null,
      battery: null,
      ram: null,
      storage: null,
      camera: null,
    };

    if (representativeCode) {
      console.log(`      Fetching specs for model code: ${representativeCode}...`);
      specs = await fetchSamsungSpecs(representativeCode, "uz_ru");
      if (specs.screenSize || specs.processor || specs.battery) {
        console.log(
          `      Specs found: Screen: ${specs.screenSize || "N/A"}, CPU: ${specs.processor || "N/A"}, Battery: ${specs.battery || "N/A"}, RAM: ${specs.ram || "N/A"}`
        );
      } else {
        console.log("      Specs: No detailed hardware specs found via API.");
      }
    }

    // Save to disk
    try {
      const saveResult = await saveProductToDisk({
        baseDir: options.baseDir,
        product: family,
        specs,
        downloadImages: options.downloadImages,
        maxImagesPerModel: 6,
      });

      totalModelsProcessed++;
      totalImagesDownloaded += saveResult.downloadedImagesCount;

      console.log(`      Saved to: ${saveResult.modelFolder}`);
      if (options.downloadImages) {
        console.log(`      Images downloaded: ${saveResult.downloadedImagesCount} (skipped: ${saveResult.skippedImagesCount})`);
      }
    } catch (saveErr) {
      console.error(`      ERROR saving ${family.marketingName}:`, saveErr);
    }

    // Polite rate-limiting between products
    await delay(350);
  }

  console.log("\n[3/3] Download and Verification Summary");
  console.log("===============================================================");
  console.log(`Total Models Processed:   ${totalModelsProcessed}`);
  console.log(`Total Images Downloaded:  ${totalImagesDownloaded}`);
  console.log(`Output Location:          ${path.resolve(options.baseDir)}`);
  console.log("===============================================================");
  console.log("Download completed successfully.");
}

main().catch((err) => {
  console.error("Unhandled error in main execution:", err);
  process.exit(1);
});

