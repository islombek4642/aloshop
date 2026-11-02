import assert from "node:assert";
import { sanitizeModelSlug, determineSeries } from "../scripts/lib/samsung-api";

console.log("Starting samsung-api unit tests...");

// Slug sanitization tests
assert.strictEqual(sanitizeModelSlug("Galaxy S24 Ultra"), "galaxy-s24-ultra");
assert.strictEqual(sanitizeModelSlug("Galaxy S24+"), "galaxy-s24-plus");
assert.strictEqual(sanitizeModelSlug("Galaxy Z Fold6 (12GB)"), "galaxy-z-fold6-12gb");

// Series detection tests
assert.strictEqual(determineSeries("Galaxy S24 Ultra"), "galaxy-s");
assert.strictEqual(determineSeries("Galaxy S23 FE"), "galaxy-s");
assert.strictEqual(determineSeries("Galaxy Z Fold6"), "galaxy-z");
assert.strictEqual(determineSeries("Galaxy Z Flip6"), "galaxy-z");
assert.strictEqual(determineSeries("Galaxy A55 5G"), "galaxy-a");
assert.strictEqual(determineSeries("Galaxy A08"), "galaxy-a");
assert.strictEqual(determineSeries("Galaxy M15"), "other");

console.log("All samsung-api unit tests PASSED successfully!");
