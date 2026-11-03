import { CATALOG_PRESETS } from "./presets-data";
import type { CatalogPreset, CatalogPresetColor } from "./types";

export type { CatalogPreset, CatalogPresetColor };

/**
 * Returns all available smartphone presets.
 */
export function getCatalogPresets(): CatalogPreset[] {
  return CATALOG_PRESETS;
}

/**
 * Returns distinct brands present in catalog presets.
 */
export function getCatalogBrands(): string[] {
  const brands = new Set<string>();
  for (const preset of CATALOG_PRESETS) {
    brands.add(preset.brand);
  }
  return Array.from(brands);
}

/**
 * Returns presets filtered by brand name (case-insensitive).
 */
export function getPresetsByBrand(brand: string): CatalogPreset[] {
  const clean = brand.trim().toLowerCase();
  return CATALOG_PRESETS.filter((p) => p.brand.toLowerCase() === clean);
}

/**
 * Returns a specific preset by brand and model name.
 */
export function getPresetByModel(
  brand: string,
  modelName: string
): CatalogPreset | undefined {
  const cleanBrand = brand.trim().toLowerCase();
  const cleanModel = modelName.trim().toLowerCase();

  return CATALOG_PRESETS.find(
    (p) =>
      p.brand.toLowerCase() === cleanBrand &&
      p.modelName.toLowerCase() === cleanModel
  );
}

/**
 * Generates a clean, standard uppercase SKU.
 * Format: [PREFIX]-[STORAGE]-[COLOR_CODE]
 * Examples:
 *   - Apple iPhone 16 Pro, 256GB, Desert Titanium -> IP16P-256-DES
 *   - Samsung Galaxy S25 Ultra, 512GB, Phantom Black -> S25U-512-BLK
 */
export function generateSku(
  brand: string,
  modelName: string,
  storage: string,
  colorName: string
): string {
  const b = brand.trim().toLowerCase();
  const m = modelName.trim().toUpperCase();

  let modelPrefix = "";

  if (b.includes("apple") || m.includes("IPHONE")) {
    const numMatch = m.match(/\d+/);
    const num = numMatch ? numMatch[0] : "";
    const isPro = m.includes("PRO");
    const isMax = m.includes("MAX");
    const isPlus = m.includes("PLUS");
    const isMini = m.includes("MINI");
    const isSe = m.includes("SE");

    if (isSe) {
      modelPrefix = "IPSE";
    } else if (isPro && isMax) {
      modelPrefix = `IP${num}PM`;
    } else if (isPro) {
      modelPrefix = `IP${num}P`;
    } else if (isPlus) {
      modelPrefix = `IP${num}PL`;
    } else if (isMini) {
      modelPrefix = `IP${num}M`;
    } else {
      modelPrefix = `IP${num || "PH"}`;
    }
  } else if (b.includes("samsung") || m.includes("GALAXY")) {
    const sMatch = m.match(/S(\d+)/i);
    const aMatch = m.match(/A(\d+)/i);
    const isUltra = m.includes("ULTRA");
    const isPlus = m.includes("+") || m.includes("PLUS");
    const isFe = m.includes("FE");

    if (sMatch) {
      const num = sMatch[1];
      if (isUltra) modelPrefix = `S${num}U`;
      else if (isPlus) modelPrefix = `S${num}P`;
      else if (isFe) modelPrefix = `S${num}FE`;
      else modelPrefix = `S${num}`;
    } else if (aMatch) {
      const num = aMatch[1];
      modelPrefix = `A${num}`;
    } else {
      modelPrefix = "SAM";
    }
  } else {
    modelPrefix = m.replace(/[^A-Z0-9]/g, "").slice(0, 4) || "DEV";
  }

  // Storage clean: "256GB" -> "256", "1TB" -> "1TB"
  const cleanStorage = storage.toUpperCase().replace(/\s+/g, "").replace(/GB$/, "") || "128";

  // Color code: first 3 letters uppercase
  const cleanColor = colorName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3) || "STD";

  return `${modelPrefix}-${cleanStorage}-${cleanColor}`;
}
