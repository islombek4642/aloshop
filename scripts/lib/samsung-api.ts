/**
 * Samsung Official API Client
 * Clean TypeScript module for querying Samsung Uzbekistan's official product finder API
 * and retrieving structured device specifications and official media assets.
 * Standards: AGENTS.md, Zero Emojis Policy, Strict TypeScript.
 */

export interface SamsungModelVariant {
  modelCode: string;
  displayName: string;
  colorName: string;
  colorCode: string;
  thumbUrl: string;
  galleryImages: string[];
}

export interface SamsungProductFamily {
  familyId: string;
  marketingName: string;
  categorySubTypeCode: string;
  series: "galaxy-s" | "galaxy-z" | "galaxy-a" | "other";
  modelCodes: string[];
  models: SamsungModelVariant[];
}

export interface SamsungHardwareSpecs {
  screenSize: string | null;
  processor: string | null;
  battery: string | null;
  ram: string | null;
  storage: string | null;
  camera: string | null;
}

interface RawSpecItem {
  attrName?: string;
  attrValue?: string | null;
  attrs?: Array<{
    attrName?: string;
    attrValue?: string | null;
  }>;
}

interface RawProductItem {
  familyId?: string;
  fmyMarketingName?: string;
  categorySubTypeCode?: string;
  modelList?: Array<{
    modelCode?: string;
    displayName?: string;
    fmyChipList?: Array<{
      fmyChipCode?: string;
      fmyChipName?: string;
    }>;
    thumbUrl?: string;
    galleryImage?: string[];
  }>;
}

/**
 * Sanitizes a model marketing name into a clean URL-safe kebab-case slug.
 * e.g. "Galaxy S24 Ultra" -> "galaxy-s24-ultra"
 *      "Galaxy S24+" -> "galaxy-s24-plus"
 */
export function sanitizeModelSlug(name: string): string {
  if (!name) return "samsung-phone";

  return name
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Categorizes a Samsung smartphone into its major product line.
 */
export function determineSeries(
  marketingName: string,
  subTypeCode?: string
): "galaxy-s" | "galaxy-z" | "galaxy-a" | "other" {
  const normalized = marketingName.toLowerCase();

  if (normalized.includes("galaxy s") || normalized.includes("s2") || normalized.includes("s24") || normalized.includes("s23")) {
    return "galaxy-s";
  }

  if (normalized.includes("galaxy z") || normalized.includes("fold") || normalized.includes("flip")) {
    return "galaxy-z";
  }

  if (normalized.includes("galaxy a") || normalized.includes("a0") || normalized.includes("a1") || normalized.includes("a2") || normalized.includes("a3") || normalized.includes("a5")) {
    return "galaxy-a";
  }

  if (subTypeCode === "01010100") return "galaxy-s";
  if (subTypeCode === "01010200") return "galaxy-z";
  if (subTypeCode === "01010400") return "galaxy-a";

  return "other";
}

/**
 * Fetches the active smartphones catalog from Samsung Uzbekistan API.
 */
export async function fetchSamsungProductList(
  siteCode = "uz_ru"
): Promise<SamsungProductFamily[]> {
  const url = `https://searchapi.samsung.com/v6/front/b2c/product/finder/global?type=01010000&siteCode=${encodeURIComponent(
    siteCode
  )}&start=1&num=60&sort=newest&onlyFilterInfoYN=N&keySummaryYN=N`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: `https://www.samsung.com/${siteCode}/smartphones/all-smartphones/`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Samsung product list: HTTP ${response.status}`);
  }

  const json = await response.json();
  const rawList: RawProductItem[] = json?.response?.resultData?.productList || [];

  const families: SamsungProductFamily[] = [];

  for (const raw of rawList) {
    const marketingName = (raw.fmyMarketingName || "Samsung Galaxy").trim();
    const familyId = raw.familyId || sanitizeModelSlug(marketingName);
    const subTypeCode = raw.categorySubTypeCode || "";
    const series = determineSeries(marketingName, subTypeCode);

    const models: SamsungModelVariant[] = [];
    const modelCodes: string[] = [];

    if (Array.isArray(raw.modelList)) {
      for (const m of raw.modelList) {
        if (!m.modelCode) continue;
        modelCodes.push(m.modelCode);

        const firstChip = m.fmyChipList?.[0];
        const colorName = firstChip?.fmyChipName || "Default";
        const colorCode = firstChip?.fmyChipCode || "default";

        models.push({
          modelCode: m.modelCode,
          displayName: m.displayName || marketingName,
          colorName,
          colorCode,
          thumbUrl: m.thumbUrl || "",
          galleryImages: Array.isArray(m.galleryImage) ? m.galleryImage : [],
        });
      }
    }

    if (models.length > 0) {
      families.push({
        familyId,
        marketingName,
        categorySubTypeCode: subTypeCode,
        series,
        modelCodes,
        models,
      });
    }
  }

  return families;
}

/**
 * Fetches hardware specifications for a specific model from Samsung Uzbekistan API.
 */
export async function fetchSamsungSpecs(
  modelCode: string,
  siteCode = "uz_ru"
): Promise<SamsungHardwareSpecs> {
  const url = `https://searchapi.samsung.com/v6/front/b2c/product/spec/detail/?modelList=${encodeURIComponent(
    modelCode
  )}&siteCode=${encodeURIComponent(siteCode)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://www.samsung.com/${siteCode}/smartphones/all-smartphones/`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        screenSize: null,
        processor: null,
        battery: null,
        ram: null,
        storage: null,
        camera: null,
      };
    }

    const json = await response.json();
    const modelData = json?.response?.resultData?.modelList?.[0];
    const specItems: RawSpecItem[] = modelData?.spec?.specItems || [];

    let screenSize: string | null = null;
    let processor: string | null = null;
    let battery: string | null = null;
    let ram: string | null = null;
    let storage: string | null = null;
    let camera: string | null = null;

    for (const cat of specItems) {
      const catName = (cat.attrName || "").toLowerCase();
      const subAttrs = cat.attrs || [];

      for (const attr of subAttrs) {
        const name = (attr.attrName || "").toLowerCase();
        const val = (attr.attrValue || "").trim();
        if (!val) continue;

        if (catName.includes("экран") || name.includes("размер экрана") || name.includes("диагональ")) {
          if (!screenSize) screenSize = val;
        } else if (catName.includes("процессор") || name.includes("частота процессора") || name.includes("тип процессора")) {
          if (!processor) processor = val;
        } else if (catName.includes("аккумулятор") || catName.includes("батарея") || name.includes("емкость аккумулятора")) {
          if (!battery) battery = val;
        } else if (name.includes("озу") || name.includes("оперативная память") || name.includes("ram")) {
          if (!ram) ram = val;
        } else if (name.includes("встроенная память") || name.includes("хранилище") || name.includes("rom")) {
          if (!storage) storage = val;
        } else if (catName.includes("камера") && (name.includes("основная камера") || name.includes("разрешение"))) {
          if (!camera) camera = val;
        }
      }
    }

    return {
      screenSize,
      processor,
      battery,
      ram,
      storage,
      camera,
    };
  } catch {
    return {
      screenSize: null,
      processor: null,
      battery: null,
      ram: null,
      storage: null,
      camera: null,
    };
  }
}

