import fs from "node:fs";
import path from "node:path";
import type { CatalogPreset, CatalogPresetColor } from "../lib/catalog/types";

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");

// Color dictionary mapping English names to Uzbek & Russian
const COLOR_TRANSLATIONS: Record<string, { uz: string; ru: string }> = {
  // Titanium colors
  "Desert Titanium": { uz: "Cho'l titani", ru: "Пустынный титан" },
  "Natural Titanium": { uz: "Tabiiy titan", ru: "Натуральный титан" },
  "White Titanium": { uz: "Oq titan", ru: "Белый титан" },
  "Black Titanium": { uz: "Qora titan", ru: "Черный титан" },
  "Titanium Black": { uz: "Titan qora", ru: "Титановый черный" },
  "Titanium Gray": { uz: "Titan kulrang", ru: "Титановый серый" },
  "Titanium Violet": { uz: "Titan binafsha", ru: "Титановый фиолетовый" },
  "Titanium Yellow": { uz: "Titan sariq", ru: "Титановый желтый" },

  // Standard Apple colors
  "Blue": { uz: "Moviy", ru: "Синий" },
  "Midnight": { uz: "To'q ko'k (Midnight)", ru: "Темная ночь (Midnight)" },
  "Starlight": { uz: "Yulduz yog'dusi (Starlight)", ru: "Сияющая звезда (Starlight)" },
  "Pink": { uz: "Pushti", ru: "Розовый" },
  "Green": { uz: "Yashil", ru: "Зеленый" },
  "Alpine Green": { uz: "Alp yashili", ru: "Альпийский зеленый" },
  "Sierra Blue": { uz: "Sierra moviy", ru: "Небесно-голубой" },
  "Gold": { uz: "Tilla rang", ru: "Золотой" },
  "Silver": { uz: "Kumush rang", ru: "Серебристый" },
  "Graphite": { uz: "Grafit", ru: "Графитовый" },
  "Space Black": { uz: "Kosmik qora", ru: "Космический черный" },
  "Space Gray": { uz: "Kosmik kulrang", ru: "Космический серый" },
  "Deep Purple": { uz: "To'q binafsha", ru: "Темно-фиолетовый" },
  "Purple": { uz: "Binafsha rang", ru: "Фиолетовый" },
  "Yellow": { uz: "Sariq", ru: "Желтый" },
  "(PRODUCT)RED": { uz: "Qizil (PRODUCT)RED", ru: "Красный (PRODUCT)RED" },
  "Product Red": { uz: "Qizil (PRODUCT)RED", ru: "Красный (PRODUCT)RED" },
  "Teal": { uz: "Moviy-yashil (Teal)", ru: "Бирюзовый (Teal)" },
  "Ultramarine": { uz: "Ultramarin", ru: "Ультрамарин" },
  "Cosmic Orange": { uz: "Kosmik to'q sariq", ru: "Космический оранжевый" },
  "Deep Blue": { uz: "To'q moviy", ru: "Глубокий синий" },
  "Lavender": { uz: "Lavanda", ru: "Лаванда" },
  "Mist Blue": { uz: "Tumanli moviy", ru: "Туманно-синий" },
  "Sage": { uz: "Mavrak yashili (Sage)", ru: "Шалфей (Sage)" },
  "Burgundy": { uz: "To'q qizil (Burgundy)", ru: "Бордовый (Burgundy)" },
  "Glacier": { uz: "Muzlik kumush (Glacier)", ru: "Ледниковый (Glacier)" },
  "Black": { uz: "Qora", ru: "Черный" },
  "White": { uz: "Oq", ru: "Белый" },

  // Samsung specific colors
  "Phantom Black": { uz: "Qora (Phantom Black)", ru: "Черный (Phantom Black)" },
  "Cobalt Violet": { uz: "Kobalt binafsha", ru: "Кобальтовый фиолетовый" },
  "Pistachio": { uz: "Pista yashili", ru: "Фисташковый" },
  "Jetblack": { uz: "Qop-qora (Jetblack)", ru: "Глубокий черный (Jetblack)" },
  "Blueblack": { uz: "Moviy-qora", ru: "Сине-черный" },
  "Awesome Olive": { uz: "Zaytun yashili", ru: "Оливковый" },
  "Awesome Lilac": { uz: "Nilufar rang", ru: "Сиреневый" },
  "Awesome Iceblue": { uz: "Muzli moviy", ru: "Ледяной голубой" },
  "Awesome Navy": { uz: "To'q ko'k (Navy)", ru: "Темно-синий" },
  "Awesome Lightgray": { uz: "Och kulrang", ru: "Светло-серый" },
  "Awesome Black": { uz: "Qora", ru: "Черный" },
  "Awesome Graphite": { uz: "Grafit", ru: "Графит" },
  "Awesome White": { uz: "Oq", ru: "Белый" },
  "Awesome Pink": { uz: "Pushti", ru: "Розовый" },
  "Awesome Gold": { uz: "Tilla rang", ru: "Золотой" },
  "Awesome Blue": { uz: "Moviy", ru: "Синий" },
};

