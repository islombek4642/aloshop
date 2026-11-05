import { CATALOG_PRESETS, type CatalogPreset } from "./presets";
import type { ProductCardData, ProductCardVariant } from "@/components/store/product-card";
import type { SerializedProduct } from "@/components/store/product-details-client";
import type { ProductVariantData } from "@/components/store/variant-selector";

/**
 * Deterministically estimates market retail prices in UZS based on phone tier.
 */
function estimatePrice(preset: CatalogPreset, storage: string): { price: number; oldPrice: number | null } {
  const m = preset.modelName.toLowerCase();
  const b = preset.brand.toLowerCase();

  let basePrice = 12000000;

  if (b.includes("apple")) {
    if (m.includes("18 pro max")) basePrice = 21000000;
    else if (m.includes("18 pro")) basePrice = 18500000;
    else if (m.includes("17 pro max")) basePrice = 19500000;
    else if (m.includes("17 pro")) basePrice = 17500000;
    else if (m.includes("17")) basePrice = 13500000;
    else if (m.includes("16 pro max")) basePrice = 18200000;
    else if (m.includes("16 pro")) basePrice = 16200000;
    else if (m.includes("16 plus")) basePrice = 13200000;
    else if (m.includes("16")) basePrice = 11800000;
    else if (m.includes("15 pro max")) basePrice = 15800000;
    else if (m.includes("15 pro")) basePrice = 13800000;
    else if (m.includes("15")) basePrice = 10400000;
    else if (m.includes("14 pro max")) basePrice = 13500000;
    else if (m.includes("14 pro")) basePrice = 12000000;
    else if (m.includes("14")) basePrice = 9200000;
    else if (m.includes("13 pro max")) basePrice = 11500000;
    else if (m.includes("13 pro")) basePrice = 10200000;
    else if (m.includes("13 mini")) basePrice = 7800000;
    else if (m.includes("13")) basePrice = 8200000;
    else if (m.includes("se")) basePrice = 5800000;
  } else if (b.includes("samsung")) {
    if (m.includes("s26 ultra")) basePrice = 18500000;
    else if (m.includes("s26+")) basePrice = 15500000;
    else if (m.includes("s26")) basePrice = 12500000;
    else if (m.includes("s25 ultra")) basePrice = 16800000;
    else if (m.includes("s25+")) basePrice = 14200000;
    else if (m.includes("s25")) basePrice = 11200000;
    else if (m.includes("fe")) basePrice = 8500000;
    else if (m.includes("a57") || m.includes("a56")) basePrice = 5200000;
    else if (m.includes("a37") || m.includes("a36")) basePrice = 4100000;
    else if (m.includes("a27") || m.includes("a26")) basePrice = 3200000;
    else if (m.includes("a18") || m.includes("a17")) basePrice = 2400000;
    else if (m.includes("a08") || m.includes("a07")) basePrice = 1600000;
  }

  // Storage bump
  let multiplier = 1;
  if (storage.includes("256")) multiplier = 1.1;
  else if (storage.includes("512")) multiplier = 1.25;
  else if (storage.includes("1TB") || storage.includes("1tb")) multiplier = 1.45;

  const finalPrice = Math.round((basePrice * multiplier) / 10000) * 10000;
  const hasDiscount = finalPrice % 200000 === 0;
  const oldPrice = hasDiscount ? finalPrice + 800000 : null;

  return { price: finalPrice, oldPrice };
}

/**
 * Converts CatalogPreset into a storefront ProductCardData.
 */
export function presetToProductCard(preset: CatalogPreset): ProductCardData {
  const defaultStorage = preset.storageOptions[0] || "128GB";
  const { price, oldPrice } = estimatePrice(preset, defaultStorage);
  const normalizedRam = preset.ram?.match(/(\d+\s*GB)/i)?.[1].replace(/\s+/g, "").toUpperCase() || preset.ram;

  const variants: ProductCardVariant[] = preset.colors.map((c, i) => {
    const images = c.imageUrl ? [c.imageUrl] : ["/images/products/placeholder.webp"];
    return {
      id: `${preset.id}-var-${i}`,
      sku: `${preset.modelName.slice(0, 3).toUpperCase()}-${defaultStorage}-${c.nameEn.slice(0, 3).toUpperCase()}`,
      colorNameUz: c.nameUz,
      colorNameRu: c.nameRu,
      colorNameEn: c.nameEn,
      colorHex: c.hex,
      ram: normalizedRam,
      storage: defaultStorage,
      condition: "NEW",
      price,
      oldPrice,
      images,
      inventory: [
        { quantity: 4, branch: { name: "Malika", slug: "malika" } },
        { quantity: 2, branch: { name: "Chilonzor", slug: "chilonzor" } },
        { quantity: 1, branch: { name: "Buyuk Ipak Yo'li", slug: "buyuk-ipak-yoli" } },
      ],
    };
  });

  return {
    id: preset.id,
    brand: preset.brand,
    modelName: preset.modelName,
    slug: preset.slug,
    warrantyMonths: preset.warrantyMonths,
    screenSize: preset.screenSize,
    processor: preset.processor,
    battery: preset.battery,
    variants,
  };
}

