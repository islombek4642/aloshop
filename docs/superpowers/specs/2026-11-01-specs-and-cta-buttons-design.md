# Design Spec: Unified Technical Specs Grid, Full-Width Variant Selector & Responsive Action Buttons

- **Date:** 2026-11-01
- **Status:** Approved by User
- **Scope:** Storefront Product Details Page (`components/store/snapshot-specs-view.tsx`, `components/store/variant-selector.tsx`, `components/store/mobile-sticky-buy-bar.tsx`, `components/store/product-details-client.tsx`, `messages/*.json`)

## 1. Intent & Problem Statement
On the product details page:
1. **Redundant & Confusing Specs:** The page displays an English-badged "Snapshot View" block and a redundant "Texnik xususiyatlar" table. Regular users do not understand "Snapshot View".
2. **Cramped Variant Buttons on Mobile:** The Color and Storage buttons are left-aligned in a loose row, looking small ("chapda kichkina bo'lib turibdi") and leaving awkward empty space on the right of mobile screens.
3. **Squeezed CTA Action Buttons:** The main "Savatchaga qo'shish" and "1-bosishda xarid" buttons are narrow and cramped ("qisilib qolgan, oriq"), causing text clipping or uncomfortable tap targets on mobile.
4. **Sticky Bottom Bar Overflow:** On phones, Uzbekistan sum prices (e.g., `14 500 000 so'm`) are very long. Showing both the current price and the crossed-out old price (`oldPrice`) in the sticky bottom bar causes severe horizontal crowding and text clipping.

## 2. Goals & Anti-Goals
- **Goals:**
  - **Full-Width Mobile Variant Selector:** Make Color and Storage buttons dynamically expand across the mobile screen width (`grid grid-cols-2` or `grid-cols-3` on phones, `sm:flex sm:flex-wrap` on desktop), centering their content with touch-friendly 44px+ height (`h-11`).
  - **Unified "Texnik xususiyatlar" Grid:** Replace the English "Snapshot View" title with **"Texnik xususiyatlar"** (`t("specs")`), add Displey, Protsessor, and Batareya tiles with Lucide icons (`Smartphone`, `Cpu`, `BatteryCharging`), and remove the duplicate table.
  - **Spacious Main Action Buttons:** Give primary CTA buttons comfortable mobile ergonomics (`h-13` / 52px, full-width stacked on mobile `flex-col`, side-by-side on tablet/desktop `sm:grid-cols-2`), generous padding, and bold readable text.
  - **Clean, Responsive Sticky Bottom Bar:** Remove the redundant old/discount price from `MobileStickyBuyBar`, showing only the clean current price in bold (`text-base font-black`), ensuring the price and action buttons never crowd or clip even on 320px screens.
  - **Strict Standards:** 100% adherence to `AGENTS.md` (zero emojis, Lucide icons only, zero hardcoded text, strict TypeScript).
- **Anti-Goals:**
  - Do not modify checkout, cart calculation, or branch inventory business logic.

## 3. Component Changes Specification

### 3.1. `components/store/variant-selector.tsx`
- **Color Buttons:**
  - Container: `grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5`
  - Button styling: `h-11 px-3 justify-center text-xs font-medium rounded-xl` with centered color swatch dot + localized color name.
- **Storage Buttons:**
  - Container: `grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap gap-2`
  - Button styling: `h-11 px-3.5 justify-center text-xs font-semibold rounded-xl text-center`.

### 3.2. `components/store/snapshot-specs-view.tsx`
- Remove `"snapshotBadge"` label.
- Header title: localized **"Texnik xususiyatlar"** (`tProduct("specs")`).
- Remove "Kafolat" (Warranty) tile as requested by user.
- Render the 8 vital hardware and availability specs in the high-density tile grid:
  1. **RAM** (`Cpu` icon, e.g. "8 GB")
  2. **Storage** (`HardDrive` icon, e.g. "256 GB")
  3. **Displey** (`Smartphone` icon, e.g. "6.7\" OLED 120Hz")
  4. **Protsessor** (`Cpu` icon, e.g. "A18 Pro" or "Snapdragon 8 Gen 3")
  5. **Batareya** (`BatteryCharging` icon, e.g. "5000 mAh")
  6. **Rang** (`Palette` icon, color circle + color name)
  7. **Holati** (`ShieldCheck` icon, Yangi / B/U)
  8. **Filialdagi mavjudlik** (`Building2` icon, jonli yashil pulsatsiyalanuvchi nuqta bilan)

### 3.3. `components/store/product-details-client.tsx`
- Delete the redundant `<Table>` specs section (lines ~456-550).
- Update CTA button container to `grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3`.
- Update buttons to `h-13` (52px), `rounded-xl`, `text-sm sm:text-base font-bold`, with generous touch targets.

### 3.4. `components/store/mobile-sticky-buy-bar.tsx`
- Remove the crossed-out `oldPrice` element.
- Display only the current price cleanly:
  ```tsx
  <span className="text-base font-black text-foreground">
    {activeVariant ? formatCurrency(activeVariant.price) : "0 so'm"}
  </span>
  ```
- Optimize flex shrinking and text truncation so on any mobile device (down to 320px) the price, stock status, and buttons sit comfortably without squeezing.
