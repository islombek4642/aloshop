# AloShop — Ko'p Filialli Telefon Do'koni Arxitektura Dizayn Hujjati (Design Document)

**Sana:** 2026-10-29  
**Status:** Tasdiqlash uchun yakuniy loyiha  
**Muallif:** AI Muhandis & AloShop Asoschisi  

---

## 1. Kontekst va Maqsad (Context & Intent)

### 1.1. Maqsad (Why)
O'zbekiston bozorida smartfon va gadjetlar savdosi asosan mobil qurilmalar orqali amalga oshiriladi. Do'konning bir nechta filiallari (masalan: Malika, Chilonzor, Samarqand) mavjud bo'lib, xaridorlarga:
- Telefonning aniq parametrlarini (xotira: 128GB/256GB, rangi, holati: yangi/b-u) tanlash;
- Qaysi filialda aynan shu konfiguratsiya mavjudligini ko'rish;
- O'zbekcha (`uz`), Ruscha (`ru`), Inglizcha (`en`) tillarida erkin foydalanish;
- Hech qanday murakkab ro'yxatdan o'tishlarsiz (SMS kutmasdan) tezkor (1-Click) buyurtma berish;
- O'ziga yaqin filialdan olib ketish (Self-pickup) yoki manzilga yetkazib berish (Delivery) imkoniyati kerak.

---

## 2. Asosiy Biznes Qarorlari (Confirmed Decisions)

| Yo'nalish | Tanlangan Qaror | Sababi va Xususiyati |
| :--- | :--- | :--- |
| **To'lov usuli (Payments)** | **Naqd / Yetkazilganda to'lash / Filialda to'lash** | Hozir 1-bosqichda Click/Payme shlyuzlari ulanmaydi (keraksiz byurokratiya va merchant kalitlarini kutmaslik uchun). Baza sxemasida esa kelajakda ulashga 100% tayyor qilinadi. |
| **Admin Avtorizatsiya (Auth)** | **SuperAdmin (.env) + Filial Adminlari (Baza)** | `.env` orqali bosh rahbar (SuperAdmin) kiradi. SuperAdmin admin panel orqali har bir filial uchun alohida oddiy adminlarni (`BRANCH_ADMIN`) yaratadi. Ular faqat o'z filialining qoldiqlari va buyurtmalarini ko'radi. |
| **Mijozlar buyurtmasi (Checkout)** | **Tezkor 1-Click xarid (Guest Checkout)** | Xaridorni ro'yxatdan o'tish yoki SMS kod bilan ushlab turilmaydi. Ism, telefon raqami va manzil/filial kiritiladi — buyurtma tushadi. |
| **IMEI hisobi** | **Baza tayyorlangan (Phase 2 uchun rezerv)** | 1-bosqichda qoldiqlar son bo'yicha (`quantity`), Phase 2 da (POS yoqilganda) har bir donaning 15 xonali IMEI kodi ishga tushadi. |

---

## 3. Loyiha Arxitekturasi va Qatlamlar (Separation of Concerns)

