"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { CATALOG_PRESETS, generateSku } from "@/lib/catalog/presets";

function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully ignore outside Next.js request context (e.g. unit tests)
  }
}

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
  condition: z.enum(["NEW", "USED"]).default("NEW"),
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
    categoryId: z.string().min(1, "Category is required"),
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
    condition: z.enum(["NEW", "USED"]).default("NEW"),
    imei: z.string().optional(),
    batteryHealth: z.number().int().min(1).max(100).optional().nullable(),
    usedConditionGrade: z.string().optional(),
    costPrice: z.number().positive().optional().nullable(),
    isDraft: z.boolean().default(false),
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

export type CreateProductInput = z.infer<typeof createProductSchema>;

export type CreateProductResult =
  | { success: true; productId: string }
  | { success: false; error: string };

export async function createProductAction(
  input: CreateProductInput
): Promise<CreateProductResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "unauthorized" };
  }

  const isSuper = isSuperAdmin(session);
  const isBranch = session.role === "BRANCH_ADMIN";

  if (!isSuper && !isBranch) {
    return { success: false, error: "unauthorized" };
  }

  if (isBranch && !session.branchId) {
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
      // 1. Ensure categoryId exists or resolve fallback category
      let validCategoryId = data.categoryId;
      const catExists = await tx.category.findUnique({
        where: { id: validCategoryId },
      });
      if (!catExists) {
        const fallbackCat = await tx.category.findFirst({
          orderBy: { nameUz: "asc" },
        });
        if (fallbackCat) {
          validCategoryId = fallbackCat.id;
        } else {
          const createdCat = await tx.category.create({
            data: {
              nameUz: "Smartfonlar",
              nameRu: "Смартфоны",
              nameEn: "Smartphones",
              slug: "smartphones",
            },
          });
          validCategoryId = createdCat.id;
        }
      }
      const product = await tx.product.create({
        data: {
          brand: data.brand.trim(),
          modelName: data.modelName.trim(),
          slug: finalSlug,
          categoryId: validCategoryId,
          warrantyMonths: data.warrantyMonths,
          series: data.series?.trim() || null,
          releaseYear: data.releaseYear ?? null,
          screenSize: data.screenSize?.trim() || null,
          processor: data.processor?.trim() || null,
          battery: data.battery?.trim() || null,
          camera: data.camera?.trim() || null,
          charging: data.charging?.trim() || null,
          os: data.os?.trim() || null,
          specs: data.specs ? (data.specs as Prisma.InputJsonValue) : undefined,
          costPrice: data.costPrice ?? null,
          isDraft: data.isDraft,
          shortDescUz: data.shortDescUz?.trim() || null,
          shortDescRu: data.shortDescRu?.trim() || null,
          shortDescEn: data.shortDescEn?.trim() || null,
          descriptionUz: data.descriptionUz.trim(),
          descriptionRu: data.descriptionRu.trim(),
          descriptionEn: data.descriptionEn.trim(),
        },
      });

      // Prepare effective variants (fallback placeholder if draft has 0 variants)
      const effectiveVariants = data.variants.length > 0
        ? data.variants
        : [
            {
              sku: `${data.brand.slice(0, 3)}-${data.modelName.slice(0, 5)}-DRAFT`.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
              colorNameUz: "Qora",
              colorNameRu: "Черный",
              colorNameEn: "Black",
              colorHex: "#000000",
              storage: "128GB",
              condition: data.condition,
              price: 1000000,
              costPrice: data.costPrice ?? null,
              oldPrice: null,
              images: ["/images/products/placeholder.webp"],
              initialStock: {},
              imei: data.imei,
            },
          ];

      for (const v of effectiveVariants) {
        // IDOR / Stock safety: Filter initialStock so BRANCH_ADMIN only modifies their own branch
        let filteredInitialStock: Record<string, number> = {};
        if (isSuper && v.initialStock) {
          filteredInitialStock = { ...v.initialStock };
        } else if (isBranch && session.branchId && v.initialStock) {
          if (typeof v.initialStock[session.branchId] === "number") {
            filteredInitialStock[session.branchId] =
              v.initialStock[session.branchId];
          }
        }

        // Ensure unique SKU without crashing on collision
        const candidateSku = v.sku.toUpperCase().trim();
        let finalSku = candidateSku;
        let skuSuffix = 1;
        while (await tx.productVariant.findUnique({ where: { sku: finalSku } })) {
          finalSku = `${candidateSku}-${skuSuffix++}`;
        }

        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: finalSku,
            colorNameUz: v.colorNameUz.trim(),
            colorNameRu: v.colorNameRu.trim(),
            colorNameEn: v.colorNameEn.trim(),
            colorHex: v.colorHex.trim(),
            ram: v.ram?.trim() || null,
            storage: v.storage.trim(),
            condition: v.condition,
            costPrice: v.costPrice ?? null,
            price: v.price,
            oldPrice: v.oldPrice ?? null,
            images:
              v.images.length > 0
                ? v.images
                : ["/images/products/placeholder.webp"],
          },
        });

        // Create IMEI Record if provided (e.g. for USED individual device)
        if (v.imei && v.imei.trim()) {
          const cleanImei = v.imei.trim();
          const existingImei = await tx.iMEIRecord.findUnique({
            where: { imeiNumber: cleanImei },
          });
          if (existingImei) {
            throw new Error(`IMEI "${cleanImei}" allaqachon ro'yxatga olingan`);
          }
          await tx.iMEIRecord.create({
            data: {
              variantId: variant.id,
              imeiNumber: cleanImei,
              status: "IN_STOCK",
            },
          });
        }

        // Initialize branch inventory records
        for (const branch of allBranches) {
          const qty = filteredInitialStock[branch.id] ?? 0;
          await tx.branchInventory.upsert({
            where: {
              branchId_variantId: {
                branchId: branch.id,
                variantId: variant.id,
              },
            },
            update: { quantity: qty },
            create: {
              branchId: branch.id,
              variantId: variant.id,
              quantity: qty,
            },
          });
        }
      }

      return product;
    });

    safeRevalidatePath("/admin/products");

    safeRevalidatePath("/catalog");

    return { success: true, productId: createdProduct.id };
  } catch (err) {
    console.error("createProductAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "failedToCreate",
    };
  }
}

