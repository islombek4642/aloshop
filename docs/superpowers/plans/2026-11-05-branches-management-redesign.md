# Branches Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the AloShop admin branches management (`/admin/branches`) interface into a Retail Store Hub with top KPI summary cards, desktop 3-column visual store cards, mobile compact list with iOS-style Bottom Sheet (Action Drawer), floating action button (FAB), and branch manager assignment.

**Architecture:** Extend `app/actions/admin-branches.ts` to assign `BRANCH_ADMIN` users to branches transactionally; enrich `app/[locale]/admin/branches/page.tsx` with branch admin lists and today's sales aggregation; redesign `components/admin/branches-list-view.tsx` with responsive desktop 3-column cards and mobile Bottom Sheet modal; enforce 100% i18n dictionary parity across `uz`, `ru`, `en`.

**Tech Stack:** Next.js 15 (App Router, Server Actions), React 19, Prisma ORM (PostgreSQL), Tailwind CSS, Lucide icons, next-intl, Radix UI Dialog.

**Spec:** [`docs/superpowers/specs/2026-11-05-branches-management-redesign.md`](file:///d:/aloshop/docs/superpowers/specs/2026-11-05-branches-management-redesign.md)

## Global Constraints

- 100% i18n parity across `uz`, `ru`, and `en` locale files (`messages/*.json`), zero emojis in UI strings.
- Mobile touch targets $\ge 44\text{px}$ (`h-10 sm:h-9` or `h-11 sm:h-9`).
- Adhere strictly to `AGENTS.md`: separation of concerns, no secrets in logs, robust validation on server actions.
- Automatic deployment via GitHub `main` push (do not run `vercel deploy --prod` unless debugging errors).
- All changes must pass `npm run check-types` (`tsc --noEmit`) and `npx tsx scripts/test-i18n.ts`.

## Review Focus

1. **Reassigning an already assigned admin:** When Admin A is assigned to Branch 1 and then selected for Branch 2, Admin A's `branchId` must update cleanly without violating uniqueness or orphaning data.
2. **Branches with zero assigned admin:** When a branch has no assigned admin, the card must render an intuitive "Biriktirilmagan" (Unassigned) placeholder with an option to assign one.
3. **Today's sales calculation edge cases:** When there are zero orders today or all orders are cancelled, KPI must show `0 so'm` and gracefully fall back to the most stocked branch for `topBranch`.
4. **Mobile Bottom Sheet accessibility & layout:** On mobile viewports (<640px), the drawer must show a single centered drag handle, sticky action buttons with `gap-2`, and safe-area inset padding.
5. **Direct Inventory link navigation:** Clicking "Omborga o'tish" must navigate to `/admin/inventory?branchId=<id>` and activate that branch's inventory tab.

---

### Task 1: Server Actions & Data Layer Extensions for Branch Admin Assignment & KPIs

**Files:**
- Modify: `app/actions/admin-branches.ts`
- Modify: `app/[locale]/admin/branches/page.tsx`
- Test: `tests/admin-branches.test.ts`

- [ ] **Step 1: Write unit test in `tests/admin-branches.test.ts`**
  Verify that `createBranchAction` and `updateBranchAction` accept `assignedAdminId` and update `User.branchId`, and verify KPI sales aggregation logic.
- [ ] **Step 2: Run test to observe expected failure**
  Run `npx tsx tests/admin-branches.test.ts` (fails because `assignedAdminId` is not yet handled).
- [ ] **Step 3: Update `app/actions/admin-branches.ts`**
  Add `assignedAdminId?: string | null` to `CreateBranchInput` and `UpdateBranchInput`. In `createBranchAction` and `updateBranchAction`, if `assignedAdminId` is provided:
  - If `assignedAdminId` is set to an admin ID: update `prisma.user.update({ where: { id: assignedAdminId }, data: { branchId: branch.id } })`. If changing an existing branch's admin, clear `branchId` from previous admins of this branch who were not selected.
  - If `assignedAdminId` is empty/null: unbind any admins currently assigned to this branch (`prisma.user.updateMany({ where: { branchId: branch.id }, data: { branchId: null } })`).
- [ ] **Step 4: Update `app/[locale]/admin/branches/page.tsx`**
  - Include assigned branch admins: `users: { where: { role: "BRANCH_ADMIN", isActive: true }, select: { id: true, fullName: true, username: true, role: true } }`.
  - Fetch active branch admin candidates: `prisma.user.findMany({ where: { role: "BRANCH_ADMIN", isActive: true }, select: { id: true, fullName: true, username: true, branchId: true } })`.
  - Query today's sales and identify the top performing branch by sales/orders:
    ```ts
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: startOfToday }, status: { not: "CANCELLED" } },
      select: { totalAmount: true, pickupBranchId: true },
    });
    ```
  - Pass `branchAdmins`, `todaySalesTotal`, `topBranchName` to `BranchesListView`.
- [ ] **Step 5: Run tests to verify pass**
  Run `npx tsx tests/admin-branches.test.ts` and `npm run check-types`.
- [ ] **Step 6: Commit changes**
  `git commit -m "feat(branches): add branch manager assignment and today sales KPI aggregation"`

---

### Task 2: i18n Dictionary Parity for Branch Hub & KPI Keys

**Files:**
- Modify: `messages/uz.json`
- Modify: `messages/ru.json`
- Modify: `messages/en.json`
- Test: `scripts/test-i18n.ts`

- [ ] **Step 1: Identify required new translation keys**
  Add keys under `admin.branchesManagement`:
  - `todaySales`: "Bugungi savdo" / "Сегодняшние продажи" / "Today's sales"
  - `topBranch`: "Eng faol filial" / "Самый активный филиал" / "Most active branch"
  - `responsibleAdmin`: "Mas'ul admin" / "Ответственный администратор" / "Responsible admin"
  - `noAssignedAdmin`: "Admin biriktirilmagan" / "Администратор не назначен" / "No admin assigned"
  - `selectAdminPlaceholder`: "Mas'ul adminni tanlang" / "Выберите администратора" / "Select responsible admin"
  - `unassignedOption`: "Biriktirilmagan" / "Не назначен" / "Unassigned"
  - `goToInventory`: "Omborga o'tish" / "Перейти на склад" / "Go to inventory"
  - `quickActions`: "Tezkor amallar" / "Быстрые действия" / "Quick actions"
  - `callBranch`: "Qo'ng'iroq qilish" / "Позвонить" / "Call branch"
  - `branchDetails`: "Filial ma'lumotlari" / "Информация о филиале" / "Branch details"
- [ ] **Step 2: Add keys to `messages/uz.json`, `messages/ru.json`, `messages/en.json`**
  Ensure identical keys across all three files, zero emojis, following `AGENTS.md`.
- [ ] **Step 3: Run i18n test**
  `npx tsx scripts/test-i18n.ts` must report `100% parity across all locales (uz, ru, en)`.
- [ ] **Step 4: Commit changes**
  `git commit -m "fix(i18n): add branch management KPI, admin assignment, and action keys across all locales"`

---

### Task 3: Redesign `BranchesListView` Component (Desktop 3-Column Hub, Mobile Bottom Sheet & FAB)

**Files:**
- Modify: `components/admin/branches-list-view.tsx`
- Test: `npm run check-types`

- [ ] **Step 1: Update component interface and props**
  Extend `BranchListItem` to include `assignedAdmin?: { id: string; fullName: string; username: string } | null`.
  Add props for `availableAdmins`, `todaySalesTotal`, `topBranchName`.
- [ ] **Step 2: Implement Top KPI Overview Cards**
  Render 4 clean metric cards:
  1. `totalBranches`: Total count with building icon.
  2. `activeBranches`: Active count with green pulse badge.
  3. `todaySales`: Formatted currency total.
  4. `topBranch`: Most active branch name with trophy / trending icon.
- [ ] **Step 3: Implement Desktop 3-Column Visual Grid (`hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-5`)**
  Each card contains:
  - Header: Branch name, city badge, active/inactive pill indicator.
  - Assigned Admin section: Avatar initial, Full Name, `@username`, and contact link.
  - Address and operating hours.
  - Metrics row: Total Phones in stock (`totalInventory`), Orders count (`ordersCount`), Staff count (`staffCount`).
  - Action footer:
    - Primary outlined button: "Omborga o'tish" (`/admin/inventory?branchId=${branch.id}`).
    - Edit button: opens Edit Modal with admin selector.
    - Delete button (disabled with tooltip if active orders or stock exists).
- [ ] **Step 4: Implement Mobile View (`block md:hidden`)**
  - Compact contact-style list items: Name, City, Status dot, Admin name preview, chevron.
  - Tapping a branch opens the mobile Bottom Sheet (`DialogContent` anchored to bottom, max-height 85vh).
  - Bottom Sheet renders:
    - Branch header and status.
    - Responsible admin card with click-to-call.
    - Address and operating hours.
    - Metrics grid.
    - Action buttons with $\ge 44\text{px}$ touch targets and `gap-2` vertical spacing.
  - Floating Action Button (FAB): Fixed bottom-right `+` button on mobile for creating a new branch.
- [ ] **Step 5: Implement Admin Assignment in Create / Edit Modal**
  Add a `<Select>` dropdown for "Mas'ul admin":
  - Options: "Biriktirilmagan" (none), plus all `availableAdmins` (showing name and username).
  - Selecting an admin binds them to this branch on submit.
- [ ] **Step 6: Run typecheck and linting**
  `npm run check-types` must exit 0.
- [ ] **Step 7: Commit changes**
  `git commit -m "feat(ui): redesign branches list view with desktop 3-col hub, mobile bottom sheet, and FAB"`

---

### Task 4: End-to-End Verification & Production Push

**Files:**
- Test: `tests/admin-branches.test.ts`
- Test: `scripts/test-i18n.ts`

- [ ] **Step 1: Run comprehensive test suite**
  - `npm run check-types`
  - `npx tsx scripts/test-i18n.ts`
  - `npx tsx tests/admin-branches.test.ts`
  - `npx tsx tests/build-safety.test.ts`
- [ ] **Step 2: Push commit to GitHub `main`**
  Run `git push origin main`.
- [ ] **Step 3: Verify automatic Vercel deployment**
  Check that commit triggers Vercel auto-deploy and verify live HTTP response at `https://aloshop-neon.vercel.app/uz/admin/branches`.

