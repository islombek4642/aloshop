import fs from "node:fs";
import path from "node:path";

export function testBuildSafety() {
  const checks: string[] = [];
  const errors: string[] = [];

  const pkgPath = path.resolve(process.cwd(), "package.json");
  const pkgContent = fs.readFileSync(pkgPath, "utf-8");
  const pkg = JSON.parse(pkgContent);

  const buildScript: string = pkg.scripts?.build || "";

  // 1. Build script must not call seed.ts
  if (buildScript.includes("seed.ts")) {
    errors.push(`Critical Hazard: package.json build script contains 'seed.ts', which wipes data on deploy: "${buildScript}"`);
  } else {
    checks.push("package.json build script does NOT call seed.ts");
  }

  // 2. Build script must not call db push --accept-data-loss
  if (buildScript.includes("--accept-data-loss")) {
    errors.push(`Critical Hazard: package.json build script contains '--accept-data-loss': "${buildScript}"`);
  } else {
    checks.push("package.json build script does NOT use --accept-data-loss");
  }

  // 3. Build script must run prisma generate and next build
  if (!buildScript.includes("prisma generate") || !buildScript.includes("next build")) {
    errors.push(`package.json build script must run 'prisma generate && next build', got: "${buildScript}"`);
  } else {
    checks.push("package.json build script runs standard 'prisma generate && next build'");
  }

  // 4. Check seed.ts has production safety guard
  const seedPath = path.resolve(process.cwd(), "prisma/seed.ts");
  const seedContent = fs.readFileSync(seedPath, "utf-8");
  if (!seedContent.includes("NODE_ENV === \"production\"") && !seedContent.includes("NODE_ENV === 'production'")) {
    errors.push("prisma/seed.ts lacks a production environment safety guard to prevent accidental data wipes");
  } else {
    checks.push("prisma/seed.ts contains production safety guard");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("build-safety.test")) {
  console.log("====================================================");
  console.log("Auditing Build & Seed Production Safety");
  console.log("====================================================");

  const res = testBuildSafety();
  for (const c of res.checks) {
    console.log(`[PASS] ${c}`);
  }
  if (!res.success) {
    console.error("\nERRORS DETECTED:");
    for (const e of res.errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }
  console.log("\nAll build and seed safety audits passed successfully.");
}
