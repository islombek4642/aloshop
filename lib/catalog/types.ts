export interface CatalogPresetColor {
  nameUz: string;
  nameRu: string;
  nameEn: string;
  hex: string;
  imageFile?: string;
  imageUrl?: string;
}

export interface CatalogPreset {
  id: string; // masalan: "apple-iphone-16-pro", "samsung-galaxy-s25-ultra"
  brand: string; // "Apple", "Samsung"
  series: string; // "iPhone 16", "Galaxy S25"
  modelName: string; // "iPhone 16 Pro", "Galaxy S25 Ultra"
  slug: string;
  releaseYear: number;
  screenSize: string;
  processor: string;
  ram: string;
  battery: string;
  camera: string;
  charging: string;
  os: string;
  warrantyMonths: number;
  descriptionUz: string;
  descriptionRu: string;
  descriptionEn: string;
  colors: CatalogPresetColor[];
  storageOptions: string[];
}