/**
 * Converts CatalogPreset into a rich SerializedProduct for the product details page.
 */
export function presetToSerializedProduct(preset: CatalogPreset): SerializedProduct {
  const allVariants: ProductVariantData[] = [];
  const normalizedRam = preset.ram?.match(/(\d+\s*GB)/i)?.[1].replace(/\s+/g, "").toUpperCase() || preset.ram;

  for (const storage of preset.storageOptions) {
    const { price, oldPrice } = estimatePrice(preset, storage);

    for (const c of preset.colors) {
      const images = c.imageUrl ? [c.imageUrl] : ["/images/products/placeholder.webp"];
      allVariants.push({
        id: `${preset.id}-${storage}-${c.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        sku: `${preset.modelName.slice(0, 4).toUpperCase()}-${storage}-${c.nameEn.slice(0, 3).toUpperCase()}`,
        colorNameUz: c.nameUz,
        colorNameRu: c.nameRu,
        colorNameEn: c.nameEn,
        colorHex: c.hex,
        ram: normalizedRam,
        storage,
        condition: "NEW",
        price,
        oldPrice,
        images,
        inventory: [
          {
            branchId: "b1",
            quantity: 3,
            branch: {
              id: "b1",
              name: "Malika Savdo Markazi",
              slug: "malika",
              address: "Navoiy shoh ko'chasi, Malika SM, A-blok 14-do'kon",
              phone: "+998 71 200 11 22",
              workingHours: "09:00 - 20:00",
            },
          },
          {
            branchId: "b2",
            quantity: 2,
            branch: {
              id: "b2",
              name: "Chilonzor filiali",
              slug: "chilonzor",
              address: "Chilonzor 9-mavze, Qatortol ko'chasi 1-uy",
              phone: "+998 71 200 33 44",
              workingHours: "09:00 - 21:00",
            },
          },
          {
            branchId: "b3",
            quantity: 1,
            branch: {
              id: "b3",
              name: "Buyuk Ipak Yo'li filiali",
              slug: "buyuk-ipak-yoli",
              address: "Mirzo Ulug'bek shoh ko'chasi, Maksim Gorkiy metro bekati yaqinida",
              phone: "+998 71 200 55 66",
              workingHours: "09:00 - 21:00",
            },
          },
        ],
      });
    }
  }

  return {
    id: preset.id,
    brand: preset.brand,
    modelName: preset.modelName,
    slug: preset.slug,
    descriptionUz: preset.descriptionUz,
    descriptionRu: preset.descriptionRu,
    descriptionEn: preset.descriptionEn,
    warrantyMonths: preset.warrantyMonths,
    screenSize: preset.screenSize,
    processor: preset.processor,
    battery: preset.battery,
    camera: preset.camera,
    charging: preset.charging,
    os: preset.os,
    series: preset.series,
    releaseYear: preset.releaseYear,
    category: {
      id: "cat-smartphones",
      nameUz: "Smartfonlar",
      nameRu: "Смартфоны",
      nameEn: "Smartphones",
      slug: "smartphones",
    },
    variants: allVariants,
  };
}

/**
 * Returns all presets converted to ProductCardData.
 */
export function getAllFallbackProducts(): ProductCardData[] {
  return CATALOG_PRESETS.map(presetToProductCard);
}

/**
 * Returns featured top flagship presets (e.g. for Homepage).
 */
export function getFeaturedFallbackProducts(): ProductCardData[] {
  const featuredIds = [
    "apple-iphone-16-pro",
    "samsung-galaxy-s25-ultra",
    "apple-iphone-16",
    "samsung-galaxy-s25-plus",
    "apple-iphone-15-pro",
    "samsung-galaxy-a56-5g",
    "apple-iphone-15",
    "samsung-galaxy-s25",
  ];

  const presets = CATALOG_PRESETS.filter((p) => featuredIds.includes(p.id));
  return (presets.length > 0 ? presets : CATALOG_PRESETS.slice(0, 8)).map(presetToProductCard);
}

/**
 * Finds a preset by slug and converts it to a full SerializedProduct.
 */
export function getFallbackProductBySlug(slug: string): SerializedProduct | null {
  const clean = slug.toLowerCase().trim().replace(/^(apple-|samsung-)/, "");
  const found = CATALOG_PRESETS.find((p) => {
    const pSlug = p.slug.toLowerCase();
    const pId = p.id.toLowerCase();
    return (
      pSlug === slug.toLowerCase() ||
      pId === slug.toLowerCase() ||
      pSlug.includes(clean) ||
      p.modelName.toLowerCase().replace(/[^a-z0-9]+/g, "-").includes(clean)
    );
  });

  return found ? presetToSerializedProduct(found) : null;
}

