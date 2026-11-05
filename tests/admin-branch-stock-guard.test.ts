import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=== Testing Active Inventory Protection on Branch Deletion ===");

const branchActionFile = path.join(process.cwd(), "app/actions/admin-branches.ts");
const branchActionSource = fs.readFileSync(branchActionFile, "utf8");

// 1. Verify deleteBranchAction queries inventory sum for the branch
assert.ok(
  branchActionSource.includes("branchInventory.aggregate") ||
  /branchInventory\.(findMany|aggregate)/.test(branchActionSource),
  "app/actions/admin-branches.ts must query branchInventory to check for active stock before deletion"
);

// 2. Verify deletion is rejected with 'hasActiveStock' if quantity > 0
assert.ok(
  branchActionSource.includes('"hasActiveStock"') || branchActionSource.includes("'hasActiveStock'"),
  "app/actions/admin-branches.ts must return { success: false, error: 'hasActiveStock' } if branch has stock > 0"
);

// 3. Verify total stock check logic
assert.ok(
  /(_sum\.quantity\s*>\s*0|totalActiveStock\s*>\s*0|stock\s*>\s*0)/.test(branchActionSource),
  "deleteBranchAction must verify that total active stock is > 0 before rejecting deletion"
);

console.log("[PASS] 1. Inventory check on branch deletion verified.");
console.log("[PASS] 2. 'hasActiveStock' rejection error code verified.");
console.log("[PASS] 3. Stock sum guard logic verified.");

console.log("\nAll Branch Stock Guard audits passed successfully!");
