# Transparent Apple Images & Catalog Card Hover-Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean and eliminate the `#f5f5f7` light-gray studio background from all Apple iPhone PNG assets to make them 100% transparent, and implement a hover-activated 3-second auto-carousel on catalog product cards with touch-swipe and color swatch synchronization.

**Architecture:**
- Native Node.js image processing script (`scripts/clean-apple-backgrounds.ts`) parses PNG scanlines, flood-replaces the `#f5f5f7` Apple studio background with `alpha = 0`, and saves pristine transparent PNGs.
- `ProductCard` collects unique photos across available variants and mounts a hover-activated 3000ms timer on desktop (plus touch-swipe on mobile) that advances images and synchronizes the active color swatch indicator.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Node.js `zlib` & `fs`.

## Global Constraints

- Zero emojis policy (AGENTS.md Rule 3.4).
- Tailwind CSS only (AGENTS.md Rule 3.4).
- Strict TypeScript (no `any`).

## Review Focus

1. **Edge Cleanliness:** Pixel transparency must only remove the `#f5f5f7` studio background rectangle without damaging white or light-silver iPhone body parts (e.g. Silver / White Titanium rims).
2. **Hover Timer Lifecycle:** Leaving the card (`onMouseLeave`) or unmounting must immediately clear the `setInterval` timer to prevent memory leaks or background CPU drain.
3. **Touch Swipe Functionality:** On mobile screens, horizontal swipe gestures on the image area must smoothly cycle between variant photos.

---

### Task 1: Automated Apple PNG Background Transparency Cleaning Script

**Files:**
- Create: `scripts/clean-apple-backgrounds.ts`
- Create: `tests/clean-apple-backgrounds.test.ts`

**Interfaces:**
- Produces: `cleanPngBackground(srcPath: string, destPath: string): { processed: boolean; transparentizedPixels: number }`

- [ ] **Step 1: Write test in `tests/clean-apple-backgrounds.test.ts`**

Assert that after cleaning, Apple PNG corner and background pixels have `alpha === 0` (RGB values 242-248 are transparent).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/clean-apple-backgrounds.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `scripts/clean-apple-backgrounds.ts` and process all Apple images**

- Implement PNG IHDR/IDAT unfiltering scanline parser.
- Detect connected/boundary `#f5f5f7` (RGB 240-249) studio background pixels and set `alpha = 0`.
- Recompress with `zlib.deflateSync` and write clean PNGs to `public/images/products/apple/` and `data/apple/`.
- Run script across all Apple assets.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/clean-apple-backgrounds.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/clean-apple-backgrounds.ts tests/clean-apple-backgrounds.test.ts public/images/products/apple/ data/apple/
git commit -m "fix(assets): remove gray studio background from all iPhone PNG images"
```

---

### Task 2: Hover-Activated 3-Second ProductCard Carousel & Swatch Sync

**Files:**
- Modify: `components/store/product-card.tsx`
- Create: `tests/product-card-carousel.test.ts`

**Interfaces:**
- Produces: Hover-activated 3000ms carousel with pagination dots, touch swipe, and swatch sync.

- [ ] **Step 1: Write test in `tests/product-card-carousel.test.ts`**

Assert multi-image extraction from variants, 3000ms interval constant, hover start/stop logic, and index cycling helpers.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/product-card-carousel.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement hover-activated 3-second carousel in `components/store/product-card.tsx`**

- Extract unique images for available colors: `cardImages = [{ url, colorHex, variantIndex }]`.
- Track `isHovered` state (`onMouseEnter` / `onMouseLeave`).
- When `isHovered && cardImages.length > 1`:
  Mount `setInterval` of 3000ms advancing to `(current + 1) % cardImages.length`.
- Synchronize active color swatch with current image.
- Add touch swipe support (`onTouchStart`, `onTouchMove`, `onTouchEnd`).
- Render pagination dots indicator at bottom of image container when `cardImages.length > 1`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/product-card-carousel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/store/product-card.tsx tests/product-card-carousel.test.ts
git commit -m "feat(store): add hover-activated 3-second carousel to catalog product cards"
```

---

### Task 3: Verification & Integration

**Files:**
- Modify: `scripts/verify-all.ts`
- Run: `npm run verify`

- [ ] **Step 1: Update `scripts/verify-all.ts` with new test suites**

Add `clean-apple-backgrounds` and `product-card-carousel` test suites to master verification.

- [ ] **Step 2: Run full verification**

Run: `npm run verify`
Expected: All suites PASS with 0 errors.

- [ ] **Step 3: Commit and push**

```bash
git add .
git commit -m "chore: verify transparent iPhone assets and catalog card carousel"
git push origin main
```

