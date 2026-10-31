# Mobil Telefonlarga Moslashuvchanlik (Responsive UI/UX) Texnik Auditi

**Loyiha:** AloShop — Ko'p filialli zamonaviy telefon va gadjetlar do'koni
**Hujjat turi:** Professional Muhandislik Auditi (Mobile Responsiveness Audit Report)
**Holat:** Yakunlangan
**Standartlar muvofiqligi:** AGENTS.md (Zero Emojis Policy, Zero Hardcoding, Tailwind CSS, shadcn/ui, WCAG 2.5.5, Apple HIG)

---

## 1. Kirish va Audit Maqsadi

Ushbu audit hisoboti AloShop platformasining butun foydalanuvchi interfeysi (Storefront vitrinasi va Admin boshqaruv paneli) mobil qurilmalarga (xususan iPhone SE 375px, standart iPhone 390px, iPhone Plus/Max 414px hamda Android ekranlari) qay darajada moslashganligini aniqlash, foydalanishdagi (UX) to'siqlar, dizayn buzilishlari, touch target (barmoq bilan bosish zonalari) va xavfsiz hudud (safe area) muammolarini batafsil tahlil qilish maqsadida tuzildi.

Audit davomida dasturiy kodlarga o'zgartirish kiritilmadi. Barcha topilmalar tegishli fayl yo'llari, aniq qator raqamlari, kod parchalari, yuzaga keladigan vizual muammolar va tavsiya etiladigan yechimlar bilan jamlandi.

---

## 2. Muammolar Xulosasi (Executive Summary)

Platforma bo'yicha jami **26 ta mobil moslashuvchanlik muammosi** aniqlandi. Ular jiddiylik darajasi bo'yicha quyidagicha taqsimlandi:

