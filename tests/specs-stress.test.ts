import { Prisma } from "@prisma/client";
import {
  inferDefaultRam,
  getDeviceVitals,
  formatRam,
  formatStorage,
  KNOWN_DEVICES,
  DeviceVitals,
} from "../lib/utils/specs";

interface StressTestReport {
  total: number;
  passed: number;
  failed: number;
  failures: string[];
}

const report: StressTestReport = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
};

function assert(condition: boolean, testName: string, details?: string): void {
  report.total++;
  if (condition) {
    report.passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    report.failed++;
    const errMsg = `[FAIL] ${testName}${details ? ` -> ${details}` : ""}`;
    console.error(errMsg);
    report.failures.push(errMsg);
  }
}

// ============================================================================
// 1. KNOWN DEVICES CATALOG INTEGRITY & NO REGEX CORRUPTION
// ============================================================================
console.log("\n--- Suite 1: Catalog Integrity & Regex Safety ---");

assert(KNOWN_DEVICES.length >= 10, "Known devices catalog contains expected device count", `Found: ${KNOWN_DEVICES.length}`);

for (const device of KNOWN_DEVICES) {
  assert(
    !device.modelMatch.global,
    `Device ${device.brand} regex must NOT have global /g flag (stateful lastIndex leak risk)`
  );
  assert(device.brand.length > 0, `Device ${device.brand} has valid brand name`);
  assert(device.screenSize.length > 0, `Device ${device.brand} has non-empty screenSize`);
  assert(device.processor.length > 0, `Device ${device.brand} has non-empty processor`);
  assert(device.battery.length > 0, `Device ${device.brand} has non-empty battery`);
  assert(device.defaultRam.endsWith("GB"), `Device ${device.brand} defaultRam ends with GB: ${device.defaultRam}`);

  // Zero emoji rule check in device catalog
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert(
    !emojiRegex.test(device.screenSize) &&
      !emojiRegex.test(device.processor) &&
      !emojiRegex.test(device.battery),
    `Device ${device.brand} spec contains zero emojis`
  );
}

// ============================================================================
// 2. CASING & UNUSUAL FORMATTING TESTS (inferDefaultRam)
// ============================================================================
console.log("\n--- Suite 2: Casing & Unusual Formatting Tests ---");

const casingCases = [
  { brand: "apple", model: "iphone 15 pro", expected: "8GB" },
  { brand: "APPLE", model: "IPHONE 15 PRO", expected: "8GB" },
  { brand: "ApPlE", model: "IpHoNe 15 PrO", expected: "8GB" },
  { brand: "  Apple  ", model: "  iPhone 15 Pro Max  ", expected: "8GB" },
  { brand: "Apple", model: "iPhone  15   Pro", expected: "8GB" }, // multi-space
  { brand: "samsung", model: "galaxy s24 ultra", expected: "12GB" },
  { brand: "SAMSUNG", model: "GALAXY S24 ULTRA", expected: "12GB" },
  { brand: "Samsung", model: "Galaxy   S24    Ultra", expected: "12GB" },
  { brand: "samsung", model: "galaxy s24+", expected: "12GB" },
  { brand: "SAMSUNG", model: "GALAXY S24 +", expected: "12GB" },
  { brand: "samsung", model: "galaxy s24", expected: "8GB" },
  { brand: "xiaomi", model: "xiaomi 14 ultra", expected: "16GB" },
  { brand: "XIAOMI", model: "XIAOMI 14 ULTRA", expected: "16GB" },
  { brand: "Xiaomi", model: "Xiaomi   14   Ultra", expected: "16GB" },
  { brand: "xiaomi", model: "xiaomi 14", expected: "12GB" },
  { brand: "xiaomi", model: "xiaomi 13", expected: "8GB" },
  { brand: "Apple", model: "iPhone 16", expected: "8GB" },
  { brand: "Apple", model: "iPhone 16 Pro", expected: "8GB" },
  { brand: "Apple", model: "iPhone 15", expected: "6GB" },
  { brand: "Apple", model: "iPhone 15 Plus", expected: "6GB" },
  { brand: "Apple", model: "iPhone 14 Pro", expected: "6GB" },
  { brand: "Apple", model: "iPhone 14", expected: "6GB" },
  { brand: "Apple", model: "iPhone 13 Pro", expected: "6GB" },
  { brand: "Apple", model: "iPhone 13", expected: "4GB" },
];

for (const tc of casingCases) {
  const actual = inferDefaultRam(tc.brand, tc.model);
  assert(
    actual === tc.expected,
    `Casing test: '${tc.brand}' '${tc.model}'`,
    `Expected '${tc.expected}', got '${actual}'`
  );
}

