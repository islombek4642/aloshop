"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";

const variantInputSchema = z.object({
  sku: z.string().min(2, "SKU is required"),
  colorNameUz: z.string().min(1, "Color name UZ required"),
  colorNameRu: z.string().min(1, "Color name RU required"),
  colorNameEn: z.string().min(1, "Color name EN required"),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Valid HEX color code required"),
  storage: z.string().min(1, "Storage is required"),
  condition: z.enum(["NEW", "USED"]).default("NEW"),
  price: z.number().positive("Price must be positive"),
  oldPrice: z.number().positive().optional().nullable(),
  images: z.array(z.string()).default([]),
  initialStock: z.record(z.string(), z.number().int().min(0)).optional(),
});

const createProductSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  modelName: z.string().min(1, "Model name is required"),
  slug: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  warrantyMonths: z.number().int().min(0).default(12),
  descriptionUz: z.string().min(1, "Description UZ required"),
  descriptionRu: z.string().min(1, "Description RU required"),
  descriptionEn: z.string().min(1, "Description EN required"),
  variants: z.array(variantInputSchema).min(1, "At least one variant required"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export type CreateProductResult =
  | { success: true; productId: string }
  | { success: false; error: string };

export async function createProductAction(
  input: CreateProductInput
): Promise<CreateProductResult> {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const data = parsed.data;

  // Generate URL-friendly slug
  const baseSlug = (data.slug || `${data.brand}-${data.modelName}`)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    const existing = await prisma.product.findUnique({
      where: { slug: baseSlug },
    });

    const finalSlug = existing
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;

    const allBranches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          brand: data.brand.trim(),
          modelName: data.modelName.trim(),
          slug: finalSlug,
          categoryId: data.categoryId,
          warrantyMonths: data.warrantyMonths,
          descriptionUz: data.descriptionUz.trim(),
          descriptionRu: data.descriptionRu.trim(),
          descriptionEn: data.descriptionEn.trim(),
        },
      });

      for (const v of data.variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: v.sku.toUpperCase().trim(),
            colorNameUz: v.colorNameUz.trim(),
            colorNameRu: v.colorNameRu.trim(),
            colorNameEn: v.colorNameEn.trim(),
            colorHex: v.colorHex.trim(),
            storage: v.storage.trim(),
            condition: v.condition,
            price: v.price,
            oldPrice: v.oldPrice ?? null,
            images:
              v.images.length > 0
                ? v.images
                : ["/images/products/placeholder.webp"],
          },
        });

        // Initialize branch inventory records
        for (const branch of allBranches) {
          const qty = v.initialStock?.[branch.id] ?? 0;
          await tx.branchInventory.create({
            data: {
              branchId: branch.id,
              variantId: variant.id,
              quantity: qty,
            },
          });
        }
      }

      return product;
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/branches");
    revalidatePath("/catalog");

    return { success: true, productId: createdProduct.id };
  } catch (err) {
    console.error("createProductAction error:", err);
    return { success: false, error: "failedToCreate" };
  }
}