```
alo_shop/
├── app/
│   ├── [locale]/
│   │   ├── (store)/                 # Xaridorlar uchun do'kon (Mobile-First)
│   │   │   ├── page.tsx             # Bosh sahifa (Banner, Kategoriyalar, Ommabop telefonlar)
│   │   │   ├── catalog/             # Katalog & Aqlli filtrlar (Brend, Narx, Xotira, Filial)
│   │   │   ├── product/[slug]/      # Telefon batafsil (Variantlar selektori, Filial qoldiqlari)
│   │   │   ├── cart/                # Savatcha
│   │   │   ├── checkout/            # Tezkor buyurtma (Yetkazib berish yoki Filialdan olib ketish)
│   │   │   └── branches/            # Filiallar ro'yxati, manzillari va telefonlari
│   │   ├── admin/                   # Boshqaruv paneli
│   │   │   ├── login/               # Admin kirish sahifasi
│   │   │   ├── dashboard/           # Savdo va filiallar statistikasi
│   │   │   ├── products/            # Tovar va variantlarni boshqarish
│   │   │   ├── branches/            # Filiallarni boshqarish va tovar ko'chirish
│   │   │   ├── orders/              # Buyurtmalar holatini yangilash
│   │   │   └── users/               # Filial adminlarini yaratish (faqat SuperAdmin uchun)
│   │   └── layout.tsx               # Root layout (i18n Provider, Toast, Theme)
├── components/
│   ├── ui/                          # Atomar komponentlar (Button, Input, Dialog, Select...)
│   ├── shared/                      # Umumiy komponentlar (PriceFormatter, LanguageSwitcher)
│   ├── store/                       # Do'kon komponentlari (ProductCard, VariantSelector, BranchBadge)
│   └── admin/                       # Admin komponentlari (ProductForm, BranchStockManager, OrderStatusModal)
├── messages/                        # Qat'iy i18n lug'atlari (Qo'lda so'z yozish taqiqlanadi!)
│   ├── uz.json                      # O'zbekcha
│   ├── ru.json                      # Ruscha
│   └── en.json                      # Inglizcha
├── lib/
│   ├── db/                          # Prisma Client
│   ├── auth/                        # SuperAdmin (.env) va JWT/Session tekshiruvi
│   ├── constants/                   # Loyiha konstantalari (tillar, buyurtma statuslari, valyuta)
│   └── utils/                       # Umumiy yordamchilar (narx formatlash, slug)
├── prisma/
│   ├── schema.prisma                # Baza arxitekturasi
│   └── seed.ts                      # Demo filiallar (Malika, Chilonzor...) va telefonlar
├── AGENTS.md                        # Muhandislik qoidalari va standartlari
├── next.config.ts                   # Next.js & next-intl sozlamalari
└── tailwind.config.ts               # Anti-slop stil tizimi
```

---

## 4. Ma'lumotlar Bazasi Sxemasi (Prisma Models)

```prisma
// Filiallar
model Branch {
  id           String            @id @default(cuid())
  name         String
  slug         String            @unique
  city         String            @default("Toshkent")
  address      String
  phone        String
  workingHours String
  isActive     Boolean           @default(true)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  
  inventory    BranchInventory[]
  users        User[]
  orders       Order[]           @relation("PickupBranch")
}

// Admin foydalanuvchilar (SuperAdmin env orqali, Filial adminlari baza orqali)
enum UserRole {
  SUPER_ADMIN
  BRANCH_ADMIN
}

model User {
  id           String    @id @default(cuid())
  username     String    @unique
  passwordHash String
  fullName     String
  role         UserRole  @default(BRANCH_ADMIN)
  branchId     String?
  branch       Branch?   @relation(fields: [branchId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

// Kategoriyalar
model Category {
  id          String    @id @default(cuid())
  nameUz      String
  nameRu      String
  nameEn      String
  slug        String    @unique
  image       String?
  products    Product[]
}

// Telefon/Mahsulot umumiy modeli
model Product {
  id             String           @id @default(cuid())
  brand          String           // Apple, Samsung, Xiaomi
  modelName      String           // iPhone 15 Pro, Galaxy S24 Ultra
  slug           String           @unique
  descriptionUz  String           @db.Text
  descriptionRu  String           @db.Text
  descriptionEn  String           @db.Text
  warrantyMonths Int              @default(12)
  categoryId     String
  category       Category         @relation(fields: [categoryId], references: [id])
  variants       ProductVariant[]
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
}

// Aniq konfiguratsiya (Rang, Xotira, Narx)
model ProductVariant {
  id          String            @id @default(cuid())
  productId   String
  product     Product           @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku         String            @unique
  colorNameUz String
  colorNameRu String
  colorNameEn String
  colorHex    String            // Masalan: #2C2C2E (Space Gray)
  storage     String            // 128GB, 256GB, 512GB, 1TB
  condition   String            @default("NEW") // NEW, USED (B/U)
  price       Decimal           @db.Decimal(12, 2) // So'mda
  oldPrice    Decimal?          @db.Decimal(12, 2)
  images      String[]          // Rasm URL lari
  
  inventory   BranchInventory[]
  orderItems  OrderItem[]
  imeiRecords IMEIRecord[]
}

// Filiallar bo'yicha tovar qoldig'i
model BranchInventory {
  id          String         @id @default(cuid())
  branchId    String
  branch      Branch         @relation(fields: [branchId], references: [id], onDelete: Cascade)
  variantId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  quantity    Int            @default(0)

  @@unique([branchId, variantId])
}

// Kelajakdagi POS va kafolat uchun IMEI zaxirasi
model IMEIRecord {
  id          String         @id @default(cuid())
  variantId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id])
  imeiNumber  String         @unique
  status      String         @default("IN_STOCK") // IN_STOCK, SOLD
  createdAt   DateTime       @default(now())
}

// Buyurtmalar
enum OrderFulfillment {
  PICKUP_FROM_BRANCH
  DELIVERY
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentType {
  CASH_ON_DELIVERY
  PAY_AT_BRANCH
  CARD_ON_DELIVERY
}

model Order {
  id              String           @id @default(cuid())
  orderNumber     String           @unique
  customerName    String
  customerPhone   String
  fulfillmentType OrderFulfillment
  pickupBranchId  String?
  pickupBranch    Branch?          @relation("PickupBranch", fields: [pickupBranchId], references: [id])
  deliveryAddress String?
  notes           String?
  totalAmount     Decimal          @db.Decimal(12, 2)
  status          OrderStatus      @default(PENDING)
  paymentType     PaymentType      @default(CASH_ON_DELIVERY)
  isPaid          Boolean          @default(false)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  items           OrderItem[]
}

model OrderItem {
  id          String         @id @default(cuid())
  orderId     String
  order       Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variantId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id])
  quantity    Int
  unitPrice   Decimal        @db.Decimal(12, 2)
}
```