// ============================================================================
// 3. STORAGE TIER VARIATIONS & OVERRIDES
// ============================================================================
console.log("\n--- Suite 3: Storage Tier Variations & Overrides ---");

const storageCases = [
  // Samsung Galaxy S23 Ultra storage tier branching
  { brand: "Samsung", model: "Galaxy S23 Ultra", storage: "256GB", expected: "8GB" },
  { brand: "Samsung", model: "Galaxy S23 Ultra", storage: "512GB", expected: "12GB" },
  { brand: "Samsung", model: "Galaxy S23 Ultra", storage: "1TB", expected: "12GB" },
  { brand: "Samsung", model: "Galaxy S23 Ultra", storage: undefined, expected: "12GB" },

  // Xiaomi 14 storage tier branching
  { brand: "Xiaomi", model: "Xiaomi 14", storage: "256GB", expected: "12GB" },
  { brand: "Xiaomi", model: "Xiaomi 14", storage: "512GB", expected: "12GB" },
  { brand: "Xiaomi", model: "Xiaomi 14", storage: "1TB", expected: "16GB" },
  { brand: "Xiaomi", model: "Xiaomi 14", storage: undefined, expected: "12GB" },

  // Storage heuristics on unknown devices
  { brand: "UnknownBrand", model: "Phone Flagship", storage: "1TB", expected: "16GB" },
  { brand: "UnknownBrand", model: "Phone Flagship", storage: "512GB", expected: "12GB" },
  { brand: "UnknownBrand", model: "Phone Flagship", storage: "256GB", expected: "8GB" },
  { brand: "UnknownBrand", model: "Phone Flagship", storage: "128GB", expected: "8GB" },
  { brand: "UnknownBrand", model: "Phone Flagship", storage: "64GB", expected: "8GB" },
  { brand: "UnknownBrand", model: "Phone Flagship", storage: "2TB", expected: "8GB" }, // unexpected storage
  { brand: "UnknownBrand", model: "Phone Flagship", storage: undefined, expected: "8GB" },
];

for (const tc of storageCases) {
  const actual = inferDefaultRam(tc.brand, tc.model, tc.storage);
  assert(
    actual === tc.expected,
    `Storage tier test: ${tc.brand} ${tc.model} [${tc.storage || "undefined"}]`,
    `Expected '${tc.expected}', got '${actual}'`
  );
}

// ============================================================================
// 4. UNKNOWN BRANDS & EXOTIC MODELS
// ============================================================================
console.log("\n--- Suite 4: Unknown Brands & Exotic Models ---");

const exoticCases = [
  { brand: "Google", model: "Pixel 8 Pro" },
  { brand: "Sony", model: "Xperia 1 V" },
  { brand: "Nothing", model: "Phone (2)" },
  { brand: "Tecno", model: "Camon 30 Premier" },
  { brand: "Infinix", model: "GT 20 Pro" },
  { brand: "OnePlus", model: "OnePlus 12" },
  { brand: "Honor", model: "Magic6 Pro" },
  { brand: "Realme", model: "GT 5 Pro" },
  { brand: "Asus", model: "ROG Phone 8" },
  { brand: "NonExistentBrand", model: "SuperPhone 9000" },
];

for (const tc of exoticCases) {
  const actual = inferDefaultRam(tc.brand, tc.model);
  assert(
    typeof actual === "string" && actual.endsWith("GB") && actual.length > 0,
    `Exotic brand fallback: ${tc.brand} ${tc.model}`,
    `Returned '${actual}'`
  );
}

// ============================================================================
// 5. ADVERSARIAL, MALFORMED & BOUNDARY INPUTS (inferDefaultRam)
// ============================================================================
console.log("\n--- Suite 5: Adversarial, Malformed & Boundary Inputs ---");

// Empty & whitespace strings
assert(inferDefaultRam("", "") === "8GB", "Empty brand and model returns 8GB without error");
assert(inferDefaultRam("   ", "   ") === "8GB", "Whitespace brand and model returns 8GB");
assert(inferDefaultRam("   ", "   ", "   ") === "8GB", "Whitespace brand, model, storage returns 8GB");
assert(inferDefaultRam("", "iPhone 15 Pro") === "8GB", "Empty brand with iPhone 15 Pro model infers 8GB");
assert(inferDefaultRam("", "Galaxy S24 Ultra") === "12GB", "Empty brand with Galaxy S24 Ultra model infers 12GB");
assert(inferDefaultRam("Apple", "") === "6GB", "Apple brand with empty model infers 6GB");
assert(inferDefaultRam("Samsung", "") === "8GB", "Samsung brand with empty model infers 8GB");
assert(inferDefaultRam("Xiaomi", "") === "8GB", "Xiaomi brand with empty model infers 8GB");

