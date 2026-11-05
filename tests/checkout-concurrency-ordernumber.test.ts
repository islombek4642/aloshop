import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { generateOrderNumber } from "../app/actions/checkout";

console.log("=== Testing Order Number Generation & Concurrency Stock Guard ===");

// 1. Order Number Format Verification
const orderNumber = generateOrderNumber(new Date("2026-11-05T12:00:00Z"));
console.log(`Generated sample order number: ${orderNumber}`);

const orderNumberRegex = /^ALO-\d{8}-[A-Z0-9]{4}$/;
assert.ok(
  orderNumberRegex.test(orderNumber),
  `Order number "${orderNumber}" must match format ALO-YYYYMMDD-XXXX`
);
assert.ok(
  orderNumber.startsWith("ALO-20261105-"),
  `Order number must contain UTC+5 date prefix ALO-20261105-, got ${orderNumber}`
);
console.log("[PASS] 1. Order number format and Tashkent date prefix verified.");

// 2. Uniqueness Distribution Test
const generatedSet = new Set<string>();
const sampleSize = 1000;
for (let i = 0; i < sampleSize; i++) {
  const num = generateOrderNumber();
  assert.ok(orderNumberRegex.test(num), `Item ${i} must match regex`);
  generatedSet.add(num);
}
// Out of 1000 samples, collision probability with 32^4 = 1,048,576 combinations is < 0.1%
assert.ok(
  generatedSet.size >= sampleSize - 2,
  `High entropy test: expected at least 998 unique numbers out of 1000, got ${generatedSet.size}`
);
console.log(`[PASS] 2. Entropy check: ${generatedSet.size}/${sampleSize} unique order numbers.`);

// 3. Static Audit: Retry Loop on Collision & Atomic Stock Check
const checkoutFile = path.join(process.cwd(), "app/actions/checkout.ts");
const checkoutSource = fs.readFileSync(checkoutFile, "utf8");

// Verify retry loop exists (up to 5 attempts or while loop with retry)
assert.ok(
  /for\s*\(\s*let\s+attempt\s*=\s*1;\s*attempt\s*<=\s*5;\s*attempt\+\+\s*\)|while\s*\(attempts\s*<\s*5\)/.test(checkoutSource) ||
  checkoutSource.includes("attempt <= 5"),
  "app/actions/checkout.ts must implement a retry loop (up to 5 attempts) for order creation collision recovery"
);

// Verify atomic pre-decrement check in transaction
assert.ok(
  checkoutSource.includes("INSUFFICIENT_BRANCH_STOCK"),
  "Transaction must check inventory and throw INSUFFICIENT_BRANCH_STOCK if quantity is insufficient"
);

// Verify delivery branch allocation re-checks inventory before decrementing
assert.ok(
  /currentInv\.quantity\s*<\s*item\.quantity/.test(checkoutSource),
  "app/actions/checkout.ts must check currentInv.quantity < item.quantity before decrementing"
);

console.log("[PASS] 3. Retry loop and atomic concurrency inventory validation verified in checkout.ts.");
console.log("\nAll Order Number Generation & Concurrency Stock Guard checks passed successfully!");
