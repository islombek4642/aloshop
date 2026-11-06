# AloShop — Mahsulotlar Ro'yxati: Mobil Moslashuv va Ommaviy O'chirish (Mobile Cards & Bulk Delete)

> **Hujjat turi:** Texnik Dizayn va Arxitektura Hujjati  
> **Sana:** 2026-11-06  
> **Loyiha:** AloShop — Telefonlar do'koni admin paneli  
> **Muallif:** Antigravity (AI Assistant) & Bosh Administrator  
> **Holati:** Ko'rib chiqish va Tasdiqlash uchun

---

## 1. Kirish va Maqsad (Intent & Why)

AloShop admin panelining mahsulotlar boshqaruvi sahifasida (`/admin/products`) tovarlar ro'yxati kompyuter monitorlari uchun keng 8 ustunli jadval (`<Table>`) shaklida yaratilgan. Biroq do'kon egalari va adminlar tizimga ko'pincha smartfon orqali kirib, tovarlarni nazorat qiladilar.

Hozirgi holatdagi muammolar:
1. **Mobilda noqulaylik:** 8 ustunli jadval va uning ichidagi 7 ustunli ochiluvchi variantlar jadvali smartfon ekranida (320px - 430px) siqilib ketadi, gorizontal scroll talab qiladi va sensorli boshqaruvga (touch target) mos emas.
2. **Ommaviy amallarning yo'qligi:** Mahsulotlarni faqat bittalab o'chirish mumkin. Bir nechta eskirgan yoki xato kiritilgan tovarlarni tezda tozalash uchun qulay tanlab o'chirish (Batch / Bulk Delete) mexanizmi mavjud emas.

**Maqsad:**
- Mahsulotlar sahifasini desktopda to'liq jadval, smartfonlarda esa zamonaviy, qulay va sensorli **mobil kartochkalar (Card view)** formatiga o'tkazish.
- Mahsulotlarni bittalab yoki ommaviy tanlab o'chirish imkonini beruvchi, ekranning pastida suzuvchi xavfsiz panel (**Floating Batch Action Bar**) va himoyalangan server action yaratish.

---

## 2. Maqsadlar, Nomahsulot Cheklovlar va Anti-maqsadlar

### Maqsadlar (Goals):
1. **Desktop ko'rinishini saqlash (`hidden md:block`):** Kompyuterlar uchun qulay 8 ustunli to'liq jadval o'z o'rnida qoladi, unga faqat mahsulotlarni tanlash uchun qator va sarlavha Checkboxlari qo'shiladi.
2. **Mobil kartochkalar (`md:hidden`):**
   - Har bir tovar uchun alohida ixcham karta: tanlash Checkboxi, brend va model nomi, kategoriya belgisi, narx diapazoni, umumiy qoldiq soni (Badge) va kafolat muddati.
   - Variantlarni ko'rish tugmasi (akkordeon): bosilganda kartochka ichida har bir variant (rang, xotira, holat, narx, ombor qoldig'i) vertikal ixcham bloklar shaklida ochiladi.
   - Tahrirlash va o'chirish tugmalari kamida 44x44px qulay sensorli o'lchamda bo'ladi.
3. **Ommaviy tanlab o'chirish (Bulk Actions):**
   - Mahsulotlar tanlanganda ekranning pastki markazida suzuvchi panel paydo bo'ladi (*"N ta tovar tanlandi — [Bekor qilish] [Tanlanganlarni o'chirish]"*).
   - "Tanlanganlarni o'chirish" bosilganda modal oyna ochilib, tasdiqlash so'raladi.
4. **Buxgalteriya va buyurtmalar yaxlitligi (`AGENTS.md` 6.5-bandi):**
   - Faol buyurtmada (PENDING, CONFIRMED, PROCESSING, SHIPPED) turgan tovarlar mutlaqo o'chirilmaydi va rad etiladi.
   - Tarixda yetkazib berilgan yoki bekor qilingan buyurtmalari bor tovarlar jismonan o'chirilmasdan, arxivlanadi (`isArchived: true`).
   - Faqat birorta ham buyurtmaga bog'lanmagan tovarlar tranzaksiya orqali bazadan to'liq o'chiriladi.