// Untyped / Runtime Nullish inputs
assert(
  inferDefaultRam(null as unknown as string, null as unknown as string) === "8GB",
  "Null brand and model does not throw and returns 8GB"
);
assert(
  inferDefaultRam(undefined as unknown as string, undefined as unknown as string) === "8GB",
  "Undefined brand and model does not throw and returns 8GB"
);
assert(
  inferDefaultRam("Apple", "iPhone 15 Pro", null as unknown as string) === "8GB",
  "Null storage does not throw and returns 8GB"
);

// XSS / SQL injection strings
const injectionStrings = [
  "<script>alert('xss')</script>",
  "' OR 1=1; --",
  "DROP TABLE Product;",
  "{{7*7}}",
  "${process.env.DATABASE_URL}",
  "\x00\x01\x02\x03",
  "🚀📱🔥⚡",
];

for (const inj of injectionStrings) {
  let result = "";
  let threw = false;
  try {
    result = inferDefaultRam(inj, inj, inj);
  } catch {
    threw = true;
  }
  assert(!threw && result.endsWith("GB"), `Injection safety: '${inj.substring(0, 20)}'`, `Got: '${result}'`);
}

// Performance & ReDoS stress test (long strings)
const longString = "iPhone 15 Pro ".repeat(5000); // 75,000 characters
const perfStart = Date.now();
const perfResult = inferDefaultRam("Apple", longString);
const perfDuration = Date.now() - perfStart;
assert(
  perfDuration < 100 && perfResult === "8GB",
  `ReDoS resistance: 75k characters evaluated in ${perfDuration}ms (<100ms)`
);

// ============================================================================
// 6. getDeviceVitals ADVERSARIAL STRESS
// ============================================================================
console.log("\n--- Suite 6: getDeviceVitals Adversarial Stress ---");

function validateVitals(vitals: DeviceVitals, context: string): void {
  assert(
    typeof vitals.screenSize === "string" && vitals.screenSize.length > 0,
    `${context}: screenSize is valid string`,
    vitals.screenSize
  );
  assert(
    typeof vitals.processor === "string" && vitals.processor.length > 0,
    `${context}: processor is valid string`,
    vitals.processor
  );
  assert(
    typeof vitals.battery === "string" && vitals.battery.length > 0,
    `${context}: battery is valid string`,
    vitals.battery
  );
  assert(
    typeof vitals.defaultRam === "string" && vitals.defaultRam.endsWith("GB"),
    `${context}: defaultRam is valid GB string`,
    vitals.defaultRam
  );
}

// Known device
const vitalsIphone = getDeviceVitals("Apple", "iPhone 15 Pro");
validateVitals(vitalsIphone, "Apple iPhone 15 Pro");
assert(vitalsIphone.processor.includes("A17 Pro"), "iPhone 15 Pro has A17 Pro processor");

// Known brand, unknown model
const vitalsAppleUnknown = getDeviceVitals("Apple", "Unknown Model");
validateVitals(vitalsAppleUnknown, "Apple Unknown Model");
assert(vitalsAppleUnknown.processor.includes("Bionic"), "Generic Apple processor returned");

const vitalsSamsungUnknown = getDeviceVitals("samsung", "Galaxy Unknown");
validateVitals(vitalsSamsungUnknown, "Samsung Unknown Model");

const vitalsXiaomiUnknown = getDeviceVitals("XIAOMI", "Redmi Unknown");
validateVitals(vitalsXiaomiUnknown, "Xiaomi Unknown Model");

// Completely unknown brand and model
const vitalsGoogle = getDeviceVitals("Google", "Pixel 8 Pro");
validateVitals(vitalsGoogle, "Google Pixel 8 Pro (Absolute Fallback)");

// Empty & nullish inputs
const vitalsEmpty = getDeviceVitals("", "");
validateVitals(vitalsEmpty, "Empty inputs (Absolute Fallback)");

const vitalsNull = getDeviceVitals(null as unknown as string, null as unknown as string);
validateVitals(vitalsNull, "Null inputs (Absolute Fallback)");

// ============================================================================
// 7. formatRam & formatStorage HELPER TESTS
// ============================================================================
console.log("\n--- Suite 7: formatRam & formatStorage Formatting Tests ---");

// formatRam
assert(formatRam("8") === "8GB", "formatRam('8') -> '8GB'");
assert(formatRam("8gb") === "8GB", "formatRam('8gb') -> '8GB'");
assert(formatRam("8GB") === "8GB", "formatRam('8GB') -> '8GB'");
assert(formatRam("  12  ") === "12GB", "formatRam('  12  ') -> '12GB'");
assert(formatRam("16 GB") === "16 GB", "formatRam('16 GB') -> '16 GB'");
assert(formatRam(null) === "", "formatRam(null) -> ''");
assert(formatRam(undefined) === "", "formatRam(undefined) -> ''");
assert(formatRam("") === "", "formatRam('') -> ''");
assert(formatRam("   ") === "", "formatRam('   ') -> ''");