function translateColor(colorName: string): { uz: string; ru: string; en: string } {
  const trimmed = colorName.trim();
  const matched = COLOR_TRANSLATIONS[trimmed];
  if (matched) {
    return { uz: matched.uz, ru: matched.ru, en: trimmed };
  }
  return { uz: trimmed, ru: trimmed, en: trimmed };
}

// Clean Samsung hardware parameters
function normalizeSamsungSpecs(modelName: string, rawSpecs: Record<string, unknown>) {
  const name = modelName.toLowerCase();

  // Flagships: S25 Ultra, S26 Ultra
  if (name.includes("s25 ultra") || name.includes("s26 ultra")) {
    return {
      screenSize: '6.9" Dynamic AMOLED 2X (120Hz, 2600 nits)',
      processor: "Qualcomm Snapdragon 8 Elite for Galaxy (3nm)",
      ram: "12GB",
      battery: "5000 mAh (45W tezkor simli, 15W simsiz)",
      camera: "200MP asosiy + 50MP periskop (5x) + 50MP ultra-keng + 10MP telephoto (3x)",
      charging: "45W simli USB-C, 15W simsiz Fast Wireless 2.0",
      os: "Android 15 (One UI 7.0)",
      storageOptions: ["256GB", "512GB", "1TB"],
      releaseYear: name.includes("s26") ? 2026 : 2025,
    };
  }

  // S25+ / S26+
  if (name.includes("s25+") || name.includes("s25 plus") || name.includes("s26+") || name.includes("s26 plus")) {
    return {
      screenSize: '6.7" Dynamic AMOLED 2X (120Hz, 2600 nits)',
      processor: "Qualcomm Snapdragon 8 Elite / Exynos 2500 (3nm)",
      ram: "12GB",
      battery: "4900 mAh (45W tezkor quvvatlash)",
      camera: "50MP asosiy + 12MP ultra-keng + 10MP telephoto (3x)",
      charging: "45W simli USB-C, 15W simsiz",
      os: "Android 15 (One UI 7.0)",
      storageOptions: ["256GB", "512GB"],
      releaseYear: name.includes("s26") ? 2026 : 2025,
    };
  }

  // S25 / S26 Base
  if (name.includes("s25") || name.includes("s26")) {
    const isFe = name.includes("fe");
    return {
      screenSize: isFe ? '6.4" Dynamic AMOLED 2X (120Hz)' : '6.2" Dynamic AMOLED 2X (120Hz)',
      processor: "Qualcomm Snapdragon 8 Elite / Exynos 2500 (3nm)",
      ram: "8GB",
      battery: isFe ? "4700 mAh (25W quvvatlash)" : "4000 mAh (25W quvvatlash)",
      camera: "50MP asosiy + 12MP ultra-keng + 10MP telephoto (3x)",
      charging: "25W simli USB-C, 15W simsiz",
      os: "Android 15 (One UI 7.0)",
      storageOptions: ["128GB", "256GB"],
      releaseYear: name.includes("s26") ? 2026 : 2025,
    };
  }

  // Galaxy A56 / A57
  if (name.includes("a56") || name.includes("a57")) {
    return {
      screenSize: '6.6" Super AMOLED (120Hz, 1000 nits)',
      processor: "Samsung Exynos 1580 (4nm)",
      ram: "8GB",
      battery: "5000 mAh (45W tezkor quvvatlash)",
      camera: "50MP OIS asosiy + 12MP ultra-keng + 5MP makro",
      charging: "45W USB-C",
      os: "Android 15 (One UI 7.0)",
      storageOptions: ["128GB", "256GB"],
      releaseYear: name.includes("a57") ? 2026 : 2025,
    };
  }

  // Galaxy A36 / A37
  if (name.includes("a36") || name.includes("a37")) {
    return {
      screenSize: '6.6" Super AMOLED (120Hz)',
      processor: "Samsung Exynos 1480 (4nm)",
      ram: "8GB",
      battery: "5000 mAh (25W tezkor quvvatlash)",
      camera: "50MP OIS asosiy + 8MP ultra-keng + 5MP makro",
      charging: "25W USB-C",
      os: "Android 15 (One UI 7.0)",
      storageOptions: ["128GB", "256GB"],
      releaseYear: name.includes("a37") ? 2026 : 2025,
    };
  }

  // Galaxy A26 / A27
  if (name.includes("a26") || name.includes("a27")) {
    return {
      screenSize: '6.5" Super AMOLED (120Hz)',
      processor: "Samsung Exynos 1280 (5nm)",
      ram: "6GB",
      battery: "5000 mAh (25W tezkor quvvatlash)",
      camera: "50MP OIS asosiy + 8MP ultra-keng + 2MP makro",
      charging: "25W USB-C",
      os: "Android 15 (One UI 7.0)",
      storageOptions: ["128GB", "256GB"],
      releaseYear: name.includes("a27") ? 2026 : 2025,
    };
  }

  // Budget A-series (A07, A08, A17, A18)
  const isA1x = name.includes("a17") || name.includes("a18");
  return {
    screenSize: isA1x ? '6.5" Super AMOLED (90Hz)' : '6.7" PLS LCD (90Hz)',
    processor: isA1x ? "MediaTek Helio G99 (6nm)" : "MediaTek Helio G85",
    ram: isA1x ? "6GB" : "4GB",
    battery: "5000 mAh (25W quvvatlash)",
    camera: isA1x ? "50MP asosiy + 5MP ultra-keng + 2MP makro" : "50MP asosiy + 2MP chuqurlik",
    charging: "25W USB-C",
    os: "Android 15 (One UI Core)",
    storageOptions: isA1x ? ["128GB", "256GB"] : ["64GB", "128GB"],
    releaseYear: name.includes("a08") || name.includes("a18") ? 2026 : 2025,
  };
}

