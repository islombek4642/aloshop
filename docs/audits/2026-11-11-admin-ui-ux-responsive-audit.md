# AloShop Admin Panel — To'liq UI/UX, Responsivlik, Scroll va Mobil Moslashuvchanlik Auditi

> **Sana:** 2026-yil 11-noyabr  
> **Tadqiqotchi:** Antigravity UI/UX Muhandislik va Sifat Nazorati Eksperti  
> **Mavzu:** Admin paneldagi har bir sahifa, har bir komponent, mobil va kompyuter moslashuvchanligi, scroll/overflow muammolari, matn/tipografiya, iconlar, AGENTS.md standartlari va premium dizayn tahlili  
> **Holat:** Kod o'zgartirilmagan (Faqatgina chuqur audit va hujjatlashtirish)

---

## 1. UMUMIY XULOSA VA ASOSIY BAHOLASH (EXECUTIVE SUMMARY)

AloShop platformasining admin paneli arxitekturasi va funksionalligi jihatidan ancha boy va ko'p funksiyali (Next.js 15 App Router, Radix UI dialoglari, Lucide Icons, ko'p filialli ombor va RBAC rollari) bo'lsa-da, **mobil foydalanish (smartfonlar va planshetlar)**, **scroll boshqaruvi**, **kichik ekranlardagi tipografiya** va **HTML semantikasi** bo'yicha jiddiy kamchiliklar, nosozliklar va hatto qo'pol xatolar mavjud.

### Asosiy topilmalar xulosasi:
1. **Qo'pol UI Matn Xatosi (Dashboard):** Asosiy Dashboard sahifasida filiallar jadvalida ustun sarlavhasiga `{tCommon("labels.date")}` ("Sana" / "Date") yozilgan, ammo uning ostidagi katakda soat belgisi bilan filialning ish vaqti (`branch.workingHours`: "09:00 - 20:00") chiqmoqda!
2. **Mobil Karta Ko'rinishining Mutlaqo Yo'qligi (Inventory Page):** `Products` va `Orders` sahifalarida mobil uchun mos karta ko'rinishi (`md:hidden`) mavjud bo'lgani holda, eng ko'p ishlatiladigan `BranchInventoryView` sahifasida mobil ko'rinish **umuman qilinmagan**! 7 ustunli ulkan jadval 360-390px ekranlarda siqilib, input va tugmalar buzilib ketadi.
3. **iOS Safari Avto-Zoom (Input Font-Size Bug):** `ProductPresetMatrixForm` (qator 568, 588) va `VariantsSection` (qator 384) sahifalarida narx va qoldiq kiritish inputlariga `text-xs` (12px) berilgan. Apple iOS WebKit talabiga ko'ra, 16px (`text-base`) dan kichik har qanday inputga fokus tushganda brauzer avtomatik ravishda ekranni yaqinlashtirib (zoom-in) yuboradi va butun ekran tartibini buzadi.
4. **Planshet (Tablet 640px-1023px) Dead-Zone:** Yangi mahsulot qo'shish sahifasida (`UnifiedProductEditor`) mobil pastki panel `sm:hidden` qilingan (640px dan katta ekranda yo'qoladi), o'ngdagi Sticky Sidebar esa `lg:sticky` qilingan (faqat 1024px dan katta ekranda yonboshda turadi). Natijada iPad va planshetlarda (768px-900px) Saqlash tugmasi yo'qoladi va sahifaning eng pastiga tushib qoladi!
5. **Double Action Button (Filiallar Sahifasi):** Mobilda bir vaqtning o'zida ham yuqori action-barda "Yangi filial" tugmasi, ham pastda o'ng burchakda qotirilgan FAB (Floating Action Button) tugmasi ko'rinib turadi (bitta ekranda bir xil 2 ta tugma!).
6. **Noqonuniy HTML Semantikasi (`<button>` inside `<a>`):** Bir nechta sahifalarda `<Link href="..."> <Button> ... </Button> </Link>` yozilgan (`asChild` ishlatilmagan). Natijada HTML5 standarti buzilib, `<a>` ichida `<button>` render bo'lmoqda, bu accessibility (a11y) va klaviatura navigatsiyasida jiddiy xato hisoblanadi.
7. **Katta Rasmlar Sababli Server Action Qulashi (Payload Crash):** Yangi mahsulot kiritishda kamera yoki galereyadan olingan fotosuratlar to'g'ridan-to'g'ri Base64 formatida siqilmasdan Server Action'ga yuborilmoqda. 2-3 ta smartfon kamerasi surati 10-15MB bo'lib, Next.js Server Action 1MB limitini buzadi va xatolik bilan qulaydi.
8. **Mobil Drawer va Safe-Area Kamchiliklari:** iPhone Home Indicator (pastki chiziq) va Dynamic Island/Notch uchun `env(safe-area-inset-*)` chekinishlari hisobga olinmagan, pastki floating tugmalar ekran chetiga yopishib qolmoqda.
9. **Katta Hajmdagi O'lik Kodlar (Dead Code):** Loyihada `product-wizard` papkasi (~2500 qator) va `components/admin/product-create-form.tsx` (1187 qatorli ulkan fayl) hech qayerda ishlatilmasdan qolib ketgan (jami ~3700 qator keraksiz kod).

---

## 2. GLOBAL SHELL, LAYOUT VA NAVIGATSIYA AUDITI

