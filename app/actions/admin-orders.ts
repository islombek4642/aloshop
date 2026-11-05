"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession, canAccessBranch } from "@/lib/auth/admin";

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.nativeEnum(OrderStatus),
});

export type UpdateOrderStatusResult =
  | { success: true }
  | { success: false; error: string };

export async function updateOrderStatusAction(
  orderIdOrInput: string | { orderId: string; status: OrderStatus },
  newStatusArg?: OrderStatus
): Promise<UpdateOrderStatusResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: "unauthorized" };
  }

  const orderId =
    typeof orderIdOrInput === "string" ? orderIdOrInput : orderIdOrInput.orderId;
  const status =
    typeof orderIdOrInput === "string" ? newStatusArg! : orderIdOrInput.status;

  const parsed = updateOrderStatusSchema.safeParse({ orderId, status });
  if (!parsed.success) {
    return { success: false, error: "validationError" };
  }

  try {
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            variantId: true,
            quantity: true,
          },
        },
      },
    });

    if (!currentOrder) {
      return { success: false, error: "orderNotFound" };
    }

    // RBAC: Branch admin can only update orders for their assigned branch
    if (session.role === "BRANCH_ADMIN") {
      if (!currentOrder.pickupBranchId || !canAccessBranch(session, currentOrder.pickupBranchId)) {
        return { success: false, error: "accessDenied" };
      }
    }

    // Prevent re-cancelling or duplicate inventory restoration
    if (status === OrderStatus.CANCELLED && currentOrder.status === OrderStatus.CANCELLED) {
      return { success: false, error: "orderAlreadyCancelled" };
    }

    // State Machine validation: cannot transition directly from CANCELLED to active states
    if (currentOrder.status === OrderStatus.CANCELLED && status !== OrderStatus.CANCELLED) {
      return { success: false, error: "cannotReactivateCancelledOrder" };
    }

    await prisma.$transaction(async (tx) => {
      // If cancelling from non-cancelled status, restore variant stock in branch inventory
      if (status === OrderStatus.CANCELLED && currentOrder.status !== OrderStatus.CANCELLED) {
        let targetBranchId = currentOrder.pickupBranchId;
        if (!targetBranchId) {
          const defaultBranch = await tx.branch.findFirst({
            where: { isActive: true },
            select: { id: true },
            orderBy: { createdAt: "asc" },
          });
          targetBranchId = defaultBranch?.id || null;
        }

        if (targetBranchId) {
          for (const item of currentOrder.items) {
            await tx.branchInventory.upsert({
              where: {
                branchId_variantId: {
                  branchId: targetBranchId,
                  variantId: item.variantId,
                },
              },
              create: {
                branchId: targetBranchId,
                variantId: item.variantId,
                quantity: item.quantity,
              },
              update: {
                quantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status },
      });
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (err) {
    console.error("updateOrderStatusAction error:", err);
    return { success: false, error: "failedToUpdate" };
  }
}

