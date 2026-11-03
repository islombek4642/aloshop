import { CATALOG_PRESETS } from "@/lib/catalog/presets";
/**
 * Hardware specifications helper for AloShop.
 * Strict TypeScript mode: no `any`, zero Unicode emojis, localized formatting support.
 */

export interface DeviceVitals {
  screenSize: string;
  processor: string;
  battery: string;
  defaultRam: string;
}

export interface KnownDeviceSpec {
  brand: string;
  modelMatch: RegExp;
  screenSize: string;
  processor: string;
  battery: string;
  ramByStorage?: Record<string, string>;
  defaultRam: string;
}

export const KNOWN_DEVICES: KnownDeviceSpec[] = [
  // Apple iPhone 15 Pro / Pro Max
  {
    brand: "Apple",
    modelMatch: /iphone\s*15\s*pro/i,
    screenSize: '6.1" Super Retina XDR OLED (120Hz ProMotion)',
    processor: "Apple A17 Pro (3nm)",
    battery: "3274 mAh",
    defaultRam: "8GB",
  },
  // Apple iPhone 15 / 15 Plus
  {
    brand: "Apple",
    modelMatch: /iphone\s*15(\s*plus)?/i,
    screenSize: '6.1" Super Retina XDR OLED',
    processor: "Apple A16 Bionic (4nm)",
    battery: "3349 mAh",
    defaultRam: "6GB",
  },
  // Apple iPhone 16 Pro / Pro Max
  {
    brand: "Apple",
    modelMatch: /iphone\s*16\s*pro/i,
    screenSize: '6.3" Super Retina XDR OLED (120Hz ProMotion)',
    processor: "Apple A18 Pro (3nm)",
    battery: "3582 mAh",
    defaultRam: "8GB",
  },
  // Apple iPhone 16 / 16 Plus
  {
    brand: "Apple",
    modelMatch: /iphone\s*16/i,
    screenSize: '6.1" Super Retina XDR OLED',
    processor: "Apple A18 (3nm)",
    battery: "3561 mAh",
    defaultRam: "8GB",
  },
  // Apple iPhone 14 Pro / Pro Max
  {
    brand: "Apple",
    modelMatch: /iphone\s*14\s*pro/i,
    screenSize: '6.1" Super Retina XDR OLED (120Hz ProMotion)',
    processor: "Apple A16 Bionic (4nm)",
    battery: "3200 mAh",
    defaultRam: "6GB",
  },
  // Apple iPhone 14 / 14 Plus
  {
    brand: "Apple",
    modelMatch: /iphone\s*14/i,
    screenSize: '6.1" Super Retina XDR OLED',
    processor: "Apple A15 Bionic (5nm)",
    battery: "3279 mAh",
    defaultRam: "6GB",
  },
  // Apple iPhone 13 Pro / Pro Max
  {
    brand: "Apple",
    modelMatch: /iphone\s*13\s*pro/i,
    screenSize: '6.1" Super Retina XDR OLED (120Hz ProMotion)',
    processor: "Apple A15 Bionic (5nm)",
    battery: "3095 mAh",
    defaultRam: "6GB",
  },
  // Apple iPhone 13
  {
    brand: "Apple",
    modelMatch: /iphone\s*13/i,
    screenSize: '6.1" Super Retina XDR OLED',
    processor: "Apple A15 Bionic (5nm)",
    battery: "3227 mAh",
    defaultRam: "4GB",
  },
  // Samsung Galaxy S24 Ultra
  {
    brand: "Samsung",
    modelMatch: /galaxy\s*s24\s*ultra/i,
    screenSize: '6.8" Dynamic AMOLED 2X (120Hz)',
    processor: "Snapdragon 8 Gen 3 for Galaxy (4nm)",
    battery: "5000 mAh",
    defaultRam: "12GB",
  },
  // Samsung Galaxy S24+
  {
    brand: "Samsung",
    modelMatch: /galaxy\s*s24\s*\+/i,
    screenSize: '6.7" Dynamic AMOLED 2X (120Hz)',
    processor: "Exynos 2400 / Snapdragon 8 Gen 3",
    battery: "4900 mAh",
    defaultRam: "12GB",
  },
  // Samsung Galaxy S24
  {
    brand: "Samsung",
    modelMatch: /galaxy\s*s24/i,
    screenSize: '6.2" Dynamic AMOLED 2X (120Hz)',
    processor: "Exynos 2400 / Snapdragon 8 Gen 3",
    battery: "4000 mAh",
    defaultRam: "8GB",
  },
  // Samsung Galaxy S23 Ultra
  {
    brand: "Samsung",
    modelMatch: /galaxy\s*s23\s*ultra/i,
    screenSize: '6.8" Dynamic AMOLED 2X (120Hz)',
    processor: "Snapdragon 8 Gen 2 for Galaxy (4nm)",
    battery: "5000 mAh",
    ramByStorage: {
      "256GB": "8GB",
      "512GB": "12GB",
      "1TB": "12GB",
    },
    defaultRam: "12GB",
  },
  // Samsung Galaxy Z Fold 5 / 6
  {
    brand: "Samsung",
    modelMatch: /galaxy\s*z\s*fold/i,
    screenSize: '7.6" Dynamic AMOLED 2X (120Hz Foldable)',
    processor: "Snapdragon 8 Gen 3 (4nm)",
    battery: "4400 mAh",
    defaultRam: "12GB",
  },
  // Samsung Galaxy Z Flip 5 / 6
  {
    brand: "Samsung",
    modelMatch: /galaxy\s*z\s*flip/i,
    screenSize: '6.7" Dynamic AMOLED 2X (120Hz Foldable)',
    processor: "Snapdragon 8 Gen 3 (4nm)",
    battery: "4000 mAh",
    defaultRam: "8GB",
  },
  // Xiaomi 14 Ultra
  {
    brand: "Xiaomi",
    modelMatch: /xiaomi\s*14\s*ultra/i,
    screenSize: '6.73" LTPO AMOLED (120Hz)',
    processor: "Snapdragon 8 Gen 3 (4nm)",
    battery: "5000 mAh",
    defaultRam: "16GB",
  },
  // Xiaomi 14 / 14 Pro
  {
    brand: "Xiaomi",
    modelMatch: /xiaomi\s*14/i,
    screenSize: '6.36" LTPO OLED (120Hz)',
    processor: "Snapdragon 8 Gen 3 (4nm)",
    battery: "4610 mAh",
    ramByStorage: {
      "256GB": "12GB",
      "512GB": "12GB",
      "1TB": "16GB",
    },
    defaultRam: "12GB",
  },
  // Xiaomi 13 / 13 Pro
  {
    brand: "Xiaomi",
    modelMatch: /xiaomi\s*13/i,
    screenSize: '6.36" OLED (120Hz)',
    processor: "Snapdragon 8 Gen 2 (4nm)",
    battery: "4500 mAh",
    defaultRam: "8GB",
  },
];