// --------------------------------------------------------------------------
// Preset-driven Product CRUD & Smart Matrix Actions
// --------------------------------------------------------------------------

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

export type PresetVariantInput = z.input<typeof presetVariantInputSchema>;
export type PresetProductInput = z.input<typeof presetProductInputSchema>;

export type ActionResult =
  | { success: true; productId?: string }
  | { success: false; error: string };

/**
 * Creates or updates a smartphone from the official presets catalog.
 * Upserts Product by slug, syncs hardware specs, and upserts variants and branch inventory.
 * RBAC: SuperAdmin can set stock for any branch; BranchAdmin can only set stock for their own branch.
 */
export async function createOrUpdateProductFromPresetAction(
  input: PresetProductInput
): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "unauthorized" };
  }

  const isSuper = isSuperAdmin(session);
  const isBranch = session.role === "BRANCH_ADMIN";

  if (!isSuper && !isBranch) {
    return { success: false, error: "unauthorized" };
  }

  if (isBranch && !session.branchId) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = presetProductInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const data = parsed.data;

  // Find preset by id or slug
  const preset = CATALOG_PRESETS.find(
    (p) => p.id === data.presetId || p.slug === data.presetId
  );
  if (!preset) {
    return { success: false, error: "presetNotFound" };
  }

  try {
    // Resolve smartphones category automatically
    let category = await prisma.category.findUnique({
      where: { slug: "smartphones" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: {
          nameUz: "Smartfonlar",
          nameRu: "Смартфоны",
          nameEn: "Smartphones",
          slug: "smartphones",
        },
      });
    }

    const allBranches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const resultProduct = await prisma.$transaction(async (tx) => {
      // Upsert product by slug
      const product = await tx.product.upsert({
        where: { slug: preset.slug },
        update: {
          brand: preset.brand,
          modelName: preset.modelName,
          series: preset.series,
          releaseYear: preset.releaseYear,
          screenSize: preset.screenSize,
          processor: preset.processor,
          battery: preset.battery,
          camera: preset.camera,
          charging: preset.charging,
          os: preset.os,
          warrantyMonths: preset.warrantyMonths,
          descriptionUz: preset.descriptionUz,
          descriptionRu: preset.descriptionRu,
          descriptionEn: preset.descriptionEn,
          categoryId: category.id,
        },
        create: {
          brand: preset.brand,
          modelName: preset.modelName,
          slug: preset.slug,
          series: preset.series,
          releaseYear: preset.releaseYear,
          screenSize: preset.screenSize,
          processor: preset.processor,
          battery: preset.battery,
          camera: preset.camera,
          charging: preset.charging,
          os: preset.os,
          warrantyMonths: preset.warrantyMonths,
          descriptionUz: preset.descriptionUz,
          descriptionRu: preset.descriptionRu,
          descriptionEn: preset.descriptionEn,
          categoryId: category.id,
        },
      });

      // Process each selected variant
      for (const v of effectiveVariants) {
        // Resolve preset color metadata
        const matchedColor =
          preset.colors.find(
            (c) =>
              c.nameUz.trim().toLowerCase() === v.colorNameUz.trim().toLowerCase() ||
              c.nameEn.trim().toLowerCase() === v.colorNameUz.trim().toLowerCase() ||
              c.nameRu.trim().toLowerCase() === v.colorNameUz.trim().toLowerCase()
          ) || preset.colors[0];

        const colorNameUz = v.colorNameUz.trim();
        const colorNameRu =
          v.colorNameRu?.trim() || matchedColor?.nameRu || colorNameUz;
        const colorNameEn =
          v.colorNameEn?.trim() || matchedColor?.nameEn || colorNameUz;
        const colorHex = v.colorHex?.trim() || matchedColor?.hex || "#000000";
        const images =
          v.images && v.images.length > 0
            ? v.images
            : matchedColor?.imageUrl
              ? [matchedColor.imageUrl]
              : ["/images/products/placeholder.webp"];

        const generatedSku = generateSku(
          preset.brand,
          preset.modelName,
          v.storage,
          colorNameEn
        );
        const finalSku = (v.sku?.trim() || generatedSku).toUpperCase();

        // Match existing variant by SKU or by (productId + colorNameUz + storage)
        let existingVariant = await tx.productVariant.findUnique({
          where: { sku: finalSku },
        });

        if (!existingVariant) {
          existingVariant = await tx.productVariant.findFirst({
            where: {
              productId: product.id,
              colorNameUz,
              storage: v.storage.trim(),
            },
          });
        }

        let variantId: string;

        if (existingVariant) {
          // RBAC guard: Branch admin cannot alter global retail price or oldPrice
          const effectivePrice = isBranch ? existingVariant.price : v.price;
          const effectiveOldPrice = isBranch ? existingVariant.oldPrice : (v.oldPrice ?? null);

          const updated = await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              sku: finalSku,
              colorNameUz,
              colorNameRu,
              colorNameEn,
              colorHex,
              ram: v.ram?.trim() || preset.ram,
              storage: v.storage.trim(),
              condition: v.condition || "NEW",
              price: effectivePrice,
              oldPrice: effectiveOldPrice,
              images,
            },
          });
          variantId = updated.id;
        } else {
          if (isBranch) {
            throw new Error("UNAUTHORIZED_BRANCH_PRICE_EDIT");
          }
          const created = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: finalSku,
              colorNameUz,
              colorNameRu,
              colorNameEn,
              colorHex,
              ram: v.ram?.trim() || preset.ram,
              storage: v.storage.trim(),
              condition: v.condition || "NEW",
              price: v.price,
              oldPrice: v.oldPrice ?? null,
              images,
            },
          });
          variantId = created.id;
        }

        if (v.imei && v.imei.trim()) {
          const cleanImei = v.imei.trim();
          await tx.iMEIRecord.upsert({
            where: { imeiNumber: cleanImei },
            update: {
              variantId: variantId,
              status: "IN_STOCK",
            },
            create: {
              variantId: variantId,
              imeiNumber: cleanImei,
              status: "IN_STOCK",
            },
          });
        }

        // Branch inventory upsert with strict RBAC IDOR protection
        for (const branch of allBranches) {
          const existingInv = await tx.branchInventory.findUnique({
            where: {
              branchId_variantId: {
                branchId: branch.id,
                variantId: variantId,
              },
            },
          });

          if (isSuper) {
            const qty =
              v.initialStock && typeof v.initialStock[branch.id] === "number"
                ? v.initialStock[branch.id]
                : existingInv
                  ? existingInv.quantity
                  : 0;

            await tx.branchInventory.upsert({
              where: {
                branchId_variantId: {
                  branchId: branch.id,
                  variantId: variantId,
                },
              },
              update: { quantity: qty },
              create: {
                branchId: branch.id,
                variantId: variantId,
                quantity: qty,
              },
            });
          } else if (isBranch && session.branchId) {
            if (branch.id === session.branchId) {
              const qty =
                v.initialStock &&
                typeof v.initialStock[session.branchId] === "number"
                  ? v.initialStock[session.branchId]
                  : existingInv
                    ? existingInv.quantity
                    : 0;

              await tx.branchInventory.upsert({
                where: {
                  branchId_variantId: {
                    branchId: branch.id,
                    variantId: variantId,
                  },
                },
                update: { quantity: qty },
                create: {
                  branchId: branch.id,
                  variantId: variantId,
                  quantity: qty,
                },
              });
            } else {
              // Foreign branch: only initialize if missing; never overwrite existing stock
              if (!existingInv) {
                await tx.branchInventory.create({
                  data: {
                    branchId: branch.id,
                    variantId: variantId,
                    quantity: 0,
                  },
                });
              }
            }
          }
        }
      }

      return product;
    });

    safeRevalidatePath("/admin/products");

    safeRevalidatePath("/catalog");


    return { success: true, productId: resultProduct.id };
  } catch (err) {
    console.error("createOrUpdateProductFromPresetAction error:", err);
    return { success: false, error: err instanceof Error ? err.message : "failedToUpsert" };
  }
}

