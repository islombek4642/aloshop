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

export interface ExistingProductItem {
  id: string;
  brand: string;
  modelName: string;
  slug: string;
  categoryId: string;
  warrantyMonths: number;
  series?: string | null;
  releaseYear?: number | null;
  screenSize?: string | null;
  processor?: string | null;
  battery?: string | null;
  camera?: string | null;
  charging?: string | null;
  os?: string | null;
  descriptionUz: string;
  descriptionRu: string;
  descriptionEn: string;
}

export type DeviceCondition = "NEW" | "USED";

export type PhysicalConditionGrade = "IDEAL" | "EXCELLENT" | "GOOD" | "FAIR";

export interface NewVariantItem {
  id: string;
  sku: string;
  colorNameUz: string;
  colorNameRu: string;
  colorNameEn: string;
  colorHex: string;
  ram: string;
  storage: string;
  price: number;
  oldPrice?: number | null;
  images: string[];
  initialStock: Record<string, number>;
}

export interface UsedDeviceFormState {
  brand: string;
  modelName: string;
  categoryId: string;
  colorNameUz: string;
  colorNameRu: string;
  colorNameEn: string;
  colorHex: string;
  ram: string;
  storage: string;
  physicalCondition: PhysicalConditionGrade;
  batteryHealth: number | null;
  batteryUnavailable?: boolean;
  defects: string;
  notes: string;
  warrantyMonths: number;
  imei: string;
  sku: string;
  price: number;
  oldPrice?: number | null;
  branchId: string;
  images: string[];
  series?: string;
  screenSize?: string;
  processor?: string;
  battery?: string;
  camera?: string;
  charging?: string;
  os?: string;
}
