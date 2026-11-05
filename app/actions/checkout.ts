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

/**
 * Generates a collision-resistant, date-prefixed human-readable order number.
 * Format: ALO-YYYYMMDD-XXXX where date is anchored in Tashkent timezone (UTC+5).
 */
export function generateOrderNumber(date: Date = new Date()): string {
  const tashkentOffsetMs = 5 * 60 * 60 * 1000;
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const tDate = new Date(utcMs + tashkentOffsetMs);

  const yyyy = tDate.getFullYear().toString();
  const mm = String(tDate.getMonth() + 1).padStart(2, "0");
  const dd = String(tDate.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ALO-${yyyy}${mm}${dd}-${rand}`;
}

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

    // 5. DB Transaction with Collision Retry Loop (up to 5 attempts)
    let createdOrder: { id: string; orderNumber: string } | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const orderNumber = generateOrderNumber();

        createdOrder = await prisma.$transaction(async (tx) => {
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

        // Atomically decrement stock from the assigned fulfillment branch with concurrency guard
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

          await tx.branchInventory.update({
            where: { id: currentInv.id },
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

        // Succeeded without collision
        break;
      } catch (err) {
        lastError = err;
        // Check for Prisma unique constraint collision (P2002 on orderNumber)
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === "P2002" &&
          attempt < 5
        ) {
          continue; // Retry with next order number
        }
        // Non-collision errors (like INSUFFICIENT_BRANCH_STOCK) should re-throw immediately
        throw err;
      }
    }

    if (!createdOrder) {
      throw lastError || new Error("ORDER_CREATION_FAILED");
    }

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
