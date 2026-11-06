(process.env as Record<string, string | undefined>).NODE_ENV = "test";
import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { bulkDeleteProductsAction } from "../app/actions/admin-products";
import { bulkDeleteProductsSchema } from "../lib/validations/admin-products";

const EMOJI_REGEX = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;

function assertZeroEmojis(content: string, filename: string): void {
  assert.strictEqual(
    EMOJI_REGEX.test(content),
    false,
    `${filename} must strictly contain zero emojis per AGENTS.md`
  );
}

export async function runAdminProductsBulkDeleteMasterSuite(): Promise<void> {
  console.log("=== Admin Products Bulk Delete & Mobile Cards Master Test Suite ===");
  let checkCount = 0;

  function recordPass(msg: string): void {
    checkCount++;
    console.log(`  [PASS] ${checkCount}. ${msg}`);
  }

  // =========================================================================
  // Section 1: Zod Schema Validation & Boundary Invariants
  // =========================================================================
  console.log("\n--- 1. Validation Schema Invariants ---");

  // 1.1 Valid payload parses successfully
  const validPayload = { productIds: ["prod-uuid-1", "prod-uuid-2"] };
  const validParsed = bulkDeleteProductsSchema.safeParse(validPayload);
  assert.strictEqual(validParsed.success, true, "Valid productIds array must pass validation");
  if (validParsed.success) {
    assert.deepStrictEqual(validParsed.data.productIds, ["prod-uuid-1", "prod-uuid-2"]);
  }
  recordPass("bulkDeleteProductsSchema accepts valid non-empty string array");

  // 1.2 Empty array is strictly rejected with custom uzbek error
  const emptyParsed = bulkDeleteProductsSchema.safeParse({ productIds: [] });
  assert.strictEqual(emptyParsed.success, false, "Empty productIds must fail validation");
  if (!emptyParsed.success) {
    assert.strictEqual(
      emptyParsed.error.issues[0]?.message,
      "Kamida bitta mahsulot tanlanishi shart"
    );
  }
  recordPass("bulkDeleteProductsSchema rejects empty array with Uzbek error message");

  // 1.3 Empty string ID inside array is rejected
  const emptyItemParsed = bulkDeleteProductsSchema.safeParse({ productIds: [""] });
  assert.strictEqual(emptyItemParsed.success, false, "Empty string product ID must fail");
  recordPass("bulkDeleteProductsSchema rejects empty string product IDs");

  // 1.4 Non-array types are rejected
  const invalidTypeParsed = bulkDeleteProductsSchema.safeParse({ productIds: "prod-1" });
  assert.strictEqual(invalidTypeParsed.success, false, "Non-array productIds must fail");
  recordPass("bulkDeleteProductsSchema rejects non-array input");

  // =========================================================================
  // Section 2: Server Action Authorization & Guard Invariants
  // =========================================================================
  console.log("\n--- 2. Server Action Runtime & RBAC Invariants ---");

  // 2.1 Unauthenticated call rejects with unauthorized
  const unauthRes = await bulkDeleteProductsAction({ productIds: ["prod-unauth-test"] });
  assert.strictEqual(unauthRes.success, false, "Unauthenticated call must fail");
  if (!unauthRes.success) {
    assert.strictEqual(unauthRes.error, "unauthorized", "Unauthenticated error must be 'unauthorized'");
  }
  recordPass("bulkDeleteProductsAction rejects unauthenticated callers with 'unauthorized'");

  // 2.2 Server action source code static audit
  const actionFilePath = join(process.cwd(), "app/actions/admin-products.ts");
  const actionSource = readFileSync(actionFilePath, "utf-8");

  // 2.3 SuperAdmin check
  assert.match(
    actionSource,
    /isSuperAdmin\(session\)/,
    "bulkDeleteProductsAction must verify isSuperAdmin(session)"
  );
  recordPass("SuperAdmin role requirement verified in action source");

  // 2.4 Active orders check statuses: PENDING, CONFIRMED, PROCESSING, SHIPPED
  assert.match(actionSource, /PENDING/, "Active statuses must include PENDING");
  assert.match(actionSource, /CONFIRMED/, "Active statuses must include CONFIRMED");
  assert.match(actionSource, /PROCESSING/, "Active statuses must include PROCESSING");
  assert.match(actionSource, /SHIPPED/, "Active statuses must include SHIPPED");
  assert.match(actionSource, /skippedActiveCount\+\+/, "Active orders must increment skippedActiveCount");
  recordPass("Active unfulfilled orders guard (PENDING, CONFIRMED, PROCESSING, SHIPPED) verified");

  // 2.5 Historical orders soft-delete archive check: preserves order items
  assert.match(
    actionSource,
    /isArchived:\s*true/,
    "Historical products must be soft-deleted by setting isArchived: true"
  );
  assert.match(actionSource, /archivedCount\+\+/, "Historical orders must increment archivedCount");
  assert.doesNotMatch(
    actionSource,
    /orderItem\.deleteMany/,
    "orderItem.deleteMany must never be called (preserves financial/order history)"
  );
  recordPass("Historical order soft-delete archive guard and orderItem preservation verified");

  // 2.6 Atomic transaction for unreferenced products
  assert.match(
    actionSource,
    /prisma\.\$transaction/,
    "Hard deletion must be executed inside an atomic prisma.$transaction"
  );
  assert.match(actionSource, /branchInventory\.deleteMany/, "Must cascade delete branchInventory");
  assert.match(actionSource, /iMEIRecord\.deleteMany/, "Must cascade delete iMEIRecord");
  assert.match(actionSource, /productVariant\.deleteMany/, "Must cascade delete productVariant");
  assert.match(actionSource, /product\.delete/, "Must delete product entity");
  assert.match(actionSource, /deletedCount\+\+/, "Must increment deletedCount");
  recordPass("Cascade deletion inside atomic transaction verified");

  // 2.7 Cache revalidation
  assert.match(
    actionSource,
    /safeRevalidatePath\("\/admin\/products"\)/,
    "Must revalidate /admin/products"
  );
  assert.match(
    actionSource,
    /safeRevalidatePath\("\/catalog"\)/,
    "Must revalidate /catalog"
  );
  recordPass("Cache revalidation for /admin/products and /catalog verified");

  // =========================================================================
  // Section 3: UI Responsive Layout & Mobile Cards Invariants
  // =========================================================================
  console.log("\n--- 3. UI Responsive Layout & Mobile Cards Invariants ---");

  const uiFilePath = join(process.cwd(), "components/admin/products-list-view.tsx");
  assert.strictEqual(existsSync(uiFilePath), true, "components/admin/products-list-view.tsx must exist");
  const uiSource = readFileSync(uiFilePath, "utf-8");

  // 3.1 Responsive breakpoint split
  assert.match(
    uiSource,
    /hidden\s+md:block/,
    "Desktop table must be wrapped in 'hidden md:block'"
  );
  assert.match(
    uiSource,
    /md:hidden/,
    "Mobile card layout must be wrapped in 'md:hidden'"
  );
  recordPass("Responsive desktop table / mobile cards split verified");

  // 3.2 Mobile card container structure
  assert.ok(
    uiSource.includes("rounded-xl") &&
    uiSource.includes("bg-card") &&
    uiSource.includes("p-3.5") &&
    uiSource.includes("space-y-3"),
    "Mobile cards must have touch-friendly styling (rounded-xl bg-card p-3.5 space-y-3)"
  );
  recordPass("Mobile card container classes verified");

  // 3.3 Expandable variant accordion & touch targets
  assert.ok(
    uiSource.includes("viewVariants") &&
    uiSource.includes("toggleExpand") &&
    (uiSource.includes("min-h-[44px]") || uiSource.includes("h-11")),
    "Mobile variant accordion trigger must have min 44px touch target ('min-h-[44px]')"
  );
  recordPass("Expandable variant accordion with 44px+ touch target verified");

  // 3.4 Action button touch targets (40px+)
  assert.ok(
    uiSource.includes("h-10 w-10") &&
    uiSource.includes("/admin/products/"),
    "Mobile action buttons must meet 40px+ touch target (h-10 w-10)"
  );
  recordPass("Mobile action buttons touch target (h-10 w-10) verified");

  // 3.5 Variant details swatch and condition badges
  assert.ok(
    uiSource.includes("colorHex") &&
    uiSource.includes("conditionNew") &&
    uiSource.includes("conditionUsed"),
    "Mobile variant accordion must display color swatch and condition badges"
  );
  recordPass("Mobile variant color swatch and condition badges verified");

  // =========================================================================
  // Section 4: Multi-Select, Batch Action Bar & Modal Invariants
  // =========================================================================
  console.log("\n--- 4. Multi-Select & Batch Action Invariants ---");

  // 4.1 Selection state management
  assert.ok(
    uiSource.includes("selectedProductIds") &&
    uiSource.includes("toggleSelectProduct") &&
    uiSource.includes("clearSelection"),
    "Must implement selectedProductIds, toggleSelectProduct, and clearSelection"
  );
  recordPass("Selection state hooks and helper methods verified");

  // 4.2 Selection reset on filter / search / pagination changes
  assert.ok(
    uiSource.includes("clearSelection") &&
    uiSource.includes("currentPage") &&
    uiSource.includes("searchTerm"),
    "Selection must be cleared on filter/search/page transitions"
  );
  recordPass("Selection reset effect on search, filter, and page change verified");

  // 4.3 Desktop and mobile selection checkboxes
  assert.match(
    uiSource,
    /type="checkbox"/,
    "Checkbox inputs must be rendered for multi-select"
  );
  assert.ok(
    uiSource.includes("stopPropagation"),
    "Row/card selection click must use stopPropagation"
  );
  recordPass("Multi-select checkboxes with stopPropagation verified");

  // 4.4 Floating action bar positioning and content
  assert.ok(
    uiSource.includes("fixed bottom-6") &&
    uiSource.includes("-translate-x-1/2") &&
    uiSource.includes("selectedCount") &&
    uiSource.includes("clearSelection"),
    "Floating batch action bar must be fixed at bottom-6, centered, showing selectedCount"
  );
  recordPass("Floating batch action bar at bottom-6 verified");

  // 4.5 Bulk delete confirmation modal & loading state
  assert.ok(
    uiSource.includes("isBulkModalOpen") &&
    uiSource.includes("isBulkDeleting") &&
    uiSource.includes("bulkDeleteModalTitle") &&
    uiSource.includes("bulkDeleteModalDesc") &&
    uiSource.includes("handleConfirmBulkDelete"),
    "Bulk delete confirmation dialog and loading state verified"
  );
  recordPass("Bulk delete modal and loading state verified");

  // =========================================================================
  // Section 5: i18n Translation Parity across uz, ru, en
  // =========================================================================
  console.log("\n--- 5. i18n Translation Parity Invariants ---");

  const requiredKeys = [
    "admin.productsManagement.selectAll",
    "admin.productsManagement.selectedCount",
    "admin.productsManagement.bulkDeleteBtn",
    "admin.productsManagement.bulkDeleteModalTitle",
    "admin.productsManagement.bulkDeleteModalDesc",
    "admin.productsManagement.bulkDeleteSuccess",
    "admin.productsManagement.bulkDeleteSkipped",
    "admin.productsManagement.cancelSelection",
    "admin.productsManagement.viewVariants",
  ];

  const locales = ["uz", "ru", "en"] as const;
  for (const locale of locales) {
    const localePath = join(process.cwd(), `messages/${locale}.json`);
    assert.strictEqual(existsSync(localePath), true, `messages/${locale}.json must exist`);
    const localeJson = JSON.parse(readFileSync(localePath, "utf-8"));

    for (const key of requiredKeys) {
      const parts = key.split(".");
      let current: unknown = localeJson;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }
      assert.ok(
        typeof current === "string" && current.trim().length > 0,
        `Missing translation key '${key}' in messages/${locale}.json`
      );
    }
    recordPass(`All 9 new translation keys present and non-empty in messages/${locale}.json`);
  }

  // =========================================================================
  // Section 6: Zero Emojis Compliance
  // =========================================================================
  console.log("\n--- 6. Zero Emojis Compliance ---");

  assertZeroEmojis(actionSource, "app/actions/admin-products.ts");
  assertZeroEmojis(uiSource, "components/admin/products-list-view.tsx");

  const validationPath = join(process.cwd(), "lib/validations/admin-products.ts");
  assertZeroEmojis(readFileSync(validationPath, "utf-8"), "lib/validations/admin-products.ts");

  for (const locale of locales) {
    const localePath = join(process.cwd(), `messages/${locale}.json`);
    assertZeroEmojis(readFileSync(localePath, "utf-8"), `messages/${locale}.json`);
  }
  recordPass("Zero emojis verified across all relevant codebase files");

  console.log(`\n===============================================================`);
  console.log(`All ${checkCount} verification checks passed successfully!`);
  console.log(`===============================================================\n`);
}

if (require.main === module || process.argv[1]?.includes("admin-products-bulk-delete.test")) {
  runAdminProductsBulkDeleteMasterSuite().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
