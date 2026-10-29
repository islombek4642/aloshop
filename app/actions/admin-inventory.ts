"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, canAccessBranch } from "@/lib/auth/admin";

const updateStockSchema = z.object({
  branchId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;

export type UpdateStockResult =
  | { success: true }
  | { success: false; error: string };

export async function updateStockAction(
  input: UpdateStockInput
): Promise<UpdateStockResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = updateStockSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { branchId, variantId, quantity } = parsed.data;

  // RBAC verification: Branch admin can only update their own branch
  if (!canAccessBranch(session, branchId)) {
    return { success: false, error: "accessDenied" };
  }

  try {
    await prisma.branchInventory.upsert({
      where: {
        branchId_variantId: {
          branchId,
          variantId,
        },
      },
      update: {
        quantity,
      },
      create: {
        branchId,
        variantId,
        quantity,
      },
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/products");
    revalidatePath("/catalog");

    return { success: true };
  } catch (err) {
    console.error("updateStockAction error:", err);
    return { success: false, error: "failedToUpdate" };
  }
}

const transferStockSchema = z.object({
  fromBranchId: z.string().min(1),
  toBranchId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive("Transfer quantity must be at least 1"),
});

export type TransferStockInput = z.infer<typeof transferStockSchema>;

export type TransferStockResult =
  | { success: true }
  | { success: false; error: string };

export async function transferStockAction(
  input: TransferStockInput
): Promise<TransferStockResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = transferStockSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  const { fromBranchId, toBranchId, variantId, quantity } = parsed.data;

  if (fromBranchId === toBranchId) {
    return { success: false, error: "sameBranchError" };
  }

  // RBAC verification: user must have authorization for source branch
  if (!canAccessBranch(session, fromBranchId)) {
    return { success: false, error: "accessDenied" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Check source inventory
      const sourceInv = await tx.branchInventory.findUnique({
        where: {
          branchId_variantId: {
            branchId: fromBranchId,
            variantId,
          },
        },
      });

      if (!sourceInv || sourceInv.quantity < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // 2. Decrement source inventory
      await tx.branchInventory.update({
        where: { id: sourceInv.id },
        data: {
          quantity: { decrement: quantity },
        },
      });

      // 3. Increment or create target branch inventory
      await tx.branchInventory.upsert({
        where: {
          branchId_variantId: {
            branchId: toBranchId,
            variantId,
          },
        },
        update: {
          quantity: { increment: quantity },
        },
        create: {
          branchId: toBranchId,
          variantId,
          quantity,
        },
      });
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/products");
    revalidatePath("/catalog");

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return { success: false, error: "insufficientStock" };
    }
    console.error("transferStockAction error:", err);
    return { success: false, error: "failedToTransfer" };
  }
}

