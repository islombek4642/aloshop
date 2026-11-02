# Samsung Catalog Downloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated, automated TypeScript downloader script that fetches official Samsung smartphone specifications and high-resolution render images from Samsung Uzbekistan's official API (`searchapi.samsung.com`) and stores them neatly in `data/samsung/<series>/<model>/`.

**Architecture:** A modular standalone TypeScript pipeline consisting of an API client module (`scripts/lib/samsung-api.ts`), a filesystem/image storage module (`scripts/lib/samsung-storage.ts`), and a CLI runner (`scripts/download-samsung.ts`) with concurrency control, retry mechanics, and rate limiting.

**Tech Stack:** Node.js (v20+), TypeScript (strict mode), native `fetch`, Node.js `fs/promises` and `stream`, `tsx`.

**Spec:** [`docs/superpowers/specs/2026-11-02-samsung-catalog-downloader-design.md`](file:///c:/alo_shop/docs/superpowers/specs/2026-11-02-samsung-catalog-downloader-design.md)

## Global Constraints

- **Storage Location:** All downloaded data and images must strictly reside in `data/samsung/`, leaving production database, Prisma schema, and storefront untouched.
- **Zero Emojis Policy:** AGENTS.md strictly forbids Unicode emojis in code, logs, and commit messages.
- **Strict TypeScript:** No `any` types; all API responses and parsed objects must have explicit interfaces.
- **Rate Limiting:** At least 300ms delay between API calls and image downloads to respect server limits.

## Review Focus

1. **Incomplete or missing specs in API:** Some budget or newly announced models may lack certain spec attributes (e.g. processor name or battery). The parser must fallback cleanly to `null` or infer without throwing unhandled exceptions.
2. **Special Characters in Model Slugs:** Model names like `Galaxy Z Fold6` or `Galaxy S24+` contain spaces and plus signs. Slugs must be sanitized to URL-safe alphanumeric kebab-case (`galaxy-z-fold6`, `galaxy-s24-plus`).
3. **Protocol-relative Image URLs:** Samsung CDN image URLs start with `//images.samsung.com/...`. The downloader must normalize them to `https://images.samsung.com/...`.
4. **Network Timeout / Transient Network Failures:** Image download failures should retry up to 3 times before recording an error and proceeding to the next image without crashing the entire run.
5. **Disk Write Idempotency:** Running the script multiple times should not corrupt existing files or re-download identical images if already present.

---

### Task 1: Samsung Official API Client & Types (`scripts/lib/samsung-api.ts`)

**Files:**
- Create: `scripts/lib/samsung-api.ts`
- Test: `tests/samsung-api.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface SamsungProductFamily {
    familyId: string;
    marketingName: string;
    categorySubTypeCode: string;
    series: "galaxy-s" | "galaxy-z" | "galaxy-a" | "other";
    modelCodes: string[];
    models: SamsungModelVariant[];
  }

  export interface SamsungModelVariant {
    modelCode: string;
    displayName: string;
    colorName: string;
    colorCode: string;
    thumbUrl: string;
    galleryImages: string[];
  }

  export interface SamsungHardwareSpecs {
    screenSize: string | null;
    processor: string | null;
    battery: string | null;
    ram: string | null;
    storage: string | null;
    camera: string | null;
  }

  export function determineSeries(marketingName: string, subTypeCode?: string): "galaxy-s" | "galaxy-z" | "galaxy-a" | "other";
  export function sanitizeModelSlug(name: string): string;
  export async function fetchSamsungProductList(siteCode?: string): Promise<SamsungProductFamily[]>;
  export async function fetchSamsungSpecs(modelCode: string, siteCode?: string): Promise<SamsungHardwareSpecs>;
  ```

- [ ] **Step 1: Write unit tests for API helpers and slug generation in `tests/samsung-api.test.ts`**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/samsung-api.test.ts`
Expected: FAIL (Cannot find module `../scripts/lib/samsung-api`)

- [ ] **Step 3: Implement `scripts/lib/samsung-api.ts`**

Implement `sanitizeModelSlug`, `determineSeries`, `fetchSamsungProductList`, and `fetchSamsungSpecs` with strict typing and defensive parsing of the Samsung `searchapi.samsung.com` responses.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/samsung-api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/samsung-api.ts tests/samsung-api.test.ts
git commit -m "feat(scripts): implement samsung official api client and spec extractor"
```

---

### Task 2: File System Organizer & Image Downloader (`scripts/lib/samsung-storage.ts`)

**Files:**
- Create: `scripts/lib/samsung-storage.ts`
- Test: `tests/samsung-storage.test.ts`

**Interfaces:**
- Consumes: `SamsungProductFamily`, `SamsungHardwareSpecs`, `sanitizeModelSlug` from `scripts/lib/samsung-api.ts`
- Produces:
  ```typescript
  export interface SaveProductOptions {
    baseDir: string;
    product: SamsungProductFamily;
    specs: SamsungHardwareSpecs;
    downloadImages?: boolean;
    maxImagesPerModel?: number;
  }

  export interface SaveProductResult {
    modelFolder: string;
    specsFile: string;
    downloadedImagesCount: number;
    skippedImagesCount: number;
  }

  export function normalizeImageUrl(url: string): string;
  export async function downloadImageToFile(imageUrl: string, targetPath: string): Promise<boolean>;
  export async function saveProductToDisk(options: SaveProductOptions): Promise<SaveProductResult>;
  ```

- [ ] **Step 1: Write unit tests in `tests/samsung-storage.test.ts`**

```typescript
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { normalizeImageUrl, saveProductToDisk } from "../scripts/lib/samsung-storage";

console.log("Starting samsung-storage unit tests...");

// Image URL normalization
assert.strictEqual(
  normalizeImageUrl("//images.samsung.com/is/image/sample.png"),
  "https://images.samsung.com/is/image/sample.png"
);
assert.strictEqual(
  normalizeImageUrl("https://images.samsung.com/sample.jpg"),
  "https://images.samsung.com/sample.jpg"
);

// Disk saving mock test
const testBaseDir = path.join("data", "test-storage");
if (fs.existsSync(testBaseDir)) {
  fs.rmSync(testBaseDir, { recursive: true, force: true });
}

const mockProduct = {
  familyId: "test-fam-1",
  marketingName: "Galaxy S24 Test",
  categorySubTypeCode: "01010100",
  series: "galaxy-s" as const,
  modelCodes: ["SM-S921TEST"],
  models: [
    {
      modelCode: "SM-S921TEST",
      displayName: "Galaxy S24 Test",
      colorName: "Onyx Black",
      colorCode: "black",
      thumbUrl: "//images.samsung.com/sample-thumb.png",
      galleryImages: [],
    },
  ],
};

const mockSpecs = {
  screenSize: '6.2" Dynamic AMOLED 2X',
  processor: "Exynos 2400",
  battery: "4000 mAh",
  ram: "8GB",
  storage: "128GB, 256GB",
  camera: "50MP + 12MP + 10MP",
};

const result = await saveProductToDisk({
  baseDir: testBaseDir,
  product: mockProduct,
  specs: mockSpecs,
  downloadImages: false,
});

assert.ok(fs.existsSync(result.specsFile), "specs.json must exist on disk");
const writtenSpecs = JSON.parse(fs.readFileSync(result.specsFile, "utf8"));
assert.strictEqual(writtenSpecs.marketingName, "Galaxy S24 Test");
assert.strictEqual(writtenSpecs.specs.processor, "Exynos 2400");

// Clean up test dir
fs.rmSync(testBaseDir, { recursive: true, force: true });

console.log("All samsung-storage unit tests PASSED successfully!");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/samsung-storage.test.ts`
Expected: FAIL (Cannot find module `../scripts/lib/samsung-storage`)

- [ ] **Step 3: Implement `scripts/lib/samsung-storage.ts`**

Implement directory creation, image downloading with streaming, retry logic on network timeouts, and JSON serialization.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/samsung-storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/samsung-storage.ts tests/samsung-storage.test.ts
git commit -m "feat(scripts): implement samsung storage and image downloader"
```

---

### Task 3: CLI Runner & Orchestration Script (`scripts/download-samsung.ts`)

**Files:**
- Create: `scripts/download-samsung.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `fetchSamsungProductList`, `fetchSamsungSpecs` from `scripts/lib/samsung-api.ts`; `saveProductToDisk` from `scripts/lib/samsung-storage.ts`
- CLI Flags:
  - `--limit=N`: Only download first N smartphone families (useful for quick verification).
  - `--series=s|z|a`: Only download a specific series.
  - `--no-images`: Only download JSON specs without images.

- [ ] **Step 1: Implement `scripts/download-samsung.ts` CLI runner**

Write the main runner with:
1. Argument parsing (`--limit`, `--series`, `--no-images`).
2. Fetching the smartphone list.
3. Looping through models with polite throttling (e.g. 500ms delay).
4. Fetching detailed specs for each model.
5. Saving to `data/samsung/<series>/<model-slug>/`.
6. Printing a clean progress log without emojis.

- [ ] **Step 2: Add script to `package.json`**

Add `"download:samsung": "npx tsx scripts/download-samsung.ts"` to `scripts` in `package.json`.

- [ ] **Step 3: Test runner in dry-run/limited mode**

Run: `npx tsx scripts/download-samsung.ts --limit=1`
Expected: Successfully fetches 1 phone (e.g. Galaxy S or A), creates directory in `data/samsung/`, creates `specs.json`, downloads render images, and exits with code 0.

- [ ] **Step 4: Run full typecheck and master verify**

Run: `npm run check-types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/download-samsung.ts package.json
git commit -m "feat(scripts): add download:samsung cli orchestrator command"
```

---

### Task 4: Execute Full Catalog Download & Integrity Verification

**Files:**
- Output directory: `data/samsung/`

- [ ] **Step 1: Execute catalog download**

Run: `npm run download:samsung`
Expected: All active Samsung smartphones fetched and stored into `data/samsung/galaxy-s`, `data/samsung/galaxy-z`, and `data/samsung/galaxy-a`.

- [ ] **Step 2: Verify downloaded directory structure**

Check that folders, `specs.json` files, and `.png`/`.webp` images exist and are non-empty:
```powershell
Get-ChildItem -Directory data/samsung/
Get-ChildItem -Recurse data/samsung/ -Filter "*.json"
```

- [ ] **Step 3: Run project verification**

Run: `npm run verify`
Expected: 6/6 suites PASS.

---

## Self-Review Checklist

- **Spec coverage:** Meets all spec requirements (separate folder, official API, structured specs, high-res images, rate-limiting, clean CLI).
- **Type consistency:** Strict TypeScript, explicit interfaces without `any`.
- **Review Focus addressed:** Handles protocol-relative URLs (`//images...`), slug sanitization, network timeouts, and disk idempotency.
- **AGENTS.md adherence:** Zero Unicode emojis used throughout scripts, logs, and documentation.