5. **100% i18n pariteti va nol emoji (`AGENTS.md` 7.2-bandi):** O'zbek (`uz`), Rus (`ru`) va Ingliz (`en`) tillarida to'liq tarjimalar, hech qanday emojilarsiz.

### Anti-maqsadlar (Non-goals):
- Mahsulot yaratish yoki tahrirlash sahifalarini o'zgartirmaslik (ular yaqinda 70/30 dizaynda yangilangan).
- O'chirish amallarini bitta so'rovda barchasini ko'r-ko'rona jismoniy o'chirishga ruxsat bermaslik (har bir mahsulotning buyurtma tarixi alohida tekshirilishi shart).

---

## 3. Ko'rib chiqilgan Yondashuvlar (Approaches)

| Yondashuv | Afzalliklari | Kamchiliklari | Xulosa |
|---|---|---|---|
| **1. Gibrid kartochkalar + Suzuvchi ommaviy panel (Tanlangan)** | Desktopda to'liq jadval, mobilda sensorli kartochkalar. Suzuvchi panel ekranni to'sib qo'ymaydi, faqat tovar tanlanganda chiqadi. | Bir oz ko'proq UI komponent yozishni talab qiladi. | **Tanlandi (Foydalanuvchi ma'qulladi)** |
| **2. Majburiy jadval va gorizontal scroll** | Minimal o'zgarish, kam kod. | Telefonda barmoq bilan siljitish juda noqulay, variantlarni ko'rish qiyin. | Rad etildi |
| **3. To'liq Bottom Sheet orqali boshqaruv** | Mobil ilovaga o'xshash. | Har bir mahsulot tafsiloti va o'chirish uchun yangi oyna ochilishi ko'rish tezligini pasaytiradi. | Rad etildi |

---

## 4. Arxitektura va Komponentlar Loyihasi

### 4.1. Server Action: `bulkDeleteProductsAction`
Fayl: `app/actions/admin-products.ts`  
Sxema: `lib/validations/admin-products.ts`

```ts
export const bulkDeleteProductsSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, "Kamida bitta mahsulot tanlanishi shart"),
});

export type BulkDeleteResult =
  | {
      success: true;
      deletedCount: number;
      archivedCount: number;
      skippedActiveCount: number;
    }
  | { success: false; error: string };
```

Mantiqiy ketma-ketlik:
1. `getAdminSession()` va `isSuperAdmin(session)` tekshiruvi.
2. Har bir `productId` bo'yicha `orderItem` mavjudligini tekshirish:
   - Faol buyurtmadagilar (`activeStatuses`) -> `skippedActiveCount` ga qo'shiladi va o'chirilmaydi.
   - Tarixiy buyurtmadagilar -> `isArchived: true` qilib yangilanadi (`archivedCount`).
   - Buyurtmasi bo'lmaganlar -> Transaction ichida variantlari, inventari va mahsulot yozuvi o'chiriladi (`deletedCount`).
3. Keshni revalidatsiya qilish (`revalidatePath("/admin/products")` va `/catalog`).
4. Natija haqida batafsil ma'lumot qaytarish.

### 4.2. UI Komponent: `components/admin/products-list-view.tsx`

Tarkibiy qismlar:
1. **Holat (State):**
   - `selectedProductIds: Set<string>` — tanlangan mahsulotlar IDlari to'plami.
   - `isBulkDeleting: boolean`, `bulkDeleteResult: BulkDeleteResult | null`.
2. **Desktop Table (`hidden md:block`):**
   - Jadval sarlavhasida "Barchasini tanlash" checkboxi (joriy sahifadagi barcha mahsulotlarni tanlash / bekor qilish).
   - Har bir qatorda mustaqil checkbox.
3. **Mobil Cards View (`md:hidden`):**
   - Har bir mahsulot uchun `border border-border rounded-xl bg-card p-3 space-y-2.5` kartasi.
   - Yuqori qator: Checkbox + Brend & Model nomi + Qoldiq Badge.
   - O'rta qator: Kategoriya nishoni, Kafolat muddati va Narx diapazoni.
   - Pastki qator: "Variantlar (N)" tugmasi + Tahrirlash (Pencil) + O'chirish (Trash2) tugmalari.
   - Kengaytirilgan variantlar: Karta ichida ochiluvchi ixcham ro'yxat (rang nuqtasi, nomi, xotira, narx, ombordagi soni).
4. **Floating Batch Action Bar (`selectedProductIds.size > 0` bo'lganda):**
   - Joylashuvi: `fixed bottom-6 left-1/2 -translate-x-1/2 z-40`.
   - Dizayni: `bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-full shadow-2xl px-4 py-2.5 flex items-center gap-3 border border-border/40`.
   - Ichidagi elementlar:
     - Tanlanganlar soni ko'rsatkichi (`N ta tanlandi`).
     - "Bekor qilish" tugmasi (`ghost` uslubida).
     - "O'chirish" tugmasi (`destructive` uslubida, chiqindi qutisi belgisi bilan).
5. **Tasdiqlash Modali:**
   - Tanlangan tovarlar soni, faol buyurtmalar himoyasi haqidagi ogohlantirish va tasdiqlash tugmasi.

---

## 5. Tarjimalar va i18n Kalitlari

`messages/uz.json`, `messages/ru.json`, `messages/en.json` fayllaridagi `admin.productsManagement` blokiga yangi kalitlar qo'shiladi:
- `selectAll`: "Barchasini tanlash" / "Выбрать все" / "Select all"
- `selectedCount`: "{count} ta tanlandi" / "Выбрано: {count}" / "{count} selected"
- `bulkDeleteBtn`: "Tanlanganlarni o'chirish" / "Удалить выбранные" / "Delete selected"
- `bulkDeleteModalTitle`: "Tanlangan mahsulotlarni o'chirish" / "Удаление выбранных товаров" / "Delete selected products"
- `bulkDeleteModalDesc`: "Haqiqatan ham {count} ta tanlangan mahsulotni o'chirmoqchimisiz? Faol buyurtmasi mavjud mahsulotlar saqlab qolinadi." / ...
- `bulkDeleteSuccess`: "{deleted} ta tovar o'chirildi, {archived} ta arxivlandi." / ...
- `bulkDeleteSkipped`: "{skipped} ta tovar faol buyurtmada bo'lgani sababli o'chirilmadi." / ...
- `cancelSelection`: "Tanlovni bekor qilish" / "Отменить выбор" / "Cancel selection"
- `viewVariants`: "Variantlar ({count})" / "Варианты ({count})" / "Variants ({count})"

---

## 6. Testlash va Verifikatsiya Rejasi

Yangi test to'plami: `tests/admin-products-bulk-delete.test.ts`
1. **Ruxsatlar tekshiruvi:** Avtorizatsiyasiz yoki oddiy `BRANCH_ADMIN` chaqirganda `unauthorized` qaytarishi.
2. **Validatsiya:** Bo'sh massiv yuborilganda rad etilishi.
3. **Xavfsiz tozalash:** Buyurtmasi bo'lmagan tovarlar to'liq o'chirilishi.
4. **Faol buyurtma himoyasi:** Faol buyurtmaga ega tovarlar o'chirilmasdan o'tkazib yuborilishi (`skippedActiveCount > 0`).
5. **Arxivlash (Soft-delete) himoyasi:** Tarixiy yetkazilgan buyurtmalari bor tovarlar `isArchived: true` qilinishi.
6. **UI elementlari tekshiruvi:** `products-list-view.tsx` faylida mobil kartochkalar, suzuvchi panel va checkboxlar mavjudligini avtomatik audit qilish.
7. **Master Suite integratsiyasi:** `scripts/verify-all.ts` dagi barcha testlar (32 ta to'plam) va `npm run build` 100% yashil o'tishi.

