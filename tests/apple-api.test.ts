import assert from 'node:assert';
import { getAppleCatalog } from '../scripts/lib/apple-api';

const catalog = getAppleCatalog();
assert(Array.isArray(catalog), 'Catalog must be an array');
assert(catalog.length >= 15, 'Catalog should contain at least 15 models across 13-18 and SE');

const seriesList = new Set(catalog.map((m) => m.series));
assert(seriesList.has('iPhone 16'), 'Must contain iPhone 16 series');
assert(seriesList.has('iPhone 17'), 'Must contain iPhone 17 series');
assert(seriesList.has('iPhone 18'), 'Must contain iPhone 18 series');
assert(seriesList.has('iPhone 15'), 'Must contain iPhone 15 series');
assert(seriesList.has('iPhone 14'), 'Must contain iPhone 14 series');
assert(seriesList.has('iPhone 13'), 'Must contain iPhone 13 series');
assert(seriesList.has('iPhone SE'), 'Must contain iPhone SE series');

for (const model of catalog) {
  assert(model.brand === 'Apple');
  assert(model.colors.length > 0, `${model.modelCode} must have colors`);
  assert(model.specs.processor.length > 0, `${model.modelCode} must have processor`);
  assert(model.images.length === model.colors.length, 'Images count should match colors count');
}

console.log('Apple API tests passed successfully');
