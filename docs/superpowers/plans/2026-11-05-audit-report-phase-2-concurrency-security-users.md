# Audit Report Phase 2: Concurrency, Security, & User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 2 of `AUDIT_REPORT.md` — collision-proof order sequencing with atomic inventory concurrency locks, branch deletion stock protection, full admin user CRUD (update, reset password, soft-deactivate/delete), RBAC price-editing guard, and accurate dashboard revenue calculation.

**Architecture:** Use Prisma transactions with strict pre-condition checks for stock concurrency; implement deterministic `ALO-YYYYMMDD-XXXX` order numbers with retry loops; add `isActive` to User model with full CRUD server actions and modal UI; filter cancelled orders from revenue aggregation.

**Tech Stack:** Next.js 15, Prisma ORM, PostgreSQL, bcryptjs, TypeScript (Strict), Tailwind CSS, Lucide Icons, next-intl.

**Spec:** [`AUDIT_REPORT.md`](file:///c:/alo_shop/AUDIT_REPORT.md) Section 9.2 (2-Bosqich).

## Global Constraints
- Zero Unicode emojis across all files, tests, and commit messages (AGENTS.md Rule 3.4).
- TDD cycle for every task: write failing test (Red), implement minimum fix (Green), refactor.
- Strict TypeScript compilation with zero errors (`tsc --noEmit`).
- All existing 26 verification test suites must continue passing with zero regressions.
- Atomic git commits per task following Conventional Commits format.

## Review Focus
- Race condition during checkout when multiple customers purchase the last unit simultaneously.
- Collision in order number generation under high order volume.
- Branch deletion with active warehouse inventory destroying stock accounting.
- Branch admin editing global retail product prices without superadmin privileges.
- Inaccurate total revenue metrics on the admin dashboard including cancelled orders.

---

### Task 1: Collision-Proof Order Number Generation & Concurrency Stock Guard

**Files:**
- Modify: `app/actions/checkout.ts:115-155`
- Test: `tests/checkout-concurrency-ordernumber.test.ts`

- [ ] Step 1: Write `tests/checkout-concurrency-ordernumber.test.ts` asserting order number format matches `^ALO-\d{8}-[A-Z0-9]{4}$`, retry logic exists on collision, and stock decrement verifies `currentInv.quantity >= item.quantity`.
- [ ] Step 2: Run `npx tsx tests/checkout-concurrency-ordernumber.test.ts` to verify Red phase failure.
- [ ] Step 3: In `app/actions/checkout.ts`, generate order number with date prefix `ALO-YYYYMMDD-XXXX` (using Tashkent timezone UTC+5) and wrap order creation in collision retry loop (up to 5 attempts).
- [ ] Step 4: In `app/actions/checkout.ts`, ensure atomic check in transaction: if `currentInv.quantity < item.quantity`, immediately throw `INSUFFICIENT_BRANCH_STOCK`.
- [ ] Step 5: Run `npx tsx tests/checkout-concurrency-ordernumber.test.ts` to verify Green phase pass.
- [ ] Step 6: Commit: `git add app/actions/checkout.ts tests/checkout-concurrency-ordernumber.test.ts && git commit -m "fix(checkout): implement collision-proof order numbering and atomic concurrency stock guard"`

---

### Task 2: Active Inventory Protection on Branch Deletion

**Files:**
- Modify: `app/actions/admin-branches.ts:280-310`
- Test: `tests/admin-branch-stock-guard.test.ts`

- [ ] Step 1: Write `tests/admin-branch-stock-guard.test.ts` checking that `deleteBranchAction` checks branch inventory sum and rejects deletion with `hasActiveStock` if quantity > 0.
- [ ] Step 2: Run `npx tsx tests/admin-branch-stock-guard.test.ts` to verify Red phase failure.
- [ ] Step 3: In `app/actions/admin-branches.ts`, query `branchInventory` aggregate `_sum.quantity` for the branch. If `stock > 0`, return `{ success: false, error: "hasActiveStock" }`.
- [ ] Step 4: Run `npx tsx tests/admin-branch-stock-guard.test.ts` to verify Green phase pass.
- [ ] Step 5: Commit: `git add app/actions/admin-branches.ts tests/admin-branch-stock-guard.test.ts && git commit -m "fix(branches): protect active warehouse inventory from deletion when deleting branch"`

---

### Task 3: Full Admin User Management (CRUD, Password Reset) & RBAC Price Guard

**Files:**
- Modify: `prisma/schema.prisma:34-47`
- Modify: `app/actions/admin-users.ts`
- Modify: `app/actions/admin-products.ts:430-460`
- Modify: `components/admin/users-list-view.tsx`
- Test: `tests/admin-users-crud.test.ts`

- [ ] Step 1: Write `tests/admin-users-crud.test.ts` verifying `updateBranchAdminAction`, `resetBranchAdminPasswordAction`, `deleteBranchAdminAction`, and RBAC price protection.
- [ ] Step 2: Run `npx tsx tests/admin-users-crud.test.ts` to verify Red phase failure.
- [ ] Step 3: In `prisma/schema.prisma`, add `isActive Boolean @default(true)` to `User` model. Run `npx prisma generate`.
- [ ] Step 4: In `app/actions/admin-users.ts`, implement `updateBranchAdminAction`, `resetBranchAdminPasswordAction`, and `deleteBranchAdminAction` (soft-delete if referencing records exist).
- [ ] Step 5: In `app/actions/admin-products.ts`, verify that `BRANCH_ADMIN` role cannot modify variant retail `price` or `oldPrice`.
- [ ] Step 6: In `components/admin/users-list-view.tsx`, add an Actions column to the users table with edit, password reset, and delete/deactivate modals.
- [ ] Step 7: Run `npx tsx tests/admin-users-crud.test.ts` to verify Green phase pass.
- [ ] Step 8: Commit: `git add prisma/schema.prisma app/actions/admin-users.ts app/actions/admin-products.ts components/admin/users-list-view.tsx tests/admin-users-crud.test.ts && git commit -m "feat(users): add full admin user management, password reset, and RBAC price guard"`

---

### Task 4: Accurate Admin Dashboard Revenue & Accounting Calculation

**Files:**
- Modify: `app/[locale]/admin/dashboard/page.tsx:75-115`
- Test: `tests/admin-dashboard-metrics.test.ts`

- [ ] Step 1: Write `tests/admin-dashboard-metrics.test.ts` verifying that `CANCELLED` orders are strictly excluded from total revenue aggregation.
- [ ] Step 2: Run `npx tsx tests/admin-dashboard-metrics.test.ts` to verify Red phase failure.
- [ ] Step 3: In `app/[locale]/admin/dashboard/page.tsx`, filter `status: { not: "CANCELLED" }` on revenue aggregate query.
- [ ] Step 4: Run `npx tsx tests/admin-dashboard-metrics.test.ts` to verify Green phase pass.
- [ ] Step 5: Commit: `git add app/[locale]/admin/dashboard/page.tsx tests/admin-dashboard-metrics.test.ts && git commit -m "fix(dashboard): exclude cancelled orders from revenue calculation"`

---

### Task 5: Master Verification Suite Expansion & GitHub Sync

**Files:**
- Modify: `scripts/verify-all.ts`

- [ ] Step 1: Add all new Phase 2 test suites to `scripts/verify-all.ts` (total 30 suites).
- [ ] Step 2: Run `npm run verify` and ensure all 30 suites pass (100% Green).
- [ ] Step 3: Run `npm run build` and ensure production build succeeds with 0 errors.
- [ ] Step 4: Commit: `git add scripts/verify-all.ts docs/superpowers/plans/ && git commit -m "test(verify): expand master verification suite to 30 suites for Phase 2"`
- [ ] Step 5: Push all commits to `origin/main` via `git push origin main`.
