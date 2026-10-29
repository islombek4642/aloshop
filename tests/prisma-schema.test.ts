import { prisma } from "../lib/db/prisma";
import {
  UserRole,
  OrderFulfillment,
  OrderStatus,
  PaymentType,
  Prisma,
} from "@prisma/client";

export function verifyPrismaSchema(): {
  success: boolean;
  modelCount: number;
  checks: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const checks: string[] = [];

  // 1. Verify Prisma Client instance
  if (!prisma) {
    errors.push("Prisma client instance is undefined");
  } else {
    checks.push("Prisma singleton exported successfully");
  }

  // 2. Verify all models exist on client
  const expectedModels: string[] = [
    "branch",
    "user",
    "category",
    "product",
    "productVariant",
    "branchInventory",
    "iMEIRecord",
    "order",
    "orderItem",
  ];

  const clientDict = prisma as unknown as Record<string, unknown>;
  for (const model of expectedModels) {
    if (typeof clientDict[model] !== "object") {
      errors.push(`Prisma model '${model}' is missing from client delegate`);
    } else {
      checks.push(`Model delegate '${model}' verified`);
    }
  }

  // 3. Verify Enums
  if (UserRole.SUPER_ADMIN !== "SUPER_ADMIN" || UserRole.BRANCH_ADMIN !== "BRANCH_ADMIN") {
    errors.push("UserRole enum values mismatch");
  } else {
    checks.push("UserRole enum verified (SUPER_ADMIN, BRANCH_ADMIN)");
  }

  if (
    OrderFulfillment.PICKUP_FROM_BRANCH !== "PICKUP_FROM_BRANCH" ||
    OrderFulfillment.DELIVERY !== "DELIVERY"
  ) {
    errors.push("OrderFulfillment enum values mismatch");
  } else {
    checks.push("OrderFulfillment enum verified");
  }

  if (
    OrderStatus.PENDING !== "PENDING" ||
    OrderStatus.CONFIRMED !== "CONFIRMED" ||
    OrderStatus.SHIPPED !== "SHIPPED" ||
    OrderStatus.DELIVERED !== "DELIVERED" ||
    OrderStatus.CANCELLED !== "CANCELLED"
  ) {
    errors.push("OrderStatus enum values mismatch");
  } else {
    checks.push("OrderStatus enum verified");
  }

  if (
    PaymentType.CASH_ON_DELIVERY !== "CASH_ON_DELIVERY" ||
    PaymentType.PAY_AT_BRANCH !== "PAY_AT_BRANCH" ||
    PaymentType.CARD_ON_DELIVERY !== "CARD_ON_DELIVERY"
  ) {
    errors.push("PaymentType enum values mismatch");
  } else {
    checks.push("PaymentType enum verified");
  }

  // 4. Verify Prisma Model names from Prisma metadata
  const dmmfModels = Prisma.dmmf.datamodel.models.map((m) => m.name);
  const requiredDmmfModels = [
    "Branch",
    "User",
    "Category",
    "Product",
    "ProductVariant",
    "BranchInventory",
    "IMEIRecord",
    "Order",
    "OrderItem",
  ];

  for (const reqModel of requiredDmmfModels) {
    if (!dmmfModels.includes(reqModel)) {
      errors.push(`DMMF Model '${reqModel}' not found in Prisma datamodel`);
    } else {
      checks.push(`Prisma DMMF Model '${reqModel}' confirmed`);
    }
  }

  return {
    success: errors.length === 0,
    modelCount: requiredDmmfModels.length,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("prisma-schema.test")) {
  const result = verifyPrismaSchema();
  console.log(`Prisma Schema & Client Verification:`);
  console.log(`Status: ${result.success ? "PASSED" : "FAILED"}`);
  console.log(`Verified Models: ${result.modelCount}`);
  for (const check of result.checks) {
    console.log(`  + ${check}`);
  }
  if (!result.success) {
    console.error("Errors found:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
}
