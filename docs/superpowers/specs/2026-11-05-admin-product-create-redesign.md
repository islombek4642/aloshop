# AloShop Admin: Mahsulot Yaratish (Product Create) Sahifasi Texnik Dizayni

- **Sana:** 2026-11-05
- **Muallif:** Google DeepMind / Antigravity Pair Programming
- **Holat:** Draft (Ko'rib chiqilmoqda)
- **Hujjat yo'li:** `docs/superpowers/specs/2026-11-05-admin-product-create-redesign.md`

---

## 1. Intent & Why (Maqsad va Zarurat)

### 1.1. Muammo
Hozirgi AloShop admin panelida yangi mahsulot qo'shish jarayoni 6 bosqichli qadam-baqadam wizard orqali amalga oshiriladi va yangi hamda ishlatilgan (B/U) telefonlar uchun ikki xil alohida oqimga bo'lingan. Bu kompyuterda ishlaydigan operatorlar uchun sekin, mahsulotning barcha parametrlarini bir vaqtning o'zida to'liq ko'rish imkonini bermaydi va narx yoki rasmni tekshirish uchun bosqichlar orasida oldinga-orqaga sakrashga majbur qiladi. Shuningdek, do'kon hisob-kitobida foydani hisoblash uchun zarur bo'lgan "Tannarx" (`costPrice`) va to'liq kiritilmagan tovarlarni saqlab turuvchi "Qoralama" (`isDraft`) imkoniyati mavjud emas.

### 1.2. Maqsad
Telefon do'koni administratorlari va operatorlari yangi tovarlarni (ham yangi, ham ishlatilgan) tizimga tez, xatosiz va qulay kiritishi uchun zamonaviy elektron tijorat standartlariga mos yagona, 2 ustunli (Desktop: 70% tana + 30% sticky panel; Mobil: akkordeon/qadamli oqim) va 6 ta mantiqiy blokdan iborat boshqaruv hubini yaratish.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1. Goals (Maqsadlar)
1. **Yagona Universal Forma:** Yangi va ishlatilgan (B/U) telefonlar uchun bitta sahifa; holat dropdown orqali tanlanadi va ishlatilgan telefon uchun xos maydonlar (IMEI, batareya salomatligi %, tashqi holat) shartli ravishda dinamik ochiladi.
2. **6 ta Mantiqiy Blok:**
   - 1. Asosiy ma'lumotlar (Nomi, Brend, Kategoriya, SKU/Artikul, Holati).
   - 2. Narx va ombor (Sotuv narxi, Tannarx, Chegirma, AloShop filiallari bo'yicha qoldiq, Status).
   - 3. Variantlar va xususiyatlar (Rang, Hex, Rang rasmi, RAM, Xotira, narxlar, tezkor "Nusxalash" imkoniyati).
   - 4. Texnik parametrlar (Protsessor, Ekran, Kamera, Batareya, SIM; agar Ishlatilgan bo'lsa IMEI + Batareya salomatligi).
   - 5. Media galereya (Asosiy rasm Thumbnail drag-and-drop, qo'shimcha galereya, mobil kamera integratsiyasi).
   - 6. Tavsif va SEO (Qisqacha tavsif, to'liq tavsif, Slug/URL, Meta sarlavha va tavsif).
3. **Desktop 70/30 Ikki Ustunli Dizayn:** Chap tomonda (70%) asosiy ma'lumotlar, variantlar va parametrlar; o'ng tomonda (30% Sticky) narx xulosasi, filiallar ombori, asosiy rasm, status va Saqlash / Qoralama tugmalari.
4. **Mobil Moslashuvchanlik:** Mobil ekranlarda qulay vertikal akkordeon/bosqichlar, pastki sticky footer va barmoq bilan bosishga qulay ($\ge 44\text{px}$) touch targetlar.
5. **Bazada Qoralama (Draft) Saqlash:** Ma'lumotlar yo'qolmasligi uchun formani to'liq to'ldirmasdan ham "Qoralama sifatida saqlash" (`isDraft: true`) imkoniyati.
6. **Tannarx (`costPrice`) Hisobi:** Do'kon foydasini tahlil qilish uchun kelish narxini xavfsiz saqlash (mijozlarga ko'rsatilmaydi).
7. **100% i18n Parity & Zero Emojis:** O'zbekcha (`uz`), Ruscha (`ru`), Inglizcha (`en`) tillarida to'liq moslik va nol emoji.

### 2.2. Non-Goals (Qilinmaydigan ishlar)
- Excel/CSV orqali ommaviy (bulk) tovar yuklash (bu alohida vazifa).
- 1C yoki Moysklad tashqi ombor tizimlari bilan to'g'ridan-to'g'ri API sinxronizatsiyasi (keyingi bosqichlarda).
- AI orqali avtomatik tavsif generatsiyasi (bu bosqichda kiritilmaydi).

### 2.3. Anti-Goals (Tizimga zarar yetkazuvchi holatlardan qochish)
- Operatorni qat'iy cheklangan shablonlarga majburlash (operator barcha variantlarni noldan erkin kirita olishi shart).
- Mijoz storefront vitrinasida "Qoralama" (`isDraft: true`) holatidagi yoki tannarx (`costPrice`) qiymatlarini oshkor qilish.
- Filial omborlarini bitta umumiy songa aylantirib, AloShop ko'p filialli tizimini buzish.

---

## 3. Constraints & Architectural Alignment

1. **Ko'p Filialli Ombor Tizimi:** AloShop Toshkent (Chilonzor), Toshkent (Samarqand darvoza) va b. faol filiallariga ega. Har bir variant bo'yicha qoldiq `BranchInventory` modeli orqali har bir filial uchun alohida kiritiladi.
2. **Prisma Ma'lumotlar Bazasi Mosligi:**
   - `Product` modeliga `costPrice Decimal?` va `isDraft Boolean @default(false)` qo'shiladi.
   - `ProductVariant` modeliga ham har bir variant kesimida `costPrice Decimal?` qo'shiladi.
3. **Mavjud Tizim bilan Orqaga Moslik (Backward Compatibility):**
   - Mavjud barcha mahsulotlar `isDraft: false` deb hisoblanadi.
   - Storefront vitrinasi faqat `isDraft: false` va `isArchived: false` mahsulotlarni ko'rsatadi.
4. **Zero Emojis Standarti:** `AGENTS.md` qoidasiga ko'ra barcha interfeys matnlarida, xatolik xabarlarida va bildirishnomalarda emojilar taqiqlanadi (0 ta emoji). Lucide ikonkalari ishlatiladi.
5. **Touch Target Standarti:** Mobil interfeysda barcha tugmalar va interaktiv maydonlar $\ge 44\text{px}$ (`h-11` yoki `min-h-[44px]`).

---

## 4. Approaches & Decision (Ko'rib Chiqilgan Yondashuvlar)

### 4.1. 1-yondashuv: Yagona Dinamik 70/30 Forma Engine (Tanlandi)
- **Tavsif:** Barcha 6 blok bitta uzluksiz sahifada joylashadi. Desktopda 70% tana va 30% sticky yon panel. Mobil qurilmada esa collapsible akkordeon bloklar. "Holati" tanlanganda IMEI va batareya foizi dinamik ochiladi.
- **Tahlil:** Operator butun tovar tuzilishini bir qarashda ko'rib turadi. Variantlarni tezkor nusxalash, har bir filial bo'yicha qoldiq kiritish va bazada qoralama saqlash to'liq ta'minlanadi.
- **Nega tanlandi:** Foydalanuvchi tomonidan ma'qullandi va e-tijoratning eng ilg'or tajribasiga (Shopify/Stripe) to'liq mos keladi.

### 4.2. 2-yondashuv: Tablarga Ajratilgan Qadamli Forma (Rad etildi)
- **Tavsif:** Forma 5 ta alohida tabga bo'linib, har bir tab alohida ochiladi.
- **Nega rad etildi:** Operator narx, variant va rasmlarni bir vaqtning o'zida ko'ra olmaydi; tablar o'rtasida ortiqcha o'tishlar talab qilinadi.

---

## 5. Detailed Component & Data Architecture (Batafsil Arxitektura)

### 5.1. Ma'lumotlar Modeli O'zgarishlari (`prisma/schema.prisma`)
```prisma
model Product {
  // ... mavjud maydonlar ...
  costPrice      Decimal?      @db.Decimal(12, 2)
  isDraft        Boolean       @default(false)
  shortDescUz    String?
  shortDescRu    String?
  shortDescEn    String?
  // ...
}

model ProductVariant {
  // ... mavjud maydonlar ...
  costPrice      Decimal?      @db.Decimal(12, 2)
  // ...
}
```

### 5.2. Arxitekturaviy Qarorlar va Chegara Qoidalari (Reviewer Audit Clarifications)
1. **Ishlatilgan (USED) telefonlar qoidasi:**
   - Har bir ishlatilgan telefon o'zining unikal IMEI raqami va batareya holatiga ega bo'lgan 1 dona jismoniy qurilma hisoblanadi. Shuning uchun "Ishlatilgan" holati tanlanganda variantlar soni qat'iy 1 dona bilan chegaralanadi, ombor qoldig'i 1 ga tenglanadi va kiritilgan IMEI `IMEIRecord` modeliga saqlanadi.
2. **Qoralama (isDraft: true) xavfsizligi:**
   - Bazadagi mavjud `NOT NULL` ustunlarni buzmaslik va storefrontda xatolik chiqmasligi uchun qoralama saqlashda minimal talab — Mahsulot nomi va Brend. Qolgan to'ldirilmagan maydonlar serverda xavfsiz bo'sh qiymatlar bilan to'ldirilib, `isDraft: true` belgilanadi. Storefront vitrinasi barcha so'rovlarda `where: { isDraft: false, isArchived: false }` filtrini qo'llaydi.
3. **Media va Rasmlar taqsimoti:**
   - Yon paneldagi asosiy rasm (Thumbnail) asosiy variantning 1-rasmi bo'lib xizmat qiladi va vitrina kartochkasi qopqog'i (cover) bo'ladi. Ranglar bo'yicha yuklangan rasmlar esa aynan shu rang variantining `images` massiviga biriktiriladi.
4. **Yon panel (Sticky Sidebar) va Variantlar bog'liqligi:**
   - Variantlarga ega mahsulotlarda alohida narxlar va har bir filial bo'yicha qoldiqlar aynan variantlar jadvalida kiritiladi.
   - O'ng tarafdagi 30% sticky yon panel esa jonli hisob-kitob (Live Computed Summary) vazifasini bajaradi: eng arzon variant narxini ("... so'mdan"), barcha filiallar bo'yicha jami qoldiqni hamda variantlar sonini dinamik ko'rsatib turadi. Agar mahsulotda faqat 1 ta variant bo'lsa (yoki Ishlatilgan telefon bo'lsa), yon panel to'g'ridan-to'g'ri tahrirlanadigan rejimda ishlaydi. Bu operatorni tasodifiy ma'lumotlarni o'chirib yuborishdan asraydi.

### 5.2. Bloklar Tuzilishi va Maydonlari

#### Blok 1: Asosiy ma'lumotlar (Basic Information)
- **Mahsulot nomi (Title):** Majburiy matn (masalan, *Apple iPhone 15 Pro Max*).
- **Brend (Brand):** Select ro'yxat (*Apple, Samsung, Xiaomi, Honor, Google Pixel, OnePlus* va yangi brend yozish imkoni).
- **Kategoriya (Category):** AloShop mavjud kategoriyalari (*Smartfonlar, Tugmali telefonlar, Aksessuarlar*).
- **Holati (Condition):** Dropdown: `Yangi (NEW)` yoki `Ishlatilgan (USED / B/U)`.
- **Artikul / Model kodi (SKU Prefix):** Asosiy unikal kod.

#### Blok 2: Narx va Ombor (Pricing & Branch Inventory)
- **Sotuv narxi (Selling Price):** Asosiy sotuv narxi (so'm).
- **Asl narxi / Tannarxi (Cost Price):** Do'kon kelish narxi (foyda hisobi uchun, storefrontda yashirin).
- **Chegirma / Eski narx (Discount / Old Price):** Ixtiyoriy, agar chegirma bo'lsa chizilgan narx.
- **Filiallar bo'yicha qoldiqlar:** Har bir faol filial uchun kiritish maydoni (Chilonzor: [X], Samarqand darvoza: [Y] dona).
- **Status:** `Faol (Sotuvda)` / `Nofaol (Mavjud emas)` / `Qoralama (Draft)`.

#### Blok 3: Variantlar va Xususiyatlar (Variations & Attributes)
- Operator barcha variantlarni noldan erkin kiritadi.
- Har bir variant uchun:
  - **Rang:** Nomi (O'zbek, Rus, Ingliz), Rang palitrasi (Hex rang kodi tanlash) va shu rang uchun alohida rasm yuklash.
  - **Xotira va RAM:** Masalan, `RAM: 8GB`, `Storage: 256GB`.
  - **Narx:** Variantga xos sotuv narxi va tannarxi (agar variantlar narxi turlicha bo'lsa).
  - **Filiallar qoldig'i:** Shu variant bo'yicha har bir filialdagi dona soni.
  - **Nusxalash tugmasi (Duplicate):** Bir bosish bilan mavjud variant nusxasini yaratish (faqat rang yoki xotirani o'zgartirish uchun).

#### Blok 4: Texnik Xususiyatlar (Specifications)
- **Protsessor (Chipset):** Masalan, *Apple A17 Pro*, *Snapdragon 8 Gen 3*.
- **Ekran (Display):** Diagonal (*6.7"*), turi (*Super Retina XDR OLED*), chastotasi (*120Hz ProMotion*).
- **Kamera (Camera):** Asosiy kamera (*48MP + 12MP + 12MP*), old kamera (*12MP TrueDepth*).
- **Batareya (Battery):** Sig'imi (*4422 mAh*), quvvatlash tezligi (*27W simli, 15W MagSafe*).
- **SIM-karta:** *Dual SIM (nano-SIM va eSIM)* yoki *eSIM only*.
- **Shartli maydonlar (Faqat "Ishlatilgan / B/U" tanlanganda ochiladi):**
  - **IMEI kodi:** 15 xonali noyob identifikator.
  - **Batareya salomatligi (%):** 80% - 100% oralig'ida yoki "Noma'lum".
  - **Tashqi holati (Grading):** A+ (Ideal/Yangi kabi), A (Yaxshi), B (Yengil qirilgan).

#### Blok 5: Media va Vizual Qism (Media Gallery)
- **Asosiy rasm (Thumbnail):** Drag-and-drop bilan asosiy vitrina rasmini yuklash.
- **Galereya rasmlari:** 5-10 tagacha qo'shimcha burchak rasmlari.
- **Mobil kamera integratsiyasi:** Mobil brauzerda `capture="environment"` orqali bevosita telefon kamerasidan suratga olib joylash.

#### Blok 6: Tavsif va SEO (Description & SEO)
- **Qisqacha tavsif (Short Description):** Vitrinada kartochka ostida ko'rinadigan asosiy afzalliklar.
- **To'liq tavsif (Full Description):** Telefon haqida batafsil ma'lumot va komplektatsiya.
- **SEO sozlamalari:** URL Slug (avtomatik nomdan generatsiya qilinadi yoki qo'lda tahrirlanadi), Meta Title, Meta Description.

---

### 5.3. Interfeys Layout Dizayni

```
+-----------------------------------------------------------------------------------+
| AloShop Admin - Yangi Mahsulot Qo'shish                                           |
+-----------------------------------------------------------------------------------+
| [<- Mahsulotlarga qaytish]   Yangi Mahsulot Yaratish       [Qoralama]  [Saqlash] |
+-------------------------------------------------------------+---------------------+
| CHAP TOMON (70% KENGROQ TANA)                               | O'NG TOMON (30%)    |
|                                                             | (STICKY PANEL)      |
| 1. Asosiy Ma'lumotlar                                       | +-----------------+ |
|    - Mahsulot nomi *                                        | | Asosiy Rasm     | |
|    - Brend * | Kategoriya * | Holati: [Yangi v]             | | [Drag & Drop]   | |
|    - Artikul / SKU                                          | +-----------------+ |
|                                                             | | Narx & Ombor    | |
| 2. Texnik Parametrlar (Chipset, Ekran, Kamera, Batareya...) | | Sotuv: [ ... ]  | |
|    (Agar "Ishlatilgan" bo'lsa: IMEI va Batareya % ochiladi) | | Tannarx:[ ... ] | |
|                                                             | | Chegirma:[ ... ]| |
| 3. Variantlar & Ranglar (Dinamik jadval / kartalar)         | |                 | |
|    - Rang tanlash (Hex) | RAM | Xotira | Filial qoldiqlari  | | Filial Ombori:  | |
|    - [+ Yangi variant qo'shish]  [Nusxalash]                | | Toshkent: [ 5 ] | |
|                                                             | | Samarqand:[ 3 ] | |
| 4. Media Galereya (Qo'shimcha rasmlar)                      | |                 | |
|                                                             | | Status:         | |
| 5. Tavsif & SEO (Qisqacha, To'liq, Slug, Meta sozlamalar)   | | [x] Faol sotuvda| |
|                                                             | |                 | |
|                                                             | | [Saqlash]       | |
|                                                             | | [Qoralama]      | |
|                                                             | +-----------------+ |
+-------------------------------------------------------------+---------------------+
| Mobil ko'rinish: Akkordeon qismlar + pastda qotib turuvchi Sticky Action Bar      |
+-----------------------------------------------------------------------------------+
```

---

## 6. Server Actions & API Kontrakti (`app/actions/admin-products.ts`)

```typescript
export interface CreateProductInput {
  title: string;
  brand: string;
  categoryId: string;
  condition: "NEW" | "USED";
  skuPrefix?: string;
  warrantyMonths: number;
  
  // Specifications
  processor?: string;
  screenSize?: string;
  battery?: string;
  camera?: string;
  charging?: string;
  os?: string;
  
  // Used specific (if condition === 'USED')
  imei?: string;
  batteryHealth?: number | null;
  usedConditionGrade?: string;
  
  // Pricing & Status
  basePrice: number;
  costPrice?: number;
  oldPrice?: number;
  isDraft: boolean;
  isActive: boolean;
  
  // Descriptions & SEO
  shortDescriptionUz?: string;
  shortDescriptionRu?: string;
  shortDescriptionEn?: string;
  descriptionUz?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  slug?: string;
  
  // Media
  thumbnail?: string;
  galleryImages: string[];
  
  // Variants with branch inventory
  variants: Array<{
    colorNameUz: string;
    colorNameRu: string;
    colorNameEn: string;
    colorHex: string;
    ram: string;
    storage: string;
    price: number;
    costPrice?: number;
    oldPrice?: number;
    sku: string;
    images: string[];
    initialStock: Record<string, number>; // branchId -> quantity
  }>;
}
```

---

## 7. What's Left to the Builder (Dasturchi Ixtiyoridagi Tafsilotlar)

1. **Komponentlar Arxitekturasi:** Forma logikasini ixcham saqlash uchun alohida kichik komponentlarga bo'lish (`ProductBasicInfoSection`, `ProductVariantsSection`, `ProductSpecsSection`, `ProductMediaSection`, `ProductSidebarSticky`).
2. **Form State Boshqaruvi:** React Hook Form yoki `useReducer`/`useState` bilan birgalikda Zod client-side validatsiyasi.
3. **Klonlash (Duplicate) Logikasi:** Mavjud variant nusxalanganda unga unikal ID berish va avtomatik yangilangan SKU prefiksini shakllantirish.
4. **i18n Kalitlari:** Yangi barcha yorliqlar (`costPrice`, `shortDesc`, `saveDraft`, `duplicateVariant`, `batteryHealth` va h.k.) `messages/uz.json`, `ru.json` va `en.json` fayllariga 1:1 qo'shilishi.

---

## 8. Verification & Sifat Nazorati Rejasi

1. **Prisma TypeCheck:** `npx prisma validate && npm run check-types` (`tsc --noEmit`) - 0 xatolik.
2. **Unit Testlar:**
   - Yangi va ishlatilgan shartli validatsiya testlari.
   - Tannarx (`costPrice`) va qoralama (`isDraft`) saqlanishi.
   - Ko'p filialli qoldiqlar (`BranchInventory`) to'g'ri taqsimlanishi.
3. **i18n Parity Audit:** `npx tsx scripts/test-i18n.ts` - 3 ta tilda 100% kalitlar mosligi va 0 ta emoji.
4. **Build Safety Audit:** `npx tsx tests/build-safety.test.ts` - ishlab chiqarish muhiti xavfsizligi.