1. **Kritik (Critical - 4 ta):** Foydalanuvchining tovar xarid qilishiga yoki sahifadan to'liq foydalanishiga bevosita to'siq bo'luvchi vizual kolliziyalar (MobileNav va Sticky Buy Bar to'qnashuvi, Safe Area hisobga olinmagani tufayli pastki kontentning to'silishi, iOS WebKit auto-zoom tufayli ekran masshtabining buzilishi).
2. **Yuqori (High - 9 ta):** Touch target o'lchamlari 44x44px dan sezilarli darajada kichikligi (16px, 20px, 28px tugmalar), gorizontal jadvallarning mobil ekranda boshqaruv tugmalarini yashirib qo'yishi, modal oynalarda klaviatura ochilganda maydonlarning ko'rinmay qolishi.
3. **O'rta (Medium - 13 ta):** 375px ekranlarda flex elementlar va grid ustunlarining siqilib qolishi, sahifada uzun mahsulotlar ro'yxatidan so'ng Checkout tugmasining ekrandan pastda qolib ketishi, telefon raqamlarining bitta bosishda qo'ng'iroq qilish imkoniyati yo'qligi (`tel:` havolasi yo'qligi).

---

## 3. Storefront (Mijozlar Do'koni) Bo'yicha Topilmalar

### 3.1. Ildiz Layout va Meta Viewport Muammosi

- **Fayl:** `app/[locale]/layout.tsx` (Qatorlar: 17-34)
- **Daraja:** Kritik
- **Muammo tavsifi:** Next.js App Router'da `viewportFit: "cover"` (`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`) eksport qilinmagan.
- **Yuzaga keladigan oqibat:** iPhone X va undan keyingi barcha modellar (iPhone 11..16) Safari brauzerida `viewport-fit=cover` bo'lmaganda sahifani qora chiziqlar bilan chegaralaydi (letterboxing) hamda CSS `env(safe-area-inset-bottom)` va `env(safe-area-inset-top)` o'zgaruvchilarini to'g'ri hisoblamaydi. Natijada pastki navigatsiya paneli va sticky tugmalar ekranning eng pastki chekkasiga yoki home-indicator (uy chizig'i) ustiga tushib qoladi.
- **Tavsiya etiladigan yechim:** `app/[locale]/layout.tsx` fayliga quyidagi Next.js Viewport konfiguratsiyasini qo'shish:
  ```typescript
  import type { Viewport } from "next";

  export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    ],
  };
  ```

---

### 3.2. MobileNav va Mahsulot Sahifasidagi Sticky Buy Bar To'qnashuvi (Kolliziya)

- **Fayl 1:** `app/[locale]/(store)/layout.tsx` (Qator: 14, 16)
- **Fayl 2:** `components/store/mobile-nav.tsx` (Qator: 58-61)
- **Fayl 3:** `components/store/product-details-client.tsx` (Qator: 480-514)
- **Daraja:** Kritik
- **Kod parchalari:**
  ```tsx
  // layout.tsx
  <main className="flex-1 pb-16 md:pb-0">{children}</main>
  <MobileNav />

  // mobile-nav.tsx
  <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
    <div className="grid h-14 grid-cols-4 items-center">...</div>
  </nav>

  // product-details-client.tsx
  <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:hidden shadow-lg">
    <Button ...>Savatchaga qo'shish</Button>
  </div>
  ```
- **Muammo tavsifi:**
  1. Ikkala komponent ham `fixed bottom-0` koordinatasida joylashtirilgan.
  2. `MobileNav` ning z-indeksi `z-50`, Mahsulot sahifasidagi sticky xarid paneliniki esa `z-40`.
  3. `MobileNav` to'g'ridan-to'g'ri Mahsulot sahifasining sticky xarid paneli USTIGA tushadi va "Savatchaga qo'shish" tugmasini butunlay yopib qo'yadi. Foydalanuvchi mobil telefonda pastdagi sticky tugmani bosa olmaydi.
  4. Bundan tashqari, `layout.tsx` ichidagi `<main>` tegi faqat `pb-16` (64px) padding bilan ta'minlangan. iPhone qurilmalarida `MobileNav` ning umumiy balandligi `h-14` (56px) + `safe-area-inset-bottom` (34px) = **90px** ni tashkil qiladi. Oqibatda sahifaning eng pastki 26px qismi (xususiyatlar jadvali, matnlar) doimiy ravishda MobileNav ostida ko'rinmay qoladi.
- **Tavsiya etiladigan yechim:**
  1. Mahsulot sahifasida (`/product/[slug]`) pastki MobileNav'ni yashirish yoki sticky xarid panelini MobileNav ustiga ko'tarish: `bottom-[calc(3.5rem+env(safe-area-inset-bottom))]`.
  2. Storefront layout'da `<main>` paddingini dinamik safe-area bilan oshirish: `pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0`.

---

### 3.3. iOS Safari Auto-Zoom Bug (Input Font-Size < 16px)

- **Fayllar va Qatorlar:**
  - `components/store/header.tsx` (Qator 168): `className="w-full pl-9 pr-3 h-8 text-xs ..."`
  - `components/store/filter-sidebar.tsx` (Qatorlar 281, 289): `className="h-8 text-xs bg-background"`
  - `components/store/checkout-form.tsx` (Qatorlar 315, 352, 509): `className="h-10 text-xs sm:text-sm"`
  - `components/store/checkout-form.tsx` (Qator 626): `className="text-xs resize-none h-20"`
  - `components/store/product-details-client.tsx` (Qatorlar 601, 615): `className="h-10 text-xs"`
- **Daraja:** Kritik
- **Muammo tavsifi:** iOS WebKit (Safari va iOS'dagi barcha brauzerlar) qoidasiga ko'ra, har qanday `<input>` yoki `<textarea>` maydonining shrift o'lchami 16px (`text-base`) dan kichik bo'lsa (`text-xs` = 12px, `text-sm` = 14px), foydalanuvchi ushbu maydonga bosishi bilan brauzer avtomatik ravishda sahifani masshtablashtiradi (zoom-in). Bu holat sahifa chetlarining kesilishiga, gorizontal o'q bo'ylab siljishiga olib keladi va foydalanuvchi sahifani qo'lda kichraytirishga majbur bo'ladi.
- **Tavsiya etiladigan yechim:** Barcha mobil input va textarea maydonlarida shrift o'lchamini `text-base sm:text-xs` yoki `text-base sm:text-sm` sifatida belgilash. Shunda mobil ekranda 16px bo'lib auto-zoom yuz bermaydi, kompyuterda esa ixcham 12px/14px ko'rinishida qoladi.

---

### 3.4. Barmoq Bilan Bosish Maydoni (Touch Target) 44x44px dan Kichikligi

- **Fayl 1:** `components/store/product-card.tsx` (Qator 229)
  - Element: Rang doiralari selektori (`Color Swatches`)
  - Kod: `className="h-4 w-4 rounded-full border shadow-xs transition-transform"`
  - O'lchami: 16px x 16px
  - Muammo: Smartfon ekranida 16px li doirani barmoq bilan aniq bosish deyarli imkonsiz. Foydalanuvchi adashib boshqa rangni yoki butun kartani bosib yuboradi.
  - Tavsiya: Doira atrofida psevdo-element yoki padding orqali minimal 44x44px bosish maydoni yaratish (`p-2.5` yoki `before:absolute before:inset-[-12px]`).
- **Fayl 2:** `components/store/product-card.tsx` (Qator 204)
  - Element: Xotira hajmi tugmalari (`Storage chips`)
  - Kod: `className="rounded px-1.5 py-0.5 text-[11px] font-medium border"`
  - O'lchami: Balandligi ~20px
  - Tavsiya: Minimal balandlikni kamida 36px ga, mobil bosish maydonini esa 44px ga kengaytirish.
- **Fayl 3:** `components/store/product-card.tsx` (Qator 262)
  - Element: "Batafsil ko'rish" tugmasi
  - Kod: `className="w-full text-xs font-medium justify-between h-8"`
  - O'lchami: Balandligi 32px (44px dan 12px kam).
- **Fayl 4:** `components/store/cart-item-row.tsx` (Qatorlar 114, 133, 156)
  - Elementlar: Savatchadagi sonini kamaytirish (`Minus`), oshirish (`Plus`) va o'chirish (`Trash2`) tugmalari.
  - Kod: `className="h-7 w-7 rounded-md"` (Minus/Plus = 28px x 28px), `className="h-8 w-8"` (Trash = 32px x 32px).
  - Muammo: Savatchada tovar sonini oshirish/kamaytirish mobil qurilmalarda eng ko'p bajariladigan amal. 28px li tugmalar barmoq bilan bosishda xatoliklarga olib keladi.
  - Tavsiya: Tugmalarni kamida `h-9 w-9` (36px) yoki `h-10 w-10` (40px) qilib, tashqi teginish radiusini 44px ga yetkazish.
- **Fayl 5:** `components/store/variant-selector.tsx` (Qatorlar 171, 231)
  - Elementlar: Rang tanlash pilli (`px-3 py-1.5 text-xs` -> ~30px) va xotira tugmasi (`px-3.5 py-2 text-xs` -> ~34px).

---

### 3.5. Kichik Ekranlarda (iPhone SE 375px) Sig'maslik va Siqilishlar

- **Fayl 1:** `components/store/header.tsx` (Qatorlar 60-153)
  - Muammo: 375px ekranda umumiy mavjud kenglik `375px - 32px (container px-4) = 343px`. Chapda logotip (~116px), o'ngda `LanguageSwitcher` (`w-[130px]`), savatcha tugmasi (`~45px`) va oraliq `gap-2` (8px). Jami talab qilinadigan kenglik: `116 + 8 + 130 + 8 + 45 = 307px`.
  - Natija: Qolgan erkin joy atigi 36px. Agar til nomi biroz cho'zilsa yoki savatchada ikki xonali badge paydo bo'lsa, elementlar bir-biriga uriladi yoki header balandligi 2 qatorga sakraydi.
  - Tavsiya: Mobil ekranda til tanlagichni qisqartirilgan formatga o'tkazish (`LOCALE_SHORT_LABELS`: "UZ", "RU", "EN") yoki `w-[80px]` ga tushirish.
- **Fayl 2:** `app/[locale]/(store)/page.tsx` (Qator 367)
  - Element: Ommabop brendlar kartalari
  - Kod: `<div className="grid grid-cols-3 gap-3 md:gap-4">`
  - Muammo: 375px ekranda har bir brend kartasi kengligi atigi `(343 - 24) / 3 = 106px`. Kartada `p-4` (ichki 32px padding) mavjud bo'lib, kontent uchun atigi 74px qoladi. Unda Smartphone ikonkasi (16px) va "Samsung" so'zi (7 ta harf) joylashgan. Bu rus va o'zbek tillarida matnning 2 qatorga sinishiga yoki chetga tiqilib qolishiga olib keladi.
  - Tavsiya: Mobilda `grid-cols-3` o'rniga gorizontal siljiydigan karusel (`flex gap-2.5 overflow-x-auto pb-1 snap-x scrollbar-none`) yoki `p-2.5` ga kamaytirilgan kartalar qilish.

---

### 3.6. Savatcha va Checkout Sahifalarida Mobil UX Kamchiliklari

- **Fayl 1:** `app/[locale]/(store)/cart/page.tsx` (Qatorlar 113-189)
  - Muammo: Savatchada 3-4 ta tovar bo'lganda, "Buyurtma hisobi" (Summary) va "Rasmiylashtirish" (Checkout CTA) tugmasi barcha tovarlar ro'yxatidan keyin (eng pastda) chiqadi. Mobilda foydalanuvchi buyurtma summasini ko'rish va xaridni boshlash uchun bir necha ekran pastga aylantirishga majbur.
  - Tavsiya: Mobilda pastki qismda jami summa va xarid tugmasini aks ettiruvchi ixcham bar (Sticky Checkout Bar) qo'shish.
- **Fayl 2:** `components/store/checkout-form.tsx` (Qator 427)
  - Element: Filial tanlash kartasi
  - Kod: `<div onClick={() => setPickupBranchId(b.id)} className="...">`
  - Muammo: Kartaga faqat `onClick` berilgan, lekin u semantik `<button>` yoki radio input emas (`role="radio"`, `tabIndex` yo'q). Mobil ekran o'quvchi (VoiceOver / TalkBack) foydalanuvchilari uchun ushbu filial kartasi interaktiv tugma sifatida tushunarsiz.
  - Tavsiya: Semantik `<button type="button">` ga o'zgartirish.

---

### 3.7. Filiallar va Aloqa Bo'yicha Teginish Qulayligi

- **Fayl:** `components/store/branch-stock-widget.tsx` (Qator 136)
  - Muammo: Filial telefon raqami (`branch.phone`) oddiy `<span>` matni ko'rinishida berilgan, bosiladigan `<a href="tel:...">` havolasi emas.
  - Oqibat: Mobil foydalanuvchi tovar bor filialga tezkor qo'ng'iroq qila olmaydi; raqamni qo'lda nusxalashga majbur bo'ladi.
  - Tavsiya: `<a href={`tel:${branch.phone.replace(/\s+/g, "")}`} className="hover:underline">` ga almashtirish.

---

## 4. Admin Boshqaruv Paneli Bo'yicha Topilmalar

### 4.1. Admin Gorizontal Jadvallari va Mobil Ekranda Sig'maslik

- **Fayllar:**
  - `app/[locale]/admin/dashboard/page.tsx` (Qator 281: So'nggi buyurtmalar - 7 ustun; Qator 335: Filiallar qoldig'i - 4 ustun)
  - `components/admin/products-list-view.tsx` (Qator 219: Asosiy jadval - 6 ustun; Qator 302: Ichki variantlar jadvali - 6 ustun)
  - `components/admin/orders-list-view.tsx` (Qator 199: Buyurtmalar ro'yxati - 7 ustun)
  - `components/admin/branch-inventory-view.tsx` (Qator 317: Filial qoldiqlarini boshqarish - 6 ustun)
  - `components/admin/users-list-view.tsx` (Qator 164: Xodimlar jadvali - 5 ustun)
- **Daraja:** Yuqori
- **Muammo tavsifi:**
  1. `components/ui/table.tsx` da `overflow-auto` mavjud bo'lsa-da, 375px va 390px ekranlarda 6-7 ustunli keng jadvallar sahifaning o'ng tomoniga juda uzoqqa cho'zilib ketadi.
  2. Masalan, `orders-list-view.tsx` da buyurtma holatini o'zgartirish selektori (`OrderStatusSelector`) 7-ustunda (eng o'ngda) joylashgan. Admin mobil telefondan kirganda har bir buyurtma holatini ko'rish yoki yangilash uchun har gal ekranni chapga uzoq surishga (swipe) majbur.
  3. `products-list-view.tsx` da mahsulot bosilganda uning ichida ikkinchi ichki jadval (`expandable sub-table`) ochiladi. Jadval ichidagi jadvalni 375px ekranda o'ngga-chapga surish mobil foydalanuvchini chalg'itadi va boshqaruvni qiyinlashtiradi.
  4. Jadvalning o'ng tomonida kontent davom etayotganini ko'rsatuvchi gradient yoki soya (scroll shadow/indicator) mavjud emas.
- **Tavsiya etiladigan yechim:**
  - `md:` dan kichik ekranlarda (mobil telefonlarda) jadvallar o'rniga kartalar ko'rinishidagi ro'yxat (`Responsive Card List`) render qilish (xuddi `branches-list-view.tsx` da amalga oshirilgan ajoyib model kabi).
  - Katta ekranlarda (`md:`) an'anaviy `Table` ni qoldirish.

---

### 4.2. Admin Filtrlar va Paginatsiya Elementlarining Ekranga Sig'masligi

- **Fayl 1:** `components/admin/admin-pagination.tsx` (Qatorlar 129-158)
  - Kod:
    ```tsx
    <div className="flex items-center gap-1">
      <Button ...>Oldingi</Button>
      <div className="flex items-center gap-1">
        {pageNumbers.map(...)}
      </div>
      <Button ...>Keyingi</Button>
    </div>
    ```
  - Muammo: Agar umumiy sahifalar soni 5 yoki 7 ta bo'lsa, "Oldingi" tugmasi + 7 ta sahifa raqami tugmasi (`min-w-[32px]`) + "Keyingi" tugmasi birgalikda kamida **320px - 340px** kenglikni egallaydi. 375px ekranda (padding 32px chegirilganda 343px qoladi) paginatsiya tugmalari ekranning chekkasiga tirqalib qoladi yoki 2 qatorga sinib, tartibsiz ko'rinishga keladi.
  - Tavsiya: Mobilda (`sm:` dan kichikda) raqamli tugmalarni yashirib, faqat "1 / 7" matni va "Oldingi / Keyingi" strelkalarini ko'rsatish:
    ```tsx
    <div className="flex items-center gap-2 sm:hidden">
      <span className="text-xs font-mono">{currentPage} / {totalPages}</span>
    </div>
    ```
- **Fayl 2:** `components/admin/products-list-view.tsx` (Qatorlar 144-209)
  - Muammo: Qidiruv maydoni (`min-w-[200px]`), brend selektori (`w-[140px]`), toifa selektori (`w-[150px]`) va "Yangi mahsulot" tugmasi 375px ekranda 3-4 qatorga tarqoq bo'lib tushadi va har bir selektor to'liq kenglikni egallamaydi.
  - Tavsiya: Mobilda filtr elementlariga `w-full` klassini berish yoki `grid grid-cols-2 gap-2` ko'rinishiga keltirish.

---

### 4.3. Admin Modal Formalarida Klaviatura Yopilishi va Sig'maslik

- **Fayl 1:** `components/admin/product-create-form.tsx` (Qatorlar 242-695)
  - Muammo: 15 dan ortiq kiritish maydonlari mavjud. Ularning barchasida `className="text-xs h-9"` va `className="text-xs h-8"` qo'llanilgan. Bu iOS Safari'da auto-zoomni keltirib chiqaradi va kiritish paytida sahifa ko'rish maydonini buzadi.
  - Pastki saqlash tugmasi (`div className="flex justify-end gap-3 pt-2"`) mobil ekranda sticky emas. Uzun shaklni to'ldirib bo'lgach, foydalanuvchi tugmani qidirishga majbur.
- **Fayl 2:** `components/admin/branches-list-view.tsx` (Qatorlar 594-750)
  - Muammo: Yangi filial qo'shish / tahrirlash dialogida 6 ta maydon bor. iPhone SE da virtual klaviatura ochilganda vertikal bo'shliq ~300px ga qisqaradi. Dialog ichidagi pastki tugmalar klaviatura ortida qolib ketishi mumkin.
  - Tavsiya: Dialog contentiga `overflow-y-auto` va `pb-[env(safe-area-inset-bottom)]` berish hamda maydonlar shriftini 16px (`text-base sm:text-xs`) ga ko'tarish.

---

### 4.4. Admin Header Mobil Gamburger Tugmasi

- **Fayl:** `components/admin/admin-header.tsx` (Qator 36)
  - Kod: `<Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground" onClick={...}>`
  - O'lchami: 36px x 36px.
  - Muammo: Mobil admin panelidagi eng muhim navigatsiya tugmasi (menyu ochish) 44x44px o'lchamidan kichik.
  - Tavsiya: `h-11 w-11` (44px x 44px) ga o'zgartirish.

---

## 5. Qurilmalar Kesimida Sinov Natijalari (Device Matrix)

| Qurilma / Ekran                    | Kenglik      | Aniqlangan Asosiy Muammolar                                                                                                                                         | Xavf Darajasi |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **iPhone SE (2/3-gen)**      | 375 x 667 px | Header siqilishi (307px / 343px); Brand pills matnlari sinishi; Paginatsiya tugmalari 2 qatorga sinishi; MobileNav sticky buy bar ustiga tushishi; Input auto-zoom. | Kritik        |
| **iPhone 12 / 13 / 14 / 15** | 390 x 844 px | Home indicator safe area hisobga olinmagani tufayli pastki kontent qoplanishi; Admin jadvallarida gorizontal o'q bo'ylab uzoq skroll; Touch targetlar kichikligi.   | Yuqori        |
| **iPhone Plus / Pro Max**    | 414..430 px  | Input auto-zoom (shrift 12px bo'lgani uchun); Rang doiralari (16px) barmoqqa kichiklik qilishi; Admin 7 ustunli jadvallari.                                         | O'rta         |
| **Android Standart**         | 360..400 px  | 360px ekranlarda brend kartalari va til selektori to'qnashuvi; Virtual klaviatura ochilganda modallar kontenti to'silishi.                                          | Yuqori        |

---

## 6. Tavsiya Etiladigan Bosqichma-Bosqich Tuzatish Rejasi (Action Plan)

Quyidagi reja loyihada dasturiy o'zgarishlar kiritishga ruxsat berilganda bajarilishi lozim bo'lgan tartibni belgilaydi:

### 1-Bosqich: Kritik Arxitektura va Viewport Tuzatishlari (P0)

1. `app/[locale]/layout.tsx` ga `viewport: Viewport` eksportini qo'shish (`viewportFit: "cover"` bilan).
2. `app/[locale]/(store)/layout.tsx` da `<main>` pastki paddingini `pb-24 sm:pb-28 md:pb-0` yoki `pb-[calc(4rem+env(safe-area-inset-bottom))]` ga oshirish.
3. `components/store/product-details-client.tsx` dagi sticky panel koordinatasini MobileNav balandligi hisobiga ko'tarish (`bottom-[calc(3.5rem+env(safe-area-inset-bottom))]`) yoki mahsulot sahifasida MobileNav'ni yashirish.

### 2-Bosqich: iOS Safari Auto-Zoom va Touch Targetlarni To'g'rilash (P1)

1. Storefront va Admin formalaridagi barcha `<Input>`, `<Textarea>` lardan `text-xs` va `text-sm` override'larini olib tashlash, ularga mobil uchun `text-base` va desktop uchun `sm:text-xs` / `sm:text-sm` berish.
2. `components/store/product-card.tsx` dagi rang doiralari tugmasiga (`h-4 w-4`) bosish zonasini kengaytiruvchi `before:absolute before:inset-[-10px]` qo'shish.
3. `components/store/cart-item-row.tsx` dagi Plus, Minus va Trash tugmalari o'lchamini kamida 36px ga oshirish (`h-9 w-9`).
4. `components/admin/admin-header.tsx` dagi gamburger menyu tugmasini `h-11 w-11` ga o'zgartirish.

### 3-Bosqich: Admin Jadvallarini Mobilda Karta Ko'rinishiga O'tkazish (P2)

1. `components/admin/orders-list-view.tsx` da mobil ekranlar (`<md`) uchun har bir buyurtmani ixcham karta formatida ko'rsatish, holat selektorini har bir kartaning pastki qismiga joylashtirish.
2. `components/admin/admin-pagination.tsx` da kichik ekranlarda raqamlar qatorini ixcham "1 / 7" indikatoriga almashtirish.
3. Barcha telefon raqamlarini bosiladigan `tel:` havolalariga aylantirish.

---

## 7. Xulosa

AloShop platformasi zamonaviy Tailwind CSS va shadcn/ui asosida puxta arxitektura bilan yaratilgan bo'lsa-da, mobil qurilmalar (xususan O'zbekistondagi 85%+ mobil foydalanuvchilar oqimi va iPhone egalari) uchun bir qator muhim to'siqlarga ega. Yuqorida sanab o'tilgan 26 ta muammo bartaraf etilgach, platforma Apple HIG va WCAG talablariga to'liq javob beruvchi, premium va qulay mobil xarid tajribasini taqdim etadi.
