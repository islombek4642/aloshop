# AloShop Loyihasining To'liq Texnik Auditi va Mustaqil Ekspertiza Xulosasi

> **Sana:** 2026-yil 4-noyabr  
> **Loyiha nomi:** AloShop (Smartfonlar savdosi va multi-filial ombor boshqaruvi platformasi)  
> **Texnologik stek:** Next.js 15 (App Router), React 19, TypeScript (Strict), Tailwind CSS, Prisma ORM, PostgreSQL, next-intl.  
> **Auditor:** Mustaqil Tizim Muhandisi, Kiberxavfsizlik va Sifat Boshqaruvi Eksperti (Antigravity Boost / Teamwork Engine)

---

## 1. ASOSIY SAVOLGA QAT'IY XULOSA: MIJOZGA TOPSHIRISHGA ARZIYDIMI?

### VERDIKT: **MUTLAQO TOPSHIRISH MUMKIN EMAS (STRICTLY NOT PRODUCTION-READY)**

Ushbu platformada UI/UX dizayn, mobil moslashuvchanlik, 3 tildagi lokalizatsiya (UZ, RU, EN) va katalog vitrinasi tashqi ko'rinishdan chiroyli va qulay ishlangan bo'lsa-da, **real tijoriy loyiha (e-commerce)** sifatida mijozga topshirishga **mutlaqo loyiq emas**.