/**
 * Deletes a product, its variants, inventory, and serial records in a transaction.
 * Requires SUPER_ADMIN role.
 * Protects against deleting products with active unfulfilled orders (PENDING, CONFIRMED, SHIPPED).
 */
export async function deleteProductAction(
  productIdOrInput: string | { productId: string }
): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return { success: false, error: "unauthorized" };
  }

  const productId =
    typeof productIdOrInput === "string"
      ? productIdOrInput.trim()
      : productIdOrInput?.productId?.trim();

  if (!productId) {
    return { success: false, error: "invalidProductId" };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return { success: false, error: "productNotFound" };
    }

    // Active unfulfilled order check (PENDING, CONFIRMED, SHIPPED)
    const activeStatuses = (
      ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] as const
    ).filter((s) => s in OrderStatus) as OrderStatus[];

    const activeOrderCount = await prisma.orderItem.count({
      where: {
        variant: {
          productId: product.id,
        },
        order: {
          status: {
            in: activeStatuses,
          },
        },
      },
    });

    if (activeOrderCount > 0) {
      return { success: false, error: "cannotDeleteWithActiveOrders" };
    }

    // Check if historical orders (DELIVERED, CANCELLED) exist for this product
    const totalOrderCount = await prisma.orderItem.count({
      where: {
        variant: {
          productId: product.id,
        },
      },
    });

    if (totalOrderCount > 0) {
      // Historical orders exist! Soft-delete (archive) product to strictly preserve financial & sales history
      await prisma.product.update({
        where: { id: product.id },
        data: { isArchived: true },
      });

      safeRevalidatePath("/admin/products");
      safeRevalidatePath("/catalog");
      return { success: true };
    }

    // No historical orders: safe hard deletion in transaction without touching orderItem table
    await prisma.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { productId: product.id },
        select: { id: true },
      });
      const variantIds = variants.map((v) => v.id);

      if (variantIds.length > 0) {
        await tx.branchInventory.deleteMany({
          where: { variantId: { in: variantIds } },
        });

        await tx.iMEIRecord.deleteMany({
          where: { variantId: { in: variantIds } },
        });

        await tx.productVariant.deleteMany({
          where: { id: { in: variantIds } },
        });
      }

      await tx.product.delete({
        where: { id: product.id },
      });
    });

    safeRevalidatePath("/admin/products");
    safeRevalidatePath("/catalog");


    return { success: true };
  } catch (err) {
    console.error("deleteProductAction error:", err);
    return { success: false, error: "failedToDelete" };
  }
}
