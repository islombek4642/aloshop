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
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerPhone: cleanUzPhone(data.customerPhone),
          fulfillmentType: data.fulfillmentType,
          pickupBranchId: data.pickupBranchId || null,
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

      // If branch pickup, decrement branch inventory
      if (data.pickupBranchId) {
        for (const item of data.items) {
          // Decrement only if stock exists, clamping to minimum 0
          const currentInv = await tx.branchInventory.findUnique({
            where: {
              branchId_variantId: {
                branchId: data.pickupBranchId,
                variantId: item.variantId,
              },
            },
          });

          if (currentInv && currentInv.quantity > 0) {
            const nextQty = Math.max(0, currentInv.quantity - item.quantity);
            await tx.branchInventory.update({
              where: {
                id: currentInv.id,
              },
              data: {
                quantity: nextQty,
              },
            });
          }
        }
      }

      return order;
    });

    return {
      success: true,
      orderNumber: createdOrder.orderNumber,
      orderId: createdOrder.id,
    };
  } catch (error) {
    console.error("Order creation failed:", error);
    return {
      success: false,
      error: "Failed to place order. Please try again.",
    };
  }
}
