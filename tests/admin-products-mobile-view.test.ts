import fs from "node:fs";
import path from "node:path";

export function testAdminProductsMobileView(): {
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

  // 1. Responsive split check
  if (!content.includes("hidden md:block")) {
    recordError("Desktop table must be wrapped in 'hidden md:block'");
  } else {
    recordCheck("Desktop table is wrapped in 'hidden md:block'");
  }

  if (!content.includes("md:hidden")) {
    recordError("Mobile cards container must use 'md:hidden'");
  } else {
    recordCheck("Mobile cards container uses 'md:hidden'");
  }

  // 2. Mobile card structure check
  const hasMobileCardClass =
    content.includes("rounded-xl") &&
    content.includes("bg-card") &&
    content.includes("p-3.5") &&
    content.includes("space-y-3");
  if (!hasMobileCardClass) {
    recordError("Mobile card does not have required container classes (rounded-xl bg-card p-3.5 space-y-3)");
  } else {
    recordCheck("Mobile card has touch-friendly container classes");
  }

  // 3. Variant accordion trigger & touch target check
  const hasVariantAccordion =
    content.includes("viewVariants") &&
    content.includes("toggleExpand") &&
    (content.includes("min-h-[44px]") || content.includes("h-11"));
  if (!hasVariantAccordion) {
    recordError("Mobile card must have variant accordion trigger with 'viewVariants' and min 44px touch target ('min-h-[44px]')");
  } else {
    recordCheck("Mobile card has variant accordion trigger with min 44px touch target");
  }

  // 4. Action buttons touch target check (Edit and Delete)
  const hasTouchActionButtons =
    content.includes("h-10 w-10") &&
    content.includes(`/admin/products/\${product.id}/edit`);
  if (!hasTouchActionButtons) {
    recordError("Mobile card action buttons must have 40px+ touch targets ('h-10 w-10')");
  } else {
    recordCheck("Mobile card action buttons have 40px+ touch targets");
  }

  // 5. Variant item rendering check
  const hasVariantDetails =
    content.includes("colorHex") &&
    content.includes("conditionNew") &&
    content.includes("conditionUsed");
  if (!hasVariantDetails) {
    recordError("Mobile variant accordion must display color swatch and condition badges");
  } else {
    recordCheck("Mobile variant accordion displays color swatch and condition badges");
  }

  // 6. Zero emojis check
  const emojiRegex = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
  if (emojiRegex.test(content)) {
    recordError("products-list-view.tsx contains forbidden emojis per AGENTS.md");
  } else {
    recordCheck("products-list-view.tsx adheres to Zero Emojis policy");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("admin-products-mobile-view.test")) {
  const res = testAdminProductsMobileView();
  console.log("Admin Products Mobile View Test Suite:");
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
  console.log("\nAll Mobile View tests PASSED successfully!");
}
