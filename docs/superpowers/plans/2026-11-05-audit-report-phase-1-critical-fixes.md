# Audit Report Phase 1: Critical Fixes & Showstoppers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all Phase 1 critical vulnerabilities, data wipe hazards, stock leakage, algorithmic RAM bugs, and failing test suites identified in `AUDIT_REPORT.md`.

**Architecture:** 
1. Decouple database seed/push from production build in `package.json` to prevent catastrophic data wipes on deploy.
2. Replace hardcoded SuperAdmin plaintext credentials with secure Prisma DB bcrypt verification and enforce strong JWT secret in `lib/auth/`.
3. Implement inventory stock restoral (`increment`) upon order cancellation and soft-delete/archival protection for products with historical order items.
4. Correct the greedy prefix matching in `lib/utils/specs.ts` to properly identify Pro models, and fix all 7 failing test suites.

**Tech Stack:** Next.js 15, Prisma ORM, PostgreSQL, bcryptjs, TypeScript (strict), Node.js.

**Spec:** [`AUDIT_REPORT.md`](file:///c:/alo_shop/AUDIT_REPORT.md)

## Global Constraints

- Zero emojis policy (AGENTS.md Rule 3.4).
- Tailwind CSS only (no separate CSS files).
- Strict TypeScript (no `any`).
- Zero hardcoded secrets or plaintext passwords.
- All verification test suites must pass 100%.

## Review Focus

1. **Build Safety:** `npm run build` must only execute `prisma generate && next build`, never wiping production databases with `seed.ts`.
2. **Auth Security:** SuperAdmin login must authenticate against database password hashes; unauthorized logins with fallback strings must fail.
3. **Stock Integrity:** Canceled orders must safely restore inventory quantities back to the assigned branch without race conditions.
4. **Order History Preservation:** Deleting products with existing order items must archive (`isArchived`) rather than delete `orderItem` records.
5. **Specification Precision:** Device RAM inference must return 8GB for iPhone 15 Pro / Pro Max and never regress to 6GB.

---

### Task 1: Fix Build Script Production Data Wiping Hazard

**Files:**
- Modify: `package.json`
- Modify: `prisma/seed.ts`
- Test: `tests/build-safety.test.ts`

- [ ] **Step 1: Write test in `tests/build-safety.test.ts`**

Assert that `package.json` `"build"` script contains `prisma generate && next build` and does NOT contain `seed.ts` or `prisma db push --accept-data-loss`.
Assert that `prisma/seed.ts` prevents accidental wiping in production environments without an explicit `--force-clean` flag.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/build-safety.test.ts`
Expected: FAIL (current `package.json` has `seed.ts` in `"build"`).

- [ ] **Step 3: Modify `package.json` and `prisma/seed.ts`**

In `package.json`:
Update `"build": "prisma generate && next build"`.
In `prisma/seed.ts`:
Add production safety guard: if `process.env.NODE_ENV === "production"` and not explicitly passed `--force-clean`, abort before deleting any orders or tables.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/build-safety.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json prisma/seed.ts tests/build-safety.test.ts
git commit -m "fix(build): remove seed and db push from build command to protect production data"
```

---

### Task 2: Eliminate Hardcoded Plaintext SuperAdmin Credentials & Weak JWT Secrets

**Files:**
- Modify: `lib/auth/admin.ts`
- Modify: `lib/auth/session.ts`
- Modify: `tests/admin-auth.test.ts`

- [ ] **Step 1: Update `tests/admin-auth.test.ts`**

Update assertions so that hardcoded fallback credentials (`superadmin_secret_password_change_me`) are rejected, and authentication strictly queries the database with bcrypt verification.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/admin-auth.test.ts`
Expected: FAIL (or demonstrates reliance on hardcoded password).

- [ ] **Step 3: Implement secure authentication in `lib/auth/admin.ts` and `lib/auth/session.ts`**

In `lib/auth/admin.ts`:
Remove plaintext `envSuperPassword` fallback comparison.
Verify all admin users (including SUPER_ADMIN) strictly via `prisma.adminUser.findUnique` and `bcrypt.compare`.
In `lib/auth/session.ts`:
Enforce minimum 32-character secret; throw in production if `AUTH_SECRET` is unset.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/admin-auth.test.ts`
Expected: PASS (all assertions pass).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/admin.ts lib/auth/session.ts tests/admin-auth.test.ts
git commit -m "security(auth): remove hardcoded plaintext superadmin fallback and enforce bcrypt database auth"
```

---

### Task 3: Order Cancellation Stock Restoral & Historical Data Protection

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `app/actions/admin-orders.ts`
- Modify: `app/actions/admin-products.ts`
- Create: `tests/order-cancellation-inventory.test.ts`

- [ ] **Step 1: Write test in `tests/order-cancellation-inventory.test.ts`**

Assert that transitioning an order to `CANCELLED` increments branch inventory.
Assert that soft deletion (`isArchived: true`) protects orders from cascading deletes.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/order-cancellation-inventory.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `prisma/schema.prisma` with `isArchived` on `Product` and apply migration**

Add `isArchived Boolean @default(false)` to `Product` model.
Run: `npx prisma generate`.

- [ ] **Step 4: Implement inventory restoral in `app/actions/admin-orders.ts` and soft delete in `app/actions/admin-products.ts`**

In `admin-orders.ts`:
When updating status to `CANCELLED`, restore items inside transaction:
```ts
if (status === "CANCELLED" && currentOrder.status !== "CANCELLED") {
  for (const item of currentOrder.items) {
    if (currentOrder.pickupBranchId) {
      await tx.branchInventory.upsert({
        where: {
          variantId_branchId: {
            variantId: item.variantId,
            branchId: currentOrder.pickupBranchId,
          },
        },
        update: { quantity: { increment: item.quantity } },
        create: {
          variantId: item.variantId,
          branchId: currentOrder.pickupBranchId,
          quantity: item.quantity,
        },
      });
    }
  }
}
```
In `admin-products.ts`:
Do not execute `tx.orderItem.deleteMany`. If product has associated orders, set `isArchived: true`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx tests/order-cancellation-inventory.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma app/actions/admin-orders.ts app/actions/admin-products.ts tests/order-cancellation-inventory.test.ts
git commit -m "fix(orders): restore inventory on order cancellation and add soft delete archival for products"
```

---

### Task 4: Fix Substring Match Algorithm in Specs & Resolve All 7 Failing Test Suites

**Files:**
- Modify: `lib/utils/specs.ts`
- Fix failing tests:
  - `tests/vitrina-m2.test.ts`
  - `tests/specs-stress.test.ts`
  - `tests/challenger-m1-empirical.test.ts`
  - `tests/challenger-m2-1-empirical.test.ts`
  - `tests/challenger-m3-adversarial.test.ts`
  - `tests/challenger-m3-empirical.test.ts`
  - `tests/challenger-m3-viewport-edgecases.test.ts`

- [ ] **Step 1: Fix `inferDefaultRam` in `lib/utils/specs.ts`**

Fix the greedy substring matching:
Sort presets by descending model name length, match exact model first, then check word boundaries `\b` so "iPhone 15 Pro" does not match "iPhone 15".
Handle edge cases: case insensitivity, trimming, empty models fallback.

- [ ] **Step 2: Run `tests/vitrina-m2.test.ts` and `tests/specs-stress.test.ts`**

Run: `npx tsx tests/vitrina-m2.test.ts`
Expected: PASS (8GB correctly inferred for iPhone 15 Pro).
Run: `npx tsx tests/specs-stress.test.ts`
Expected: PASS.

- [ ] **Step 3: Address remaining challenger test failures**

Investigate and fix any remaining assertions across the 5 challenger test suites.

- [ ] **Step 4: Verify all 7 tests pass**

Run:
```bash
npx tsx tests/vitrina-m2.test.ts
npx tsx tests/specs-stress.test.ts
npx tsx tests/challenger-m1-empirical.test.ts
npx tsx tests/challenger-m2-1-empirical.test.ts
npx tsx tests/challenger-m3-adversarial.test.ts
npx tsx tests/challenger-m3-empirical.test.ts
npx tsx tests/challenger-m3-viewport-edgecases.test.ts
```
Expected: All 7 pass with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/specs.ts tests/
git commit -m "fix(specs): correct greedy substring RAM matching and resolve all 7 failing test suites"
```

---

### Task 5: Master Verification & GitHub Sync

**Files:**
- Modify: `scripts/verify-all.ts`
- Run: `npm run verify`

- [ ] **Step 1: Integrate new tests into `scripts/verify-all.ts`**

Add `build-safety` and `order-cancellation-inventory` to master verification suites.

- [ ] **Step 2: Run master verification**

Run: `npm run verify`
Expected: All test suites PASS with 0 errors.

- [ ] **Step 3: Commit and Push**

```bash
git add .
git commit -m "chore: complete Audit Report Phase 1 critical fixes and verify all test suites"
git push origin main
```
