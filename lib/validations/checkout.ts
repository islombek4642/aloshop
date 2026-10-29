import { z } from "zod";

export const UZ_PHONE_REGEX = /^\+998\d{9}$/;

export function cleanUzPhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export function isValidUzPhone(phone: string): boolean {
  return UZ_PHONE_REGEX.test(cleanUzPhone(phone));
}

export const checkoutItemSchema = z.object({
  variantId: z.string().min(1, { message: "variantRequired" }),
  quantity: z
    .number({ required_error: "quantityRequired" })
    .int({ message: "quantityInvalid" })
    .min(1, { message: "quantityInvalid" }),
  unitPrice: z
    .number({ required_error: "priceRequired" })
    .nonnegative({ message: "priceInvalid" }),
});

export const checkoutSchema = z
  .object({
    customerName: z
      .string({ required_error: "fullNameRequired" })
      .trim()
      .min(2, { message: "fullNameRequired" }),
    customerPhone: z
      .string({ required_error: "phoneRequired" })
      .trim()
      .min(1, { message: "phoneRequired" })
      .refine(
        (val) => isValidUzPhone(val),
        { message: "phoneInvalid" }
      ),
    fulfillmentType: z.enum(["PICKUP_FROM_BRANCH", "DELIVERY"], {
      required_error: "fulfillmentRequired",
    }),
    pickupBranchId: z.string().optional().nullable(),
    deliveryAddress: z.string().optional().nullable(),
    paymentType: z.enum(
      ["CASH_ON_DELIVERY", "PAY_AT_BRANCH", "CARD_ON_DELIVERY"],
      { required_error: "paymentRequired" }
    ),
    notes: z.string().optional().nullable(),
    honeypot: z.string().optional().nullable(),
    items: z
      .array(checkoutItemSchema)
      .min(1, { message: "itemsRequired" }),
  })
  .superRefine((data, ctx) => {
    // Honeypot anti-spam check: honeypot field must be empty
    if (data.honeypot && data.honeypot.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "spamDetected",
        path: ["honeypot"],
      });
    }

    // Pickup branch requirement
    if (data.fulfillmentType === "PICKUP_FROM_BRANCH") {
      if (!data.pickupBranchId || data.pickupBranchId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "branchRequired",
          path: ["pickupBranchId"],
        });
      }
    }

    // Delivery address requirement
    if (data.fulfillmentType === "DELIVERY") {
      if (!data.deliveryAddress || data.deliveryAddress.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "addressRequired",
          path: ["deliveryAddress"],
        });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
