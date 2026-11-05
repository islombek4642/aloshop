(process.env as Record<string, string | undefined>).NODE_ENV = "test";

import bcrypt from "bcryptjs";
import { prisma } from "../lib/db/prisma";
import { verifyAdminCredentials } from "../lib/auth/admin";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runBootstrapLifecycleTest() {
  console.log("Starting admin bootstrap & settings update lifecycle test...\n");

  const testSuperUser = "test_bootstrap_superadmin";
  const testInitialPass = "1111";
  const testNewPass = "mySuperSecurePass2026!";

  // Cleanup any leftover test user
  await prisma.user.deleteMany({
    where: { username: { in: [testSuperUser, "test_renamed_superadmin"] } },
  });

  // 1. Verify that database contains encrypted bcrypt hash for existing superadmin
  const existingSuper = await prisma.user.findUnique({
    where: { username: "superadmin" },
  });

  if (existingSuper) {
    assert(
      existingSuper.passwordHash.startsWith("$2"),
      "Existing superadmin password in DB must be bcrypt encrypted (starts with $2)"
    );
    assert(
      existingSuper.passwordHash !== "1111",
      "Existing superadmin password in DB must NEVER be stored in plain text"
    );
    console.log("  + Security verified: superadmin password is encrypted with bcrypt in DB");
  }

  // 2. Test verifyAdminCredentials with superadmin & 1111
  const loginResult = await verifyAdminCredentials("superadmin", "1111");
  assert(loginResult !== null, "Default superadmin / 1111 login must succeed");
  assert(loginResult.role === "SUPER_ADMIN", "Role must be SUPER_ADMIN");
  assert(loginResult.username === "superadmin", "Username must be superadmin");
  console.log("  + Login with default superadmin / 1111 succeeded");

  // 3. Test wrong password rejection
  const wrongResult = await verifyAdminCredentials("superadmin", "wrong_pass_999");
  assert(wrongResult === null, "Wrong password must be rejected");
  console.log("  + Security verified: wrong password rejected");

  // 4. Test simulate password reset via bcrypt hash (Settings flow)
  const user = await prisma.user.findUnique({
    where: { username: "superadmin" },
  });
  assert(user !== null, "superadmin user must exist in DB");

  const originalHash = user.passwordHash;
  const newHash = await bcrypt.hash(testNewPass, 10);

  // Update password in DB as done by resetBranchAdminPasswordAction
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  // 5. Test that old password "1111" now FAILS
  const oldPassResult = await verifyAdminCredentials("superadmin", "1111");
  assert(oldPassResult === null, "Old password 1111 must FAIL after password reset in settings");
  console.log("  + Security verified: old password 1111 fails after reset in settings");

  // 6. Test that new password succeeds
  const newPassResult = await verifyAdminCredentials("superadmin", testNewPass);
  assert(newPassResult !== null, "New password must succeed");
  assert(newPassResult.role === "SUPER_ADMIN", "Role remains SUPER_ADMIN");
  console.log("  + Security verified: new password succeeds");

  // Restore original password hash for superadmin
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: originalHash },
  });

  // Verify restored password works again
  const restoredResult = await verifyAdminCredentials("superadmin", "1111");
  assert(restoredResult !== null, "Restored password must work");
  console.log("  + Clean state: superadmin restored successfully");

  console.log("\nAll admin bootstrap & settings update lifecycle tests PASSED successfully!\n");
}

runBootstrapLifecycleTest().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});

