import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { saveAppleModelSpecs } from '../scripts/lib/apple-storage';
import { getAppleCatalog } from '../scripts/lib/apple-api';

const testBaseDir = path.resolve(process.cwd(), 'tests/fixtures/apple-test');
fs.rmSync(testBaseDir, { recursive: true, force: true });

const catalog = getAppleCatalog();
const sampleModel = catalog[0];
const specsPath = saveAppleModelSpecs(sampleModel, testBaseDir);

assert(fs.existsSync(specsPath), 'specs.json must exist');
const written = JSON.parse(fs.readFileSync(specsPath, 'utf-8'));
assert.strictEqual(written.modelCode, sampleModel.modelCode);
assert.strictEqual(written.brand, 'Apple');
assert.strictEqual(written.series, sampleModel.series);

fs.rmSync(testBaseDir, { recursive: true, force: true });
console.log('Apple storage tests passed successfully');
