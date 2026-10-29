import assert from "node:assert";

function computePageNumbers(safeCurrentPage: number, safeTotalPages: number): (number | "dots")[] {
  if (safeTotalPages <= 7) {
    return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
  }

  const pages: (number | "dots")[] = [];

  if (safeCurrentPage <= 4) {
    for (let i = 1; i <= 5; i++) {
      pages.push(i);
    }
    pages.push("dots");
    pages.push(safeTotalPages);
  } else if (safeCurrentPage >= safeTotalPages - 3) {
    pages.push(1);
    pages.push("dots");
    for (let i = safeTotalPages - 4; i <= safeTotalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    pages.push("dots");
    pages.push(safeCurrentPage - 1);
    pages.push(safeCurrentPage);
    pages.push(safeCurrentPage + 1);
    pages.push("dots");
    pages.push(safeTotalPages);
  }

  return pages;
}

function computePaginationRange(currentPage: number, pageSize: number, totalItems: number) {
  const safeTotalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const from = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const to = Math.min(safeCurrentPage * pageSize, totalItems);
  return { safeTotalPages, safeCurrentPage, from, to };
}

console.log("Starting admin-pagination unit tests...");

// 1. Test short page counts (<= 7)
assert.deepStrictEqual(computePageNumbers(1, 1), [1]);
assert.deepStrictEqual(computePageNumbers(3, 5), [1, 2, 3, 4, 5]);
assert.deepStrictEqual(computePageNumbers(7, 7), [1, 2, 3, 4, 5, 6, 7]);
console.log("  + Short page counts (<= 7) produce exact sequence");

// 2. Test near start (safeCurrentPage <= 4)
assert.deepStrictEqual(computePageNumbers(1, 10), [1, 2, 3, 4, 5, "dots", 10]);
assert.deepStrictEqual(computePageNumbers(4, 10), [1, 2, 3, 4, 5, "dots", 10]);
console.log("  + Near-start pagination produces [1..5, dots, totalPages]");

// 3. Test near end (safeCurrentPage >= safeTotalPages - 3)
assert.deepStrictEqual(computePageNumbers(7, 10), [1, "dots", 6, 7, 8, 9, 10]);
assert.deepStrictEqual(computePageNumbers(10, 10), [1, "dots", 6, 7, 8, 9, 10]);
console.log("  + Near-end pagination produces [1, dots, (end-4)..end]");

// 4. Test middle
assert.deepStrictEqual(computePageNumbers(5, 10), [1, "dots", 4, 5, 6, "dots", 10]);
assert.deepStrictEqual(computePageNumbers(6, 10), [1, "dots", 5, 6, 7, "dots", 10]);
console.log("  + Middle pagination produces [1, dots, curr-1, curr, curr+1, dots, totalPages]");

// 5. Test range and clamping
const empty = computePaginationRange(1, 20, 0);
assert.strictEqual(empty.from, 0);
assert.strictEqual(empty.to, 0);
assert.strictEqual(empty.safeTotalPages, 1);

const firstPage = computePaginationRange(1, 20, 45);
assert.strictEqual(firstPage.from, 1);
assert.strictEqual(firstPage.to, 20);
assert.strictEqual(firstPage.safeTotalPages, 3);

const lastPage = computePaginationRange(3, 20, 45);
assert.strictEqual(lastPage.from, 41);
assert.strictEqual(lastPage.to, 45);
assert.strictEqual(lastPage.safeTotalPages, 3);

const outOfBounds = computePaginationRange(99, 20, 45);
assert.strictEqual(outOfBounds.safeCurrentPage, 3);
assert.strictEqual(outOfBounds.from, 41);
assert.strictEqual(outOfBounds.to, 45);
console.log("  + Range math and clamping out-of-bounds verified");

console.log("\nAll admin-pagination tests PASSED successfully!");
