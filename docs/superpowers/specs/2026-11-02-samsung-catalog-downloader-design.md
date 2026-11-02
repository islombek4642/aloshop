# Dizayn Hujjati: Samsung Rasmiy Smartfonlar Ma'lumotlari va Rasmlarini Yuklab Olish Tizimi

**Sana:** 2026-11-02  
**Holat:** Ko'rib chiqish uchun taqdim etildi  
**Standartlar:** AGENTS.md (Zero Emojis Policy, TypeScript Strict, Separation of Concerns)

---

## 1. Maqsad va Vazifa (Intent & Why)

AloShop do'konida mavjud bo'lgan soxta va tasodifiy Unsplash rasmlari hamda test ma'lumotlarini Samsung O'zbekiston rasmiy saytidan (`samsung.com/uz_ru`) olingan haqiqiy smartfonlar bilan almashtirish talab etiladi.

Hozirgi bosqichda loyiha kodlariga va ma'lumotlar bazasiga bevosita teginmasdan, barcha ma'lumotlar va yuqori aniqlikdagi fotosuratlarni alohida `data/samsung/` papkasiga rasmiy sayt ierarxiyasi bo'yicha yuklab olish va saqlash vazifasi qo'yildi. Keyingi bosqichda ushbu ma'lumotlar ko'rib chiqilib, AloShop katalogiga integratsiya qilinadi.

---

## 2. Maqsadlar, No-Goal va Anti-Goal

### Maqsadlar (Goals)
1. **Rasmiy API integratsiyasi:** Samsung O'zbekiston `searchapi.samsung.com` rasmiy endpoints orqali barcha faol Galaxy smartfonlari ro'yxatini olish.
2. **To'liq xarakteristikalar:** Har bir model uchun ekran, protsessor, batareya, operativ xotira (RAM), doimiy xotira (ROM), kamera va rasmiy rang nomlarini aniq yuklash.
3. **Sifatli rasmlar:** Har bir model va uning barcha rang variantlari uchun yuqori sifatli rasmiy fotosuratlarni yuklab olish.
4. **Tartibli papkalar strukturasi:**
   ```text
   data/samsung/
   ├── galaxy-s/
   │   └── galaxy-s24-ultra/
   │       ├── specs.json
   │       └── images/
   │           ├── titanium-gray-front.png
   │           └── titanium-black-front.png
   ├── galaxy-z/
   │   └── galaxy-z-fold6/
   │       ├── specs.json
   │       └── images/
   └── galaxy-a/
       └── galaxy-a55-5g/
           ├── specs.json
           └── images/
   ```
5. **Xavfsiz va boshqariladigan skript:** `scripts/download-samsung.ts` mustaqil skriptini yaratish (throttling, xatoliklarni qayta urinish (retry), progress-bar).

### Cheklovlar va No-Goals
1. Mavjud AloShop ma'lumotlar bazasiga (`prisma/seed.ts` yoki PostgreSQL) hozircha o'zgartirish kiritilmaydi.
2. Og'ir brauzer avtomatizatsiyasi (Puppeteer/Playwright) ishlatilmaydi; engil, tez va xavfsiz Node.js `fetch` va `fs` ishlatiladi.

### Anti-Goals
1. Serverni zo'riqtirish (spam so'rovlar yuborish) taqiqlanadi (so'rovlar orasida 500-1000ms kutish oralig'i qo'yiladi).
2. Sifatsiz yoki kichraytirilgan (thumbnail) rasmlar o'rniga faqat original yuqori aniqlikdagi renderlar yuklanadi.
3. AGENTS.md ga muvofiq, skript xabarlari va fayl tuzilmalarida Unicode emojilardan foydalanish taqiqlanadi.

---

## 3. Ko'rib Chiqilgan Yondashuvlar (Approaches)

1. **1-yondashuv (Tanlangan):** Rasmiy API orqali seriyalar va modellar bo'yicha fayl tizimiga to'liq yuklovchi mustaqil TypeScript skripti.
   - *Afzalligi:* To'liq oflayn ko'rish, rasmlar mahalliy saqlanadi, har bir model alohida jildda tartibli joylashadi.
2. **2-yondashuv (Rad etilgan):** Faqat yagona `catalog.json` faylida havolalarni saqlash.
   - *Rad etish sababi:* Foydalanuvchi rasmlarni alohida papkada mahalliy saqlashni qat'iy talab qildi.
3. **3-yondashuv (Rad etilgan):** HTML veb-skraping.
   - *Rad etish sababi:* Sekin, beqaror va xavfli.

---

## 4. Amalga Oshirish Bosqichlari (Implementation Details)

1. **Skript yaratish:** [`scripts/download-samsung.ts`](file:///c:/alo_shop/scripts/download-samsung.ts).
2. **API endpointlari:**
   - Katalog: `https://searchapi.samsung.com/v6/front/b2c/product/finder/global?type=01010000&siteCode=uz_ru&start=1&num=60`
   - Detallar: `https://searchapi.samsung.com/v6/front/b2c/product/spec/detail/?modelList=<modelCode>&siteCode=uz_ru`
3. **Rasm URL konvertori:** `//images.samsung.com/is/image/samsung/...` havolalarini yuqori sifatli `https://images.samsung.com/is/image/samsung/...` formatiga o'tkazib yuklash.
4. **`package.json` ga buyruq qo'shish:**
   - `"download:samsung": "npx tsx scripts/download-samsung.ts"`
5. **Skriptni sinovdan o'tkazish:** 1 ta model misolida tekshirib, keyin to'liq katalogni xavfsiz yuklash.

