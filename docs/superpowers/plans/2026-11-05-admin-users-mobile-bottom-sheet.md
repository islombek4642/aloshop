# Admin Users Mobile Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an intuitive, responsive mobile experience for the admin users page (`/admin/users`) by replacing the awkward 6-column horizontal scrolling table with a clean contact-list view on mobile devices and an iOS/Telegram-style bottom sheet displaying full user vitals and touch-friendly actions.

**Architecture:** Responsive split inside `components/admin/users-list-view.tsx`. Desktop view (`hidden md:block`) retains the existing full table with all sorting and actions. Mobile view (`block md:hidden`) renders clean contact rows that open a bottom sheet dialog upon tap, giving access to user metadata and 3 prominent action triggers (Edit, Reset Password, Delete).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI Dialog, Lucide React, next-intl.

**Spec:** `C:\Users\Islombek\.gemini\antigravity\brain\fc2abb41-642b-46fa-bd25-768c8d0c7a9c\admin-users-mobile-bottom-sheet-design.md`

## Global Constraints

- Preserve 100% i18n key parity across `messages/uz.json`, `messages/ru.json`, and `messages/en.json`.
- Zero emojis across all UI copy as mandated by `AGENTS.md`.
- Strict touch target sizing (minimum 44x44px) for all mobile interactive controls.
- Desktop table view must remain completely unchanged and functional.
- Zero TypeScript errors (`npm run check-types` must pass with exit code 0).

## Review Focus

1. Mobile viewport width (320px - 425px) must have zero horizontal overflow or clipping.
2. Clicking a bottom sheet action (Edit, Reset Password, Delete) must cleanly transition to the respective modal without backdrop collision or stuck state.
3. SuperAdmin account must hide or disable the Delete action in both mobile bottom sheet and desktop table.
4. Active vs Inactive badge indicators must be immediately recognizable on small screens.
5. Localization must react instantly to language switching without untranslated keys.

---

### Task 1: Add Mobile Bottom Sheet i18n Keys

**Files:**
- Modify: `messages/uz.json`
- Modify: `messages/ru.json`
- Modify: `messages/en.json`
- Test: `scripts/test-i18n.ts`

- [ ] Step 1: Add `mobileDetailsTitle` and `close` keys to `admin.usersManagement` in all 3 locale dictionaries.
- [ ] Step 2: Run `npx tsx scripts/test-i18n.ts` to confirm 100% key parity and zero emojis.
- [ ] Step 3: Commit the translation updates.

---

### Task 2: Implement Responsive Split & Bottom Sheet in `UsersListView`

**Files:**
- Modify: `components/admin/users-list-view.tsx`
- Test: `npm run check-types`
- Test: `npx tsx tests/admin-users-crud.test.ts`

- [ ] Step 1: Add `selectedMobileUser` state and responsive split container in `components/admin/users-list-view.tsx`.
- [ ] Step 2: Wrap existing desktop table inside `<div className="hidden md:block">`.
- [ ] Step 3: Implement mobile contact list inside `<div className="block md:hidden space-y-2">` rendering each user's full name, @username, role badge, status dot, and Chevron indicator.
- [ ] Step 4: Implement Bottom Sheet Dialog triggered when tapping any user card:
  - Top visual drag handle (`w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto mb-3`);
  - User details header (Full Name, Username, Role badge, Status badge);
  - Metadata rows (Branch name with `Building2` icon, Created date with `Calendar` icon);
  - 3 full-width action buttons: Edit, Reset Password, and Delete (with 44px+ height and clear icons);
  - Seamless handover to existing Edit, Reset Password, and Delete dialogs.
- [ ] Step 5: Verify TypeScript compilation with `npm run check-types`.
- [ ] Step 6: Verify Admin Users CRUD tests with `npx tsx tests/admin-users-crud.test.ts`.
- [ ] Step 7: Commit the responsive implementation.

---

### Task 3: Build Verification & Vercel Production Deployment

**Files:**
- Test: `scripts/verify-all.ts`
- Deploy: `vercel deploy --prod --yes`

- [ ] Step 1: Run comprehensive tests to ensure zero regressions across all modules.
- [ ] Step 2: Push commit to GitHub `origin/main`.
- [ ] Step 3: Deploy to Vercel Production using `vercel deploy --prod --yes`.
- [ ] Step 4: Verify the mobile bottom sheet live on `https://aloshop-neon.vercel.app/uz/admin/users`.