// formatStorage
assert(formatStorage("128") === "128GB", "formatStorage('128') -> '128GB'");
assert(formatStorage("256gb") === "256GB", "formatStorage('256gb') -> '256GB'");
assert(formatStorage("512GB") === "512GB", "formatStorage('512GB') -> '512GB'");
assert(formatStorage("1tb") === "1TB", "formatStorage('1tb') -> '1TB'");
assert(formatStorage(null) === "", "formatStorage(null) -> ''");
assert(formatStorage(undefined) === "", "formatStorage(undefined) -> ''");
assert(formatStorage("") === "", "formatStorage('') -> ''");
assert(formatStorage("   ") === "", "formatStorage('   ') -> ''");

// ============================================================================
// 8. GENERATIVE FUZZING (1000 randomized inputs)
// ============================================================================
console.log("\n--- Suite 8: Generative Fuzzing (1,000 Iterations) ---");

const testBrands = ["Apple", "Samsung", "Xiaomi", "Google", "Sony", "Unknown", "", "   ", "APPLE", "samsung"];
const testModels = [
  "iPhone 15 Pro",
  "iPhone 15",
  "Galaxy S24 Ultra",
  "Galaxy S24",
  "Xiaomi 14",
  "Xiaomi 14 Ultra",
  "Pixel 8",
  "UnknownModel",
  "",
  "   ",
  "Ultra",
  "Pro Max",
  "Plus",
];
const testStorages = ["128GB", "256GB", "512GB", "1TB", "64GB", "2TB", "", undefined, "512gb", "1tb"];

let fuzzFailures = 0;
for (let i = 0; i < 1000; i++) {
  const b = testBrands[Math.floor(Math.random() * testBrands.length)];
  const m = testModels[Math.floor(Math.random() * testModels.length)];
  const s = testStorages[Math.floor(Math.random() * testStorages.length)];

  try {
    const res = inferDefaultRam(b, m, s);
    if (!res || !res.endsWith("GB")) {
      fuzzFailures++;
      console.error(`Fuzz failed on (${b}, ${m}, ${s}) -> ${res}`);
    }
  } catch (err) {
    fuzzFailures++;
    console.error(`Fuzz threw on (${b}, ${m}, ${s}) -> ${err}`);
  }
}
assert(fuzzFailures === 0, "1,000 generative fuzzing iterations passed with 0 crashes or invalid formats");

// ============================================================================
// 9. PRISMA DMMF NULLABILITY & FIELD PROPERTY VERIFICATION
// ============================================================================
console.log("\n--- Suite 9: Prisma DMMF Nullability & Field Properties ---");

const productModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "Product");
assert(!!productModel, "Product model present in Prisma DMMF");

if (productModel) {
  const fields = ["screenSize", "processor", "battery"];
  for (const f of fields) {
    const fieldDef = productModel.fields.find((field) => field.name === f);
    assert(!!fieldDef, `Product.${f} field definition exists in DMMF`);
    assert(fieldDef?.type === "String", `Product.${f} is of type String`);
    assert(!fieldDef?.isRequired, `Product.${f} is optional (nullable) for backward compatibility`);
  }
}

const variantModel = Prisma.dmmf.datamodel.models.find((m) => m.name === "ProductVariant");
assert(!!variantModel, "ProductVariant model present in Prisma DMMF");

if (variantModel) {
  const ramField = variantModel.fields.find((f) => f.name === "ram");
  assert(!!ramField, "ProductVariant.ram field definition exists in DMMF");
  assert(ramField?.type === "String", "ProductVariant.ram is of type String");
  assert(!ramField?.isRequired, "ProductVariant.ram is optional (nullable) for backward compatibility");
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log("\n===============================================================");
console.log(`CHALLENGER STRESS AUDIT REPORT:`);
console.log(`  Total checks:  ${report.total}`);
console.log(`  Passed checks: ${report.passed}`);
console.log(`  Failed checks: ${report.failed}`);
console.log("===============================================================");

if (report.failed > 0) {
  console.error("CRITICAL ISSUES DETECTED IN STRESS HARNESS:");
  for (const f of report.failures) {
    console.error(`  - ${f}`);
  }
  process.exit(1);
} else {
  console.log("ALL ADVERSARIAL & STRESS CHECKS PASSED WITH ZERO FAILURES!");
  process.exit(0);
}