export function generateAllPresets(): CatalogPreset[] {
  const presets: CatalogPreset[] = [];

  // 1. Process Apple Models
  const appleDir = path.join(DATA_DIR, "apple");
  const appleSeriesDirs = fs.readdirSync(appleDir, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const sDir of appleSeriesDirs) {
    const sPath = path.join(appleDir, sDir.name);
    const modelDirs = fs.readdirSync(sPath, { withFileTypes: true }).filter((d) => d.isDirectory());

    for (const mDir of modelDirs) {
      const specsPath = path.join(sPath, mDir.name, "specs.json");
      if (!fs.existsSync(specsPath)) continue;

      const raw = JSON.parse(fs.readFileSync(specsPath, "utf-8"));
      const colors: CatalogPresetColor[] = (raw.colors || []).map((c: { name: string; hex: string; imageFile: string; imageUrl: string }) => {
        const trans = translateColor(c.name);
        const localImgPath = `/images/products/apple/${sDir.name}/${mDir.name}/images/${c.imageFile}`;
        return {
          nameUz: trans.uz,
          nameRu: trans.ru,
          nameEn: trans.en,
          hex: c.hex,
          imageFile: c.imageFile,
          imageUrl: fs.existsSync(path.join(ROOT_DIR, "public", localImgPath.slice(1))) ? localImgPath : c.imageUrl,
        };
      });

      const preset: CatalogPreset = {
        id: `apple-${raw.modelCode || mDir.name}`,
        brand: "Apple",
        series: raw.series || sDir.name.replace("-", " ").toUpperCase(),
        modelName: raw.model || mDir.name,
        slug: `apple-${mDir.name}`,
        releaseYear: raw.releaseYear || 2024,
        screenSize: raw.specs?.screenSize || '6.1" Super Retina XDR OLED',
        processor: raw.specs?.processor || "Apple Bionic Chip",
        ram: raw.specs?.ram || "8GB",
        battery: raw.specs?.battery || "3274 mAh",
        camera: raw.specs?.camera || "48MP asosiy kamera",
        charging: raw.specs?.charging || "USB-C, 25W MagSafe",
        os: raw.specs?.os || "iOS 18",
        warrantyMonths: 12,
        descriptionUz: `Apple ${raw.model || mDir.name} smartfoni. ${raw.specs?.screenSize || ""}, ${raw.specs?.processor || ""} protsessori va ${raw.specs?.camera || ""} bilan jihozlangan.`,
        descriptionRu: `Смартфон Apple ${raw.model || mDir.name}. Оснащен экраном ${raw.specs?.screenSize || ""}, процессором ${raw.specs?.processor || ""} и камерой ${raw.specs?.camera || ""}.`,
        descriptionEn: `Apple ${raw.model || mDir.name} smartphone featuring ${raw.specs?.screenSize || ""}, ${raw.specs?.processor || ""} chip, and ${raw.specs?.camera || ""}.`,
        colors,
        storageOptions: raw.storageOptions || ["128GB", "256GB", "512GB"],
      };

      presets.push(preset);
    }
  }

  // 2. Process Samsung Models
  const samsungDir = path.join(DATA_DIR, "samsung");
  const samsungSeriesDirs = fs.readdirSync(samsungDir, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const sDir of samsungSeriesDirs) {
    const sPath = path.join(samsungDir, sDir.name);
    const modelDirs = fs.readdirSync(sPath, { withFileTypes: true }).filter((d) => d.isDirectory());

    for (const mDir of modelDirs) {
      const specsPath = path.join(sPath, mDir.name, "specs.json");
      if (!fs.existsSync(specsPath)) continue;

      const raw = JSON.parse(fs.readFileSync(specsPath, "utf-8"));
      const modelName = raw.marketingName || mDir.name;
      const cleanSpecs = normalizeSamsungSpecs(modelName, raw.specs || {});

      // Unique colors from variants
      const colorMap = new Map<string, CatalogPresetColor>();
      for (const v of raw.variants || []) {
        if (!v.colorName || colorMap.has(v.colorName)) continue;
        const trans = translateColor(v.colorName);
        const safeColorFile = v.colorName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const localImgPath = `/images/products/samsung/${sDir.name}/${mDir.name}/images/${safeColorFile}-thumb.png`;
        const hasLocal = fs.existsSync(path.join(ROOT_DIR, "public", localImgPath.slice(1)));

        colorMap.set(v.colorName, {
          nameUz: trans.uz,
          nameRu: trans.ru,
          nameEn: trans.en,
          hex: v.colorCode || "#000000",
          imageFile: `${safeColorFile}-thumb.png`,
          imageUrl: hasLocal ? localImgPath : v.thumbUrl,
        });
      }

      const colors = Array.from(colorMap.values());

      const preset: CatalogPreset = {
        id: `samsung-${mDir.name}`,
        brand: "Samsung",
        series: sDir.name === "galaxy-s" ? "Galaxy S" : "Galaxy A",
        modelName,
        slug: `samsung-${mDir.name}`,
        releaseYear: cleanSpecs.releaseYear,
        screenSize: cleanSpecs.screenSize,
        processor: cleanSpecs.processor,
        ram: cleanSpecs.ram,
        battery: cleanSpecs.battery,
        camera: cleanSpecs.camera,
        charging: cleanSpecs.charging,
        os: cleanSpecs.os,
        warrantyMonths: 12,
        descriptionUz: `Samsung ${modelName} smartfoni. ${cleanSpecs.screenSize} ekran, ${cleanSpecs.processor} protsessori, ${cleanSpecs.camera} kamera va ${cleanSpecs.battery} batareyaga ega.`,
        descriptionRu: `Смартфон Samsung ${modelName}. Экран ${cleanSpecs.screenSize}, процессор ${cleanSpecs.processor}, камера ${cleanSpecs.camera}, аккумулятор ${cleanSpecs.battery}.`,
        descriptionEn: `Samsung ${modelName} smartphone featuring ${cleanSpecs.screenSize} display, ${cleanSpecs.processor} chip, ${cleanSpecs.camera} camera, and ${cleanSpecs.battery} battery.`,
        colors,
        storageOptions: cleanSpecs.storageOptions,
      };

      presets.push(preset);
    }
  }

  // Sort: Apple then Samsung, flagship to budget
  presets.sort((a, b) => {
    if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
    return b.releaseYear - a.releaseYear || a.modelName.localeCompare(b.modelName);
  });

  return presets;
}

function writePresetsDataFile() {
  const presets = generateAllPresets();
  const fileContent = `// AUTO-GENERATED - AloShop Curated Smartphone Catalog Presets
// Strict TypeScript, Zero Unicode Emojis
import type { CatalogPreset } from "./types";

export const CATALOG_PRESETS: CatalogPreset[] = ${JSON.stringify(presets, null, 2)};
`;

  const targetPath = path.join(ROOT_DIR, "lib", "catalog", "presets-data.ts");
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, fileContent, "utf-8");
  console.log(`Successfully generated lib/catalog/presets-data.ts (${presets.length} presets).`);
}

if (require.main === module || process.argv[1]?.includes("generate-catalog-presets")) {
  writePresetsDataFile();
}
