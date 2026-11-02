# Dizayn Hujjati: Apple iPhone Rasmiy Smartfonlar Ma'lumotlari va Rasmlarini Yuklab Olish Tizimi

**Sana:** 2026-11-02  
**Holat:** Ko'rib chiqish uchun taqdim etildi  
**Standartlar:** AGENTS.md (Zero Emojis Policy, TypeScript Strict, Separation of Concerns)

---

## 1. Maqsad va Vazifa (Intent & Why)

AloShop do'konida haqiqiy smartfonlar katalogini shakllantirish doirasida Samsung Galaxy smartfonlari bilan bir qatorda Apple iPhone modellarini ham rasmiy texnik xarakteristikalari va yuqori sifatli original rasmlari bilan alohida `data/apple/` papkasiga yuklab olish talab etiladi.

Foydalanuvchi talabiga asosan, hozirda bozorda faol sotilayotgan barcha modellar (iPhone 13, 14, 15, 16 seriyalari va SE) hamda yangi kutilayotgan modellar (iPhone 17 va 18 seriyalari) to'liq qamrab olinadi. Barcha ma'lumotlar va rasmlar xuddi Samsung kabi mustaqil tartibda saqlanadi va loyihaning asosiy ma'lumotlar bazasiga ta'sir qilmaydi.

---

## 2. Maqsadlar, No-Goals va Anti-Goals

### Maqsadlar (Goals)
1. **Rasmiy Apple renderlari:** Apple rasmiy CDN serverlaridan (`store.storeimages.cdn-apple.com` va Apple rasmiy media resurslari) har bir model va uning har bir rasmiy rang varianti uchun yuqori aniqlikdagi fotosuratlarni yuklab olish.
2. **To'liq xarakteristikalar (`specs.json`):** Ekran diagonali va texnologiyasi, Apple Bionic / Apple Silicon A-seriyali protsessorlar, operativ xotira (RAM), saqlash xotirasi (ROM), akkumulyator hajmi, kameralar tizimi va ranglar palitrasi (nomi va hex kodi).
3. **Tartibli papkalar strukturasi:**
   ```text
   data/apple/
   ├── iphone-18/
   │   ├── iphone-18-pro-max/
   │   │   ├── specs.json
   │   │   └── images/
   │   └── iphone-18-pro/
   ├── iphone-17/
   │   ├── iphone-17-pro-max/
   │   ├── iphone-17-pro/
   │   └── iphone-17/
   ├── iphone-16/
   │   ├── iphone-16-pro-max/
   │   ├── iphone-16-pro/
   │   ├── iphone-16-plus/
   │   └── iphone-16/
   ├── iphone-15/
   │   ├── iphone-15-pro-max/
   │   ├── iphone-15-pro/
   │   ├── iphone-15-plus/
   │   └── iphone-15/
   ├── iphone-14/
   │   ├── iphone-14-pro-max/
   │   ├── iphone-14-pro/
   │   ├── iphone-14-plus/
   │   └── iphone-14/
   ├── iphone-13/
   │   ├── iphone-13-pro-max/
   │   ├── iphone-13-pro/
   │   ├── iphone-13/
   │   └── iphone-13-mini/
   └── iphone-se/
       └── iphone-se-3rd-gen/
   ```
4. **Xavfsiz va modulli TypeScript skripti:**
   - `scripts/lib/apple-api.ts`: Apple modellari, spetsifikatsiyalari va CDN havolalarini boshqaruvchi modul.
   - `scripts/lib/apple-storage.ts`: Fayl tizimiga `specs.json` va rasmlarni xavfsiz yuklovchi modul (mavjud fayllarni qayta yuklamaydi, hash va hajmni tekshiradi).
   - `scripts/download-apple.ts`: CLI orqali ishga tushuvchi skript (`npm run download:apple`).
   - Unit testlar: `tests/apple-api.test.ts` va `tests/apple-storage.test.ts`.

