(process.env as Record<string, string | undefined>).NODE_ENV = "test";
import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { updateSiteSettingsSchema } from "../lib/validations/admin-settings";
import { updateSiteSettingsAction } from "../app/actions/admin-settings";
import { DEFAULT_SITE_SETTINGS } from "../lib/settings/site-settings";

const EMOJI_REGEX = /(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;

function assertZeroEmojis(content: string, filename: string): void {
  assert.strictEqual(
    EMOJI_REGEX.test(content),
    false,
    `${filename} must strictly contain zero emojis per AGENTS.md`
  );
}

export async function runSiteSettingsSuite(): Promise<void> {
  console.log("=== Admin Site Settings Master Test Suite ===");
  let checkCount = 0;

  function recordPass(msg: string): void {
    checkCount++;
    console.log(`  [PASS] ${checkCount}. ${msg}`);
  }

  // 1. Zod schema validation
  console.log("\n--- 1. Validation Schema Invariants ---");
  const validPayload = {
    siteName: "AloShop",
    phone: "+998 71 200 11 22",
    secondaryPhone: "+998 90 123 45 67",
    email: "info@aloshop.uz",
    workingHours: "09:00 - 20:00",
    address: "Toshkent sh., Navoiy shoh ko'chasi",
    telegramUrl: "https://t.me/aloshop_official",
    instagramUrl: "https://instagram.com/aloshop",
    facebookUrl: null,
    announcementBanner: null,
  };
  const validParsed = updateSiteSettingsSchema.safeParse(validPayload);
  assert.strictEqual(validParsed.success, true, "Valid site settings payload must pass validation");
  recordPass("updateSiteSettingsSchema accepts valid payload");

  // Invalid email
  const invalidEmailParsed = updateSiteSettingsSchema.safeParse({
    ...validPayload,
    email: "not-an-email",
  });
  assert.strictEqual(invalidEmailParsed.success, false, "Invalid email must fail");
  recordPass("updateSiteSettingsSchema rejects invalid email");

  // Empty site name
  const emptyNameParsed = updateSiteSettingsSchema.safeParse({
    ...validPayload,
    siteName: "",
  });
  assert.strictEqual(emptyNameParsed.success, false, "Empty site name must fail");
  recordPass("updateSiteSettingsSchema rejects empty siteName");

  // 2. Default settings
  console.log("\n--- 2. Default Settings Invariants ---");
  assert.strictEqual(DEFAULT_SITE_SETTINGS.id, "global");
  assert.strictEqual(DEFAULT_SITE_SETTINGS.siteName, "AloShop");
  assert.ok(DEFAULT_SITE_SETTINGS.phone.includes("+998"));
  assert.ok(DEFAULT_SITE_SETTINGS.workingHours.includes("09:00"));
  recordPass("DEFAULT_SITE_SETTINGS structure and defaults verified");

  // 3. Server action authorization
  console.log("\n--- 3. Server Action RBAC Guard Invariants ---");
  const unauthRes = await updateSiteSettingsAction(validPayload);
  assert.strictEqual(unauthRes.success, false);
  if (!unauthRes.success) {
    assert.strictEqual(unauthRes.error, "unauthorized");
  }
  recordPass("updateSiteSettingsAction rejects unauthenticated callers with 'unauthorized'");

  // 4. File existence and zero emojis
  console.log("\n--- 4. Codebase Files & Zero Emojis Compliance ---");
  const filesToCheck = [
    "lib/validations/admin-settings.ts",
    "lib/settings/site-settings.ts",
    "app/actions/admin-settings.ts",
    "components/admin/settings-form.tsx",
    "app/[locale]/admin/settings/page.tsx",
  ];

  for (const relPath of filesToCheck) {
    const fullPath = join(process.cwd(), relPath);
    assert.strictEqual(existsSync(fullPath), true, `${relPath} must exist`);
    const content = readFileSync(fullPath, "utf-8");
    assertZeroEmojis(content, relPath);
    recordPass(`${relPath} verified (exists and zero emojis)`);
  }

  // 5. Sidebar Settings menu item check
  const sidebarPath = join(process.cwd(), "components/admin/admin-sidebar.tsx");
  const sidebarContent = readFileSync(sidebarPath, "utf-8");
  assert.ok(sidebarContent.includes("/admin/settings"), "AdminSidebar must include /admin/settings link");
  assert.ok(sidebarContent.includes("Settings"), "AdminSidebar must import and use Settings icon");
  assert.ok(sidebarContent.includes("isCollapsed"), "AdminSidebar must implement isCollapsed state");
  recordPass("AdminSidebar contains collapsible state and settings menu link");

  // 6. Store Footer dynamic integration
  const footerPath = join(process.cwd(), "components/store/footer.tsx");
  const footerContent = readFileSync(footerPath, "utf-8");
  assert.ok(footerContent.includes("getSiteSettings"), "StoreFooter must call getSiteSettings");
  assert.ok(footerContent.includes("prisma.branch"), "StoreFooter must query prisma.branch for active branches");
  recordPass("StoreFooter dynamically loads active branches and site settings");

  console.log(`\n===============================================================`);
  console.log(`All ${checkCount} site settings verification checks passed successfully!`);
  console.log(`===============================================================\n`);
}

if (require.main === module || process.argv[1]?.includes("admin-site-settings.test")) {
  runSiteSettingsSuite().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
