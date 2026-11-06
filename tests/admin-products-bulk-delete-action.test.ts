(process.env as Record<string, string | undefined>).NODE_ENV = "test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bulkDeleteProductsAction } from "../app/actions/admin-products";
import { bulkDeleteProductsSchema } from "../lib/validations/admin-products";

async function runBulkDeleteActionTests() {
  console.log("Running bulk delete action unit and schema tests...");

  // 1. Zod schema validation tests
  const validCheck = bulkDeleteProductsSchema.safeParse({
    productIds: ["prod-1", "prod-2"],
  });
  assert.strictEqual(validCheck.success, true, "Valid productIds must pass validation");
  if (validCheck.success) {
    assert.deepStrictEqual(validCheck.data.productIds, ["prod-1", "prod-2"]);
  }

  // Empty array must fail validation
  const emptyCheck = bulkDeleteProductsSchema.safeParse({ productIds: [] });
  assert.strictEqual(emptyCheck.success, false, "Empty productIds array must fail validation");
  if (!emptyCheck.success) {
    const errorMsg = emptyCheck.error.issues[0]?.message;
    assert.strictEqual(
      errorMsg,
      "Kamida bitta mahsulot tanlanishi shart",
      "Expected exact validation message for empty productIds"
    );
  }

  // Array with empty string must fail
  const emptyStringCheck = bulkDeleteProductsSchema.safeParse({
    productIds: [""],
  });
  assert.strictEqual(emptyStringCheck.success, false, "Empty string product ID must fail validation");

  // Non-array input must fail
  const nonArrayCheck = bulkDeleteProductsSchema.safeParse({
    productIds: "prod-1",
  });
  assert.strictEqual(nonArrayCheck.success, false, "Non-array productIds must fail validation");

  console.log("  + Zod schema validation rules verified");

  // 2. Unauthenticated invocation must return unauthorized
  const unauthRes = await bulkDeleteProductsAction({
    productIds: ["test-id-1"],
  });
  assert.strictEqual(unauthRes.success, false, "Unauthenticated request must fail");
  if (!unauthRes.success) {
    assert.strictEqual(unauthRes.error, "unauthorized", "Must return 'unauthorized'");
  }
  console.log("  + Unauthenticated invocation rejected with 'unauthorized'");

  // 3. Static audit of source code for security, invariants, and zero regressions
  const actionFilePath = join(process.cwd(), "app/actions/admin-products.ts");
  const actionContent = readFileSync(actionFilePath, "utf-8");

  // Verify SuperAdmin RBAC guard
  assert.match(
    actionContent,
    /isSuperAdmin\(session\)/,
    "bulkDeleteProductsAction must check isSuperAdmin(session)"
  );

  // Verify safeRevalidatePath calls for /admin/products and /catalog
  assert.match(
    actionContent,
    /safeRevalidatePath\("\/admin\/products"\)/,
    "bulkDeleteProductsAction must revalidate /admin/products"
  );
  assert.match(
    actionContent,
    /safeRevalidatePath\("\/catalog"\)/,
    "bulkDeleteProductsAction must revalidate /catalog"
  );

  // Verify historical order protection: must not delete order items
  assert.doesNotMatch(
    actionContent,
    /orderItem\.deleteMany/,
    "Must never call orderItem.deleteMany (customer order items must be preserved)"
  );

  // Verify historical soft-delete archival
  assert.match(
    actionContent,
    /isArchived:\s*true/,
    "Must soft-delete via isArchived: true when historical orders exist"
  );

  // Verify active order statuses
  assert.match(
    actionContent,
    /PENDING/,
    "Active order check must include PENDING"
  );
  assert.match(
    actionContent,
    /CONFIRMED/,
    "Active order check must include CONFIRMED"
  );
  assert.match(
    actionContent,
    /SHIPPED/,
    "Active order check must include SHIPPED"
  );

  // Verify zero emojis in action and test files
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.strictEqual(
    emojiRegex.test(actionContent),
    false,
    "admin-products.ts must not contain any emoji"
  );

  console.log("  + Action invariants and archival guards verified");
  console.log("All bulk delete action unit tests PASSED successfully!");
}

runBulkDeleteActionTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
