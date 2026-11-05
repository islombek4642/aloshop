import { z } from "zod";

export const variantInputSchema = z.object({
  sku: z.string().min(2, "SKU is required"),
  colorNameUz: z.string().min(1, "Color name UZ required"),
  colorNameRu: z.string().min(1, "Color name RU required"),
  colorNameEn: z.string().min(1, "Color name EN required"),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Valid HEX color code required"),
  ram: z.string().optional(),
  storage: z.string().min(1, "Storage is required"),
  condition: z.enum(["NEW", "USED"]).optional().default("NEW"),
  price: z.number().positive("Price must be positive"),
  costPrice: z.number().positive().optional().nullable(),
  oldPrice: z.number().positive().optional().nullable(),
  images: z.array(z.string()).default([]),
  initialStock: z.record(z.string(), z.number().int().min(0)).optional(),
  imei: z.string().optional(),
});

export const createProductSchema = z
  .object({
    brand: z.string().min(1, "Brand is required"),
    modelName: z.string().min(1, "Model name is required"),
    slug: z.string().optional(),
    categoryId: z.string().optional().default(""),
    warrantyMonths: z.number().int().min(0).default(12),
    series: z.string().optional(),
    releaseYear: z.number().int().optional(),
    screenSize: z.string().optional(),
    processor: z.string().optional(),
    battery: z.string().optional(),
    camera: z.string().optional(),
    charging: z.string().optional(),
    os: z.string().optional(),
    specs: z.record(z.string(), z.unknown()).optional(),
    condition: z.enum(["NEW", "USED"]).optional().default("NEW"),
    imei: z.string().optional(),
    batteryHealth: z.number().int().min(1).max(100).optional().nullable(),
    usedConditionGrade: z.string().optional(),
    costPrice: z.number().positive().optional().nullable(),
    isDraft: z.boolean().optional().default(false),
    shortDescUz: z.string().optional(),
    shortDescRu: z.string().optional(),
    shortDescEn: z.string().optional(),
    descriptionUz: z.string().default(""),
    descriptionRu: z.string().default(""),
    descriptionEn: z.string().default(""),
    variants: z.array(variantInputSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.isDraft) {
      if (!data.categoryId || !data.categoryId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Category is required",
          path: ["categoryId"],
        });
      }
      if (!data.descriptionUz || !data.descriptionUz.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Description UZ required",
          path: ["descriptionUz"],
        });
      }
      if (!data.descriptionRu || !data.descriptionRu.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Description RU required",
          path: ["descriptionRu"],
        });
      }
      if (!data.descriptionEn || !data.descriptionEn.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Description EN required",
          path: ["descriptionEn"],
        });
      }
      if (!data.variants || data.variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one variant required",
          path: ["variants"],
        });
      }
      if (data.condition === "USED") {
        if (!data.imei || !/^\d{15}$/.test(data.imei.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "15-digit numeric IMEI is required for USED device",
            path: ["imei"],
          });
        }
      }
    }
  });

export const presetVariantInputSchema = z.object({
  colorNameUz: z.string().min(1, "Color name is required"),
  colorNameRu: z.string().optional(),
  colorNameEn: z.string().optional(),
  colorHex: z.string().optional(),
  sku: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().min(1, "Storage is required"),
  condition: z.enum(["NEW", "USED"]).optional().default("NEW"),
  price: z.number().positive("Price must be positive"),
  oldPrice: z.number().positive().optional().nullable(),
  images: z.array(z.string()).optional(),
  initialStock: z.record(z.string(), z.number().int().min(0)).optional(),
  imei: z.string().optional(),
});

export const presetProductInputSchema = z.object({
  presetId: z.string().min(1, "Preset ID is required"),
  variants: z
    .array(presetVariantInputSchema)
    .min(1, "At least one variant required"),
});

export type CreateProductInput = z.input<typeof createProductSchema>;
export type VariantInput = z.input<typeof variantInputSchema>;
export type PresetVariantInput = z.input<typeof presetVariantInputSchema>;
export type PresetProductInput = z.input<typeof presetProductInputSchema>;

