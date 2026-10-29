/**
 * Unit tests for Branch Admin Product Isolation & Creation Access Controls
 * Tests the Prisma query filters and IDOR stock sanitization logic.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function buildProductWhere(session: { role: string; branchId: string | null } | null) {
  if (!session) return null;
  const isSuper = session.role === "SUPER_ADMIN";
  return isSuper
    ? {}
    : {
        variants: {
          some: {
            inventory: {
              some: {
                branchId: session.branchId || "none",
                quantity: { gt: 0 },
              },
            },
          },
        },
      };
}

function sanitizeInitialStock(
  session: { role: string; branchId: string | null },
  rawInitialStock: Record<string, number> | undefined
): { allowed: boolean; sanitizedStock: Record<string, number> } {
  const isSuper = session.role === "SUPER_ADMIN";
  const isBranch = session.role === "BRANCH_ADMIN";

  if (!isSuper && !isBranch) {
    return { allowed: false, sanitizedStock: {} };
  }

  if (isBranch && !session.branchId) {
    return { allowed: false, sanitizedStock: {} };
  }

  const filteredInitialStock: Record<string, number> = {};
  if (isSuper && rawInitialStock) {
    Object.assign(filteredInitialStock, rawInitialStock);
  } else if (isBranch && session.branchId && rawInitialStock) {
    if (typeof rawInitialStock[session.branchId] === "number") {
      filteredInitialStock[session.branchId] = rawInitialStock[session.branchId];
    }
  }

  return { allowed: true, sanitizedStock: filteredInitialStock };
}

function getBranchQueryFilter(session: { role: string; branchId: string | null }) {
  const isSuper = session.role === "SUPER_ADMIN";
  return isSuper
    ? { isActive: true }
    : { id: session.branchId || "none" };
}

async function runBranchProductsIsolationTests() {
  console.log("Starting branch-products-isolation unit tests...\n");

  // 1. SuperAdmin sees all products (empty where filter)
  const superAdminSession = {
    role: "SUPER_ADMIN",
    branchId: null,
  };
  const superWhere = buildProductWhere(superAdminSession);
  assert(superWhere !== null && Object.keys(superWhere).length === 0, "SuperAdmin where filter must be empty {}");
  console.log("  + SuperAdmin sees all products (no where clause restriction)");

  // 2. BranchAdmin only sees products with stock > 0 in their assigned branch
  const branchAdminSession = {
    role: "BRANCH_ADMIN",
    branchId: "branch-malika-id",
  };
  const branchWhere = buildProductWhere(branchAdminSession);
  assert(
    branchWhere?.variants?.some?.inventory?.some?.branchId === "branch-malika-id",
    "BranchAdmin where clause must filter by their branchId"
  );
  assert(
    branchWhere?.variants?.some?.inventory?.some?.quantity?.gt === 0,
    "BranchAdmin where clause must enforce quantity > 0"
  );
  console.log("  + BranchAdmin product query strictly isolates to branchId with quantity > 0");

  // 3. IDOR protection: SuperAdmin can set stock for multiple branches
  const superStockResult = sanitizeInitialStock(superAdminSession, {
    "branch-malika-id": 10,
    "branch-chilonzor-id": 15,
  });
  assert(superStockResult.allowed === true, "SuperAdmin should be allowed");
  assert(superStockResult.sanitizedStock["branch-malika-id"] === 10, "SuperAdmin malika stock preserved");
  assert(superStockResult.sanitizedStock["branch-chilonzor-id"] === 15, "SuperAdmin chilonzor stock preserved");
  console.log("  + SuperAdmin can specify initialStock across multiple branches");

  // 4. IDOR protection: BranchAdmin attempting to inject stock into foreign branch is blocked
  const branchAttackStockResult = sanitizeInitialStock(branchAdminSession, {
    "branch-malika-id": 5,
    "branch-chilonzor-id": 999, // Unauthorized branch attempt!
    "branch-samarkand-id": 500, // Unauthorized branch attempt!
  });
  assert(branchAttackStockResult.allowed === true, "BranchAdmin is allowed to create");
  assert(branchAttackStockResult.sanitizedStock["branch-malika-id"] === 5, "Own branch stock preserved");
  assert(branchAttackStockResult.sanitizedStock["branch-chilonzor-id"] === undefined, "Foreign branch stock stripped!");
  assert(branchAttackStockResult.sanitizedStock["branch-samarkand-id"] === undefined, "Foreign branch stock stripped!");
  console.log("  + IDOR protection: Foreign branch stock entries successfully stripped from BranchAdmin request");

  // 5. BranchAdmin without branchId is rejected
  const invalidBranchAdmin = {
    role: "BRANCH_ADMIN",
    branchId: null,
  };
  const invalidResult = sanitizeInitialStock(invalidBranchAdmin, { "branch-malika-id": 5 });
  assert(invalidResult.allowed === false, "BranchAdmin without branchId must be rejected");
  console.log("  + BranchAdmin without branchId rejected with unauthorized");

  // 6. Branch query filter for new product page
  const superBranchQuery = getBranchQueryFilter(superAdminSession);
  assert(superBranchQuery.isActive === true && !("id" in superBranchQuery), "SuperAdmin gets all active branches");
  
  const branchAdminBranchQuery = getBranchQueryFilter(branchAdminSession);
  assert(branchAdminBranchQuery.id === "branch-malika-id", "BranchAdmin only gets their own branch");
  console.log("  + Branch options for new product page correctly isolated per role");

  console.log("\nAll branch-products-isolation unit tests PASSED successfully!\n");
}

runBranchProductsIsolationTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