---

## 5. UI / UX Standartlari va Telefon Do'koni Tajribasi (Anti-UI Slop)

1. **Zero Emojis Qoidasi (Emojilar qat'iyan taqiqlanadi):** Tugmalar, menyu, sarlavhalar, badge va bildirishnomalarda arzon va havaskorona Unicode emojilardan (📱, 🛒, 🔥, ⚡, 📦) foydalanish butunlay taqiqlanadi.
2. **Professional Vektor Ikonlar (Lucide Icons, Iconify):** Barcha piktogrammalar faqat rasmiy professional SVG/vektor kutubxonalar (`lucide-react`, `@iconify/react`) orqali bir xil chiziq qalinligi (stroke-width) va zamonaviy premium o'lchamlarda beriladi.
3. **Mobile-First Ustuvorligi:** O'zbekistonda 85%+ xarid telefondan amalga oshiriladi. Pastki qulay navigatsiya (Bottom Navigation: Bosh sahifa, Katalog, Savatcha, Filiallar).
4. **Variant Selektori:**
   - Ranglar: Doira shaklidagi rang tugmalari (swatches). Rang tanlanganda telefon rasmi reaktiv o'zgaradi.
   - Xotira: Katta, bosishga qulay tugmalar (`128GB`, `256GB`, `512GB`). Tanlanganda narx darhol yangilanadi.
5. **Filial Qoldiqlari Vidjeti:**
   - Telefon sahifasida: *"Malika: 3 dona bor (Yashil)", "Chilonzor: Mavjud emas (Kulrang)"*.
6. **Narxlar va Format:**
   - Barcha narxlar o'zbek so'mida probellar bilan ajratilgan: `14 850 000 so'm`.

---

## 7. Xavfsizlik Arxitekturasi (Security Architecture)

1. **Maxfiy kalitlar xavfsizligi (.env & Secrets):**
   - Baza sirlari (`DATABASE_URL`, `DIRECT_URL`), `SUPER_ADMIN_PASSWORD` va JWT kalitlari faqat server muhitida saqlanadi. Hech qachon brauzer kodiga (`NEXT_PUBLIC_`) chiqarilmaydi va git repozitoriyga commit qilinmaydi.
2. **Kiritishlarni qat'iy tekshirish (Zod Validation):**
   - Har bir Server Action va API endpoint orqali keladigan ma'lumotlar (telefon raqami, ism, variant tanlovi, filial ID) Zod orqali qat'iy tekshiriladi va tozalanadi. SQL Injection va XSS xavfi 0 ga tenglashtiriladi.
3. **Admin Avtorizatsiya & RBAC (Role-Based Access Control):**
   - Parollar bcrypt orqali hashlanadi. Sessiyalar xavfsiz `httpOnly` shifrlangan cookie-fayllarda saqlanadi.
   - `/admin/*` yo'llari Next.js Middleware orqali himoyalanadi.
   - Filial admini faqat o'ziga biriktirilgan `branchId` ma'lumotlarini ko'ra olishi har bir server so'rovida qat'iy tekshiriladi (IDOR himoyasi).
4. **Spam va Botlardan himoya (Rate Limiting & Honeypot):**
   - Checkout (buyurtma berish) va login urinishlariga IP bo'yicha Rate Limiting qo'yiladi.
   - Soxta avtomatlashgan buyurtmalarni bloklash uchun ko'rinmas Honeypot maydoni qo'llaniladi.
5. **Xavfsiz HTTP Sarlavhalari (Security Headers):**
   - Clickjacking (X-Frame-Options: DENY), Sniffing (X-Content-Type-Options: nosniff), va CSP himoyasi ta'minlanadi.

---

## 8. Joylashtirish va Bulutli Baza (Deployment: Vercel + Supabase)

- **Hosting & CI/CD:** **Vercel**
  - Next.js uchun eng maqbul serverless muhit. Har bir git commit uchun avtomatik preview link yaratiladi va buyurtmachi/xaridorga telefon orqali ko'rsatish uchun tayyor bo'ladi.
- **Ma'lumotlar Bazasi:** **Supabase PostgreSQL**
  - Bulutli boshqariladigan PostgreSQL bazasi. Connection pooling (PgBouncer) orqali Vercel serverless funksiyalaridan uzluksiz va tezkor ulanishni ta'minlaydi.
  - Boshqaruv paneli (Table Editor) orqali baza holatini vizual ko'rish juda oson.

---

## 9. Bosqichma-bosqich Reja (Implementation Roadmap)

1. **1-Qadam: Scaffolding & Core Setup**
   - Next.js 15, TypeScript, Tailwind CSS, shadcn/ui o'rnatish;
   - `next-intl` (uz, ru, en) va i18n lug'at strukturasini yaratish;
   - `AGENTS.md` qoidalariga mos arxitektura va layoutlarni sozlash.
2. **2-Qadam: Database & Prisma Setup (Supabase)**
   - Prisma schema, Supabase PostgreSQL aloqasi va migratsiyalar;
   - Filiallar (Malika, Chilonzor) va ommabop telefonlar (iPhone 15 Pro, Samsung S24) bilan seed yaratish.
3. **3-Qadam: Storefront (Mijozlar do'koni)**
   - Bosh sahifa, Katalog va aqlli filtrlar;
   - Telefon sahifasi (variantlar, narx, filial qoldiqlari);
   - Savatcha va 1-Click tezkor buyurtma (Pickup vs Delivery).
4. **4-Qadam: Admin Panel & Xavfsizlik**
   - SuperAdmin (.env) login tizimi, Middleware himoyasi;
   - Mahsulotlar va filiallar qoldig'ini boshqarish;
   - Filial adminlarini yaratish va buyurtmalar nazorati.
5. **5-Qadam: To'liq Test, Polishing & Vercel Deploy**
   - 3 tilda to'liq tekshiruv (zero hardcoding);
   - Mobil telefonda UI/UX sinovlari;
   - Vercel ga joylashtirish va xaridorga ko'rsatishga tayyorlash.

---

> [!NOTE]
> Ushbu hujjat barcha talablar, xavfsizlik qoidalari va infratuzilmani (Vercel + Supabase) to'liq o'z ichiga oladi.
