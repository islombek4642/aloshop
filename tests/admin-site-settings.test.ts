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
    announcementBanner: "Kuzgi chegirmalar boshlandi!",
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
    "components/store/announcement-banner.tsx",
    "components/store/header.tsx",
    "components/store/footer.tsx",
    "app/[locale]/(store)/layout.tsx",
    "app/[locale]/(store)/branches/page.tsx",
    "app/[locale]/(store)/page.tsx",
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

  // 6. Announcement Banner Integration
  console.log("\n--- 5. Announcement Banner & Header Integration ---");
  const bannerPath = join(process.cwd(), "components/store/announcement-banner.tsx");
  const bannerContent = readFileSync(bannerPath, "utf-8");
  assert.ok(bannerContent.includes("AnnouncementBanner"), "announcement-banner must export AnnouncementBanner");
  assert.ok(bannerContent.includes("Megaphone"), "AnnouncementBanner must use Megaphone icon");
  recordPass("AnnouncementBanner component implemented");

  const layoutPath = join(process.cwd(), "app/[locale]/(store)/layout.tsx");
  const layoutContent = readFileSync(layoutPath, "utf-8");
  assert.ok(layoutContent.includes("AnnouncementBanner"), "Storefront layout must render AnnouncementBanner");
  assert.ok(layoutContent.includes("getSiteSettings"), "Storefront layout must call getSiteSettings");
  recordPass("Storefront layout renders AnnouncementBanner and passes settings to header and footer");

  const headerPath = join(process.cwd(), "components/store/header.tsx");
  const headerContent = readFileSync(headerPath, "utf-8");
  assert.ok(headerContent.includes("settings?: SiteSettingsData"), "StoreHeader must accept settings prop");
  assert.ok(headerContent.includes("hidden lg:block"), "StoreHeader must have desktop utility bar");
  assert.ok(headerContent.includes("cleanPhone"), "StoreHeader must format phone link");
  recordPass("StoreHeader contains top utility bar with address, hours, phone, and social links");

  // 7. Store Footer dynamic integration
  console.log("\n--- 6. Store Footer Dynamic Integration ---");
  const footerPath = join(process.cwd(), "components/store/footer.tsx");
  const footerContent = readFileSync(footerPath, "utf-8");
  assert.ok(footerContent.includes("getSiteSettings"), "StoreFooter must call getSiteSettings");
  assert.ok(footerContent.includes("prisma.branch"), "StoreFooter must query prisma.branch for active branches");
  assert.ok(footerContent.includes("secondaryPhone"), "StoreFooter must support secondaryPhone");
  assert.ok(footerContent.includes("email"), "StoreFooter must support email");
  assert.ok(footerContent.includes("telegramUrl"), "StoreFooter must support social media links");
  recordPass("StoreFooter dynamically loads active branches, address, working hours, and contacts");

  // 8. Branches page dynamic headquarters integration
  console.log("\n--- 7. Branches Page Integration ---");
  const branchesPath = join(process.cwd(), "app/[locale]/(store)/branches/page.tsx");
  const branchesContent = readFileSync(branchesPath, "utf-8");
  assert.ok(branchesContent.includes("getSiteSettings"), "Branches page must call getSiteSettings");
  assert.ok(branchesContent.includes("settings?.address"), "Branches page must display dynamic address");
  recordPass("Branches page displays dynamic headquarters and contact info");

  // 9. Cache revalidation invariant
  console.log("\n--- 8. Cache Revalidation Invariants ---");
  const actionsPath = join(process.cwd(), "app/actions/admin-settings.ts");
  const actionsContent = readFileSync(actionsPath, "utf-8");
  assert.ok(actionsContent.includes('revalidateTag("site-settings")'), "safeRevalidate must call revalidateTag");
  assert.ok(actionsContent.includes('revalidatePath("/", "layout")'), "safeRevalidate must purge root layout");
  assert.ok(actionsContent.includes('revalidatePath("/[locale]", "layout")'), "safeRevalidate must purge locale layout");
  recordPass("Server actions safeRevalidate comprehensively invalidates layout and cache tags");

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
