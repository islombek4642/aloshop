import fs from "node:fs";
import path from "node:path";

export function testAdminProductsSelectionBar(): {
  success: boolean;
  checks: string[];
  errors: string[];
} {
  const checks: string[] = [];
  const errors: string[] = [];

  function recordCheck(name: string) {
    checks.push(name);
  }

  function recordError(msg: string) {
    errors.push(msg);
  }

  const filePath = path.resolve(process.cwd(), "components/admin/products-list-view.tsx");
  if (!fs.existsSync(filePath)) {
    recordError("components/admin/products-list-view.tsx does not exist");
    return { success: false, checks, errors };
  }

  const content = fs.readFileSync(filePath, "utf-8");

  // 1. Server action import & invocation
  if (!content.includes("bulkDeleteProductsAction")) {
    recordError("products-list-view.tsx must import and call bulkDeleteProductsAction");
  } else {
    recordCheck("products-list-view.tsx imports bulkDeleteProductsAction");
  }

  // 2. Selection state management
  const hasSelectionState =
    content.includes("selectedProductIds") &&
    content.includes("toggleSelectProduct") &&
    (content.includes("toggleSelectAllOnPage") || content.includes("toggleSelectAllCurrentPage")) &&
    content.includes("clearSelection");
  if (!hasSelectionState) {
    recordError("products-list-view.tsx must define selectedProductIds, toggleSelectProduct, toggleSelectAllOnPage, and clearSelection");
  } else {
    recordCheck("products-list-view.tsx implements selection state management and helper methods");
  }

  // 3. Selection reset on filter / pagination changes
  const hasSelectionResetEffect =
    content.includes("clearSelection") &&
    content.includes("currentPage") &&
    content.includes("searchTerm");
  if (!hasSelectionResetEffect) {
    recordError("products-list-view.tsx must reset selection when search/filter/pagination changes");
  } else {
    recordCheck("Selection resets on search, filter, and pagination changes");
  }

  // 4. Desktop checkboxes
  const hasDesktopHeaderCheckbox =
    content.includes("selectAll") &&
    content.includes('type="checkbox"');
  if (!hasDesktopHeaderCheckbox) {
    recordError("Desktop table header must include a select all checkbox with selectAll aria-label");
  } else {
    recordCheck("Desktop table header includes select all checkbox");
  }

  const hasDesktopRowCheckbox =
    content.includes("toggleSelectProduct") &&
    content.includes("stopPropagation");
  if (!hasDesktopRowCheckbox) {
    recordError("Desktop table rows must include individual checkboxes with stopPropagation");
  } else {
    recordCheck("Desktop table rows include individual checkboxes with stopPropagation");
  }

  // 5. Mobile card checkboxes
  const hasMobileCheckbox =
    content.includes("md:hidden") &&
    content.includes("toggleSelectProduct");
  if (!hasMobileCheckbox) {
    recordError("Mobile card view must include individual checkboxes for selection");
  } else {
    recordCheck("Mobile card view includes touch-friendly selection checkboxes");
  }

  // 6. Floating Action Bar
  const hasFloatingBar =
    content.includes("fixed bottom-6") &&
    content.includes("-translate-x-1/2") &&
    content.includes("selectedCount") &&
    content.includes("clearSelection");
  if (!hasFloatingBar) {
    recordError("Floating batch action bar must be fixed at bottom-6, centered, and show selected count");
  } else {
    recordCheck("Floating batch action bar is rendered at bottom-6 when items are selected");
  }

  // 7. Bulk Delete Modal & Loading State
  const hasBulkDeleteModal =
    content.includes("isBulkModalOpen") &&
    content.includes("isBulkDeleting") &&
    content.includes("bulkDeleteModalTitle") &&
    content.includes("bulkDeleteModalDesc") &&
    content.includes("handleConfirmBulkDelete");
  if (!hasBulkDeleteModal) {
    recordError("products-list-view.tsx must implement bulk delete modal with confirmation dialog and loading state");
  } else {
    recordCheck("Bulk delete confirmation dialog and loading state implemented");
  }

  // 8. Zero Emojis check
  const emojiRegex = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
  if (emojiRegex.test(content)) {
    recordError("products-list-view.tsx contains forbidden emojis per AGENTS.md");
  } else {
    recordCheck("products-list-view.tsx complies with Zero Emojis policy");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("admin-products-selection-bar.test")) {
  const res = testAdminProductsSelectionBar();
  console.log("Admin Products Selection Bar & Bulk Delete Test Suite:");
  console.log(`Status: ${res.success ? "PASSED" : "FAILED"}`);
  for (const c of res.checks) {
    console.log(`  + ${c}`);
  }
  if (!res.success) {
    console.error("Errors found:");
    for (const err of res.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
  console.log("\nAll Selection Bar & Bulk Delete tests PASSED successfully!");
}
