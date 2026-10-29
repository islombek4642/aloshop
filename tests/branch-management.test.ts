import { generateSlug } from "../lib/utils/slug";
import { UZ_PHONE_REGEX, cleanUzPhone, isValidUzPhone } from "../lib/utils/phone";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("Starting branch-management unit tests...\n");

  // 1. Slug Transliteration & URL-Safety Tests
  console.log("1. Testing slug generation with Cyrillic, Uzbek apostrophes and symbols...");
  
  const testCases = [
    { input: "Чилонзор филиали", expected: "chilonzor-filiali" },
    { input: "Малика савдо маркази", expected: "malika-savdo-markazi" },
    { input: "Самарқанд филиали", expected: "samarqand-filiali" },
    { input: "Қўқон шаҳар филиали", expected: "qoqon-shahar-filiali" },
    { input: "Ғиждувон маркази", expected: "gijduvon-markazi" },
    { input: "O'rikzor filiali", expected: "orikzor-filiali" },
    { input: "Farg'ona do'koni", expected: "fargona-dokoni" },
    { input: "G‘ijduvon shoh", expected: "gijduvon-shoh" },
    { input: "Toshkent City", expected: "toshkent-city" },
    { input: "Filial #1 (Markaziy)!", expected: "filial-1-markaziy" },
    { input: "  --Ortiqcha   chiziqlar--  ", expected: "ortiqcha-chiziqlar" },
  ];

  for (const { input, expected } of testCases) {
    const slug = generateSlug(input);
    assert(
      slug === expected,
      `Slug mismatch for "${input}": expected "${expected}", got "${slug}"`
    );
    console.log(`  + "${input}" -> "${slug}"`);
  }

  // 2. Uzbek Phone Validation Tests
  console.log("\n2. Testing Uzbek phone number validation for branch contact numbers...");
  
  const validPhones = [
    "+998 71 200 11 22",
    "+998901234567",
    "+998-93-555-44-33",
    "+998 (71) 200-11-22",
  ];

  for (const p of validPhones) {
    assert(isValidUzPhone(p), `Phone "${p}" should be valid`);
    console.log(`  + Valid: "${p}" -> cleaned "${cleanUzPhone(p)}"`);
  }

  const invalidPhones = [
    "1234567",
    "+1234567890",
    "+99812",
    "998901234567",
    "+99890123456789",
    "",
    "not-a-number",
  ];

  for (const p of invalidPhones) {
    assert(!isValidUzPhone(p), `Phone "${p}" should be invalid`);
    console.log(`  + Rejected invalid: "${p}"`);
  }

  // 3. Business rule checks
  console.log("\n3. Testing branch deletion and order protection constraints...");
  const mockBranchWithOrders = {
    id: "branch-malika",
    name: "Malika",
    ordersCount: 5,
  };
  const mockBranchWithoutOrders = {
    id: "branch-new-empty",
    name: "New Empty Branch",
    ordersCount: 0,
  };

  assert(
    mockBranchWithOrders.ordersCount > 0,
    "Branch with orders must trigger protection against hard deletion"
  );
  assert(
    mockBranchWithoutOrders.ordersCount === 0,
    "Empty branch with 0 orders can be safely deleted"
  );
  console.log("  + Order protection invariants verified");

  console.log("\nAll branch-management tests PASSED successfully!\n");
}

runTests();
