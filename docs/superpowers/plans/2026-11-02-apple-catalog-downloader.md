# Apple iPhone Catalog Downloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apple iPhone'ning barcha sotilayotgan (13, 14, 15, 16, SE) hamda yangi kutilayotgan (17, 18) smartfonlari uchun rasmiy xarakteristikalari va yuqori sifatli original rasmlarini `data/apple/` papkasiga yuklovchi avtomatlashtirilgan TypeScript tizimini yaratish va ishga tushirish.

**Architecture:** Modulli arxitektura: `apple-api.ts` (modellar, xarakteristikalar va CDN havolalari), `apple-storage.ts` (fayl tizimiga `specs.json` va rasmlarni xavfsiz yuklovchi oqim) va `download-apple.ts` (CLI runner). Har bir modul TDD (Test-Driven Development) orqali yaratiladi.

**Tech Stack:** TypeScript (strict mode), Node.js `fs`/`stream`/`fetch`, `tsx`, Jest/Node assert testlari.

**Spec:** [docs/superpowers/specs/2026-11-02-apple-catalog-downloader-design.md](file:///c:/alo_shop/docs/superpowers/specs/2026-11-02-apple-catalog-downloader-design.md)

## Global Constraints

- AGENTS.md 3.4: Barcha matnlar, loglar, test xabarlari va skriptlarda Unicode emojilardan foydalanish qat'iyan taqiqlanadi (Zero Emojis Policy).
- AGENTS.md 3.1 & 3.2: DRY va modulli arxitektura, `any` tipi taqiqlanadi.
- AloShop asosiy ma'lumotlar bazasi va do'kon kodlariga tegilmaydi; barcha ma'lumotlar faqat `data/apple/` ichida saqlanadi.

## Review Focus

1. Internet uzilishi yoki CDN vaqtincha javob bermasligi: retry va graceful fallback mavjud bo'lishi kerak.
2. Mavjud rasmlarni qayta-qayta yuklamaslik (idempotency tekshiruvi: fayl allaqachon mavjud bo'lsa o'tkazib yuborish).
3. `specs.json` fayli to'g'ri UTF-8 va chiroyli indentatsiya (2 spaces) bilan yozilishi.
4. Barcha ranglar uchun haqiqiy Apple hex kodlari va aniq fayl nomlari berilishi.
5. `npm run check-types` (`tsc --noEmit`) 0 xato bilan o'tishi.

---

### Task 1: Apple Catalog Data & Spec Matrix Module (`scripts/lib/apple-api.ts`)

**Files:**
- Create: `scripts/lib/apple-api.ts`
- Test: `tests/apple-api.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface AppleColorEntry {
    name: string;
    hex: string;
    imageFile: string;
    imageUrl: string;
  }

  export interface AppleHardwareSpecs {
    screenSize: string;
    processor: string;
    ram: string;
    battery: string;
    camera: string;
    charging: string;
    os: string;
  }

  export interface AppleModelEntry {
    brand: 'Apple';
    series: string;
    model: string;
    modelCode: string;
    releaseYear: number;
    status: 'available' | 'upcoming';
    colors: AppleColorEntry[];
    storageOptions: string[];
    specs: AppleHardwareSpecs;
    images: string[];
  }

  export function getAppleCatalog(): AppleModelEntry[];
  ```

- [ ] **Step 1: Write the failing test**
  Fayl: `tests/apple-api.test.ts`
  ```typescript
  import assert from 'node:assert';
  import { getAppleCatalog } from '../scripts/lib/apple-api';

  const catalog = getAppleCatalog();
  assert(Array.isArray(catalog), 'Catalog must be an array');
  assert(catalog.length >= 15, 'Catalog should contain at least 15 models across 13-18 and SE');

  const seriesList = new Set(catalog.map(m => m.series));
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
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx tsx tests/apple-api.test.ts`
  Expected: FAIL with "Cannot find module '../scripts/lib/apple-api'"

- [ ] **Step 3: Implement `scripts/lib/apple-api.ts`**
  Model va seriyalar bo'yicha to'liq Apple xarakteristikalari va rasmiy CDN render havolalarini shakllantirish.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx tsx tests/apple-api.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add scripts/lib/apple-api.ts tests/apple-api.test.ts
  git commit -m "feat(apple): add apple catalog specification matrix module and unit tests"
  ```

---

### Task 2: Storage & File Downloader Module (`scripts/lib/apple-storage.ts`)

**Files:**
- Create: `scripts/lib/apple-storage.ts`
- Test: `tests/apple-storage.test.ts`

**Interfaces:**
- Consumes: `AppleModelEntry` from `scripts/lib/apple-api.ts`
- Produces:
  ```typescript
  export function saveAppleModelSpecs(model: AppleModelEntry, baseDir?: string): string;
  export function downloadAppleImage(imageUrl: string, destPath: string): Promise<boolean>;
  ```

- [ ] **Step 1: Write the failing test**
  Fayl: `tests/apple-storage.test.ts`
  ```typescript
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

  fs.rmSync(testBaseDir, { recursive: true, force: true });
  console.log('Apple storage tests passed successfully');
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx tsx tests/apple-storage.test.ts`
  Expected: FAIL with "Cannot find module '../scripts/lib/apple-storage'"

- [ ] **Step 3: Implement `scripts/lib/apple-storage.ts`**
  Kataloglarni yaratish, `specs.json` faylini formatlab saqlash va rasmlarni HTTP(S) oqimi orqali yuklash.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx tsx tests/apple-storage.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add scripts/lib/apple-storage.ts tests/apple-storage.test.ts
  git commit -m "feat(apple): add storage manager for apple specs and images with unit tests"
  ```

---

### Task 3: CLI Runner Script & Package Command (`scripts/download-apple.ts`)

**Files:**
- Create: `scripts/download-apple.ts`
- Modify: `package.json`

- [ ] **Step 1: Implement `scripts/download-apple.ts`**
  Barcha Apple modellarini aylanib chiqib, `data/apple/` papkasini shakllantirish, har bir modelning rasmlarini yuklab olish, yuklanish holati va xatolarini nazorat qilish.
- [ ] **Step 2: Add `"download:apple"` to `package.json` scripts**
  `"download:apple": "npx tsx scripts/download-apple.ts"`
- [ ] **Step 3: Execute `npm run download:apple`**
  Run: `npm run download:apple`
  Expected: Barcha iPhone seriyalari (`iphone-18`, `iphone-17`, `iphone-16`, `iphone-15`, `iphone-14`, `iphone-13`, `iphone-se`) to'liq yuklanadi.
- [ ] **Step 4: Verify generated files and structure**
  `data/apple/` papkalarida barcha `specs.json` va `.png` rasmlari mavjudligini tekshirish.
- [ ] **Step 5: Commit**
  ```bash
  git add scripts/download-apple.ts package.json data/apple/
  git commit -m "feat(apple): execute apple catalog downloader and store all models into data/apple"
  ```

---

### Task 4: Static Typing and Master Audit Verification

**Files:**
- None (Verification only)

- [ ] **Step 1: Run TypeScript strict check**
  Run: `npm run check-types`
  Expected: 0 errors
- [ ] **Step 2: Run master verification audit**
  Run: `npm run verify`
  Expected: All audit suites PASS

