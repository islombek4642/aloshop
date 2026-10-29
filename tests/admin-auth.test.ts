(process.env as Record<string, string | undefined>).NODE_ENV = "test";

import {
  signSessionToken,
  verifySessionToken,
  type AdminSessionPayload,
} from "../lib/auth/session";
import {
  canAccessBranch,
  hasRole,
  isSuperAdmin,
  isBranchAdmin,
  canManageUsers,
  canManageBranches,
  verifyAdminCredentials,
} from "../lib/auth/admin";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAdminAuthTests() {
  console.log("Starting admin-auth unit tests...\n");

  // 1. SuperAdmin session roundtrip
  const superPayload: AdminSessionPayload = {
    userId: "superadmin-root",
    username: "admin",
    fullName: "Super Administrator",
    role: "SUPER_ADMIN",
    branchId: null,
    branchName: null,
  };

  const superToken = await signSessionToken(superPayload, "2h");
  assert(typeof superToken === "string" && superToken.length > 20, "Token should be non-empty string");

  const verifiedSuper = await verifySessionToken(superToken);
  assert(verifiedSuper !== null, "Verified SuperAdmin payload must not be null");
  assert(verifiedSuper.userId === "superadmin-root", "userId must match");
  assert(verifiedSuper.username === "admin", "username must match");
  assert(verifiedSuper.fullName === "Super Administrator", "fullName must match");
  assert(verifiedSuper.role === "SUPER_ADMIN", "role must be SUPER_ADMIN");
  assert(verifiedSuper.branchId === null, "branchId must be null for SuperAdmin");
  assert(verifiedSuper.branchName === null, "branchName must be null for SuperAdmin");
  console.log("  + SuperAdmin session signing & verification passed");

  // 2. BranchAdmin session roundtrip
  const branchPayload: AdminSessionPayload = {
    userId: "user-chilonzor-mgr",
    username: "chilonzor_mgr",
    fullName: "Chilonzor Menejeri",
    role: "BRANCH_ADMIN",
    branchId: "branch-chilonzor-id",
    branchName: "Chilonzor filiali",
  };

  const branchToken = await signSessionToken(branchPayload, "2h");
  const verifiedBranch = await verifySessionToken(branchToken);
  assert(verifiedBranch !== null, "Verified BranchAdmin payload must not be null");
  assert(verifiedBranch.userId === "user-chilonzor-mgr", "userId must match");
  assert(verifiedBranch.username === "chilonzor_mgr", "username must match");
  assert(verifiedBranch.role === "BRANCH_ADMIN", "role must be BRANCH_ADMIN");
  assert(verifiedBranch.branchId === "branch-chilonzor-id", "branchId must match");
  assert(verifiedBranch.branchName === "Chilonzor filiali", "branchName must match");
  console.log("  + BranchAdmin session signing & verification passed");

  // 3. Tampered token rejection
  const tamperedToken = superToken.slice(0, -5) + "abcde";
  const verifiedTampered = await verifySessionToken(tamperedToken);
  assert(verifiedTampered === null, "Tampered token verification must return null");
  console.log("  + Tampered token rejection passed");

  // 4. Malformed string rejection
  const verifiedMalformed = await verifySessionToken("not-a-valid-jwt-token");
  assert(verifiedMalformed === null, "Malformed token verification must return null");
  const verifiedEmpty = await verifySessionToken("");
  assert(verifiedEmpty === null, "Empty token verification must return null");
  console.log("  + Malformed token rejection passed");

  // 5. Expired token rejection
  const pastTimestamp = Math.floor(Date.now() / 1000) - 60; // 60 seconds ago
  const expiredToken = await signSessionToken(superPayload, pastTimestamp);
  const verifiedExpired = await verifySessionToken(expiredToken);
  assert(verifiedExpired === null, "Expired token verification must return null");
  console.log("  + Expired token rejection passed");

  // 6. RBAC branch access tests
  assert(canAccessBranch(superPayload, "branch-chilonzor-id"), "SuperAdmin should access any branch");
  assert(canAccessBranch(superPayload, "branch-malika-id"), "SuperAdmin should access malika branch");
  assert(canAccessBranch(superPayload, null), "SuperAdmin should access null branch target");

  assert(canAccessBranch(branchPayload, "branch-chilonzor-id"), "BranchAdmin should access own branch");
  assert(!canAccessBranch(branchPayload, "branch-malika-id"), "BranchAdmin must NOT access other branch");
  assert(!canAccessBranch(branchPayload, null), "BranchAdmin must NOT access null branch target");
  assert(!canAccessBranch(branchPayload, undefined), "BranchAdmin must NOT access undefined branch");
  console.log("  + Multi-branch RBAC access controls passed");

  // 7. RBAC role checks
  assert(hasRole(superPayload, ["SUPER_ADMIN"]), "SuperAdmin should have SUPER_ADMIN role");
  assert(hasRole(superPayload, ["SUPER_ADMIN", "BRANCH_ADMIN"]), "SuperAdmin should match multi-role check");
  assert(!hasRole(superPayload, ["BRANCH_ADMIN"]), "SuperAdmin should not match BRANCH_ADMIN only");

  assert(hasRole(branchPayload, ["BRANCH_ADMIN"]), "BranchAdmin should have BRANCH_ADMIN role");
  assert(!hasRole(branchPayload, ["SUPER_ADMIN"]), "BranchAdmin should not match SUPER_ADMIN");

  assert(isSuperAdmin(superPayload), "isSuperAdmin(superPayload) must be true");
  assert(!isSuperAdmin(branchPayload), "isSuperAdmin(branchPayload) must be false");
  assert(isBranchAdmin(branchPayload), "isBranchAdmin(branchPayload) must be true");
  assert(!isBranchAdmin(superPayload), "isBranchAdmin(superPayload) must be false");

  assert(canManageUsers(superPayload), "SuperAdmin can manage users");
  assert(!canManageUsers(branchPayload), "BranchAdmin cannot manage users");
  assert(canManageBranches(superPayload), "SuperAdmin can manage branches");
  assert(!canManageBranches(branchPayload), "BranchAdmin cannot manage branches");
  console.log("  + RBAC role verification utilities passed");

  // 8. SuperAdmin .env credentials verification
  const envUser = process.env.SUPER_ADMIN_USERNAME || "admin";
  const envPass = process.env.SUPER_ADMIN_PASSWORD || "superadmin_secret_password_change_me";

  const validSuperCreds = await verifyAdminCredentials(envUser, envPass);
  assert(validSuperCreds !== null, "Valid SuperAdmin credentials should succeed");
  assert(validSuperCreds.role === "SUPER_ADMIN", "Verified role should be SUPER_ADMIN");
  assert(validSuperCreds.username === envUser, "Verified username should match");

  const invalidSuperCreds = await verifyAdminCredentials(envUser, "wrong_password_12345");
  assert(invalidSuperCreds === null, "Wrong password must fail");

  const emptyCreds = await verifyAdminCredentials("", "");
  assert(emptyCreds === null, "Empty credentials must fail");
  console.log("  + SuperAdmin credentials verification passed");

  console.log("\nAll admin-auth unit tests PASSED successfully!\n");
}

runAdminAuthTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