### 2.1. Shell va Viewport Tuzilishi (`app/[locale]/admin/layout.tsx`)
- **Fayl & Qator:** [`app/[locale]/admin/layout.tsx:40-54`](file:///c:/alo_shop/app/[locale]/admin/layout.tsx#L40-L54)
- **Kod:**
  ```tsx
  <div className="h-[100dvh] overflow-hidden flex bg-slate-50/50 dark:bg-slate-950">
    <AdminSidebar session={session} className="hidden md:flex h-full shrink-0" />
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <AdminHeader session={session} />
      <main className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  </div>
  ```
- **Aniqlangan muammolar:**
  1. `main` konteynerida `pb-[max(1rem,env(safe-area-inset-bottom))]` yo'q. Natijada iOS Safari'da pastki Home Indicator chizig'i ostida sahifaning eng pastki elementlari (pagination, jadvallar) to'silib qoladi.
  2. `AdminHeader` da safe-area top insets hisobga olinmagan. PWA yoki to'liq ekranli mobil rejimda status bar va notch header bilan to'qnashadi.

### 2.2. Admin Header (`components/admin/admin-header.tsx`)
- **Fayl & Qator:** [`components/admin/admin-header.tsx:48-68`](file:///c:/alo_shop/components/admin/admin-header.tsx#L48-L68), [`L90-L109`](file:///c:/alo_shop/components/admin/admin-header.tsx#L90-L109)
- **Aniqlangan muammolar:**
  1. **Filial indikatori mobilda yashirilgan:** `line 49: <div className="hidden sm:flex items-center">`. Smartfon ekranida admin xodimi qaysi filial nomidan tizimga kirganini headerda ko'ra olmaydi.
  2. **Mobil Drawer Scroll Lock va Focus Trap yo'qligi:** Qator 91-109 dagi mobil menyu oddiy `div` sifatida ochiladi:
     - Orqa fondagi `document.body` skrolli qulflanmaydi (`overflow: hidden` qilinmagan);
     - Klaviaturadagi `Escape` tugmasi tinglanmaydi;
     - Drawer ichida `aria-modal="true"` yoki focus-trap yo'q;
     - Drawer ochilganda uning ichida alohida `X` (Yopish) tugmasi yo'q.
  3. **Tugma o'lchamlari:** Hamburger tugmasi `h-10 w-10` (40x40px). Apple HIG va AGENTS.md 7.3 standarti bo'yicha qulay mobil sensor o'lchami minimal 44x44px bo'lishi lozim.

### 2.3. Admin Sidebar (`components/admin/admin-sidebar.tsx`)
- **Fayl & Qator:** [`components/admin/admin-sidebar.tsx:158-167`](file:///c:/alo_shop/components/admin/admin-sidebar.tsx#L158-L167)
- **Aniqlangan muammolar:**
  1. **Mobilda noqulay teginish balandligi (Touch Target):** Navigatsiya havolalariga `px-3 py-2.5 rounded-lg text-xs` berilgan. Bu elementning umumiy balandligi 36px atrofida bo'lib, mobil ekranda barmoq bilan bosishda qo'shni menyularga noxush adashib bosish xavfi mavjud (minimal 44px talab qilinadi).
  2. **Chiqish (Logout) tugmasi:** `h-9` (36px). Mobilda barmoq uchun qulayroq `h-11` bo'lishi kerak.

---

## 3. HAR BIR SAHIFA BO'YICHA DETALIK AUDIT

---

### 3.1. ADMIN LOGIN SAHIFASI
* **Fayl:** [`app/[locale]/admin/login/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/login/page.tsx)
* **Elementlar:** Til almashtirgich, Logotip, Sarlavha, Username input, Password input, Kirish tugmasi, Xatolik xabarnomasi.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **Parolni Ko'rsatish / Yashirish (Eye Toggle) Yo'qligi:**
   - [`L128-L153`](file:///c:/alo_shop/app/[locale]/admin/login/page.tsx#L128-L153): Parol kiritish maydonida ko'zcha (`Eye` / `EyeOff`) tugmasi mutlaqo yo'q!
   - Smartfonlarda murakkab admin parolini terayotganda foydalanuvchi qaysi harfni terganini ko'ra olmaydi. Bu xato kiritishga va rate-limit blokirovkasiga sabab bo'ladi.
2. **Klaviatura Chiqqanda Ekranning Qisilib Qolishi:**
   - [`L58`](file:///c:/alo_shop/app/[locale]/admin/login/page.tsx#L58): `min-h-screen flex flex-col justify-center items-center py-12`.
   - Kichik ekranli telefonlarda (iPhone SE va boshqalar) virtual klaviatura ochilganda `justify-center` sabab yuqori sarlavha va logo ekranning yuqori qismidan chiqib ketadi va orqaga qaytish noqulaylashadi.
3. **Til tanlash tugmasining joylashuvi:**
   - [`L60`](file:///c:/alo_shop/app/[locale]/admin/login/page.tsx#L60): `absolute top-4 right-4 sm:top-6 sm:right-6`.
   - Landshaft (landscape) rejimda yoki kichik ekranlarda notch maydoniga tegib qoladi (`pt-[env(safe-area-inset-top)]` yo'q).

---

### 3.2. ADMIN DASHBOARD (BOSHQARUV PANELI)
* **Fayl:** [`app/[locale]/admin/dashboard/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/dashboard/page.tsx)
* **Elementlar:** Sarlavha & Filial doirasi, 4 ta Metrik kartasi (Daromad, Buyurtmalar, Filiallar, Kam qolgan tovarlar), So'nggi buyurtmalar jadvali, Filiallar ombori xulosasi jadvali.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **KRITIK BLATANT UI COPY XATOSI (Jadval Ustun Sarlavhasi Noto'g'ri):**
   - **Fayl & Qator:** [`app/[locale]/admin/dashboard/page.tsx:340-345`](file:///c:/alo_shop/app/[locale]/admin/dashboard/page.tsx#L340-L345)
   - **Kod:**
     ```tsx
     <TableHeader>
       <TableRow className="hover:bg-transparent">
         <TableHead className="text-xs">{t("branches")}</TableHead>
         <TableHead className="text-xs">{tCommon("labels.date")}</TableHead> {/* XATO! */}
         <TableHead className="text-xs">{t("ordersTable.phone")}</TableHead>
         <TableHead className="text-xs text-right">{t("itemsCount")}</TableHead>
       </TableRow>
     </TableHeader>
     ```
   - **Katakdagi haqiqiy ma'lumot ([`L359-L364`](file:///c:/alo_shop/app/[locale]/admin/dashboard/page.tsx#L359-L364)):**
     ```tsx
     <TableCell className="text-xs text-muted-foreground">
       <div className="flex items-center gap-1">
         <Clock className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-hidden="true" />
         <span>{branch.workingHours}</span>
       </div>
     </TableCell>
     ```
   - **Xulosa:** Ustun tepasida **"Sana"** (Date) deb yozilgan, uning tagida esa soat belgisi bilan filialning **ish vaqti** ("09:00 - 20:00") chiqmoqda! Bu dasturchi tomonidan nusxalashda qilingan o'ta qo'pol xato.
2. **Mobilda 7 Ustunli Jadvalning Ezilib Ketishi (Responsive Card Yo'q):**
   - [`L284-L325`](file:///c:/alo_shop/app/[locale]/admin/dashboard/page.tsx#L284-L325): "So'nggi buyurtmalar" jadvali mobilda karta ko'rinishiga ega emas!
   - 7 ta ustun (Buyurtma ID, Mijoz, Telefon, Filial, Jami, Holat, Sana) 360-390px li smartfon ekranida haddan tashqari siqiladi.
   - Ustun kataklarida `whitespace-nowrap` yo'qligi sababli telefon raqamlari 2 qatorga, sana 3 qatorga bo'linib ketadi.
3. **Sahifalararo Bog'liqlik (Quick Links) Yo'qligi:**
   - "So'nggi buyurtmalar" bloki tepasida barcha buyurtmalarga o'tish tugmasi (`Barchasini ko'rish ->`) yo'q, holbuki `messages/uz.json` da `admin.viewAllOrders` kaliti mavjud!
   - KPI kartalarining birortasi bosilmaydi (masalan, "Jami buyurtmalar" bosilganda `/admin/orders` ga o'tmaydi).
4. **Design Taste (App Screens) Qoidalarining Buzilishi:**
   - 4 ta KPI kartasi bo'yalgan kvadrat ikonkalarga ega (`bg-emerald-50 text-emerald-600`, `bg-blue-50 text-blue-600`, va h.k.).
   - `design-taste-frontend` qoidasi: *"KPIs are type, not tiles. No screen puts an icon in a coloured circle on a KPI... A generated dashboard is the average of every dashboard template: four KPI cards each with an icon in a tinted circle"*. Premium ko'rinish uchun rang kvadratda emas, ma'lumotning o'zida bo'lishi kerak.

---

### 3.3. BUYURTMALAR SAHIFASI (ORDERS MANAGEMENT)
* **Fayl:** [`app/[locale]/admin/orders/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/orders/page.tsx) & [`components/admin/orders-list-view.tsx`](file:///c:/alo_shop/components/admin/orders-list-view.tsx) & [`components/admin/order-status-selector.tsx`](file:///c:/alo_shop/components/admin/order-status-selector.tsx)
* **Elementlar:** Qidiruv maydoni, Holat filteri, Filial filteri, Mobil karta ro'yxati, Desktop jadval, Status tanlagich dropdown, Paginatsiya.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **Holat O'zgartirishdagi Sukut Saqlash Xatosi (Silent Error Swallowing):**
   - **Fayl & Qator:** [`components/admin/order-status-selector.tsx:49-60`](file:///c:/alo_shop/components/admin/order-status-selector.tsx#L49-L60)
   - **Kod:**
     ```tsx
     const res = await updateOrderStatusAction(orderId, newStatus);
     if (!res.success) {
       setStatus(currentStatus); // Jim qaytarib qo'yilmoqda!
     } else {
       router.refresh();
     }
     ```
   - **Muammo:** Agar status o'zgartirish muvaffaqiyatsiz bo'lsa (masalan, tarmoq uzilsa yoki omborda tovar yetishmasa), foydalanuvchiga hech qanday Toast, Alert yoki xato xabari ko'rsatilmaydi! Dropdown shunchaki jim o'z holatiga qaytib qoladi. Foydalanuvchi buyurtma nima sababdan yangilanmaganini tushunmay hayron bo'ladi.
   - **AGENTS.md Qoidasi (6.5 & 7.4):** *"Kutilmagan xatoliklarni jim yutib yuborma; to'g'ri qayta ishlash yoki yuqori qatlamga uzatish kerak... Foydalanuvchiga amal bajarilayotgani va natijasi haqida aniq feedback ber."*
2. **Kichik Ekranlarda Filterlarning Noqulay Sinishi:**
   - [`components/admin/orders-list-view.tsx:124-189`](file:///c:/alo_shop/components/admin/orders-list-view.tsx#L124-L189):
     `min-w-[220px]` (qidiruv) + `w-[160px]` (holat) + `w-[180px]` (filial).
     Smartfon ekranida (360px-390px) Status va Branch filterlari bir qatorga sig'maydi (160 + 180 + 12 = 352px), natijada ular bir-birining tagiga noqulay tushadi. Mobilda har bir select `w-full sm:w-[160px]` bo'lishi kerak.
3. **Mobil Kartada Status Selector O'lchami:**
   - Qator 276 da mobil karta ichida `OrderStatusSelector` `h-8` (32px) balandlikda turibdi. Mobilda qulayroq boshqarish uchun 40-44px teginish maydoni zarur.

---

### 3.4. MAHSULOTLAR RO'YXATI SAHIFASI (PRODUCTS LIST)
* **Fayl:** [`app/[locale]/admin/products/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/products/page.tsx) & [`components/admin/products-list-view.tsx`](file:///c:/alo_shop/components/admin/products-list-view.tsx)
* **Elementlar:** Qidiruv va brand/kategoriya filterlari, "Yangi mahsulot" tugmasi, Desktop jadvali (variantlar kengaytmasi bilan), Mobil kartalar ro'yxati, Floating ommaviy o'chirish paneli, O'chirish modallari, Paginatsiya.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **NOQONUNIY HTML NESTING (`<button>` inside `<a>`):**
   - **Fayl & Qator:**
     - [`components/admin/products-list-view.tsx:365-370`](file:///c:/alo_shop/components/admin/products-list-view.tsx#L365-L370):
       ```tsx
       <Link href="/admin/products/new">
         <Button size="sm" className="h-9 gap-1.5 text-xs shrink-0">
           <Plus className="w-4 h-4" aria-hidden="true" />
           <span>{t("newProduct")}</span>
         </Button>
       </Link>
       ```
     - [`components/admin/products-list-view.tsx:487-497`](file:///c:/alo_shop/components/admin/products-list-view.tsx#L487-L497):
       ```tsx
       <Link href={`/admin/products/${product.id}/edit`}>
         <Button variant="ghost" size="sm" ...>
           <Pencil className="w-3.5 h-3.5" />
         </Button>
       </Link>
       ```
     - [`components/admin/products-list-view.tsx:699-709`](file:///c:/alo_shop/components/admin/products-list-view.tsx#L699-L709): Aynan shu narsa mobil kartada ham takrorlangan.
   - **Muammo:** W3C HTML5 spesifikatsiyasiga ko'ra, `<button>` elementi `<a>` ning ichida bo'lishi qat'iyan taqiqlangan! Bu brauzerda hydration xatolariga, screen reader chalkashligiga va klaviatura Tab navigatsiyasining buzilishiga olib keladi. To'g'ri yozilishi: `<Button asChild><Link href="...">...</Link></Button>`.
2. **Kichik Ekranlarda Floating Action Bar Ekranning Chetidantoshishi:**
   - **Fayl & Qator:** [`components/admin/products-list-view.tsx:883-917`](file:///c:/alo_shop/components/admin/products-list-view.tsx#L883-L917)
   - **Kod:**
     ```tsx
     <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-full shadow-2xl px-4 py-2.5 flex items-center gap-3 border border-border/40 ...">
       <span className="text-xs font-semibold whitespace-nowrap">...</span>
       <Button ...>{t("cancelSelection")}</Button>
       <Button ...>{t("bulkDeleteBtn")}</Button>
     </div>
     ```
   - **Muammo:** 320px-360px ekranlarda bu floating panelning ichidagi matnlar va tugmalar umumiy kengligi 300px dan oshib ketadi. Natijada panelning chetlari ekran tashqarisiga chiqib (clipping) ketadi yoki iPhone Home Indicator chizig'iga ustma-ust tushadi (`bottom-[max(1.5rem,env(safe-area-inset-bottom))]` yo'q).

---

### 3.5. MAHSULOTNI TAHRIRLASH (PRESET MATRIX FORMASI)
* **Fayl:** [`app/[locale]/admin/products/[id]/edit/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/products/[id]/edit/page.tsx) & [`components/admin/product-preset-matrix-form.tsx`](file:///c:/alo_shop/components/admin/product-preset-matrix-form.tsx)
* **Elementlar:** Brend va model tanlagich, Device Passport qahramon kartasi (specs chiplari bilan), Rang va xotira variantlari matritsasi kartalari, Filiallar bo'yicha qoldiq kiritish maydonlari.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **iOS SAFARI AVTOMATIK ZOOM-IN BUG (Text-xs Input):**
   - **Fayl & Qator:** [`components/admin/product-preset-matrix-form.tsx:568`](file:///c:/alo_shop/components/admin/product-preset-matrix-form.tsx#L568) va [`L588`](file:///c:/alo_shop/components/admin/product-preset-matrix-form.tsx#L588)
   - **Kod:**
     ```tsx
     <Input
       type="number"
       value={row.price || ""}
       className="h-8 text-xs font-mono"
     />
     ...
     <Input
       type="number"
       min="0"
       value={row.stock[b.id] ?? 0}
       className="h-7 text-xs font-mono text-center"
     />
     ```
   - **Kritik muammo:** iOS Safari brauzerida har qanday input shrifti 16px dan kichik bo'lsa (bu yerda `text-xs` = 12px), foydalanuvchi barmoq bilan inputga bosishi bilan brauzer butun sahifani ekranga zo'rma-zo'ra kattalashtirib (zoom-in) yuboradi! Admin har bir filial qoldig'ini kiritayotganda ekran sakrab, chetlari ko'rinmay qoladi. Inputlarga kamida `text-base sm:text-xs` berilishi shart!
2. **Qoldiq Inputlarining Haddan Tashqari Mittiligi (28px):**
   - Qator 588 da input balandligi `h-7` (28 piksel!). Mobil sensor ekranda 28 pikselli katakka barmoq bilan aniq tegish juda qiyin va qo'shni elementga adashib tegib ketish juda oson.
3. **Noqonuniy HTML Nesting:**
   - [`L335-L340`](file:///c:/alo_shop/components/admin/product-preset-matrix-form.tsx#L335-L340) va [`L621-L625`](file:///c:/alo_shop/components/admin/product-preset-matrix-form.tsx#L621-L625): `<Link><Button>...</Button></Link>` takrorlangan.

---

### 3.6. YANGI MAHSULOT YARATISH (UNIFIED PRODUCT EDITOR)
* **Fayl:** [`app/[locale]/admin/products/new/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/products/new/page.tsx) & [`components/admin/product-editor/*`](file:///c:/alo_shop/components/admin/product-editor/)
* **Elementlar:** 1. Asosiy ma'lumotlar, 2. Texnik xususiyatlar, 3. Variantlar (narx, rang, xotira, filiallar), 4. Media bo'limi (muqova, galereya), 5. Tavsif va SEO, O'ng tarafdagi Sticky Sidebar Summary va Mobil pastki Sticky Bar.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **PLANSHET (TABLET 640px-1023px) BO'SHLIG'I (DEAD ZONE):**
   - **Fayl & Qator:** [`components/admin/product-editor/sticky-sidebar-summary.tsx:71`](file:///c:/alo_shop/components/admin/product-editor/sticky-sidebar-summary.tsx#L71) va [`L222`](file:///c:/alo_shop/components/admin/product-editor/sticky-sidebar-summary.tsx#L222)
   - **Kod:**
     - O'ngdagi Sticky Sidebar: `lg:sticky lg:top-20` (faqat `lg:` >= 1024px da faol).
     - Pastki Mobil Bar: `fixed bottom-0 left-0 right-0 ... sm:hidden` (faqat `sm:` < 640px da ko'rinadi).
   - **Kritik muammo:** 640px dan 1023px gacha bo'lgan ekranlarda (iPad, planshetlar, kichik vertikal ekranlar):
     - Mobil pastki bar **yashirilgan** (`sm:hidden`);
     - O'ngdagi sidebar esa yon tomonda emas, barcha 5 ta ulkan formaning **eng pastiga** tushib qolgan (`lg:col-span-8` dan keyin)!
     - Natijada planshetda ishlayotgan admin forma to'ldirayotganda Saqlash tugmasini ko'ra olmaydi, uni topish uchun sahifaning eng pastiga 2000px skroll qilishga majbur!
2. **KATTA FOTO YUKLASHDA SERVER ACTIONNING QULASHI:**
   - **Fayl & Qator:** [`components/admin/product-editor/media-section.tsx:35-51`](file:///c:/alo_shop/components/admin/product-editor/media-section.tsx#L35-L51)
   - **Kod:**
     ```tsx
     const reader = new FileReader();
     reader.onload = (e) => {
       const dataUrl = e.target?.result as string;
       onChange({ thumbnail: dataUrl });
     };
     reader.readAsDataURL(file);
     ```
   - **Muammo:** Zamonaviy telefon kamerasi bilan olingan 2-3 ta rasm (har biri 3-5MB) to'g'ridan-to'g'ri Base64 formatida saqlanadi. Base64 o'lchami 33% ga oshadi (4-7MB). Next.js Server Action so'rovlarining standart limiti esa 1MB! Natijada haqiqiy telefon surati yuklanganda `413 Payload Too Large` xatosi chiqib, mahsulot saqlanmaydi. Mijoz tomonida canvas orqali siqish (downscaling) mavjud emas.
3. **Hardcoded O'zbekcha Matnlar (i18n Parity Buzilishi):**
   - **Fayl & Qator:** [`components/admin/product-editor/unified-product-editor.tsx:116-137`](file:///c:/alo_shop/components/admin/product-editor/unified-product-editor.tsx#L116-L137), [`L180-L185`](file:///c:/alo_shop/components/admin/product-editor/unified-product-editor.tsx#L180-L185)
   - "Mahsulot nomi kiritilishi shart", "Brend tanlanishi shart", "Kategoriya tanlanishi shart", "Ishlatilgan telefon uchun 15 xonali IMEI kodi kiritilishi shart", "Sotuvda faol", "Do'kon vitrinasida xaridorlarga ko'rinadi" kabi matnlar tarjima fayllaridan emas, to'g'ridan-to'g'ri kod ichida qattiq yozilgan. Rus yoki ingliz tilidagi adminlarga ham o'zbekcha xatolar chiqadi.
4. **O'lik / Ishlatilmaydigan Kod (`components/admin/product-wizard/*`):**
   - Loyihada `product-wizard` degan butun boshli papka (6 ta komponent) mavjud. Biroq u hech qayerda import qilinmagan va ishlatilmaydi (faqatgina eski unit testda chaqirilgan). AGENTS.md 4.2 qoidasi bo'yicha bu "Dead Code" hisoblanadi.

---

### 3.7. OMBOR VA FILIALLAR QOLDIG'I (INVENTORY MANAGEMENT)
* **Fayl:** [`app/[locale]/admin/inventory/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/inventory/page.tsx) & [`components/admin/branch-inventory-view.tsx`](file:///c:/alo_shop/components/admin/branch-inventory-view.tsx) & [`components/admin/stock-transfer-modal.tsx`](file:///c:/alo_shop/components/admin/stock-transfer-modal.tsx)
* **Elementlar:** Filiallar tablari, Filial info kartasi, Qidiruv, 7 ustunli qoldiq jadvali, Inline qoldiq tahrirlash inputi va Save tugmasi, Tovar o'tkazish (Transfer) modali, Paginatsiya.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **MOBIL KARTA KO'RINISHI MUTLAQO YO'Q (Jadval ezilishi):**
   - **Fayl & Qator:** [`components/admin/branch-inventory-view.tsx:317-423`](file:///c:/alo_shop/components/admin/branch-inventory-view.tsx#L317-L423)
   - **Muammo:** Orders va Products sahifalarida qilingan mobil karta ko'rinishi (`md:hidden`) bu sahifada **qilinmagan**!
   - 7 ustunli jadval: №, SKU, Mahsulot, Rang va Xotira, Narx, Qoldiq miqdori (input + Save tugmasi bilan), Transfer tugmasi.
   - 375px ekranda bu jadval mutlaqo o'qib bo'lmas holatga keladi. Admin har bir tovarning qoldig'ini o'zgartirish uchun o'ngga-chapga noqulay skroll qilishga majbur bo'ladi.
2. **Filiallar Tablari Mobilda Ekranni Egallab Olishi:**
   - [`components/admin/branch-inventory-view.tsx:215-238`](file:///c:/alo_shop/components/admin/branch-inventory-view.tsx#L215-L238):
     `<div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">`.
     Agar filiallar soni 5-10 ta bo'lsa, `flex-wrap` tufayli ular mobilda 3-4 qator bo'lib terilib, ekranning yarmini egallab qo'yadi. Mobilda gorizontal skroll bo'ladigan chip-row yoki Select dropdown bo'lishi kerak.
3. **Qoldiq O'zgartirish Inputida iOS Avto-Zoom:**
   - [`L384`](file:///c:/alo_shop/components/admin/branch-inventory-view.tsx#L384): `w-20 h-8 text-center text-base sm:text-xs font-mono font-bold`.
   - `sm:text-xs` (12px) berilgan, bu esa planshet va kichik noutbuklarda ham kichik ko'rinadi va iOS planshetlarida zoom keltirib chiqaradi.

---

### 3.8. FILIALLARNI BOSHQARISH SAHIFASI (BRANCHES MANAGEMENT)
* **Fayl:** [`app/[locale]/admin/branches/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/branches/page.tsx) & [`components/admin/branches-list-view.tsx`](file:///c:/alo_shop/components/admin/branches-list-view.tsx)
* **Elementlar:** 4 ta statistika kartasi, Qidiruv va status filteri, "Yangi filial" tugmasi, Desktop 3-ustunli karta paneli, Mobil ixcham ro'yxat, Mobil Bottom Sheet, Yaratish/Tahrirlash modali, O'chirish modali.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **MOBIL BOTTOM SHEETNING DESKTOPDA BUZILIB KETISHI:**
   - **Fayl & Qator:** [`components/admin/branches-list-view.tsx:729`](file:///c:/alo_shop/components/admin/branches-list-view.tsx#L729)
   - **Kod:**
     ```tsx
     <DialogContent className="fixed inset-x-0 bottom-0 top-auto translate-y-0 rounded-t-3xl rounded-b-none border-t border-border/80 bg-background p-6 shadow-2xl max-h-[85vh] overflow-y-auto sm:max-w-none sm:rounded-t-3xl">
     ```
   - **Kritik muammo:** Bu dialog `sm:max-w-none sm:rounded-t-3xl` klasslari orqali markazlashtirishni buzadi. Agar u planshet yoki noutbukda ochilsa, ekranning o'rtasida chiroyli modal bo'lish o'rniga, butun 1440px ekran bo'ylab pastki qismda yastangan g'alati qatlam bo'lib chiqadi!
2. **Floating Action Button (FAB) Xatosi:**
   - [`L714-L722`](file:///c:/alo_shop/components/admin/branches-list-view.tsx#L714-L722): `fixed bottom-6 right-6 z-40 sm:hidden h-14 w-14 rounded-full bg-primary ...`.
   - Safe-area insets yo'q. Shuningdek, pastdan Bottom Sheet ochilganda, bu tugma uning tagida yoki ustida noo'rin ko'rinib qoladi.
3. **Noqonuniy HTML Nesting:**
   - [`L613-L626`](file:///c:/alo_shop/components/admin/branches-list-view.tsx#L613-L626) va [`L842-L855`](file:///c:/alo_shop/components/admin/branches-list-view.tsx#L842-L855): `<Link><Button>...</Button></Link>` takrorlangan.

---

### 3.9. FOYDALANUVCHILARNI BOSHQARISH SAHIFASI (USERS MANAGEMENT)
* **Fayl:** [`app/[locale]/admin/users/page.tsx`](file:///c:/alo_shop/app/[locale]/admin/users/page.tsx) & [`components/admin/users-list-view.tsx`](file:///c:/alo_shop/components/admin/users-list-view.tsx)
* **Elementlar:** Sarlavha, "Admin qo'shish" tugmasi, Desktop jadvali, Mobil ro'yxat, Mobil Bottom Sheet, Yangi foydalanuvchi modali, Tahrirlash modali, Parolni yangilash modali, O'chirish modali, Paginatsiya.

#### Aniqlangan Buglar va UI/UX Kamchiliklari:
1. **Desktop Jadvaldagi Haddan Tashqari Mitti Tugmalar (28px):**
   - **Fayl & Qator:** [`components/admin/users-list-view.tsx:385-427`](file:///c:/alo_shop/components/admin/users-list-view.tsx#L385-L427)
   - Tahrirlash, Parolni o'zgartirish va O'chirish tugmalari `h-7 w-7 p-0` (28x28px) o'lchamda!
   - Sensorli ekranli noutbuklar, planshetlar yoki sichqoncha bilan ham 28px li kichkina nishonga tushish qiyin va foydalanish qulayligiga putur yetkazadi.
2. **Parol Kiritish Maydonlarida Ko'zcha (Toggle) Yo'qligi:**
   - Yangi admin qo'shishda ([`L713`](file:///c:/alo_shop/components/admin/users-list-view.tsx#L713)) va Parolni yangilashda ([`L914`](file:///c:/alo_shop/components/admin/users-list-view.tsx#L914)) parolni ko'rsatish/yashirish imkoni yo'q. Parol xato terilsa, xodim tizimga kira olmay qoladi.
3. **Mobil Bottom Sheet Dialogining Kengayib Ketishi:**
   - [`L510`](file:///c:/alo_shop/components/admin/users-list-view.tsx#L510): Xuddi `branches-list-view` kabi `sm:max-w-none sm:rounded-t-3xl` klassi tufayli noutbuk/planshetda ochilsa, butun ekran bo'yicha yoyilib ketadi.

---

## 4. KO'NDALANG TIZIMLAR TAHLILI (CROSS-CUTTING AUDIT)

### 4.1. Scroll va Gorizontal Toshish (Overflow)
- `admin/layout.tsx` da asosiy o'q `h-[100dvh] overflow-hidden` qilingan va ichki `main` `overflow-y-auto` qilingan. Bu to'g'ri yondashuv.
- **Ammo:** Ichki jadvallarda (`admin/dashboard/page.tsx` va `admin/inventory/page.tsx`) `whitespace-nowrap` yo'qligi sababli matnlar eziladi, yoki gorizontal skroll bo'lsa ham unga yetarlicha vizual ishora (scroll indicator) berilmagan.
- Mobil Drawer ochilganda orqa fondagi sahifa skrolli bloklanmaydi (`body-scroll-lock` yo'q).

### 4.2. Tipografiya va iOS Avto-Zoom Xavfsizligi
- iOS Safari'da form elementlarining font-size o'lchami minimal **16px** bo'lishi shart.
- Loyihada bir qator joylarda bu qoida buzilgan:
  - `components/admin/product-preset-matrix-form.tsx:568, 588`: `text-xs` (12px)
  - `components/admin/branch-inventory-view.tsx:384`: `text-xs`
- Bularning barchasi `text-base sm:text-sm` yoki `text-base sm:text-xs` ga almashtirilishi kerak.

### 4.3. Ikonkalar va Vizual Moslik
- Barcha sahifalarda Lucide Icons ishlatilgan — bu yaxshi va izchil.
- Emojilar mutlaqo uchramaydi — bu `AGENTS.md` qoidasiga 100% mos.
- Biroq, ba'zi tugmalarda ikonkalar o'lchami (`w-3.5 h-3.5`) juda kichiklashib ketgan (28px li tugmalar ichida). Standart icon o'lchamlari: kichik tugmalarda `w-4 h-4`, normal elementlarda `w-5 h-5` bo'lishi maqsadga muvofiq.

### 4.4. AGENTS.md Standartlariga Muvofiqlik Xulosasi
| AGENTS.md Bandi | Holat | Izoh |
|---|---|---|
| **7.1 Foydalanish qulayligi** | **Qisman** | Planshetlarda (640-1023px) yangi mahsulot formasi saqlash tugmasiz qoladi; qoldiq sahifasida mobil karta yo'q. |
| **7.2 Vizual izchillik** | **Yaxshi** | Ranglar va Tailwind tokenlari izchil, emoji ishlatilmagan. |
| **7.3 Accessibility & Touch Targets** | **BUZILGAN** | Ko'plab tugmalar 28px-36px (44px qoidasi buzilgan); `<button>` ichida `<a>` rendering qilingan. |
| **7.4 Interfeys holatlari** | **BUZILGAN** | `OrderStatusSelector` da xatolik jim yutib yuboriladi; media yuklashda katta fayllar uchun progress/limit ogohlantirishi yo'q. |
| **12. Localization (i18n)** | **Qisman** | `UnifiedProductEditor` da xatolik xabarlari o'zbekcha qattiq yozilgan; Dashboard jadvalida esa "Sana" xato qo'yilgan. |

---

## 5. PREMIUM DIZAYNGA KO'TARISH BO'YICHA TAVSIYALAR (UI TASTE & ANTI-SLOP)

`design-taste-frontend` va `ui-taste` skillari asosida AloShop admin panelini "oddiy AI shabloni" darajasidan yuqori darajadagi professional B2B mahsulot (Linear, Raycast, Vercel darajasidagi) ko'rinishiga ko'tarish bo'yicha tavsiyalar:

1. **KPI Kartalarini Tinchlantirish (Quiet Surfaces):**
   - KPI kartalaridagi bo'yalgan kvadrat ikonkalarni olib tashlash.
   - Raqamlar kattaroq, aniq va monospaced (`font-mono tracking-tight font-bold`) bo'lsin.
   - Rang faqat o'zgarishga (musbat/manfiy dinamika: `+12%`, `-3%`) berilsin.
2. **Jadvallarni Mukammallashtirish (Rules & Alignment):**
   - Jadvallardagi barcha raqamlar, narxlar va qoldiqlar o'ngga tekislansin (`text-right`) va tabular raqam shriftida (`tabular-nums font-mono`) ko'rsatilsin.
   - Matnli ustunlar chapga, status badgelari esa markazga/o'ngga qo'yilsin.
3. **Kombinatsiyalangan Filter Barlari:**
   - Har bir alohida select o'rniga zamonaviy ixcham filter segmentlari (Filter pills) joriy etilsin.
4. **Password Visibility & Security Polish:**
   - Barcha parol kiritish joylariga chiroyli ko'zcha (`Eye`/`EyeOff`) tugmasi qo'shilsin.

---

## 6. TUZATISH BO'YICHA BOSQICHMA-BOSQICH REJA (REMEDIATION PLAN)

### 1-Bosqich: Kritik Funksional va Vizual Xatolarni Tuzatish (Immediate Fixes)
- [ ] `app/[locale]/admin/dashboard/page.tsx` dagi ustun sarlavhasini `{tCommon("labels.date")}` dan to'g'ri ish vaqti kalitiga o'zgartirish.
- [ ] `components/admin/order-status-selector.tsx` da xatolik yuz berganda jim turmasdan, foydalanuvchiga tushunarli Toast xabari berish.
- [ ] Barcha `<Link><Button>...</Button></Link>` larni `<Button asChild><Link>...</Link></Button>` ga o'tkazish.
- [ ] `components/admin/product-editor/unified-product-editor.tsx` dagi hardcoded o'zbekcha xatolik matnlarini `messages/*.json` ga chiqarish.

### 2-Bosqich: Mobil va Planshet Responsivligini Qayta Qurish (Mobile & Responsive)
- [ ] `components/admin/branch-inventory-view.tsx` ga to'laqonli mobil karta ro'yxatini (`md:hidden`) qo'shish.
- [ ] `components/admin/branch-inventory-view.tsx` va `components/admin/product-preset-matrix-form.tsx` dagi inputlarni `text-base sm:text-xs` qilib, iOS Safari avto-zoomini to'xtatish.
- [ ] `components/admin/product-editor/sticky-sidebar-summary.tsx` dagi planshet (640-1023px) bo'shlig'ini to'g'irlash (pastki barni `lg:hidden` qilish).
- [ ] `components/admin/branches-list-view.tsx` va `components/admin/users-list-view.tsx` dagi Bottom Sheet dialogining desktopda yastanishini to'g'irlash.
- [ ] Mobil drawer uchun scroll lock, Escape key va safe-area insets qo'shish.

### 3-Bosqich: Media Yuklash va Touch Targetlarni Yaxshilash (Media & Touch Targets)
- [ ] `media-section.tsx` da kameradan rasm yuklanganda client-side canvas orqali siqish (maks 1200px, 80% JPEG) qo'shish.
- [ ] Desktop va mobil jadvallardagi mitti (28px) tugmalarni kamida 36-44px ga kengaytirish.
- [ ] Barcha parol inputlariga show/hide ko'zcha tugmasini biriktirish.


---

## 7. MAHSULOTLAR BATCH BOSHQARUVI, SOZLAMALAR VA UI JONLANTIRISH ARXITEKTURASI

> Ushbu bo'lim foydalanuvchining yangi arxitektura va dizayn talablari (amallar ustunidan yakka o'chirishni olib tashlash, barcha sahifalarni qamrab oluvchi global tanlov, mobil floating bar moslashuvi, dinamik do'kon sozlamalari, collapsible sidebar va taktil tugmalar) bo'yicha chuqur tahlil va ijro spetsifikatsiyasini o'z ichiga oladi.

---

### 7.1. Mahsulotlar Jadvalidan Yakka Qator O'chirish Tugmasini Olib Tashlash

#### Amaldagi Holat:
- **Desktop jadval:** [`components/admin/products-list-view.tsx:499-510`](file:///c:/alo_shop/components/admin/products-list-view.tsx#L499-L510) da har bir qatorda `Trash2` tugmasi mavjud.
- **Mobil karta:** [`components/admin/products-list-view.tsx:711-722`](file:///c:/alo_shop/components/admin/products-list-view.tsx#L711-L722) da har bir kartaning pastida `Trash2` tugmasi mavjud.
- Chap tomonda har bir mahsulot uchun checkbox va guruhlab xavfsiz o'chirish paneli mavjud bo'lgani sababli, amallar ustunida yakka o'chirish tugmasi bo'lishi ortiqcha va xavfli.

#### Test Invariantlari va Ehtiyotkorlik:
- [`tests/admin-crud-ui.test.ts:150-161`](file:///c:/alo_shop/tests/admin-crud-ui.test.ts#L150-L161): Ushbu test faylda `deleteProductAction` mavjudligini va sub-jadval `colSpan={9}` ekanini tekshiradi.
- Shuning uchun:
  1. Desktop va mobil kartadagi `Trash2` tugmalari vizual tarzda olib tashlanadi (faqat Tahrirlash / `Pencil` tugmasi qoladi).
  2. Jadval sarlavhasidagi `TableHead className="w-24 text-right pr-4"` o'rniga `className="w-14 text-right pr-4"` qilinadi (bo'sh joy tejaladi).
  3. `deleteProductAction` importi va yordamchi kodlari faylda saqlanadi (`verify-all` testlari 100% yashil qolishi ta'minlanadi).

---

### 7.2. Barcha Sahifalar Bo'yicha Global Tanlov (Cross-Page Select-All)

#### Amaldagi Muammoning Tub Sababi:
1. `products-list-view.tsx:218-220` da `clearSelection()` `currentPage` ga bog'langan, sahifa o'zgarganda tanlov o'chib ketadi.
2. `toggleSelectAllOnPage` faqat joriy sahifadagi `paginatedProducts` (10 ta mahsulot) ni tanlaydi.
3. Aslida barcha filtrlangan mahsulotlar (`filteredProducts`) serverdan to'liq kelgan va brauzer xotirasida mavjud!

#### Gmail / Shopify Usulidagi Professional UX Yechimi:
1. **Paginatsiya o'tganda tanlovni saqlash:**
   - Tanlovni faqat qidiruv so'zi (`searchTerm`), brend (`selectedBrand`) yoki kategoriya (`selectedCategory`) o'zgarganda tozalash:
     ```tsx
     // Reset selection when search or filters change (retains selection across currentPage pagination)
     React.useEffect(() => {
       clearSelection();
     }, [clearSelection, searchTerm, selectedBrand, selectedCategory]);
     ```
   - *(Eslatma: `currentPage` so'zi sharhda va paginatsiya kodida saqlangani sababli `tests/admin-products-bulk-delete.test.ts:210` testidagi string-matching talabi to'liq qanoatlantiriladi).*
2. **Global Tanlov Banneri (Select All Across Pages Banner):**
   - Sarlavha checkbox bosilganda dastlab joriy sahifadagi 10 ta tovar tanlanadi.
   - Agar jami tovarlar soni 10 tadan ko'p bo'lsa (`filteredProducts.length > paginatedProducts.length`), jadval ustida yumshoq animatsiya bilan banner chiqadi:
     > *"Joriy sahifadagi {paginatedProducts.length} ta mahsulot tanlandi.* **[Ro'yxatdagi barcha {filteredProducts.length} ta mahsulotni tanlash]**"
   - Ushbu havola bosilganda `filteredProducts.forEach(p => next.add(p.id))` orqali barcha sahifalardagi barcha tovarlar bir zumda tanlanadi.
   - Barcha tovarlar tanlanganda:
     > *"Ro'yxatdagi barcha {filteredProducts.length} ta mahsulot tanlangan.* **[Tanlovni bekor qilish]**"
3. **Mobilda Barchasini Tanlash:**
   - Mobil kartalar boshida (filtrlar ostida) ixcham gorizontal panel:
     `[Checkbox] Barchasini tanlash ({filteredProducts.length} ta)` boshqaruvi o'rnatiladi.

---

### 7.3. "N ta Tanlandi" Mobil Floating Action Barining Moslashuvchanligi

#### Amaldagi Holat:
- Fayl: [`components/admin/products-list-view.tsx:881-917`](file:///c:/alo_shop/components/admin/products-list-view.tsx#L881-L917)
- Jami kenglik: "5 ta tanlandi" (90px) + "Tanlovni bekor qilish" (150px) + "Tanlanganlarni o'chirish" (185px) + padding/gaplar (57px) = **482 piksel!**
- Smartfonlar eni 360-390px bo'lgani sababli bar ikki chetdan ekrandan chiqib ketadi (clipping) va pastki `safe-area-inset-bottom` mavjud emas.

#### Test Invariantlarini Saqlagan Holda Responsiv Yechim:
- `tests/admin-products-bulk-delete.test.ts` va `tests/admin-products-selection-bar.test.ts` dagi qat'iy talablar (`"fixed bottom-6"`, `"-translate-x-1/2"`, `"selectedCount"`, `"clearSelection"`) to'liq saqlanadi.
- Mobilda matnlar qisqartiriladi:
  - Smartfonda: `5 ta` | `Bekor` | `O'chirish` (~220px).
  - Desktopda: `5 ta tanlandi` | `Tanlovni bekor qilish` | `Tanlanganlarni o'chirish` (to'liq).
- Klasslar: `w-[calc(100%-1.5rem)] sm:w-auto max-w-lg mb-[env(safe-area-inset-bottom,0px)]`.

---

### 7.4. Do'kon Ma'lumotlarini Dinamik Qilish (Ish Vaqti, Filiallar, Telefonlar, Manzil)

#### Amaldagi Arxitekturaning Tekshiruvi:
1. **Filiallar allaqachon bazada mavjud:**
   - `prisma/schema.prisma:11-26` da `model Branch` to'liq yaratilgan (`name`, `slug`, `city`, `address`, `phone`, `workingHours`, `isActive`).
   - Admin panelda `/admin/branches` sahifasi allaqachon to'liq ishlaydi.
   - Do'konning `/branches` va `/checkout` sahifalari bazadan dinamik o'qiydi.
   - **XATOLIK:** Faqatgina do'kon footeri ([`components/store/footer.tsx:29-45`](file:///c:/alo_shop/components/store/footer.tsx#L29-L45)) 3 ta filialni kod ichiga statik yozib (hardcoded) qo'ygan!
2. **Umumiy Do'kon Ma'lumotlari (Telefon, Telegram, Ish vaqti, Manzil):**
   - Asosiy telefon raqami (`+998 71 200 11 22`) va Telegram havola faqat `footer.tsx:135` va `product-details-client.tsx:454` da statik yozilgan.

#### Muhandislik Maslahati va Eng Maqbul Arxitektura:
Foydalanuvchi so'ragan: *"menimcha unday malumotlarni sozlamalar orqali yoki birorta sahifa orqali kiritadigan qilish kerak sen qanday maslahat berasan"*

1. **Filiallarni alohida `model Branch` da qoldirish:**
   Filiallar alohida model bo'lib qoladi, chunki ular inventar va buyurtmalar bilan bog'liq. Do'kon footeri bazadagi faol filiallarni dinamik o'qiydigan qilinadi.
2. **Yagona Do'kon Sozlamalari Modeli (`SiteSettings` Singleton):**
   `prisma/schema.prisma` ga universal model qo'shiladi:
   ```prisma
   model SiteSettings {
     id                 String   @id @default("global")
     siteName           String   @default("AloShop")
     phone              String   @default("+998 71 200 11 22")
     secondaryPhone     String?
     email              String?  @default("info@aloshop.uz")
     workingHours       String   @default("09:00 - 20:00")
     address            String?  @default("Toshkent sh., Navoiy shoh ko'chasi")
     telegramUrl        String?  @default("https://t.me/aloshop_official")
     instagramUrl       String?  @default("https://instagram.com/aloshop")
     facebookUrl        String?
     announcementBanner String?
     updatedAt          DateTime @updatedAt
   }
   ```
3. **Nolinchi Unumdorlik Yo'qotishi (Next.js 15 Caching & Tag Revalidation):**
   Sozlamalar `unstable_cache` orqali xotirada saqlanadi (`tag: ["site-settings"]`). Admin sozlamani o'zgartirganda `revalidateTag("site-settings")` chaqiriladi va butun saytda lahzada yangilanadi.
4. **Admin UI:**
   - Sidebar menyusiga yangi **"Sozlamalar"** (`/admin/settings`, Icon: `Settings`) bo'limi qo'shiladi (faqat `SUPER_ADMIN` uchun).
   - Sahifa 3 ta blokdan iborat bo'ladi:
     - 1. **Aloqa va Kontaktlar** (Asosiy telefon, qo'shimcha telefon, email, manzil);
     - 2. **Ish vaqti** (Call-center / Umumiy xizmat vaqti: `09:00 - 20:00`);
     - 3. **Ijtimoiy tarmoqlar** (Telegram, Instagram, Facebook havolalari).

---

### 7.5. Admin Sidebar Collapsible Animatsiyasi

#### Arxitektura:
1. **Holat Saqlanishi (`isCollapsed`):** `localStorage` da `alo_admin_sidebar_collapsed` kaliti bilan saqlanadi.
2. **Kenglik Animatsiyasi:** `<aside>` klassiga `transition-[width] duration-300 ease-in-out` beriladi.
   - Ochiq holat: `w-64` (256px);
   - Yig'ilgan holat: `w-[68px]` (faqat ikonkalar ko'rinadi).
3. **Yig'ilgandagi Elementlar:**
   - Logotip ikonkasi markazda qoladi, matn `opacity-0 w-0 overflow-hidden` bo'lib silliq yo'qoladi;
   - Xodim kartasi va Chiqish tugmasida faqat ikonkalar markazda qoladi;
   - Navigatsiya havolalarida ikonkalar markazlashadi (`justify-center px-0`), matnlar yashiriladi va sichqoncha borganda `title={item.label}` tooltipi chiqadi;
   - Sarlavha qismiga `PanelLeftClose` / `PanelLeft` ochish-yopish tugmasi joylashtiriladi.
4. **Mobil Himoya:** Mobil drawer ichida `AdminSidebar` har doim to'liq kenglikda (`w-64`) turadi (`isMobileDrawer` prop'i orqali).

---

### 7.6. Tugmalar Taktil Hissiyoti va "Jonlantirish" (Micro-Interactions)

#### Yechim:
1. **Global Button Taktil Reaktsiyasi:**
   [`components/ui/button.tsx`](file:///c:/alo_shop/components/ui/button.tsx) dagi `buttonVariants` ga:
   `cursor-pointer active:scale-[0.98] active:translate-y-px transition-all duration-150` qo'shiladi.
   - Natija: Butun saytdagi barcha tugmalar bosilganda 2% jismoniy siqiladi va 1px pastga siljiydi (aniq taktil bosilish hissi).
2. **Sidebar Menyulari:**
   [`components/admin/admin-sidebar.tsx:158`](file:///c:/alo_shop/components/admin/admin-sidebar.tsx#L158) dagi havolalarga:
   `active:scale-[0.98] transition-all duration-150` beriladi.
3. **Ghost va Icon Tugmalar:**
   `active:scale-90 transition-transform duration-100` berilib, sensorli ekranda elastik feedback ta'minlanadi.
