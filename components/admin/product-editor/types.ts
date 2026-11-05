export interface BranchItem {
  id: string;
  name: string;
}

export interface CategoryItem {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  slug: string;
}

export interface EditorVariant {
  id: string;
  sku: string;
  colorNameUz: string;
  colorNameRu: string;
  colorNameEn: string;
  colorHex: string;
  ram: string;
  storage: string;
  condition: "NEW" | "USED";
  price: number;
  costPrice: number | null;
  oldPrice: number | null;
  images: string[];
  stockByBranch: Record<string, number>;
  imei?: string;
}

export interface ProductEditorState {
  title: string;
  brand: string;
  categoryId: string;
  condition: "NEW" | "USED";
  skuPrefix: string;
  warrantyMonths: number;
  series: string;
  releaseYear: number | null;
  screenSize: string;
  processor: string;
  battery: string;
  camera: string;
  charging: string;
  os: string;
  imei: string;
  batteryHealth: number | null;
  usedConditionGrade: string;
  shortDescUz: string;
  shortDescRu: string;
  shortDescEn: string;
  descriptionUz: string;
  descriptionRu: string;
  descriptionEn: string;
  slug: string;
  thumbnail: string;
  galleryImages: string[];
  variants: EditorVariant[];
  basePrice: number;
  costPrice: number | null;
  oldPrice: number | null;
  isActive: boolean;
  isDraft: boolean;
}
