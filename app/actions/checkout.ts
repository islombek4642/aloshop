"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  checkoutSchema,
  cleanUzPhone,
  type CheckoutInput,
} from "@/lib/validations/checkout";

// Simple in-memory rate limiter: max 5 orders per 60 seconds per IP
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export type CreateOrderResult =
  | {
      success: true;
      orderNumber: string;
      orderId: string;
    }
  | {
      success: false;
      error: string;
    };

export async function createOrderAction(
  rawInput: CheckoutInput
): Promise<CreateOrderResult> {
  try {
    // 1. Rate limiting by IP
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (!checkRateLimit(ip, 5, 60_000)) {
      return {
        success: false,
        error: "rateLimitExceeded",
      };
    }

    // 2. Honeypot check (Anti-spam)
    if (rawInput.honeypot && rawInput.honeypot.trim().length > 0) {
      return {
        success: false,
        error: "spamDetected",
      };
    }

    // 3. Zod schema validation
    const parsed = checkoutSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message || "Invalid checkout input",
      };
    }

    const data = parsed.data;

    // 4. Validate variants and fetch official prices from DB
    const variantIds = data.items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
      },
      include: {
        inventory: true,
      },
    });

    if (variants.length !== variantIds.length) {
      return {
        success: false,
        error: "Some items in your cart are no longer available",
      };
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Calculate total price based on DB records
    let calculatedTotal = 0;
    for (const item of data.items) {
      const v = variantMap.get(item.variantId);
      if (!v) {
        return {
          success: false,
          error: "Variant not found",
        };
      }
      calculatedTotal += Number(v.price) * item.quantity;
    }

    // 5. Generate human-readable unique order number
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `ALO-${randomDigits}`;

    // 6. DB Transaction to create Order + OrderItems and decrement inventory
    const createdOrder = await prisma.$transaction(async (tx) => {
      let fulfillingBranchId: string | null = null;

      if (data.fulfillmentType === "PICKUP_FROM_BRANCH") {
        fulfillingBranchId = data.pickupBranchId || null;
        if (!fulfillingBranchId) {
          throw new Error("BRANCH_REQUIRED");
        }

        // Verify stock for each item in the chosen pickup branch
        for (const item of data.items) {
          const currentInv = await tx.branchInventory.findUnique({
            where: {
              branchId_variantId: {
                branchId: fulfillingBranchId,
                variantId: item.variantId,
              },
            },
          });

          if (!currentInv || currentInv.quantity < item.quantity) {
            throw new Error("INSUFFICIENT_BRANCH_STOCK");
          }

          // Atomically decrement stock
          await tx.branchInventory.update({
            where: { id: currentInv.id },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }
      } else {
        // DELIVERY: Smart nearest branch allocation
        // Find active branches having sufficient inventory for ALL items in the order
        const activeBranches = await tx.branch.findMany({
          where: { isActive: true },
          include: {
            inventory: {
              where: {
                variantId: { in: variantIds },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        for (const branch of activeBranches) {
          const invMap = new Map(
            branch.inventory.map((inv) => [inv.variantId, inv.quantity])
          );
          const hasAllStock = data.items.every((item) => {
            const available = invMap.get(item.variantId) ?? 0;
            return available >= item.quantity;
          });

          if (hasAllStock) {
            fulfillingBranchId = branch.id;
            break;
          }
        }

        if (!fulfillingBranchId) {
          throw new Error("OUT_OF_STOCK_DELIVERY");
        }

        // Atomically decrement stock from the assigned fulfillment branch
        for (const item of data.items) {
          await tx.branchInventory.update({
            where: {
              branchId_variantId: {
                branchId: fulfillingBranchId,
                variantId: item.variantId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerPhone: cleanUzPhone(data.customerPhone),
          fulfillmentType: data.fulfillmentType,
          pickupBranchId: fulfillingBranchId,
          deliveryAddress: data.deliveryAddress || null,
          notes: data.notes || null,
          totalAmount: calculatedTotal,
          paymentType: data.paymentType,
          items: {
            create: data.items.map((item) => {
              const v = variantMap.get(item.variantId)!;
              return {
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: v.price,
              };
            }),
          },
        },
      });

      return order;
    });

    return {
      success: true,
      orderNumber: createdOrder.orderNumber,
      orderId: createdOrder.id,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_BRANCH_STOCK") {
        return {
          success: false,
          error: "insufficientBranchStock",
        };
      }
      if (error.message === "OUT_OF_STOCK_DELIVERY") {
        return {
          success: false,
          error: "outOfStockDelivery",
        };
      }
      if (error.message === "BRANCH_REQUIRED") {
        return {
          success: false,
          error: "branchRequired",
        };
      }
    }

    console.error("Order creation failed:", error);
    return {
      success: false,
      error: "Failed to place order. Please try again.",
    };
  }
}