### Cheklovlar va No-Goals
1. Hozircha AloShop ma'lumotlar bazasiga (`prisma/schema.prisma` yoki PostgreSQL jadvallariga) o'zgartirish kiritilmaydi.
2. Storefront (mijozlar interfeysi) fayllari tegilmaydi.
3. Og'ir veb-skraping kutubxonalari (Puppeteer/Playwright) ishlatilmaydi; engil, tez va xavfsiz Node.js `fetch` va `fs` mexanizmlaridan foydalaniladi.

### Anti-Goals
1. Tarmoqni zo'riqtirish taqiqlanadi (rasmlar yuklanishida tartibli oqim va kutish oraliqlari qo'yiladi).
2. Sifatsiz yoki noaniq o'lchamdagi rasmlar yuklanmaydi — faqat original Apple mahsulot renderlari olinadi.
3. AGENTS.md 3.4 qoidasiga ko'ra, barcha matnlar, loglar, skript chiqishlari va testlarda emojilar ishlatilishi qat'iyan man etiladi.

---

## 3. Ko'rib Chiqilgan Yondashuvlar (Approaches)

1. **1-yondashuv (Tanlangan — Foydalanuvchi ma'qullagan):**
   - Rasmiy Apple CDN manbalari va to'liq aniqlikdagi spetsifikatsiyalar matritsasi asosida yuklash.
   - Foydalanuvchi talabiga ko'ra barcha sotilayotgan (13, 14, 15, 16, SE) hamda yangi/kelajak (17 va 18) seriyalar qamrab olinadi.
   - *Afzalligi:* 100% barqaror, tez, bloklanish xavfi yo'q, barcha ranglar va variantlar aniq strukturalangan.

2. **2-yondashuv (Rad etilgan):**
   - Jonli `apple.com` sahifalarini Puppeteer/Playwright orqali tahlil qilish.
   - *Rad etish sababi:* Og'ir, Canvas/WebGL sababli statik renderlarni ajratib olish beqaror, foydalanuvchi 1-yondashuvni ma'qulladi.

---

## 4. `specs.json` Arxitekturasi

Har bir model katalogidagi `specs.json` fayli quyidagi standart formatda shakllantiriladi:

```json
{
  "brand": "Apple",
  "series": "iPhone 16",
  "model": "iPhone 16 Pro Max",
  "modelCode": "iphone-16-pro-max",
  "releaseYear": 2024,
  "status": "available",
  "colors": [
    { "name": "Desert Titanium", "hex": "#C5B6A5", "imageFile": "desert-titanium.png" },
    { "name": "Natural Titanium", "hex": "#9E9A95", "imageFile": "natural-titanium.png" },
    { "name": "White Titanium", "hex": "#F2F1ED", "imageFile": "white-titanium.png" },
    { "name": "Black Titanium", "hex": "#3C3B3A", "imageFile": "black-titanium.png" }
  ],
  "storageOptions": ["256GB", "512GB", "1TB"],
  "specs": {
    "screenSize": "6.9 dyuym Super Retina XDR OLED, 120Hz ProMotion",
    "processor": "Apple A18 Pro (3nm)",
    "ram": "8GB",
    "battery": "4685 mAh",
    "camera": "48MP asosiy + 48MP ultra-keng + 12MP 5x telephoto",
    "charging": "USB-C, MagSafe 25W simsiz",
    "os": "iOS 18"
  },
  "images": [
    "desert-titanium.png",
    "natural-titanium.png",
    "white-titanium.png",
    "black-titanium.png"
  ]
}
```

---

## 5. Sinov va Tekshirish (Verification Strategy)

1. **Birlik testlari (Unit tests):**
   - `tests/apple-api.test.ts`: Barcha seriyalar va modellar to'liq shakllangani, ranglar va URL manzillari to'g'riligi tekshiriladi.
   - `tests/apple-storage.test.ts`: Papkalar ierarxiyasi va `specs.json` faylini to'g'ri yozish tekshiriladi.
2. **Statik analiz:**
   - `npm run check-types` (`tsc --noEmit`) 0 xato bilan o'tishi shart.
3. **Yuklash amaliyoti:**
   - `npm run download:apple` ishga tushirilib, `data/apple/` papkasida barcha modellar va rasmlar to'liq mavjudligi tekshiriladi.

