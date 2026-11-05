# AloShop — Filiallar Boshqaruvi (Branches Management) Redesign

> **Hujjat turi:** Texnik Dizayn va Arxitektura Hujjati  
> **Sana:** 2026-11-05  
> **Loyiha:** AloShop — Telefonlar do‘koni admin paneli  
> **Muallif:** Antigravity (AI Assistant) & Superadmin  
> **Holati:** Ko'rib chiqish va Tasdiqlash uchun

---

## 1. Kirish va Maqsad (Intent & Why)

AloShop — bu bir nechta jismoniy savdo nuqtalariga (masalan: *Malika, Chilonzor, Buyuk Ipak Yo‘li*) ega bo‘lgan telefonlar do‘koni tarmog‘idir. Har bir filial o‘zining mustaqil tovar qoldig‘iga (omborgacha), kassasiga, biriktirilgan filial adminiga va qabul qilinadigan buyurtmalariga ega.

Mavjud filiallar sahifasida (`/admin/branches`) filiallar 3 ustunli oddiy kartochkalarda ko‘rsatilgan, ammo:
1. Bir qarashda filiallarning holatini, mas'ul adminini va iqtisodiy ko‘rsatkichlarini (bugungi savdo, tovar qoldig‘i) qush nazari bilan ko‘rish imkoniyati yo‘q.
2. Har bir filial kartasida ma'lumotlar chalkash va to‘g‘ridan-to‘g‘ri kerakli filial omboriga (`/admin/inventory`) yoki sozlamalariga o‘tish amallari noqulay.
3. Mobil qurilmalarda kartalar ekranni to‘ldirib yuboradi, amallarni bajarish barmoq bilan ishlashga to‘liq moslashtirilmagan.

**Maqsad:**
Superadmin uchun barcha 3 ta filialni to‘liq nazorat qilish imkonini beruvchi, desktopda **Retail Store Hub (vizual 3 ustunli kartalar va KPI paneli)** hamda mobilda **ixcham ro‘yxat + pastdan ochiluvchi Bottom Sheet (Action Drawer)** interfeysini joriy qilish.

---

## 2. Maqsadlar, Nomahsulot Cheklovlar va Anti-maqsadlar