const GENERIC_VITALS: Record<string, DeviceVitals> = {
  Apple: {
    screenSize: '6.1" Super Retina XDR OLED',
    processor: "Apple Bionic / Pro Chip",
    battery: "3200 mAh",
    defaultRam: "6GB",
  },
  Samsung: {
    screenSize: '6.6" Dynamic AMOLED (120Hz)',
    processor: "Octa-Core Flagship Processor",
    battery: "5000 mAh",
    defaultRam: "8GB",
  },
  Xiaomi: {
    screenSize: '6.67" AMOLED (120Hz)',
    processor: "Snapdragon Octa-Core",
    battery: "5000 mAh",
    defaultRam: "8GB",
  },
};

const ABSOLUTE_FALLBACK_VITALS: DeviceVitals = {
  screenSize: '6.5" OLED Display (120Hz)',
  processor: "Octa-Core High Performance",
  battery: "5000 mAh",
  defaultRam: "8GB",
};

/**
 * Infers default RAM capacity for a device based on brand, model name, and storage.
 * Follows real-world manufacturer specifications.
 *
 * @param brand Brand name (e.g. "Apple", "Samsung", "Xiaomi")
 * @param modelName Model name (e.g. "iPhone 15 Pro", "Galaxy S24 Ultra")
 * @param storage Optional storage string (e.g. "128GB", "256GB", "512GB", "1TB")
 * @returns Normalized RAM string (e.g. "8GB", "6GB", "12GB", "16GB")
 */
