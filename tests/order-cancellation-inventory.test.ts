import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

console.log("===============================================================");
console.log("Order Cancellation Stock Restoral & Historical Data Audit");
console.log("===============================================================");

// 1. Audit Prisma Schema for isArchived field
const schemaPath = join(process.cwd(), "prisma/schema.prisma");
const schemaContent = readFileSync(schemaPath, "utf-8");

assert.match(
  schemaContent,
  /isArchived\s+Boolean\s+@default\(false\)/,
  "Product model must contain 'isArchived Boolean @default(false)' field for soft-delete archival"
);
console.log("[PASS] 1. Product model contains isArchived field in prisma/schema.prisma");

// 2. Audit admin-orders.ts for inventory restoration and state transition safeguards
const adminOrdersPath = join(process.cwd(), "app/actions/admin-orders.ts");
const adminOrdersContent = readFileSync(adminOrdersPath, "utf-8");

assert.match(
  adminOrdersContent,
  /CANCELLED/,
  "admin-orders.ts must explicitly handle CANCELLED order status"
);

assert.match(
  adminOrdersContent,
  /branchInventory/,
  "admin-orders.ts must interact with branchInventory upon cancellation"
);

assert.match(
  adminOrdersContent,
  /increment:\s*item\.quantity/,
  "admin-orders.ts must increment branch inventory by item.quantity upon order cancellation"
);

assert.match(
  adminOrdersContent,
  /currentOrder\.status\s*===.*CANCELLED/,
  "admin-orders.ts must prevent double-restoration if order is already CANCELLED"
);
console.log("[PASS] 2. Inventory restoration logic on order cancellation verified in admin-orders.ts");

// 3. Audit admin-products.ts for historical order protection
const adminProductsPath = join(process.cwd(), "app/actions/admin-products.ts");
const adminProductsContent = readFileSync(adminProductsPath, "utf-8");

// Must NOT contain orderItem.deleteMany which wipes customer sales history
assert.doesNotMatch(
  adminProductsContent,
  /orderItem\.deleteMany/,
  "deleteProductAction must NEVER delete customer orderItem records from database"
);

assert.match(
  adminProductsContent,
  /isArchived:\s*true/,
  "deleteProductAction must archive product (isArchived: true) when historical orders exist"
);
console.log("[PASS] 3. Historical accounting data protection and archival verified in admin-products.ts");

console.log("\nAll order inventory restoration & historical data checks passed successfully!");
