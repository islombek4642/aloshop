# AGENTS.md — AloShop Engineering & Architecture Standards

Ushbu qoidalar majmuasi loyihada ishlaydigan barcha AI agentlar va dasturchilar uchun majburiydir. Har qanday yangi xususiyat, komponent yoki tuzatish kiritilishidan oldin ushbu qoidalarga qat'iy rioya qilinishi shart.

---

## 1. Loyiha Haqida Qisqacha (Project Overview)
- **Nomi:** AloShop — ko'p filialli zamonaviy telefon va gadjetlar do'koni.
- **Tizim qismlari:**
  1. **Mijozlar do'koni (Storefront):** Mobil qurilmalarga yo'naltirilgan, yuqori tezlikdagi e-commerce vitrina (`app/[locale]/(store)`).
  2. **Boshqaruv paneli (Admin Dashboard):** Filiallar, mahsulot variantlari, narxlar, qoldiqlar va buyurtmalarni boshqarish (`app/[locale]/admin`).
  3. **Multi-filial hisobi:** Har bir filialda tovarlar qoldig'i mustaqil nazorat qilinadi; kelajakda POS (kassa) tizimini ulashga tayyor arxitektura.

---

## 2. Texnologik Stack (Tech Stack)
- **Framework:** Next.js (App Router, React Server Components)
- **Til:** TypeScript (Strict mode, `any` taqiqlanadi)
- **Stillashtirish & UI:** Tailwind CSS, shadcn/ui komponentlar tizimi, Lucide Icons
- **Baza & ORM:** PostgreSQL + Prisma ORM
- **Lokalizatsiya (i18n):** `next-intl` (O'zbek `uz`, Rus `ru`, Ingliz `en`)
- **Holat boshqaruvi (State Management):** Zustand (mijoz savatchasi va filtrlar uchun), Server Actions / TanStack Query

---

## 3. Asosiy Muhandislik Qoidalari (Core Principles)

### 3.1. DRY (Don't Repeat Yourself)
- Kod va komponentlar takrorlanmasligi shart.
- Umumiy UI elementlari (tugmalar, modallar, kiritish maydonlari, telefon kartalari, narx formatlagichlar) `components/ui/` va `components/shared/` jildlariga umumiy qilib chiqariladi.
- Barcha hisob-kitoblar (chegirma, soliq, filial qoldiqlari, valyuta konvertatsiyasi) umumiy yordamchi funksiyalarda (`lib/utils/`) jamlanadi.

### 3.2. Modular Arxitektura va Separation of Concerns (SoC)
Loyiha qatlamlari bir-biridan aniq ajratilishi shart:
- **Presentation Layer (`components/`):** Faqat UI va foydalanuvchi bilan o'zaro aloqani aks ettiradi. Ichida to'g'ridan-to'g'ri SQL so'rovlar yoki og'ir biznes mantiqi bo'lmaydi.
- **Business Logic Layer (`services/` yoki `actions/`):** Buyurtma yaratish, filial qoldig'ini tekshirish, narxlarni hisoblash logikasi.
- **Data Access Layer (`lib/db/` & `prisma/`):** Ma'lumotlar bazasi bilan xavfsiz va optimallashgan ishlash.
- **Localization Layer (`messages/`):** Har bir til uchun alohida JSON lug'atlar.

### 3.3. Qat'iy Lokalizatsiya (Zero Hardcoding Policy)
- **Hech qanday matn komponentlar ichida qattiq (hardcoded) yozilmaydi!**
- Barcha matnlar, sarlavhalar, xatolik xabarlari, tugma nomlari `messages/uz.json`, `messages/ru.json`, `messages/en.json` fayllaridan olinadi.
- Standart kalitlar (keys) semantik va ierarxik bo'lishi shart (masalan: `products.specs.storage`, `checkout.pickupBranch`).
- Sana va narxlar mahalliy formatda aks ettirilishi shart (`14 500 000 so'm`, `1 200 $`).

### 3.4. Yuqori Didli UI/UX (Anti-UI Slop Standards)
- **Shabloncha (AI-slop) dizayn taqiqlanadi:** Umumiy, jonsiz, ko'k gradyentli shablonlar yaratilmasin.
- **Tayyor komponentlar ustuvorligi (shadcn/ui + Radix UI):** G'ildirakni qayta kashf qilmaslik va qulaylikni (accessibility, mobil touch) ta'minlash uchun atomar komponentlar (Button, Dialog, Select, Dropdown, Drawer, Table, Input) sifatida tayyor va sinovdan o'tgan `shadcn/ui` komponentlaridan foydalaniladi.
- **Faqat Tailwind CSS (Qo'lda alohida CSS yozilmaydi):** Barcha dizayn faqat Tailwind CSS utility-classlari orqali boshqariladi. Bu CSS fayllar shishib ketishini (bloat) oldini oladi va yuklanishni tezlashtiradi.
- **Qat'iy Mikro-kopirayting (No Fluff / Ortiqcha matnlar taqiqlanadi):** AI tomonidan to'qilgan uzun, balandparvoz va bema'no gaplar yozish taqiqlanadi. Faqat qisqa, aniq faktlar beriladi: Model nomi, Xotira, Narx, Kafolat va Filialdagi soni. CTA tugmalari 1-2 so'zdan oshmasligi shart ("Xarid qilish", "Filialdan olib ketish").
- **Emojilar va stikerlar qat'iyan taqiqlanadi (Zero Emojis Policy):** Interfeysda (tugmalar, menyu, sarlavhalar, badge va bildirishnomalarda) havaskorona Unicode emojilardan (masalan: 📱, 🛒, 🔥, ⚡, 📦 va h.k.) foydalanish MUTLAQO TAQIQLANADI!
- **Faqat professional vektor ikonlar (Lucide Icons, Iconify):** Barcha vizual belgilar faqat professional vektor kutubxonalari (`lucide-react`, `@iconify/react`) orqali bir xil chiziq qalinligi (stroke-width), toza nisbatlar va premium ko'rinishda ishlatiladi.
- **Telefon do'koni o'ziga xosligi:**
  - Mobil versiya ustuvor (Mobile-First): O'zbekistonda 85%+ xaridlar telefondan amalga oshiriladi.
  - Mahsulot sahifasida aniq variantlar selektori: Rang doiralari (Color swatches), Xotira tugmalari (128GB, 256GB), Holati (Yangi / B/U).
  - Filial mavjudligi indikatori: *"Malika filialida bor (3 dona)", "Chilonzorda mavjud emas"*.
  - Tezkor buyurtma (1-click checkout) va Telegram/telefon orqali bog'lanish tugmalari.

### 3.5. Ma'lumotlar Bazasi va Filial Boshqaruvi
- Har bir mahsulotning umumiy tavsifi (`Product`) va uning aniq konfiguratsiyalari (`ProductVariant`: rang, xotira, narx) bo'ladi.
- Qoldiqlar har doim `BranchInventory` orqali filial kesimida saqlanadi.
- Kelajakda POS (kassa) qo'shilganda har bir tovar donasi `IMEIRecord` orqali aniq kuzatilishi uchun jadval strukturasida zamin yaratiladi.

---

## 4. Kodlash Standartlari va TypeScript
- `any` turidan foydalanish taqiqlanadi.
- Barcha API va Server Action kiritishlari Zod orqali validatsiya qilinadi.
- Fayl va jild nomlari: `kebab-case` (masalan: `product-card.tsx`, `use-cart.ts`).
- Komponent nomlari: `PascalCase` (masalan: `ProductCard`, `BranchSelector`).

---

## 5. Qat'iy Xavfsizlik Qoidalari (Strict Security Standards)

### 5.1. Maxfiy Ma'lumotlar va Kalitlar (.env & Secrets Management)
- Hech qachon `.env`, API kalitlar, baza parollari (`DATABASE_URL`, `DIRECT_URL`, `SUPER_ADMIN_PASSWORD`, JWT secrets) git repozitoriyga commit qilinmaydi.
- Server sirlari hech qachon brauzerga (Client Componentlarga) chiqib ketmasligi shart. Brauzerga faqat `NEXT_PUBLIC_` prefiksi bilan ruxsat etilgan ochiq parametrlar beriladi.

### 5.2. Kiritish Ma'lumotlarini Validatsiya Qilish (Input Validation & Sanitization)
- Barcha Server Action va API kiritmalari Zod sxemalari orqali tekshirilishi shart.
- XSS va SQL Injection himoyasi: Prisma parametrlangan so'rovlari ishlatiladi; `dangerouslySetInnerHTML` ishlatish qat'iyan man etiladi.
- Telefon raqamlari O'zbekiston formati bo'yicha (+998...) qat'iy tekshiriladi va tozalanadi.

### 5.3. Admin Avtorizatsiya va Rollar Xavfsizligi (Auth & RBAC Protection)
- Parollar hech qachon ochiq saqlanmaydi — faqat xavfsiz hash (bcrypt/argon2).
- Sessiyalar: `httpOnly`, `secure`, `sameSite: 'lax'` bo'lgan shifrlangan cookie orqali boshqariladi.
- `/admin/*` marshrutlari Next.js Middleware orqali himoyalanadi; ruxsat etilmagan foydalanuvchi darhol login sahifasiga yo'naltiriladi.
- Filial adminlari faqat o'z filialining qoldiqlari va buyurtmalarini ko'rishi/tahrirlashi har bir server so'rovida qat'iy tekshiriladi (IDOR — Insecure Direct Object References himoyasi).

### 5.4. Spam va Soxta Buyurtmalardan Himoya (Rate Limiting & Anti-Spam)
- Checkout (buyurtma berish) va login urinishlariga cheklov (Rate limiting) qo'yiladi (1 daqiqada 5 martadan ko'p urinish taqiqlanadi).
- Botlar tomonidan soxta buyurtmalar yuborilishini oldini olish uchun yashirin "Honeypot" maydoni qo'llaniladi.

### 5.5. Xavfsiz HTTP Sarlavhalari (Security Headers)
- Next.js sozlamalarida `X-Frame-Options: DENY` (Clickjacking himoyasi), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` majburiy qilib o'rnatiladi.

---

## 6. Inson-Markazli Dizayn va Foydalanish Qulayligi Standartlari (Human-Centered UI/UX)

AloShop oddiy xaridorlar (shu jumladan texnologiyani chuqur tushunmaydigan katta yoshdagi fuqarolar) uchun yaratilmoqda. AI agentlar har qanday interfeysni loyihalashda quyidagi qonuniyatlarga so'zsiz rioya qilishi shart:

### 6.1. Jakob Qonuni va O'rnatilgan Mental Modellar (Zero Weird Layouts)
- Foydalanuvchilar o'rgangan umumiy internet standartlaridan chetga chiqilmaydi.
- Savatcha har doim o'ng yuqori burchakda yoki mobil pastki menyuda bo'ladi.
- Qidiruv paneli ko'zga darhol tashlanadigan markaziy yoki yuqori o'rinda joylashadi.
- Kutilmagan va g'alati navigatsiya mantiqlarini to'qib chiqarish qat'iyan taqiqlanadi.

### 6.2. Mobil Bosh Barmoq Zonasi (Fitts's Law & Thumb Zone)
- Asosiy harakat tugmalari (CTA: "Xarid qilish", "Filialdan olish", "Buyurtmani tasdiqlash") mobil ekranning pastki qismida, bir qo'l bilan bosh barmoq orqali qulay bosiladigan maydonda joylashadi.
- Barcha bosiladigan elementlarning sensor maydoni (touch target) kamida 44x44px o'lchamda bo'lishi shart.
- Mayda, bir-biriga yopishib ketgan va xato bosilish ehtimoli yuqori bo'lgan tugmalar taqiqlanadi.

### 6.3. Hik Qonuni va Kognitiv Soddalik (Don't Make Me Think)
- Foydalanuvchiga bir ekranda ortiqcha tanlov va ma'lumotlar uyumi berilmaydi.
- Mahsulot kartasida faqat 4 ta asosiy narsa birinchi o'rinda turadi: Tovar surati, Aniq to'liq nomi, Narxi va Bosh harakat tugmasi.
- Murakkab texnik parametrlar (Display PPI, Bluetooth versiyasi va h.k.) dastlab yashiriladi va "Barcha xususiyatlar" orqali bosqichma-bosqich ochiladi (Progressive Disclosure).

### 6.4. Qat'iy Holat Aloqasi (Instant Visual Feedback & Zero Blind Clicks)
- Har qanday bosish, so'rov yuborish yoki holat o'zgarishi foydalanuvchiga 100ms ichida vizual sezilishi shart:
  - Tugma bosilganda yuklanish animatsiyasi (Loading state) va tugma qayta bosilmasligi uchun bloklanishi (`disabled`).
  - Ma'lumot yuklanayotganda bo'sh oq sahifa emas, skeleton (xira kontur) ko'rsatilishi.
  - Savatchaga mahsulot qo'shilganda darhol bildirishnoma (Toast / Badge soni oshishi).

### 6.5. O'zbekiston Bozoriga Xos Mahalliy Foydalanish Odatlari
- **Minimal ro'yxatdan o'tish to'sig'i:** Murakkab email, parol yoki 10 ta maydondan iborat ro'yxatdan o'tish formasi taqiqlanadi. Buyurtma berish uchun faqat Ism va Telefon raqami (`+998...`) kifoya qilishi kerak (1-bosqichli tezkor xarid).
- **Filial mavjudligining ochiqligi:** Xaridor telefon qaysi do'konda borligini sahifadan chiqmasdan ko'rishi shart (masalan: "Malika filialida 2 dona bor").
- **Tushunarli xalqona til:** Quruq texnik yoki dasturchi jargonlari ishlatilmaydi ("Xatolik 404", "Fetch failed" o'rniga "Kechirasiz, mahsulot topilmadi" yoki "Internet aloqasini tekshiring").

### 6.6. Bo'sh Holatlar va Xatoliklar (Empty States & Recovery)
- Hech bir sahifa "shunchaki bo'sh" ko'rinishda qolmasligi shart (masalan: Savatcha bo'sh bo'lsa, faqat "Bo'sh" demasdan, xaridorni katalogga qaytaruvchi "Mahsulotlarni ko'rish" tugmasi beriladi).
- Formada xato kiritilganda butun sahifa tozalanmaydi, aynan qaysi maydonda qanday xato borligi qizil matn bilan aniq ko'rsatiladi.


