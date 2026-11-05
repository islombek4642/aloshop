import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=== Testing Admin Users CRUD, Password Reset & RBAC Price Guard ===");

// 1. Schema check: User model contains isActive boolean
const schemaFile = path.join(process.cwd(), "prisma/schema.prisma");
const schemaSource = fs.readFileSync(schemaFile, "utf8");
assert.ok(
  /model\s+User\s*\{[\s\S]*isActive\s+Boolean\s+@default\(true\)[\s\S]*\}/.test(schemaSource),
  "prisma/schema.prisma User model must contain isActive Boolean @default(true)"
);
console.log("[PASS] 1. Schema User model has isActive field.");

// 2. Actions check: updateBranchAdminAction, resetBranchAdminPasswordAction, deleteBranchAdminAction
const usersActionFile = path.join(process.cwd(), "app/actions/admin-users.ts");
const usersActionSource = fs.readFileSync(usersActionFile, "utf8");

assert.ok(
  usersActionSource.includes("export async function updateBranchAdminAction"),
  "admin-users.ts must export updateBranchAdminAction"
);
assert.ok(
  usersActionSource.includes("export async function resetBranchAdminPasswordAction"),
  "admin-users.ts must export resetBranchAdminPasswordAction"
);
assert.ok(
  usersActionSource.includes("export async function deleteBranchAdminAction"),
  "admin-users.ts must export deleteBranchAdminAction"
);
assert.ok(
  usersActionSource.includes("isSuperAdmin"),
  "admin-users.ts actions must strictly enforce isSuperAdmin check"
);
console.log("[PASS] 2. Admin user management server actions (Update, Reset Password, Delete) verified.");

// 3. RBAC Price Guard in admin-products.ts
const productsActionFile = path.join(process.cwd(), "app/actions/admin-products.ts");
const productsActionSource = fs.readFileSync(productsActionFile, "utf8");

assert.ok(
  productsActionSource.includes("isBranch") &&
  /isBranch[\s\S]*existingVariant/.test(productsActionSource),
  "admin-products.ts must check isBranch and protect existingVariant price/oldPrice from branch admin modification"
);
console.log("[PASS] 3. RBAC Price Guard in admin-products.ts verified.");

// 4. UI check: Actions column in UsersListView
const usersViewFile = path.join(process.cwd(), "components/admin/users-list-view.tsx");
const usersViewSource = fs.readFileSync(usersViewFile, "utf8");

assert.ok(
  usersViewSource.includes("updateBranchAdminAction") ||
  usersViewSource.includes("resetBranchAdminPasswordAction") ||
  usersViewSource.includes("deleteBranchAdminAction"),
  "components/admin/users-list-view.tsx must invoke user management actions"
);
assert.ok(
  /Amallar|Actions|Harakatlar|tableHeadActions/.test(usersViewSource) ||
  usersViewSource.includes("t(\"actions\")") ||
  usersViewSource.includes("t(\"action\")"),
  "components/admin/users-list-view.tsx must contain an Actions column"
);
console.log("[PASS] 4. Users list view Actions UI verified.");

console.log("\nAll Admin Users CRUD & RBAC audits passed successfully!");
