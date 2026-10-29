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
      if (child.stderr) {
        console.error(`     STDERR:\n${child.stderr.trim()}`);
      }
      if (child.stdout) {
        console.error(`     STDOUT:\n${child.stdout.trim()}`);
      }
      console.log("");
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("===============================================================");
  console.log("VERIFICATION AUDIT SUMMARY REPORT");
  console.log("===============================================================");
  for (const r of results) {
    const mark = r.passed ? "[PASS]" : "[FAIL]";
    const padName = r.name.padEnd(50, ".");
    const padTime = `${(r.durationMs / 1000).toFixed(2)}s`.padStart(7, " ");
    console.log(` ${mark} ${padName} ${padTime}`);
  }
  console.log("---------------------------------------------------------------");
  console.log(` Total Suites: ${results.length}`);
  console.log(` Passed:       ${results.filter((r) => r.passed).length}`);
  console.log(` Failed:       ${results.filter((r) => !r.passed).length}`);
  console.log(` Time Elapsed: ${totalDuration}s`);
  console.log("===============================================================\n");

  if (!allPassed) {
    console.error("Master verification FAILED. Please review errors above.");
    process.exit(1);
  }

  console.log("Master verification SUCCEEDED! All systems verified production-ready.");
}

runMasterVerification();
