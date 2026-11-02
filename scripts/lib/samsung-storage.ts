/**
 * Samsung Storage and Image Downloader
 * Organizes downloaded Samsung data into a hierarchical directory structure on disk:
 * data/samsung/<series>/<model-slug>/specs.json
 * data/samsung/<series>/<model-slug>/images/<color>-<view>.png
 * Standards: AGENTS.md, Zero Emojis Policy, Strict TypeScript.
 */

import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type {
  SamsungProductFamily,
  SamsungHardwareSpecs,
} from "./samsung-api";
import { sanitizeModelSlug } from "./samsung-api";

export interface SaveProductOptions {
  baseDir: string;
  product: SamsungProductFamily;
  specs: SamsungHardwareSpecs;
  downloadImages?: boolean;
  maxImagesPerModel?: number;
}

export interface SaveProductResult {
  modelFolder: string;
  specsFile: string;
  downloadedImagesCount: number;
  skippedImagesCount: number;
}

/**
 * Normalizes protocol-relative or partial image URLs to full HTTPS URLs.
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Downloads a remote image file to disk with retries and timeout handling.
 */
export async function downloadImageToFile(
  imageUrl: string,
  targetPath: string,
  retries = 3
): Promise<boolean> {
  const normalized = normalizeImageUrl(imageUrl);
  if (!normalized) return false;

  // If already exists and is non-empty, skip
  if (fs.existsSync(targetPath)) {
    try {
      const stat = fs.statSync(targetPath);
      if (stat.size > 1024) {
        return true;
      }
    } catch {
      // stat failed, proceed with re-download
    }
  }

  // Ensure target folder exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(normalized, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.samsung.com/",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Stream to temp file then rename
      const tempPath = `${targetPath}.tmp.${Date.now()}`;
      const fileStream = fs.createWriteStream(tempPath);
      // @ts-expect-error Node fetch body ReadableStream compatibility
      const readable = Readable.fromWeb(response.body);

      await pipeline(readable, fileStream);

      fs.renameSync(tempPath, targetPath);
      return true;
    } catch (err) {
      if (attempt === retries) {
        return false;
      }
      // Wait before retry
      await new Promise((res) => setTimeout(res, 600 * attempt));
    }
  }

  return false;
}

/**
 * Saves a smartphone family, its detailed specifications, and images into the target folder.
 */
export async function saveProductToDisk(
  options: SaveProductOptions
): Promise<SaveProductResult> {
  const {
    baseDir,
    product,
    specs,
    downloadImages = false,
    maxImagesPerModel = 8,
  } = options;

  const modelSlug = sanitizeModelSlug(product.marketingName);
  const seriesFolder = path.join(baseDir, product.series);
  const modelFolder = path.join(seriesFolder, modelSlug);
  const imagesFolder = path.join(modelFolder, "images");

  if (!fs.existsSync(modelFolder)) {
    fs.mkdirSync(modelFolder, { recursive: true });
  }

  // Prepare structured JSON
  const specsPayload = {
    marketingName: product.marketingName,
    slug: modelSlug,
    series: product.series,
    categorySubTypeCode: product.categorySubTypeCode,
    scrapedAt: new Date().toISOString(),
    sourceUrl: `https://www.samsung.com/uz_ru/smartphones/all-smartphones/`,
    specs,
    variants: product.models.map((m) => ({
      modelCode: m.modelCode,
      displayName: m.displayName,
      colorName: m.colorName,
      colorCode: m.colorCode,
      thumbUrl: normalizeImageUrl(m.thumbUrl),
      galleryImages: m.galleryImages.map(normalizeImageUrl),
    })),
  };

  const specsFile = path.join(modelFolder, "specs.json");
  fs.writeFileSync(specsFile, JSON.stringify(specsPayload, null, 2), "utf8");

  let downloadedImagesCount = 0;
  let skippedImagesCount = 0;

  if (downloadImages) {
    if (!fs.existsSync(imagesFolder)) {
      fs.mkdirSync(imagesFolder, { recursive: true });
    }

    // Collect images to download (limit per model)
    const imagesToFetch: Array<{ url: string; fileName: string }> = [];

    for (const variant of product.models) {
      const colorSafe = sanitizeModelSlug(variant.colorName || "default");

      if (variant.thumbUrl) {
        imagesToFetch.push({
          url: variant.thumbUrl,
          fileName: `${colorSafe}-thumb.png`,
        });
      }

      variant.galleryImages.forEach((imgUrl, idx) => {
        if (imagesToFetch.length < maxImagesPerModel) {
          imagesToFetch.push({
            url: imgUrl,
            fileName: `${colorSafe}-gallery-${idx + 1}.png`,
          });
        }
      });

      if (imagesToFetch.length >= maxImagesPerModel) break;
    }

    for (const item of imagesToFetch) {
      const filePath = path.join(imagesFolder, item.fileName);
      const success = await downloadImageToFile(item.url, filePath);
      if (success) {
        downloadedImagesCount++;
      } else {
        skippedImagesCount++;
      }
      // Polite delay between image downloads
      await new Promise((res) => setTimeout(res, 200));
    }
  }

  return {
    modelFolder,
    specsFile,
    downloadedImagesCount,
    skippedImagesCount,
  };
}