### Maqsadlar (Goals):
- **Yuqori KPI panel:** Jami filiallar, faol filiallar, bugungi umumiy savdo hajmi va eng faol filial ko‘rsatkichlarini bir joyda ko‘rsatish.
- **Desktop vizual kartalar (3 ustunli grid):** Har bir filial kartasida:
  - Filial nomi, shahar va faol/nofaol indikatori (pulsatsiyalanuvchi yashil/kulrang).
  - Mas'ul filial admini bloki (Avatar, ismi, `@username`).
  - Manzil va ish vaqti.
  - Asosiy metrikalar: ombordagi telefonlar soni, jami buyurtmalar soni.
  - To‘g‘ridan-to‘g‘ri **"Omborga o‘tish"** havolasi (`/admin/inventory?branchId=...`).
  - Filialni tahrirlash (ichida mas'ul adminni tanlash bilan) va o‘chirish (himoyalangan) tugmalari.
- **Mobil qulaylik:**
  - Alohida ixcham vertikal ro‘yxat (nomi, shahar, admin va holat nishoni).
  - Filial kartasiga teginganda pastdan silliq ochiluvchi **Bottom Sheet** (iOS/Telegram uslubi).
  - Mobil ekranning pastki o‘ng burchagida doim ko‘rinib turuvchi suzuvchi `+` tugmasi (**Floating Action Button - FAB**).
- **Admin biriktirish:** Filial yaratish yoki tahrirlash modalida tizimdagi faol `BRANCH_ADMIN` foydalanuvchilar orasidan mas'ul adminni tanlash imkoniyati.
- **100% i18n pariteti:** O‘zbek (`uz`), Rus (`ru`) va Ingliz (`en`) tillari, 0 ta emoji, `AGENTS.md` qoidalariga qat'iy rioya qilish.

### Anti-maqsadlar (Non-goals):
- Filiallar sahifasini murakkab buxgalteriya ERP tizimiga aylantirmaslik; ortiqcha grafiklar va yuklanuvchi jadvallar bilan yuklamaslik.
- O‘chirish jarayonida ma'lumotlar bazasida bog‘langan buyurtmalar yoki faol ombor qoldig‘i mavjud filialni tasodifan o‘chirishga yo‘l qo‘ymaslik (mavjud backend xavfsizlik cheklovlari saqlanadi).

---

## 3. Ko‘rib chiqilgan Yondashuvlar (Approaches)

| Yondashuv | Afzalliklari | Kamchiliklari | Xulosa |
|---|---|---|---|
| **1. Retail Store Hub (Tanlangan)** | Desktopda 3 ustunli axborotli kartalar + yuqori KPI, mobilda esa ixcham ro‘yxat + Bottom Sheet + FAB. 3 ta filial uchun ideal. | Yo‘q. Loyiha arxitekturasiga 100% mos. | **Tanlandi (Foydalanuvchi ma'qulladi)** |
| **2. Grid / Table Toggle** | Foydalanuvchi kartalar yoki jadval rejimini o‘zi tanlay oladi. | 3 ta filial mavjud bo‘lganda ikkita mustaqil ko‘rinishni ishlab chiqish ortiqcha murakkablik va kod hajmini oshiradi. | Rad etildi |
| **3. Expandable Rows (Kengayuvchi qatorlar)** | Qatorlar tor va ixcham ko‘rinadi. | Superadmin 3 ta filialni o‘zaro bir vaqtda solishtira olmaydi, har birini qo‘lda ochib chiqish kerak bo‘ladi. | Rad etildi |

---

## 4. Arxitektura va Komponentlar Loyihasi

### 4.1. Ma'lumotlar Oqimi (Data Layer)
`app/[locale]/admin/branches/page.tsx` faylida quyidagi ma'lumotlar yuklanadi:
1. **Filiallar:** `prisma.branch.findMany` orqali:
   - `users`: ushbu filialga biriktirilgan adminlar (`id, fullName, username, role`).
   - `inventory`: tovarlar soni yig‘indisi (`sum(quantity)`).
   - `_count`: `orders` (jami buyurtmalar) va `users` (xodimlar soni).
2. **Faol filial adminlari ro‘yxati:** `prisma.user.findMany({ where: { role: "BRANCH_ADMIN", isActive: true } })` — modal ichidagi dropdown uchun.
3. **Bugungi umumiy savdo va eng faol filial:** Bugungi buyurtmalar bo‘yicha agregatsiya.

### 4.2. UI Komponentlar Tuzilmasi

```
components/admin/branches-list-view.tsx
├── Top KPI Overview Cards (4 ta ko'rsatkich)
├── Search & Filter Bar (Qidiruv + Faol/Nofaol filtr + "Filial qo'shish" tugmasi)
├── Desktop View (hidden on mobile, grid-cols-1 md:grid-cols-2 xl:grid-cols-3)
│   └── BranchCard (Header, Admin Info, Address, Metrics, Action Buttons)
├── Mobile View (block on mobile, hidden on md)
│   ├── MobileBranchListItem (Touch-target >= 44px, status dot, chevron)
│   └── Floating Action Button (FAB "+" for mobile create)
├── Mobile Bottom Sheet (Dialog as Drawer)
│   ├── Branch Header & Status
│   ├── Responsible Admin Card (with click-to-call)
│   ├── Working Hours & Full Address
│   ├── Quick Metric Cards (Stock, Orders, Staff)
│   └── Actions (Go to Inventory, Edit Branch, Toggle Status, Delete)
├── Create / Edit Branch Modal
│   ├── Name, City, Address, Phone, Working Hours
│   ├── Responsible Branch Admin Selector (Select component)
│   └── Active Switch
└── Delete Confirmation Modal (with guard warnings)
```

---

## 5. Yangilanishlar va Funksiyalar Ro‘yxati

1. **KPI Dashboard Blok:**
   - Jami filiallar: `totalBranches`
   - Faol filiallar: `activeBranches`
   - Bugungi umumiy savdo: `todaySales` (so‘mda formatlangan)
   - Eng faol filial: `topBranchName`
2. **Mas'ul Admin Integratsiyasi:**
   - Filial yaratish/tahrirlash server amali (`createBranchAction` va `updateBranchAction`): tanlangan adminning `branchId` sini ushbu filialga yangilaydi.
   - Agar boshqa admin tanlansa, avvalgisidan filial yechiladi va yangisiga biriktiriladi.
3. **"Omborga o'tish" Tugmasi:**
   - Har bir karta pastida asosiy tugmalardan biri: `/admin/inventory?branchId=${branch.id}` sahifasiga yo‘naltiradi.
4. **Mobil Foydalanish Qulayligi:**
   - Mobil kartochkalar tegilganda pastdan ochiladigan Bottom Sheet drayveri (foydalanuvchilar sahifasida muvaffaqiyatli sinovdan o‘tgan yondashuv).
   - Pastki o‘ng burchakdagi suzuvchi `+` tugmasi (`fixed bottom-6 right-6 z-40 sm:hidden`).
5. **Dizayn va Standartlar:**
   - `components/ui/dialog.tsx` dagi tuzatilgan `DialogFooter` (`gap-2` mobil bo‘shliq) ishlatiladi.
   - Barcha tugmalar $\ge 44\text{px}$ touch o‘lchamiga ega bo‘ladi.
   - Zero emojis, 100% tarjima matnlari (`messages/uz.json`, `messages/ru.json`, `messages/en.json`).

---

## 6. Qabul qilish Mezonlari (Acceptance Criteria)

- [ ] Desktopda filiallar 3 ustunli zamonaviy kartalar gridida joylashadi.
- [ ] Har bir filial kartasida mas'ul filial admini (`fullName`, `@username`) va uning do‘kon bilan aloqa ma'lumoti ko‘rinadi.
- [ ] Tahrirlash modalida mas'ul adminni tanlash (yoki bo‘sh qoldirish) dropdown'i ishlaydi va saqlanganda bazada admin biriktiriladi.
- [ ] "Omborga o'tish" tugmasi bosilganda to‘g‘ridan-to‘g‘ri shu filial ombori ochiladi.
- [ ] Mobilda filial bosilganda iOS uslubidagi to‘liq Bottom Sheet ochiladi, barcha amallar qulay ishlaydi.
- [ ] Mobilda yangi filial qo‘shish uchun qulay FAB (`+`) tugmasi mavjud bo‘ladi.
- [ ] `npm run check-types` va `npx tsx scripts/test-i18n.ts` xatosiz (0 error) o‘tadi.
- [ ] O'zgarishlar GitHub `main` ga yuboriladi va Vercel production avtomatik deploy qiladi.