export function inferDefaultRam(
  brand: string,
  modelName: string,
  storage?: string
): string {
  const cleanBrand = (brand || "").trim().toLowerCase();
  const cleanModel = (modelName || "").trim().toLowerCase();
  const normalizedStorage = (storage || "").trim().toUpperCase();

  // 1. Check verified official presets
  const presetMatch = CATALOG_PRESETS.find(
    (p) =>
      p.brand.toLowerCase() === cleanBrand &&
      (p.modelName.toLowerCase() === cleanModel ||
       cleanModel.includes(p.modelName.toLowerCase()) ||
       p.modelName.toLowerCase().includes(cleanModel))
  );
  if (presetMatch && presetMatch.ram) {
    return presetMatch.ram;
  }

  // 2. Check legacy known devices catalogue
  const matched = KNOWN_DEVICES.find(
    (d) =>
      d.brand.toLowerCase() === cleanBrand &&
      d.modelMatch.test(cleanModel)
  );

  if (matched) {
    if (normalizedStorage && matched.ramByStorage?.[normalizedStorage]) {
      return matched.ramByStorage[normalizedStorage];
    }
    return matched.defaultRam;
  }

  // 2. Brand-specific heuristics
  if (cleanBrand === "apple" || cleanModel.includes("iphone")) {
    if (cleanModel.includes("16") || cleanModel.includes("15 pro")) {
      return "8GB";
    }
    if (cleanModel.includes("pro") || cleanModel.includes("plus") || cleanModel.includes("15")) {
      return "6GB";
    }
    return "6GB";
  }

  if (cleanBrand === "samsung" || cleanModel.includes("galaxy")) {
    if (cleanModel.includes("ultra") || cleanModel.includes("fold")) {
      return "12GB";
    }
    if (cleanModel.includes("+") || cleanModel.includes("plus")) {
      return "12GB";
    }
    return "8GB";
  }

  if (cleanBrand === "xiaomi" || cleanModel.includes("xiaomi") || cleanModel.includes("redmi") || cleanModel.includes("poco")) {
    if (cleanModel.includes("ultra")) {
      return "16GB";
    }
    if (cleanModel.includes("pro") || cleanModel.includes("14")) {
      return "12GB";
    }
    return "8GB";
  }

  // 3. Storage-based fallback heuristic for high tier capacities
  if (normalizedStorage.includes("1TB")) {
    return "16GB";
  }
  if (normalizedStorage.includes("512GB")) {
    return "12GB";
  }

  return "8GB";
}

/**
 * Returns typed device vitals (screenSize, processor, battery, defaultRam)
 * for a given brand and modelName.
 */
export function getDeviceVitals(brand: string, modelName: string): DeviceVitals {
  const cleanBrand = (brand || "").trim().toLowerCase();
  const cleanModel = (modelName || "").trim().toLowerCase();

  // 1. Check verified official presets
  const preset = CATALOG_PRESETS.find(
    (p) =>
      p.brand.toLowerCase() === cleanBrand &&
      (p.modelName.toLowerCase() === cleanModel ||
       cleanModel.includes(p.modelName.toLowerCase()) ||
       p.modelName.toLowerCase().includes(cleanModel))
  );

  if (preset) {
    return {
      screenSize: preset.screenSize,
      processor: preset.processor,
      battery: preset.battery,
      defaultRam: preset.ram || "8GB",
    };
  }

  const matched = KNOWN_DEVICES.find(
    (d) =>
      d.brand.toLowerCase() === cleanBrand &&
      d.modelMatch.test(cleanModel)
  );

  if (matched) {
    return {
      screenSize: matched.screenSize,
      processor: matched.processor,
      battery: matched.battery,
      defaultRam: matched.defaultRam,
    };
  }

  for (const [key, vitals] of Object.entries(GENERIC_VITALS)) {
    if (key.toLowerCase() === cleanBrand) {
      return vitals;
    }
  }

  return ABSOLUTE_FALLBACK_VITALS;
}

/**
 * Formats a RAM string cleanly (e.g. "8gb" -> "8GB", "8" -> "8GB").
 */
export function formatRam(ram?: string | null): string {
  if (!ram) return "";
  const trimmed = ram.trim();
  if (!trimmed) return "";
  if (/^\d+$/i.test(trimmed)) {
    return `${trimmed}GB`;
  }
  return trimmed.toUpperCase();
}

/**
 * Formats storage string cleanly (e.g. "256gb" -> "256GB").
 */
export function formatStorage(storage?: string | null): string {
  if (!storage) return "";
  const trimmed = storage.trim();
  if (!trimmed) return "";
  if (/^\d+$/i.test(trimmed)) {
    return `${trimmed}GB`;
  }
  return trimmed.toUpperCase();
}
