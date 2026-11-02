# AloShop: Smartfonlar Katalogi Ma'lumotlari, Admin Paneli va Storefront Solishtirma Tahlili (Audit Hisoboti)

Hujjat sanasi: 2026-11-02  
Tadqiqotchi: AloShop Arxitektura va Sifat Nazorati Guruhi  
Standart: AGENTS.md (Qat'iy Zero Emojis Siyosati, Strict TypeScript, Separation of Concerns)  
Hujjat joylashuvi: `docs/audits/2026-11-02-catalog-data-gap-analysis.md`

---

## 1. Kirish va Tadqiqot Maqsadi

Ushbu tahlil `data/` papkasida yig'ilgan rasmiy smartfonlar katalogi (Apple va Samsung) bilan saytning hozirgi ma'lumotlar bazasi (`prisma/schema.prisma`), admin paneli (`app/[locale]/admin/products/` va `components/admin/product-create-form.tsx`) hamda storefront vitrinasi (`app/[locale]/(store)/product/[slug]/page.tsx` va `components/store/`) o'rtasidagi nomutanosibliklar, kamchiliklar va imkoniyatlarni har tomonlama chuqur tekshirishga bag'ishlangan.

Tadqiqot quyidagi to'rtta asosiy savol atrofida olib borildi:
1. `data/` papkasidagi smartfon ma'lumotlari bilan sayt bazasi va admin shakli o'rtasida qanday kamchiliklar va strukturaviy to'siqlar mavjud?
2. `data/` papkasidagi rasmlarni saytda to'g'ridan-to'g'ri aks ettirish mumkinmi yoki rasm joylash tizimida texnik cheklovlar bormi?
3. Admin panelda yangi mahsulot qo'shayotganda barcha parametrlarni noldan qo'lda yozmasdan, tayyor shablonlar, ranglar palitrasi va xotira variantlarini tanlaydigan, zarurat bo'lganda qo'lda kiritish (custom fallback) imkoniyatini yaratish mumkinmi?
4. Rasmlar uchun yangi slayd-shou (slider/carousel) qilish kerakmi yoki mavjud komponent yetarlimi?

---

## 2. Oldingi Tadqiqot Xatolari va To'g'rilangan Faktik Dalillar (Gap & Error Corrections)

Dastlabki yuzaki tadqiqot hisoboti sinchkovlik bilan tekshirilganda bir nechta jiddiy xatolar, noaniqliklar va e'tibordan chetda qolgan tizimli to'siqlar aniqlandi:

### 2.1. 1-Xato: Samsung Rasmlari Bo'yicha Noto'g'ri Da'vo
- **Oldingi hisobot da'vosi:** "data/samsung katalogida har bir rang uchun 6 tagacha turli burchakdagi fotosuratlar mavjud (thumb + 5 ta galereya rasmi). Shuning uchun Samsung variantlari tanlanganda mavjud slayder hech qanday o'zgarishsiz darhol to'liq ishga tushadi."
- **Koddagi faktik holat:** `scripts/download-samsung.ts` faylining 150-qatorida `maxImagesPerModel: 6` qattiq cheklovi o'rnatilgan. Natijada `scripts/lib/samsung-storage.ts` fayli (186-196 qatorlar) birinchi variantning 6 ta rasmini (1 ta thumb + 5 ta galereya) yuklab olgach, siklni to'xtatgan.
- **Haqiqiy holat:** Har bir Samsung modelida 2 tadan 4 tagacha unikal ranglar mavjud bo'lsa-da, `data/samsung/<series>/<model>/images/` jildida **FAQAT BIRINCHI RANG** uchun 6 ta PNG fayli yuklangan (19 ta model x 6 = 114 ta rasm). Qolgan barcha rang variantlari uchun mahalliy diskda bitta ham rasm yuklanmagan! Agar import skripti barcha variantlarga mahalliy rasm yo'llarini bersa, ikkinchi va uchinchi ranglar vitrinada rasmsiz (404 xatolik) qoladi.
- **Yechim:** Qolgan ranglarning rasmlarini ham mahalliy yuklab olish yoki ularga Samsung rasmiy CDN manzillarini (`images.samsung.com`) biriktirish.

### 2.2. 2-Xato: Samsung Variantlarida Xotira (Storage) Maydoni Yo'qligi
- **Oldingi hisobot kamchiligi:** Oldingi hisobot Samsung ma'lumotlarini Prisma `ProductVariant` ga to'g'ridan-to'g'ri yuklash mumkin deb xulosa qilgan, faqat narx va qoldiqlar kiritilishi kerakligini aytgan.
- **Koddagi faktik holat:** `data/samsung/.../specs.json` faylida `variants` massivi ichidagi har bir obyekt faqat `{ modelCode, displayName, colorName, colorCode, thumbUrl, galleryImages }` dan iborat. Unda na `storage` va na `ram` maydoni mavjud! Xotira faqat umumiy `specs.storage: "512"` shaklida yuqori darajada ko'rsatilgan.
- **Haqiqiy holat:** Prisma sxemasidagi `ProductVariant` modelida `storage String` ustuni majburiy (`NOT NULL`). Samsung modelida bir nechta xotira konfiguratsiyalari (masalan, `SM-S938BAKBSOZ` 256GB va `SM-S938BAKCSOZ` 512GB) model kodi harflari ichiga shifrlangan bo'lib, ochiq `storage` qiymatiga ega emas. Shuning uchun to'g'ridan-to'g'ri import Prisma validatsiyasidan o'tmaydi.
- **Yechim:** Import vaqtida Samsung model kodidan xotira hajmini aniqlovchi xarita (mapping parser) ishlab chiqilishi shart.

### 2.3. 3-Xato: Admin Shakli va Harakatlarida RAM Maydoni Mutlaqo Unutilgani
- **Oldingi hisobot kamchiligi:** Oldingi tahlilda faqat `screenSize`, `processor` va `battery` formadan tushib qolgani aytilgan.
- **Koddagi faktik holat:** `prisma/schema.prisma` da `ram String?` ustuni `ProductVariant` modelida (96-qator) mavjud. Biroq:
  1. `app/actions/admin-products.ts` dagi `variantInputSchema` Zod sxemasida (8-22 qatorlar) `ram` maydoni umuman kiritilmagan.
  2. `components/admin/product-create-form.tsx` dagi `VariantFormState` (51-64 qatorlar) interfeysida `ram` yo'q.
  3. `ProductCreateForm` render qismida (516-630 qatorlar) RAM kiritish uchun birorta ham maydon mavjud emas.
  4. `tx.productVariant.create` chaqiruvida (115-132 qatorlar) `ram` bazaga saqlanmaydi.
- **Haqiqiy holat:** Ma'lumotlar bazasida mavjud bo'lgan 4 ta muhim apparat parametri (`screenSize`, `processor`, `battery`, `ram`) ning barchasi admin panelidan butunlay uzilib qolgan.

### 2.4. 4-Xato: Samsung API Xom Texnik Ko'rsatkichlarining Vitrinaga To'g'ri Kelmasligi
- `data/samsung` dagi `processor`: Chipset nomi emas, protsessor chastotasi saqlangan (masalan: `"4.47 ГГц, 3.5 ГГц"`).
- `data/samsung` dagi `battery`: Akkumulyator sig'imi (mAh) emas, video ko'rish soati yozilgan (`"До 31"`).
- `data/samsung` dagi `screenSize`: Ruscha formatda (`"174.2мм (6.9\")"`).
- `data/samsung` dagi `ram`: Doim `null`.
- Agar bu xom ma'lumotlar filtrsiz saytga chiqarilsa, vitrinada professional bo'lmagan, tushunarsiz yozuvlar paydo bo'ladi.

---

## 3. `data/` Papkasidagi Katalog Resurslarining Haqiqiy Holati

Fayllar statistikasi (Tekshiruv buyrug'i: `Get-ChildItem -Path c:\alo_shop\data -Recurse -File`):
- Jami fayllar: 253 ta.
- Jami JSON fayllar: 41 ta (`specs.json`).
- Jami PNG rasmlar: 212 ta.
- Umumiy hajm: 22.03 MB (Apple: 17.54 MB, Samsung: 4.49 MB).

### 3.1. Apple Katalogi (22 ta model, 98 ta mahalliy PNG rasm)
Kataloglar tuzilishi:
- `data/apple/iphone-13/`: 4 ta model (`iphone-13`, `iphone-13-mini`, `iphone-13-pro`, `iphone-13-pro-max`) — 22 ta rasm.
- `data/apple/iphone-14/`: 4 ta model (`iphone-14`, `iphone-14-plus`, `iphone-14-pro`, `iphone-14-pro-max`) — 18 ta rasm.
- `data/apple/iphone-15/`: 4 ta model (`iphone-15`, `iphone-15-plus`, `iphone-15-pro`, `iphone-15-pro-max`) — 18 ta rasm.
- `data/apple/iphone-16/`: 4 ta model (`iphone-16`, `iphone-16-plus`, `iphone-16-pro`, `iphone-16-pro-max`) — 18 ta rasm.
- `data/apple/iphone-17/`: 3 ta model (`iphone-17`, `iphone-17-pro`, `iphone-17-pro-max`) — 11 ta rasm.
- `data/apple/iphone-18/`: 2 ta model (`iphone-18-pro`, `iphone-18-pro-max`) — 8 ta rasm.
- `data/apple/iphone-se/`: 1 ta model (`iphone-se-3rd-gen`) — 3 ta rasm.

Apple ma'lumotlarining xususiyatlari:
- Har bir rang uchun aynan 1 ta rasmiy Apple CDN shaffof PNG rasmi saqlangan.
- Texnik pasport (`specs`): `screenSize`, `processor`, `ram`, `battery`, `camera`, `charging`, `os` to'liq va o'zbek tiliga moslashtirilgan tarzda keltirilgan.
- Xotira variantlari (`storageOptions`): `["128GB", "256GB", "512GB", "1TB"]` massiv shaklida alohida berilgan.

### 3.2. Samsung Katalogi (19 ta model, 114 ta mahalliy PNG rasm)
Kataloglar tuzilishi:
- `data/samsung/galaxy-a/`: 11 ta model (`galaxy-a07`, `a07s`, `a08`, `a17`, `a18`, `a26-5g`, `a27-5g`, `a36-5g`, `a37-5g`, `a56-5g`, `a57-5g`) — 66 ta rasm.
- `data/samsung/galaxy-s/`: 8 ta model (`galaxy-s25`, `s25-fe`, `s25-plus`, `s25-ultra`, `s26`, `s26-fe`, `s26-plus`, `s26-ultra`) — 48 ta rasm.

Samsung ma'lumotlarining xususiyatlari:
- Har bir model papkasida aynan 6 ta PNG mavjud bo'lib, ular faqat 1-rang variantiga tegishli (`<color>-thumb.png` va `<color>-gallery-1.png` dan `5.png` gacha).
- `specs.json` ichida esa barcha ranglar uchun Samsung rasmiy CDN havolalari (`thumbUrl` va `galleryImages`) mavjud.

---

## 4. Ma'lumotlar Bazasi Sxemasi (`prisma/schema.prisma`) bilan Solishtirma

Mavjud sxemadagi `Product` modeli (64-84 qatorlar) va `ProductVariant` modeli (87-110 qatorlar) tahlil qilindi.

### 4.1. Bazadagi Yo'q Maydonlar Ro'yxati
1. `camera String?`: Xaridorlar uchun telefon tanlashdagi eng asosiy parametr. Katalogdagi barcha 41 ta modelda mavjud, ammo Prisma sxemasida yo'q.
2. `charging String?`: Tezkor quvvatlash (masalan: `USB-C, 27W simli, 25W MagSafe`). Bazada yo'q.
3. `os String?`: Operatsion tizim (iOS 18, Android 15). Bazada yo'q.
4. `series String?`: Mahsulot seriyasi (`iPhone 16`, `Galaxy S25`, `Galaxy A`). Katalogda guruhlash va filtrlash uchun shart.
5. `releaseYear Int?`: Modelning chiqarilgan yili. Katalogda mavjud, bazada yo'q.
6. `specs Json?`: Doimiy sxema migratsiyalarisiz qo'shimcha parametrlar (suvga chidamlilik IP68, ekran yorqinligi nits, AI funksiyalari)ni saqlash uchun JSON ustuni mavjud emas.

### 4.2. `ProductVariant` Darajasidagi Nomutanosibliklar
1. `colorNameUz`, `colorNameRu`, `colorNameEn` maydonlari `NOT NULL`. Apple ma'lumotlarida nomlar faqat inglizcha (`Desert Titanium`), Samsung ma'lumotlarida esa ingliz/ruscha (`Awesome Olive`). Tarjimalar avtomatlashtirilmasa baza xatolik beradi.
2. `condition`: Standart `NEW` yoki `USED`. `data/` katalogidagi barcha parametrlar yangi telefonlar uchun tegishli.
3. `price` va `oldPrice`: `data/` katalogida tijoriy narxlar bo'lmagani sababli, admin har doim narxni o'zi kiritishi yoki narxlar shabloni bo'yicha hisoblanishi zarur.

---

## 5. Rasmlar Arxitekturasi va Storefront Slayderi Holati

### 5.1. `public/` Jildi Yo'qligi Muammosi
- Tekshiruv: `powershell -Command "Test-Path c:\alo_shop\public"` buyrug'i `False` qaytardi.
- Next.js freymvorkida brauzerga statik resurslarni xizmat qilish faqat `public/` papkasi orqali amalga oshiriladi (masalan, `public/images/products/...` fayli saytda `/images/products/...` manzili orqali ochiladi).
- Hozirgi kunda `data/apple/` va `data/samsung/` dagi rasmlarni Next.js to'g'ridan-to'g'ri vebga bera olmaydi.
- Shuningdek, `app/actions/admin-products.ts` ning 130-qatoridagi `"/images/products/placeholder.webp"` zaxira rasmi ham `public/` papkasi yo'qligi sababli 404 xato qaytaradi.
- **Yechim:** `public/images/products/` papkalarini yaratish va rasmlarni ko'chirish yoki sinxronizatsiya qilish shart.

### 5.2. `next.config.ts` Remote Patterns Cheklovi
Fayl: `c:\alo_shop\next.config.ts`, 7-14 qatorlar:
```typescript
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
```
Agar `specs.json` dagi CDN rasmlari ishlatilsa, quyidagi ikkita domen kiritilishi shart:
- `store.storeimages.cdn-apple.com` (Apple renderlari uchun)
- `images.samsung.com` (Samsung galereya rasmlari uchun)

### 5.3. Rasmlar Slayderi (Slider / Carousel) Zaruriyati va Mavjud Tizim
Foydalanuvchi savoli: *"va rasmlar uchun slider qilish kerakmi?"*

Koddagi holat: Fayl `components/store/product-gallery.tsx` (247 qator):
- Saytda rasmlar slayderi **allaqachon noldan professional tarzda yaratilgan va to'liq jihozlangan**:
  - Sensorli mobil ekranlar uchun gorizontal surish logikasi (`touchStartX`, `touchEndX`, `minSwipeDistance = 40`) mavjud (29-92 qatorlar).
  - Chapga/o'ngga navigatsiya strelkalari (`ChevronLeft`, `ChevronRight`) mavjud (157-177 qatorlar).
  - Mobil sahifalar uchun pastki nuqtali indikatorlar (dots pagination) mavjud (180-196 qatorlar).
  - Miniatyuralar tasmasi (thumbnail strip) mavjud (201-243 qatorlar).
  - Asosiy rasm hover bo'lganda silliq kattalashishi (`hover:scale-105`) mavjud.
- **Holat tahlili:**
  - Slayder `safeImages.length > 1` bo'lgandagina o'zining navigatsiya boshqaruvlarini chiqaradi.
  - Samsung'ning 1-rang variantida 6 ta mahalliy rasm borligi sababli, slayder darhol to'liq ishlaydi.
  - Apple'da esa har bir rangda 1 tadan rasm bor. Shuning uchun Apple variantlari tanlanganda slayder avtomatik ravishda bitta asosiy rasmni ko'rsatib turadi, o'tish tugmalari ko'rinmaydi.
- **Tavsiya:** Yangi slayder komponenti yozish mutlaqo kerak emas! Mavjud `ProductGallery` mukammal. Apple mahsulotlari uchun ham slayder ishlashi maqsadida:
  - Variant rasmlariga umumiy seriya yoki qo'shimcha burchak rasmlari biriktiriladi (`[colorMainImage, ...modelSharedImages]`).

---

## 6. Admin Panel Kamchiliklari va Adminga Qulaylik Yaratish Arxitekturasi

Foydalanuvchi savoli: *"bu malumotlarni admin panelga joylab qoysa adminga qulaylik yaratish uchun admin birorta telefonni saytga joylashda kerakli malumotlarni kiritmay masalan tayyor ranglarni tanlasa yoki boshqalarini tanlasa yoki qo'shimchasiga qolda kiritadigan qilsa boladimi yo'qmi shunday yaxshilanishlar qilsa boladimi yoqmi?"*

### 6.1. Hozirgi Admin Formasi Kamchiliklari (`ProductCreateForm`)
1. **Apparat maydonlari yo'qligi:** Bazada `screenSize`, `processor`, `battery` bo'lsa-da, formadagi `payload` va Zod sxemasida bu maydonlar umuman yo'q. Mahsulot qo'shilganda bu ustunlar doim `null` bo'lib qoladi.
2. **RAM maydoni yo'qligi:** `ProductVariant` modelidagi `ram` parametri formaga ham, Zod sxemasiga ham ulanmagan.
3. **100% qo'lda matn kiritish:** Admin brend, model, slug, 3 tildagi tavsiflar, SKU, xotira, 3 tildagi rang nomlari va HEX kodini noldan terishga majbur. Bitta telefonni barcha ranglari bilan kiritish 15-20 daqiqa vaqt oladi.
4. **Rasmlar matnli inputda:** Rasm URL manzillari vergul bilan bitta `Input` ga kiritiladi (`url1, url2`). Fayl yuklash, oldindan ko'rish (preview) yoki serverdan tanlash imkoni yo'q.
5. **Tahrirlash sahifasi yo'qligi:** `app/[locale]/admin/products/[id]/edit` sahifasi hali mavjud emas.

### 6.2. Taklif Etilayotgan Arxitektura: Tayyor Shablon + Ranglar Palitrasi + Custom Fallback

Adminga maksimal qulaylik yaratish uchun `components/admin/product-create-form.tsx` quyidagi professional bloklar bilan kengaytiriladi:

#### A. Katalog Shablonini Tanlash Vidjeti (Catalog Preset Selector)
- Forma boshida ikkita qulay selektor joylashtiriladi:
  1. `[ Brend: Apple | Samsung | Boshqa (Custom) ]`
  2. `[ Model shabloni: iPhone 16 Pro | Galaxy S25 Ultra | ... ]`
- Model tanlanganda bir zumda avtomatik to'ldiriladi:
  - Brend, Model nomi, Kategoriya ("Smartfonlar").
  - URL slug (`apple-iphone-16-pro`).
  - Ekran, Protsessor, Batareya, Kamera, Zaryadlash, OS, Kafolat (12 oy).
  - Uch tildagi qisqa, professional faktik tavsiflar (AGENTS.md mikro-kopirayting qoidalariga mos: ortiqcha maqtovlarsiz, faqat texnik parametrlar).
  - Barcha rasmiy ranglar va xotira variantlari avtomatik variantlar jadvaliga generatsiya qilinadi.
  - Har bir rangga o'zining tayyor render rasmlari havolasi ulanadi.

#### B. Smart Ranglar Palitrasi (Color Swatches) + Custom Rejim
Variantlar jadvalidagi rang kiritish bo'limi yangilanadi:
- **Tayyor rang tugmalari (Presets):** Tanlangan modelga xos bo'lgan rasmiy ranglar (Desert Titanium, Natural Titanium, Black, Awesome Olive, Cobalt Violet...) vizual rangli doirachalar ko'rinishida turadi.
- Tugma bosilganda HEX kod va uchta tildagi nomlar (`colorNameUz`, `colorNameRu`, `colorNameEn`) bir soniyada to'ldiriladi.
- **"Qo'lda kiritish (Custom)" tugmasi:** Agar admin katalogda yo'q noodatiy rang kiritmoqchi bo'lsa, erkin matn va rang tanlash (`<input type="color">`) rejimi ochiq qoladi.

#### C. Xotira Hajmi Tugmalari (Storage Pills)
Matn yozish o'rniga tezkor tugmalar:
`[ 64GB ] [ 128GB ] [ 256GB ] [ 512GB ] [ 1TB ] [ 2TB ]` + "Boshqa" (Custom).

#### D. Avtomatik SKU Generatori
Admin SKU o'ylab topmasligi uchun avtomatik formula joriy etiladi:
`[MODEL_KODI]-[XOTIRA]-[RANG]` (masalan: `IP16P-256-DES`, `S25U-512-BLK`). Qo'lda tahrirlash imkoniyati ham saqlanadi.

#### E. Adminga Qoladigan Yagona Vazifa:
Admin faqat ikkita tijoriy ma'lumotni kiritadi:
1. Chakana narx (masalan: `14 500 000 so'm`).
2. Filiallardagi qoldiq soni (Malika: 3 dona, Chilonzor: 2 dona).
Natijada telefonni saytga joylash vaqti 15 daqiqadan **30 soniyaga** tushadi!

---

## 7. Storefront Vitrinasi (`SnapshotSpecsView`) Holati

Fayllar: `components/store/snapshot-specs-view.tsx` va `lib/utils/specs.ts`.

### 7.1. Vitrinadagi Kamchiliklar
- Hozirgi `SnapshotSpecsView` texnik pasportida Kamera (`camera`) va Zaryadlash (`charging`) ko'rsatilmaydi.
- Smartfon xaridorlari uchun kamera piksellari va zaryadlash tezligi birinchi darajali ma'lumot hisoblanadi.

### 7.2. `lib/utils/specs.ts` dagi Qattiq Kodlangan Xavf
- Ushbu yordamchi faylda `KNOWN_DEVICES` nomli qattiq kodlangan ro'yxat mavjud. Unda faqat iPhone 13-16, S23-S24 va Xiaomi 13-14 bor.
- Yangi iPhone 17-18 yoki Galaxy S25-S26 va Galaxy A07-A57 modellari bu ro'yxatda yo'q.
- Natijada ushbu yangi modellar ochilganda `GENERIC_VITALS` ishga tushib, byudjetli Galaxy A07 ga flagman parametrlari (6.6" Dynamic AMOLED 120Hz, 8GB RAM, Flagship processor) noto'g'ri ko'rsatiladi.
- **Yechim:** Texnik parametrlar qattiq kodlangan xaritadan emas, bevosita `Product` bazasidagi real qiymatlardan olinishi zarur.

---

## 8. Yakuniy Solishtirma Qiyosiy Jadval (Master Gap Matrix)

| Ko'rsatkich / Xususiyat | `data/` Katalogi | Prisma Baza (`schema.prisma`) | Admin Forma (`ProductCreateForm`) | Storefront Vitrinasi | Tahlil va Yechim |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Brend (Brand)** | Mavjud (Apple, Samsung) | Mavjud (`String`) | Mavjud (Qo'lda yoziladi) | To'liq aks etadi | Tayyor brend selektori qo'shiladi |
| **Model nomi** | Mavjud (41 ta model) | Mavjud (`String`) | Mavjud (Qo'lda yoziladi) | To'liq aks etadi | Tayyor model selektori qo'shiladi |
| **Seriya (Series)** | Mavjud (`series`) | **Bazada yo'q!** | **Formada yo'q!** | Ko'rsatilmaydi | Baza va formaga `series String?` qo'shiladi |
| **Kamera (Camera)** | **To'liq mavjud (MP, linzalar)**| **Bazada umuman yo'q!** | **Formada maydoni yo'q!** | **Ko'rsatilmaydi!** | Baza, forma va vitrinaga kiritiladi |
| **Zaryadlash (Charging)**| Apple'da to'liq bor (Watt)| **Bazada umuman yo'q!** | **Formada maydoni yo'q!** | **Ko'rsatilmaydi!** | Baza, forma va vitrinaga kiritiladi |
| **Operatsion tizim (OS)**| Apple'da bor (iOS versiya)| **Bazada umuman yo'q!** | **Formada maydoni yo'q!** | **Ko'rsatilmaydi!** | Bazaga `os String?` qo'shiladi |
| **Chiqarilgan yili** | Mavjud (`releaseYear`)| **Bazada yo'q!** | **Formada yo'q!** | Ko'rsatilmaydi | Bazaga `releaseYear Int?` qo'shiladi |
| **Moslashuvchan specs** | JSON shaklida mavjud | **Bazada yo'q!** | **Formada yo'q!** | Ko'rsatilmaydi | Bazaga `specs Json?` qo'shiladi |
| **Ekran (Screen)** | Mavjud (dyuym, OLED, Hz) | Mavjud (`screenSize String?`) | **Formada maydoni yo'q!** | Aks etadi (agar bazada bo'lsa) | Formaga kiritish maydoni qo'shiladi |
| **Protsessor (CPU)** | Mavjud (chipset / chastota) | Mavjud (`processor String?`) | **Formada maydoni yo'q!** | Aks etadi (agar bazada bo'lsa) | Formaga kiritish maydoni qo'shiladi |
| **Akkumulyator** | Mavjud (sig'im / soat) | Mavjud (`battery String?`) | **Formada maydoni yo'q!** | Aks etadi (agar bazada bo'lsa) | Formaga kiritish maydoni qo'shiladi |
| **Operativ xotira (RAM)**| Apple'da bor, Samsung'da yo'q | Mavjud (`ram String?`) | **Formada maydoni yo'q!** | Taxminiy hisoblanadi | Formaga kiritish maydoni qo'shiladi |
| **Ranglar (Colors)** | Hex + inglizcha/ruscha nom| 3 tilda talab qilinadi | Hex + 3 nom qo'lda teriladi | Swatches orqali tanlanadi | Smart Swatches + Custom rejim |
| **Xotira (Storage)** | Apple'da bor, Samsungda modelda| Majburiy (`storage String`)| Qo'lda yoziladi | Tugmalar orqali tanlanadi | Storage Pills + Parser qo'shiladi |
| **Rasmlar (Images)** | 212 ta mahalliy PNG | `images String[]` | Matnli URL qatori | Slayder va galereya | Oldindan ko'rish (preview) qo'shiladi |
| **Rasmlar Slayderi** | Ko'p rakursli (Samsung 6 ta) | Ko'p rasm massivini saqlaydi | Ko'rish imkoni yo'q | **To'liq tayyor va ishlaydi** | Yangi slayder shart emas! |
| **Chakana narxlar** | **Mavjud emas** (Texnik katalog)| Majburiy (`Decimal`) | Qo'lda kiritiladi | To'liq aks etadi | Admin qo'lda kiritadi |
| **Filial qoldiqlari** | **Mavjud emas** | Majburiy (`BranchInventory`) | Har bir filialga kiritiladi | Vidjet orqali ko'rsatiladi | Admin har bir filialga belgilaydi |

---

## 9. Bosqichma-Bosqich Amaliy Harakatlar Rejasi (Actionable Roadmap)

### 1-bosqich: Baza Sxemasini Takomillashtirish
1. `prisma/schema.prisma` dagi `Product` modeliga ustunlarni qo'shish:
   - `camera String?`
   - `charging String?`
   - `os String?`
   - `series String?`
   - `releaseYear Int?`
   - `specs Json?`
2. Migratsiyani amalga oshirish (`npx prisma migrate dev --name add_smartphone_specs_fields`).

### 2-bosqich: Statik Rasmlar Muhitini Sozlash
1. `public/images/products/apple/` va `public/images/products/samsung/` papkalarini yaratish.
2. `data/` dagi 212 ta PNG faylini tegishli kataloglarga ko'chirish yoki sinxronlashtirish.
3. `next.config.ts` faylidagi `images.remotePatterns` ga `store.storeimages.cdn-apple.com` va `images.samsung.com` domenlarini qo'shish.
4. Samsung uchun qolgan rang variantlari rasmlarini to'liq yuklab olish yoki CDN havolalarini saqlab qolish.

### 3-bosqich: Admin Paneli Qulayliklarini Joriy Etish
1. Server tomonida tayyor katalog shablonlarini beruvchi xizmat (`lib/catalog/presets.ts`) yaratish.
2. `components/admin/product-create-form.tsx` komponentiga:
   - Shablon selektori (Apple / Samsung modellarini bir zumda to'ldirish).
   - Smart ranglar palitrasi (Hex va Uz/Ru/En nomlarni bitta bosishda to'ldirish + Custom fallback).
   - Xotira tugmalari (`128GB`, `256GB`, `512GB`, `1TB`).
   - Ekran, Protsessor, Batareya, RAM, Kamera, Zaryadlash kiritish maydonlari.
   - Rasmlarni oldindan ko'rish (preview thumbnails).
3. `app/actions/admin-products.ts` da Zod sxemasi va `tx.product.create` chaqiruviga yangi maydonlarni ulash.

### 4-bosqich: Storefront Vitrinasini Yangilash
1. `components/store/snapshot-specs-view.tsx` komponentiga Kamera (`camera`) va Zaryadlash (`charging`) qatorlarini qo'shish.
2. `lib/utils/specs.ts` faylini tozalab, generic taxminiy ma'lumotlar o'rniga bazadagi haqiqiy ma'lumotlarga ustuvorlik berish.

---

## 10. Remaining Questions & Gaps (Qolgan Ochiq Savollar)

1. **Samsung qolgan ranglarining mahalliy rasmlari:** Hozirda 19 ta Samsung modelining har birida faqat 1-rang rasmlari yuklangan (jami 114 ta rasm). Qolgan 2-3 xil ranglar uchun mahalliy PNG rasmlarni qo'shimcha yuklab olish kerakmi yoki ularni `images.samsung.com` CDN havolasi orqali aks ettirish yetarlimi?
2. **Samsung xom parametrlarini tozalash:** Samsung API dan olingan protsessor chastotasi (`4.47 ГГц...`) va batareya (`До 31`) parametrlarini import vaqtida tozalab, rasmiy marketing nomlariga (masalan: `Snapdragon 8 Elite, 5000 mAh`) o'giruvchi qoida qaysi manba asosida shakllantirilishi lozim?
3. **Boshlang'ich narxlar:** 41 ta model uchun boshlang'ich so'm narxlarini belgilash formulasi bormi yoki adminlar har bir model narxini bozor talabidan kelib chiqib o'zlari qo'lda belgilaydilarmi?
4. **Keyingi bosqich ijrochisi uchun birinchi qadam:** `prisma/schema.prisma` dagi yangi maydonlarni qo'shish va `public/images/products/` papkasini ochib, statik marshrutlarni sozlash.
