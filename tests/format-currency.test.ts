import { formatCurrency } from "../lib/utils/format-currency";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("Starting formatCurrency tests...");

  // 1. Basic formatting with number
  const r1 = formatCurrency(14850000);
  assert(r1 === "14 850 000 so'm", `Expected "14 850 000 so'm", got "${r1}"`);
  console.log("  + Basic number formatted:", r1);

  // 2. String input
  const r2 = formatCurrency("14850000");
  assert(r2 === "14 850 000 so'm", `Expected "14 850 000 so'm", got "${r2}"`);
  console.log("  + String number formatted:", r2);

  // 3. Decimal-like object (e.g. Prisma Decimal)
  const fakePrismaDecimal = {
    toString() {
      return "18999000";
    },
  };
  const r3 = formatCurrency(fakePrismaDecimal);
  assert(r3 === "18 999 000 so'm", `Expected "18 999 000 so'm", got "${r3}"`);
  console.log("  + Prisma Decimal formatted:", r3);

  // 4. Zero and null/undefined
  assert(formatCurrency(0) === "0 so'm", "Zero failed");
  assert(formatCurrency(null) === "0 so'm", "Null failed");
  assert(formatCurrency(undefined) === "0 so'm", "Undefined failed");
  console.log("  + Zero, null, undefined handled correctly");

  // 5. Negative values
  const r5 = formatCurrency(-50000);
  assert(r5 === "-50 000 so'm", `Expected "-50 000 so'm", got "${r5}"`);
  console.log("  + Negative values formatted:", r5);

  // 6. Custom currency
  const r6 = formatCurrency(1200, "$");
  assert(r6 === "1 200 $", `Expected "1 200 $", got "${r6}"`);
  console.log("  + Custom currency suffix:", r6);

  // 7. Hide currency
  const r7 = formatCurrency(14850000, { showCurrency: false });
  assert(r7 === "14 850 000", `Expected "14 850 000", got "${r7}"`);
  console.log("  + Without currency suffix:", r7);

  // 8. Fixed decimals
  const r8 = formatCurrency(1234567.89, { decimals: 2, currency: "USD" });
  assert(r8 === "1 234 567.89 USD", `Expected "1 234 567.89 USD", got "${r8}"`);
  console.log("  + Custom decimals option:", r8);

  console.log("\nAll formatCurrency tests PASSED!");
}

runTests();
