import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=== Testing Admin Dashboard Revenue & Accounting Calculation ===");

const dashboardFile = path.join(process.cwd(), "app/[locale]/admin/dashboard/page.tsx");
const dashboardSource = fs.readFileSync(dashboardFile, "utf8");

// 1. Verify revenue aggregation excludes CANCELLED orders
assert.ok(
  /prisma\.order\.aggregate\(\{[\s\S]*where:\s*\{[\s\S]*status:\s*\{\s*not:\s*["']CANCELLED["']\s*\}[\s\S]*_sum:\s*\{\s*totalAmount:\s*true\s*\}/.test(dashboardSource),
  "app/[locale]/admin/dashboard/page.tsx must exclude CANCELLED orders from total revenue aggregation using status: { not: 'CANCELLED' }"
);

console.log("[PASS] 1. CANCELLED orders exclusion from revenue aggregate verified.");

console.log("\nAll Admin Dashboard metrics audits passed successfully!");