Agar loyiha joriy holatida buyurtmachiga topshirilsa yoki jonli efirga (production) chiqarilsa, quyidagi muqarrar halokatlar yuz beradi:
1. **Har bir yangi deployda mijozlarning barcha buyurtmalari avtomatik o'chib ketishi:** `package.json` dagi build buyrug'i `seed.ts` ni chaqiradi. [`prisma/seed.ts:141-146`](file:///d:/aloshop/prisma/seed.ts#L141-L146) har safar ishga tushganda `prisma.order.deleteMany({})` va `prisma.orderItem.deleteMany({})` buyruqlarini bajarib, **barcha real xaridorlar va buyurtmalar tarixini 100% tozalab yuboradi!**
2. **Kompaniya darajasidagi moliyaviy va tovar o'g'irlanishi / yo'qotilishi:** 
   - Bekor qilingan buyurtmalarda ombordagi tovar qaytarilmaydi (`increment` qilinmaydi);
   - Poyga holati (race condition) sabab tovarlar manfiy qoldiqqa (`quantity = -1`) tushib, do'konda yo'q tovarlar sotilib ketadi;
   - Filial xodimi (`BRANCH_ADMIN`) butun tizim bo'yicha mahsulot narxlarini ruxsatsiz o'zgartirishi mumkin;
   - Mahsulot o'chirilganda o'tmishdagi barcha buxgalteriya yozuvlari va buyurtma tarkiblari (`orderItem`) bazadan jismonan o'chib ketadi.
3. **Kiberxavfsizlik va ruxsatsiz to'liq kirish:** Standart SuperAdmin paroli ochiq kodda yozilgan (`superadmin_secret_password_change_me`), xeshlanmasdan plaintext taqqoslanadi; JWT tokenlari uchun ochiq dev-secret ishlatilgan.
4. **Davlat qonunlari va UzIMEI buzilishi:** O'zbekiston Respublikasi Vazirlar Mahkamasining 778-sonli Qaroriga ko'ra, UzIMEI ro'yxatidan o'tmagan telefonlarni sotish noqonuniy bo'lib, xaridorlarning telefonlari 30 kunda bloklanadi. Tizimda UzIMEI hisobi va mijozga IMEI biriktirish mutlaqo ishlamaydi.

---

## 2. KRITIK XAVFSIZLIK VA AVTORIZATSIYA (RBAC) ZAIFLIKLARI

### 2.1. Ochiq Kodda Hardcoded SuperAdmin Paroli va Plaintext Solishtirish
* **Fayl:** [`lib/auth/admin.ts`](file:///d:/aloshop/lib/auth/admin.ts#L95-L113)
* **Kod:**
```typescript
const envSuperUsername = process.env.SUPER_ADMIN_USERNAME || "admin";
const envSuperPassword =
  process.env.SUPER_ADMIN_PASSWORD || "superadmin_secret_password_change_me";

if (trimmedUsername === envSuperUsername && password === envSuperPassword) {
  return {
    userId: "superadmin-root",
    username: envSuperUsername,
    fullName: "Super Administrator",
    role: "SUPER_ADMIN",
    branchId: null,
    branchName: null,
  };
}
```
* **Xavf darajasi:** **CRITICAL**. Agar `.env` faylida parol ko'rsatilmasa, istalgan shaxs `admin` va `superadmin_secret_password_change_me` orqali butun tizimni to'liq nazoratiga oladi. Shuningdek, `tests/admin-auth.test.ts:121-134` testi aynan shu hardcoded paroldan foydalanadi, natijada virtual admin va DB admin o'rtasida ziddiyat bor.
* **Tuzatish:** SuperAdmin foydalanuvchisi faqat ma'lumotlar bazasida `bcrypt` orqali xeshlangan holda saqlanishi kerak; `.env` orqali plaintext kirish butunlay olib tashlanishi shart.

### 2.2. Zaif JWT Maxfiy Kaliti (Dev Secret Fallback)
* **Fayl:** [`lib/auth/session.ts`](file:///d:/aloshop/lib/auth/session.ts#L17-L21)
* **Kod:**
```typescript
export function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET || "dev-secret-key-32-chars-long-for-aloshop";
  return new TextEncoder().encode(secret);
}
```
* **Xavf darajasi:** **HIGH**. Production muhitida `AUTH_SECRET` kiritilmasa, har qanday hujumchi ushbu ochiq kalit yordamida soxta admin JWT tokenlarini yaratib, tizimga ruxsatsiz kira oladi.
* **Tuzatish:** Agar `process.env.AUTH_SECRET` mavjud bo'lmasa yoki 32 belgidan kam bo'lsa, server ishga tushmasdan xato berishi (`throw new Error`) shart.

### 2.3. Filial Adminining Butun Do'kon Bo'yicha Narxlarni O'zgartira Olishi (RBAC Privilegiya Buzilishi)
* **Fayl:** [`app/actions/admin-products.ts`](file:///d:/aloshop/app/actions/admin-products.ts#L436-L451)
* **Muammo:** Filial admini (`BRANCH_ADMIN`) o'z filialidagi tovar miqdorini tahrirlash huquqiga ega bo'lishi kerak. Ammo preset matritsasini tahrirlaganda, `tx.productVariant.update` orqali butun tizim uchun umumiy bo'lgan `price` va `oldPrice` qiymatlarini ham yangilaydi. Natijada oddiy filial xodimi butun respublika bo'yicha barcha do'konlardagi iPhone'lar narxini o'zboshimchalik bilan o'zgartirib yuborishi mumkin!
* **Tuzatish:** Narxni faqat `SUPER_ADMIN` o'zgartirishi kerak, `BRANCH_ADMIN` faqat o'z filialining `BranchInventory.quantity` qiymatini o'zgartirish bilan cheklanishi shart.

### 2.4. Admin Foydalanuvchilarini Boshqarishda CRUD Kamchiligi
* **Fayl:** [`app/actions/admin-users.ts`](file:///d:/aloshop/app/actions/admin-users.ts#L29-L85)
* **Komponent:** [`components/admin/users-list-view.tsx`](file:///d:/aloshop/components/admin/users-list-view.tsx)
* **Muammo:** Tizimda faqat yangi admin yaratish (`createBranchAdminAction`) mavjud. Admin parolini o'zgartirish, ma'lumotlarini tahrirlash yoki uni o'chirish/bloklash imkoni yo'q. Jadvalda faqat 4 ta ustun bor, "Amallar" (Actions) ustuni umuman yo'q. Filial xodimi bo'shatilsa, uning loginini o'chirishning iloji yo'q.

---

## 3. BIZNES MANTIQI VA MA'LUMOTLAR BAZASI HALOKATLARI

### 3.1. Build Skriptidagi Baza Qirg'ini (Production Data Wiping)
* **Fayl:** [`package.json`](file:///d:/aloshop/package.json#L7) va [`prisma/seed.ts`](file:///d:/aloshop/prisma/seed.ts#L141-L146)
* **Kod:**
```json
"build": "prisma generate && prisma db push --accept-data-loss && npx tsx prisma/seed.ts && next build"
```
```typescript
// prisma/seed.ts:141-146
await prisma.orderItem.deleteMany({});
await prisma.order.deleteMany({});
await prisma.iMEIRecord.deleteMany({});
await prisma.branchInventory.deleteMany({});
```
* **Halokat:** Har safar Vercel, Railway yoki VPS serverida yangi versiya build qilinganda, `seed.ts` chaqiriladi va u mijozlarning barcha real buyurtmalarini, tovar qoldiqlarini va IMEI hisoblarini o'chirib, test ma'lumotlari bilan almashtiradi!

### 3.2. "iPhone 15 Pro" dagi Ochko'z Prefiks (Greedy Prefix Substring) Algoritmik Xatosi
* **Fayl:** [`lib/utils/specs.ts`](file:///d:/aloshop/lib/utils/specs.ts#L237-L246)
* **Kod:**
```typescript
const presetMatch = CATALOG_PRESETS.find(
  (p) =>
    p.brand.toLowerCase() === cleanBrand &&
    (p.modelName.toLowerCase() === cleanModel ||
     cleanModel.includes(p.modelName.toLowerCase()) ||
     p.modelName.toLowerCase().includes(cleanModel))
);
```
* **Muammo:** `CATALOG_PRESETS` da `apple-iphone-15` modeli `apple-iphone-15-pro` dan oldin keladi. Qidiruvda `"iphone 15 pro".includes("iphone 15")` birinchi bo'lib mos keladi. Natijada do'kondagi eng asosiy **iPhone 15 Pro va Pro Max modellari uchun RAM hajmi 8GB emas, 6GB deb ko'rsatiladi!** Ushbu bug sababli test suitlari ham qulamoqda.

### 3.3. Buyurtma Bekor Qilinganda Ombordagi Tovar Qaytarilmaydi (Stock Leakage)
* **Fayl:** [`app/actions/admin-orders.ts`](file:///d:/aloshop/app/actions/admin-orders.ts#L54-L57)
* **Muammo:** Buyurtma berilganda tovar `decrement` qilinadi. Ammo admin buyurtma statusini `CANCELLED` ga o'tkazganda omborga hech qanday tovar qaytarilmaydi (`increment` qilinmaydi). Natijada tovarlar sun'iy ravishda "tugagan" bo'lib qoladi. Shuningdek, Chekli Avtomat (State Machine) yo'qligi sabab bekor qilingan buyurtmani to'g'ridan-to'g'ri `DELIVERED` ga o'tkazish mumkin.

### 3.4. Mahsulot O'chirilganda Buxgalteriya va Buyurtmalar Tarixi O'chishi
* **Fayl:** [`app/actions/admin-products.ts`](file:///d:/aloshop/app/actions/admin-products.ts#L648-L652)
* **Muammo:** `deleteProductAction` funksiyasida `onDelete: Restrict` cheklovini aylanib o'tish uchun o'tmishda yetkazib berilgan (`DELIVERED`) buyurtmalarning tarkibiy qismlari (`tx.orderItem.deleteMany`) bazadan jismonan o'chirib yuboriladi. Natijada buyurtma ichida nima sotilgani yo'qoladi, buxgalteriya hisoboti buziladi. Soft Delete (`isArchived: true`) qo'llanilishi shart.

### 3.5. Buyurtma Raqamlari To'qnashuvi (Unique Constraint Crash)
* **Fayl:** [`app/actions/checkout.ts`](file:///d:/aloshop/app/actions/checkout.ts#L118-L120)
* **Kod:** `const orderNumber = "ALO-" + Math.floor(100000 + Math.random() * 900000);`
* **Muammo:** Faqat 6 xonali tasodifiy son. "Tug'ilgan kun paradoksi"ga ko'ra, 1000 ta buyurtmadan so'ng to'qnashuv ehtimoli ~43% ga, 2000 ta buyurtmada ~89% ga yetadi. Retry sikli yo'qligi sababli xaridorga "Failed to place order" xatosi chiqib, xarid to'xtaydi.

### 3.6. Poyga Holati (Race Condition) va Manfiy Qoldiqqa Tushish
* **Fayl:** [`app/actions/checkout.ts`](file:///d:/aloshop/app/actions/checkout.ts#L147-L152)
* **Muammo:** Ikki xaridor bir vaqtda oxirgi tovarni sotib olsa, ikkalasi ham tekshiruvdan o'tadi va qoldiq `-1` ga tushadi. Bazada `CHECK (quantity >= 0)` cheklovi yo'q va tranzaksiyada Row-level lock (`SELECT ... FOR UPDATE`) ishlatilmagan.

### 3.7. Filialni O'chirishda Ombordagi Tovar Zaxirasi Tekshirilmasligi
* **Fayl:** [`app/actions/admin-branches.ts`](file:///d:/aloshop/app/actions/admin-branches.ts#L285-L305)
* **Muammo:** `deleteBranchAction` filialda faol buyurtmalar borligini tekshiradi, ammo **omborda tovar qoldig'i (stock) bor-yo'qligini tekshirmaydi**! Filialda 100 ta qimmatbaho iPhone tursa ham, filial o'chirilsa, barcha zaxiralar (`tx.branchInventory.deleteMany`) bazadan jismonan o'chib ketadi.

### 3.8. Checkout Sahifasidagi "Tuzoq" Filiallar (Failing Fallback Branches)
* **Fayl:** [`app/[locale]/(store)/checkout/page.tsx`](file:///d:/aloshop/app/%5Blocale%5D/%28store%29/checkout/page.tsx#L24-L49)
* **Fayl:** [`app/actions/checkout.ts`](file:///d:/aloshop/app/actions/checkout.ts#L133-L144)
* **Muammo:** Baza bilan vaqtinchalik uzilish bo'lsa, `getCheckoutBranches` statik fallback filiallarni (`id: "b1", "b2", "b3"`) qaytaradi. Foydalanuvchi ulardan birini tanlasa, serverdagi `checkout.ts` bazadan `b1` ni topa olmay, buyurtmani butunlay rad etadi.

### 3.9. 1-Click Buy da Toshkent Manzili Majburlanishi
* **Fayl:** [`components/store/product-details-client.tsx`](file:///d:/aloshop/components/store/product-details-client.tsx#L236-L251)
* **Muammo:** "1 Bosishda Xarid" qilinganda, manzil maydoniga majburan `deliveryAddress: "Toshkent (1-Click)"` yoziladi. Mijoz viloyatda bo'lsa ham manzil kiritish imkoni berilmaydi va buyurtma bazadagi birinchi filialga yuklanadi.

### 3.10. Dashboardda Umumiy Tushumning Soxta Hisoblanishi
* **Fayl:** [`app/[locale]/admin/dashboard/page.tsx`](file:///d:/aloshop/app/%5Blocale%5D/admin/dashboard/page.tsx#L83-L86)
* **Muammo:** `orderWhere` buyurtma statusini filtrlamaydi. Bekor qilingan (`CANCELLED`) milliardlab so'mlik buyurtmalar ham to'liq "Tushum" deb qo'shib hisoblanadi.

---

## 4. TESTLAR VA SIFAT HOLATI: QULAYOTGAN 7 TA TEST SUITI

Loyihada 31 ta test fayli mavjud. Barcha testlar mustaqil ishga tushirilganda **7 ta test suiti FAIL berayotgani** aniqlandi:

| # | Test Fayli | Holati | Aniq Sababi / Qulash Nuqtasi |
| :- | :--- | :--- | :--- |
| 1 | `challenger-m1-empirical.test.ts` | **FAIL** | Seed bazasida iPhone 15 Pro mavjudligi sababli assertion xatosi |
| 2 | `challenger-m2-1-empirical.test.ts` | **FAIL** | Bo'sh variantli kartada RAM ni (8GB) model nomidan noto'g'ri chiqarish |
| 3 | `challenger-m3-adversarial.test.ts` | **FAIL** | Tile 6 da omborda bor indikatori (pulsing green dot) chiqmasligi |
| 4 | `challenger-m3-empirical.test.ts` | **FAIL** | SnapshotSpecsView jonli yashil nuqtani render qilmasligi |
| 5 | `challenger-m3-viewport-edgecases.test.ts` | **FAIL** | ProductDetailsClient pastki sticky bar uchun to'qnashuv paddingi (`pb-28`) yetishmasligi |
| 6 | `specs-stress.test.ts` | **FAIL** | 11 ta tekshiruv quladi (RAM inferencing, Case sensitivity, Fuzzing) |
| 7 | `vitrina-m2.test.ts` | **FAIL** | iPhone 15 Pro uchun RAM xatosi (`'6GB' !== '8GB'`) |

*Shuningdek, `package.json` da `"lint": "next lint"` yozilgan, ammo loyihada na `.eslintrc.json` va na `eslint.config.mjs` mavjud.*

---

## 5. FOYDALANUVCHI (STOREFRONT) VA ADMIN SAHIFALARINING TO'LIQ SOLISHTIRUVI

| Modul / Sahifa | Foydalanuvchi Vitrinasi (Storefront) | Admin Boshqaruv Paneli | Tafovut va Salbiy Oqibat |
| :--- | :--- | :--- | :--- |
| **Filiallar (Branches)** | `page.tsx:123` va `footer.tsx:29` da qattiq yozilgan (hardcoded) statik manzillar. | `admin/branches` da dinamik yaratish, tahrirlash va statusni o'zgartirish. | **Uzilish:** Admin filial telefonini yoki manzilini o'zgartirsa ham, xaridor bosh sahifa va footerda eski xato ma'lumotni ko'raveradi. |
| **Ishlatilgan (USED) Telefonlar** | Mahsulot kartasida faqat "B/U" nishoni bor, texnik ko'rsatkichlar ko'rinmaydi. | `admin/products/new` da batareya %, nuqsonlar, IMEI, kosmetik holat kiritiladi. | **Ma'lumot Yo'qolishi:** Admin kiritgan `specs` JSON ma'lumotlari storefront sahifasiga o'tkazilmaydi (`specs` dropped). Xaridor batareya holatini bilolmaydi. |
| **Buyurtma Tafsilotlari** | Xaridor 1-Click Buy yoki Checkoutda izoh (`notes`) va to'lov turini tanlaydi. | `components/admin/orders-list-view.tsx` dagi buyurtmalar jadvali. | **Ko'rinmaslik:** Admin buyurtmalar jadvalida xaridorning izohi (`notes`) va to'lov turi (`paymentType`) mutlaqo ko'rsatilmaydi! Domofon kodi yoki model nomi adminga bormaydi. |
| **Mahsulotni Tahrirlash** | Narx, rang va xotira kombinatsiyalarini ko'radi. | `admin/products/[id]/edit` faqat standart presetlar matritsasiga ulangan. | **Buzilish:** Agar admin o'zi qo'lda kiritgan nostandart yoki ishlatilgan telefonni tahrirlasa, u preset modelga mos kelmay, ma'lumotlari standart Apple modeliga aylanib ketadi. |
| **Buyurtma Holatini Kuzatish** | Buyurtma berilgach, modal yopilsa, xaridorni qayta ko'rish imkoni yo'q. | Admin buyurtma holatini PENDING dan DELIVERED gacha o'zgartiradi. | **Bog'liqlik yo'q:** Xaridorga SMS bormaydi, havola berilmaydi, saytda `/track/[orderNumber]` sahifasi mavjud emas. |
| **Foydalanuvchi Kabineti** | Shaxsiy kabinet, avtorizatsiya va buyurtmalar tarixi yo'q. | Faqat tizim administratorlari ro'yxati mavjud. | Xaridor har xaridda ma'lumotlarini noldan kiritishga majbur. |
| **IMEI Boshqaruvi** | Xaridor chekida yoki SMSida IMEI raqami ko'rsatilmaydi. | Wizardda faqat 1 ta IMEI kiritish mumkin, ommaviy kiritib bo'lmaydi. | Sotilgan tovar bilan IMEI o'rtasida aloqa bog'lanmaydi. Kafolat tekshiruvi imkonsiz. |

---

## 6. ARXITEKTURA VA UNUMDORLIK (PERFORMANCE) MUAMMOLARI

### 6.1. Rasmlarni PostgreSQL da Base64 Ko'rinishida Saqlash
* **Fayl:** [`components/admin/product-wizard/image-uploader.tsx`](file:///d:/aloshop/components/admin/product-wizard/image-uploader.tsx#L26-L79)
* **Fayl:** [`next.config.ts`](file:///d:/aloshop/next.config.ts#L8-L10)
* **Muammo:** Rasm yuklanganda Canvas orqali Base64 qilinadi (`data:image/jpeg;base64,...`) va to'g'ridan-to'g'ri PostgreSQL dagi `ProductVariant.images: String[]` massivida saqlanadi. Bitta rasm 500KB - 2MB bo'lsa, 100 ta mahsulot bazani yuzlab megabaytga shishiradi. `next.config.ts` da Server Actions hajmi majburan `10mb` qilib ochib qo'yilgan. Vitrina ochilganda foydalanuvchiga megabaytlab base64 oqib keladi.
* **Tuzatish:** Cloudflare R2 yoki AWS S3 kabi obyekt omboriga yuklab, bazada faqat CDN havolasini saqlash kerak.

### 6.2. Next.js Image Tashqi Domenlar Cheklovi
* **Fayl:** [`next.config.ts`](file:///d:/aloshop/next.config.ts#L12-L27)
* **Muammo:** `images.remotePatterns` da faqat Unsplash, Apple va Samsung domenlari ko'rsatilgan. Admin boshqa manbadan rasm URL kiritsa, `next/image` xatolik berib butun sahifani qulatadi.

---

## 7. QONUNCHILIK VA ELEKTRON TIJORAT TALABLARI AUDITI

O'zbekiston Respublikasining amaldagi qonunchilik me'yorlari bo'yicha tahlil:

1. **Vazirlar Mahkamasining 2019-yil 17-sentabrdagi 778-son Qarori (UzIMEI Tizimi):**
   - **Qonun talabi:** O'zbekiston hududida sotiladigan barcha mobil qurilmalar UzIMEI tizimidan ro'yxatdan o'tgan bo'lishi shart. Aks holda qurilma 30 kunda barcha aloqa operatorlari tomonidan bloklanadi.
   - **AloShop holati:** Tizimda UzIMEI holatini tekshirish (`isUzImeiRegistered`), bojxona deklaratsiyasi yoki ro'yxat holati maydoni mavjud emas. Xaridorga IMEI biriktirilmaydi. **(QONUNGA TO'LIQ ZID)**
2. **"Elektron tijorat to'g'risida"gi Qonun (15–18-moddalar):**
   - **Qonun talabi:** Sotuvchi o'zining to'liq yuridik nomi (MCHJ/YaTT), STIR (INN), yuridik manzili va rekvizitlarini ochiq ko'rsatishi shart.
   - **AloShop holati:** Saytda hech qanday yuridik ma'lumot, STIR yoki rasmiy kompaniya nomi ko'rsatilmagan. **(MOS EMAS)**
3. **Ommaviy Oferta (Fuqarolik Kodeksi 369-modda):**
   - **Qonun talabi:** Internet orqali oldi-sotdi shartnomasi tuzish uchun Ommaviy Oferta matni joylashtirilishi shart.
   - **AloShop holati:** Oferta sahifasi mavjud emas. **(MOS EMAS)**
4. **"Iste'molchilarning huquqlarini himoya qilish to'g'risida"gi Qonun (18-modda):**
   - **Qonun talabi:** Nuqsonsiz tovarlarni 10 kun ichida qaytarish yoki almashtirish shartlari ochiq ko'rsatilishi lozim.
   - **AloShop holati:** Qaytarish va almashtirish siyosati (Refund & Return Policy) sahifasi yo'q. **(MOS EMAS)**
5. **"Shaxsga doir ma'lumotlar to'g'risida"gi Qonun:**
   - **Qonun talabi:** Mijoz ma'lumotlarini yig'ishda "Maxfiylik siyosati" (Privacy Policy) va rozilik chekboksi talab qilinadi.
   - **AloShop holati:** Maxfiylik siyosati ham, checkout shaklida rozilik belgisi ham yo'q. **(MOS EMAS)**
6. **Soliq Kodeksi va Fiskalizatsiya:**
   - **Qonun talabi:** Elektron to'lov yoki yetkazib berishda Soliq qo'mitasi talablariga mos elektron chek (QR-kodli fiskal chek) shakllantirilishi kerak.
   - **AloShop holati:** OFD / Fiskal integratsiya mavjud emas. **(MOS EMAS)**

---

## 8. AGENTS.MD UNIVERSAL STANDARTLARI TALABLARIGA MUVOFIQLIK

`AGENTS.md` qo'llanmasi bo'yicha baholash:
- **Correctness First:** **Qoniqarsiz.** Ombor qoldig'i, tovar hisobi va buxgalteriya yozuvlarida buzilishlar mavjud.
- **Security by Design:** **Qoniqarsiz.** Plaintext parol solishtirish, hardcoded sirlar va cheklanmagan Base64 saqlash mavjud.
- **Clean Code & Consistency:** **Yaxshi.** TypeScript turlaridan to'g'ri foydalanilgan, emoji ishlatilmagan, Lucide ikonkalari izchil.
- **Localization:** **A'lo.** 3 ta tilda (uz, ru, en) 751 tadan kalit 100% paritetga ega.
- **UI/UX & Mobile:** **Juda yaxshi.** 2 ustunli mobil vitrina, snapshot specs, va mobil sticky bar qulay ishlangan.

---

## 9. MIJOZGA TOPSHIRISH UCHUN BOSQICHMA-BOSQICH YO'L XARITASI (ACTION PLAN)

### 1-Bosqich: Kritik Halokatli Xatolarni Tuzatish (Showstoppers - 1-2 kun)
1. [`package.json`](file:///d:/aloshop/package.json#L7) dagi `build` skriptidan `prisma db push --accept-data-loss` va `seed.ts` ni butunlay chiqarib tashlash (`prisma generate && next build`).
2. [`lib/auth/admin.ts`](file:///d:/aloshop/lib/auth/admin.ts) va [`lib/auth/session.ts`](file:///d:/aloshop/lib/auth/session.ts) dagi hardcoded parollar va fallback sirlarni yo'qotish, `.env` yo'q bo'lsa serverni xato bilan to'xtatish.
3. [`app/actions/admin-orders.ts`](file:///d:/aloshop/app/actions/admin-orders.ts) da `status === "CANCELLED"` bo'lganda tovar qoldig'ini tegishli filialga qaytaruvchi (`increment`) mantiqni kiritish.
4. [`app/actions/admin-products.ts`](file:///d:/aloshop/app/actions/admin-products.ts#L649) dagi `tx.orderItem.deleteMany` mantiqini yo'q qilish, o'rniga mahsulotlar uchun arxivlash (`isArchived: true`) Soft Delete tizimini joriy etish.
5. [`lib/utils/specs.ts`](file:///d:/aloshop/lib/utils/specs.ts#L237) dagi substring moslik xatosini to'g'irlash (avval to'liq moslik, so'ng so'z chegarasi `\b` bo'yicha).
6. Qulayotgan 7 ta test suitini to'liq yashil holatga keltirish.

### 2-Bosqich: Xavfsizlik, Concurrency va Saqlash Arxitekturasi (2-3 kun)
1. `checkout.ts` dagi tasodifiy buyurtma raqamini xavfsiz sekvensiyaga aylantirish (`ALO-YYYYMMDD-XXXX`) va PostgreSQL da `BranchInventory.quantity >= 0` check constraintini qo'shish.
2. Rasmlarni Base64 ko'rinishida PostgreSQL ga saqlashni to'xtatish. Cloudflare R2 / AWS S3 obyekt omborini ulash.
3. Foydalanuvchilarni boshqarish (`admin-users.ts`) uchun Update, Delete va Parolni o'zgartirish funksiyalarini kiritish.
4. `deleteBranchAction` da filialda tovar zaxirasi borligini tekshirish to'sig'ini qo'yish.

### 3-Bosqich: Vitrina va Admin Sinxronizatsiyasi hamda Aloqa (2-3 kun)
1. Bosh sahifa va Footer'dagi filiallar va telefonlarni ma'lumotlar bazasi bilan ulash.
2. Ishlatilgan (USED) telefonlar uchun admin kiritgan `specs` (batareya salomatligi %, holati, IMEI) ma'lumotlarini vitrinada to'liq ko'rsatish.
3. Adminning `orders-list-view.tsx` jadvaliga mijoz izohi (`notes`) va to'lov turini (`paymentType`) chiqarish.
4. Yangi buyurtma tushganda do'kon ma'muriyatiga Telegram Bot orqali bildirishnoma yuborish mexanizmini ulash.
5. Xaridor uchun buyurtma holatini kuzatish sahifasini (`/track/[orderNumber]`) yaratish.

### 4-Bosqich: Yuridik Sahifalar va To'lovlar (2 kun)
1. Saytga 4 ta yuridik sahifani qo'shish: `/oferta`, `/privacy`, `/returns`, `/delivery`.
2. Checkout shakliga "Ommaviy oferta va Maxfiylik siyosatiga roziman" majburiy chekboksini joylashtirish.
3. Footer qismiga kompaniya rekvizitlarini (Yuridik nomi, STIR/INN, manzil) yozish.
4. Eng kamida Payme yoki Click orqali onlayn to'lov qabul qilish shlyuzini ulash.

---

## 10. QOLGAN OCHIQ SAVOLLAR VA BO'SHLIQLAR (REMAINING QUESTIONS & GAPS)

1. **Yuridik va Soliq Rekvizitlari:** Do'kon rasman MCHJ yoki YaTT sifatida ro'yxatdan o'tganmi? Uning STIR (INN), yuridik manzili va bank hisob raqami qanday?
2. **UzIMEI Ro'yxatdan O'tkazish Holati:** Sotilayotgan telefonlarning IMEI raqamlari qaysi bosqichda va kim tomonidan ro'yxatdan o'tkaziladi? AloShop platformasi UzIMEI ommaviy APIsi bilan integratsiya qilinadimi yoki admin qo'lda belgilaydimi?
3. **To'lov Provayderlari:** Buyurtmachida Click Merchant yoki Payme Business hisob raqamlari ochilganmi? Test API kalitlari bormi?
4. **SMS va Telegram Xizmatlari:** Bildirishnomalar uchun qaysi SMS shlyuz (Eskiz.uz yoki PlayMobile) tanlanadi va ma'murlar guruhi uchun Telegram Bot tokeni bormi?
5. **Bulutli Rasm Saqlash (Storage):** Base64 muammosini hal qilish uchun qaysi S3-mos bulutli xizmat (Cloudflare R2, AWS S3 yoki Selectel) tanlanadi?
