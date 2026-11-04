import { spawnSync } from "node:child_process";
import path from "node:path";

interface SuiteDefinition {
  id: string;
  name: string;
  command: string;
}

interface SuiteResult {
  id: string;
  name: string;
  command: string;
  passed: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

const SUITES: SuiteDefinition[] = [
  {
    id: "i18n",
    name: "i18n Parity, Quality & Zero-Emoji Audit",
    command: `npx tsx "${path.join("scripts", "test-i18n.ts")}"`,
  },
  {
    id: "currency",
    name: "Currency & Price Formatting Suite",
    command: `npx tsx "${path.join("tests", "format-currency.test.ts")}"`,
  },
  {
    id: "checkout",
    name: "Checkout Validation & Anti-Spam Security Suite",
    command: `npx tsx "${path.join("tests", "checkout-validation.test.ts")}"`,
  },
  {
    id: "admin-auth",
    name: "Admin Authentication & RBAC Multi-Branch Suite",
    command: `npx tsx "${path.join("tests", "admin-auth.test.ts")}"`,
  },
  {
    id: "prisma-schema",
    name: "Prisma Schema & DMMF Model Delegate Audit",
    command: `npx tsx "${path.join("tests", "prisma-schema.test.ts")}"`,
  },
  {
    id: "static-assets",
    name: "Static Assets Pipeline & CDN Whitelist Audit",
    command: `npx tsx "${path.join("tests", "static-assets.test.ts")}"`,
  },
  {
    id: "catalog-presets",
    name: "Catalog Presets Engine & SKU Generator Suite",
    command: `npx tsx "${path.join("tests", "catalog-presets.test.ts")}"`,
  },
  {
    id: "admin-action",
    name: "Admin Product Action & Hardware Validation Suite",
    command: `npx tsx "${path.join("tests", "admin-products-action.test.ts")}"`,
  },
  {
    id: "storefront-specs",
    name: "Storefront Specifications & Vitals View Suite",
    command: `npx tsx "${path.join("tests", "storefront-specs.test.ts")}"`,
  },
  {
    id: "storefront-gallery",
    name: "Storefront Gallery Auto-Carousel Suite",
    command: `npx tsx "${path.join("tests", "storefront-gallery.test.ts")}"`,
  },
  {
    id: "catalog-pricing",
    name: "Catalog Pricing Engine Suite",
    command: `npx tsx "${path.join("tests", "catalog-pricing.test.ts")}"`,
  },
  {
    id: "admin-crud-actions",
    name: "Admin Product CRUD Actions Suite",
    command: `npx tsx "${path.join("tests", "admin-crud-actions.test.ts")}"`,
  },
  {
    id: "admin-crud-ui",
    name: "Admin Preset Matrix UI & Actions Suite",
    command: `npx tsx "${path.join("tests", "admin-crud-ui.test.ts")}"`,
  },
  {
    id: "admin-product-wizard",
    name: "Admin Product Wizard & Redesign Suite",
    command: `npx tsx "${path.join("tests", "admin-product-wizard.test.ts")}"`,
  },
  {
    id: "clean-apple-backgrounds",
    name: "Apple PNG Background Transparency Suite",
    command: `npx tsx "${path.join("tests", "clean-apple-backgrounds.test.ts")}"`,
  },
  {
    id: "product-card-carousel",
    name: "Catalog Product Card Hover Carousel Suite",
    command: `npx tsx "${path.join("tests", "product-card-carousel.test.ts")}"`,
  },
  {
    id: "typecheck",
    name: "Strict TypeScript Compilation (tsc --noEmit)",
    command: "npx tsc --noEmit",
  },
];

function runMasterVerification(): void {
  const startTime = Date.now();
  console.log("===============================================================");
  console.log("AloShop Master Engineering Verification Suite");
  console.log("Running comprehensive audits across all modules...");
  console.log("===============================================================\n");

  const results: SuiteResult[] = [];
  let allPassed = true;

  for (let i = 0; i < SUITES.length; i++) {
    const suite = SUITES[i];
    const indexStr = `[${i + 1}/${SUITES.length}]`;
    console.log(`${indexStr} RUNNING: ${suite.name}`);
    console.log(`     Command: ${suite.command}`);

    const suiteStart = Date.now();
    const child = spawnSync(suite.command, {
      shell: true,
      encoding: "utf-8",
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });
    const durationMs = Date.now() - suiteStart;
    const passed = child.status === 0;

    results.push({
      id: suite.id,
      name: suite.name,
      command: suite.command,
      passed,
      durationMs,
      stdout: child.stdout || "",
      stderr: child.stderr || "",
      exitCode: child.status,
    });

    if (passed) {
      console.log(`     STATUS: [PASS] (${(durationMs / 1000).toFixed(2)}s)\n`);
    } else {
      allPassed = false;
      console.error(
        `     STATUS: [FAIL] (Exit Code: ${child.status}, ${(durationMs / 1000).toFixed(2)}s)`
      );
      if (child.stdout) {
        console.log("--- STDOUT ---");
        console.log(child.stdout.trim());
      }
      if (child.stderr) {
        console.error("--- STDERR ---");
        console.error(child.stderr.trim());
      }
      console.log("\n");
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("===============================================================");
  console.log("VERIFICATION AUDIT SUMMARY REPORT");
  console.log("===============================================================");
  for (const r of results) {
    const statusTag = r.passed ? "[PASS]" : "[FAIL]";
    const line = ` ${statusTag} ${r.name.padEnd(46, ".")} ${(r.durationMs / 1000).toFixed(2).padStart(6, " ")}s`;
    console.log(line);
  }
  console.log("---------------------------------------------------------------");
  console.log(` Total Suites: ${SUITES.length}`);
  console.log(` Passed:       ${passedCount}`);
  console.log(` Failed:       ${failedCount}`);
  console.log(` Time Elapsed: ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log("===============================================================\n");

  if (!allPassed) {
    console.error("Master verification FAILED! Please resolve the errors above before shipping.");
    process.exit(1);
  } else {
    console.log("Master verification SUCCEEDED! All systems verified production-ready.\n");
  }
}

if (require.main === module || process.argv[1]?.includes("verify-all")) {
  runMasterVerification();
}
