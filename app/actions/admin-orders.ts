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
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, pickupBranchId: true },
    });

    if (!order) {
      return { success: false, error: "orderNotFound" };
    }

    // RBAC: Branch admin can only update orders for their assigned branch
    if (session.role === "BRANCH_ADMIN") {
      if (!order.pickupBranchId || !canAccessBranch(session, order.pickupBranchId)) {
        return { success: false, error: "accessDenied" };
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (err) {
    console.error("updateOrderStatusAction error:", err);
    return { success: false, error: "failedToUpdate" };
  }
}

