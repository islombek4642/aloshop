import { PrismaClient, UserRole, OrderFulfillment, OrderStatus, PaymentType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // 1. Filiallar (Tashkent branches)
  const branchesData = [
    {
      name: "Malika Savdo Markazi",
      slug: "malika",
      city: "Toshkent",
      address: "Navoiy shoh ko'chasi, Malika savdo majmuasi, A-blok 14-do'kon",
      phone: "+998 71 200 11 22",
      workingHours: "09:00 - 20:00",
      isActive: true,
    },
    {
      name: "Chilonzor filiali",
      slug: "chilonzor",
      city: "Toshkent",
      address: "Chilonzor 9-mavze, Qatortol ko'chasi 1-uy",
      phone: "+998 71 200 33 44",
      workingHours: "09:00 - 21:00",
      isActive: true,
    },
    {
      name: "Buyuk Ipak Yo'li filiali",
      slug: "buyuk-ipak-yoli",
      city: "Toshkent",
      address: "Mirzo Ulug'bek shoh ko'chasi, Maksim Gorkiy metro bekati yaqinida",
      phone: "+998 71 200 55 66",
      workingHours: "09:00 - 21:00",
      isActive: true,
    },
  ];

  const branches = await Promise.all(
    branchesData.map((branch) =>
      prisma.branch.upsert({
        where: { slug: branch.slug },
        update: branch,
        create: branch,
      })
    )
  );
  console.log(`Created/updated ${branches.length} branches.`);

  const malikaBranch = branches.find((b) => b.slug === "malika")!;
  const chilonzorBranch = branches.find((b) => b.slug === "chilonzor")!;
  const biyBranch = branches.find((b) => b.slug === "buyuk-ipak-yoli")!;

  // 2. Admin foydalanuvchilar (Hashed passwords)
  const defaultPassword = await bcrypt.hash("admin12345", 10);
  const branchManagerPassword = await bcrypt.hash("manager123", 10);

  const usersData = [
    {
      username: "admin",
      fullName: "Bosh Administrator",
      passwordHash: defaultPassword,
      role: UserRole.SUPER_ADMIN,
      branchId: null,
    },
    {
      username: "admin_malika",
      fullName: "Malika Filial Menejeri",
      passwordHash: branchManagerPassword,
      role: UserRole.BRANCH_ADMIN,
      branchId: malikaBranch.id,
    },
    {
      username: "admin_chilonzor",
      fullName: "Chilonzor Filial Menejeri",
      passwordHash: branchManagerPassword,
      role: UserRole.BRANCH_ADMIN,
      branchId: chilonzorBranch.id,
    },
    {
      username: "admin_biy",
      fullName: "Buyuk Ipak Yo'li Filial Menejeri",
      passwordHash: branchManagerPassword,
      role: UserRole.BRANCH_ADMIN,
      branchId: biyBranch.id,
    },
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        fullName: user.fullName,
        passwordHash: user.passwordHash,
        role: user.role,
        branchId: user.branchId,
      },
      create: user,
    });
  }
  console.log(`Created/updated ${usersData.length} admin users.`);

  // 3. Kategoriyalar
  const categoriesData = [
    {
      nameUz: "Smartfonlar",
      nameRu: "Смартфоны",
      nameEn: "Smartphones",
      slug: "smartphones",
      image: "/images/categories/smartphones.webp",
    },
    {
      nameUz: "Aksessuarlar",
      nameRu: "Аксессуары",
      nameEn: "Accessories",
      slug: "accessories",
      image: "/images/categories/accessories.webp",
    },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: cat,
        create: cat,
      })
    )
  );
  console.log(`Created/updated ${categories.length} categories.`);

  const smartphonesCategory = categories.find((c) => c.slug === "smartphones")!;

  // 4. Mahsulotlar va variantlar
  const productsData = [
    {
      brand: "Apple",
      modelName: "iPhone 15 Pro",
      slug: "apple-iphone-15-pro",
      descriptionUz:
        "Apple A17 Pro 3nm protsessori, yengil va mustahkam aerokosmik titan korpus, Dynamic Island hamda yangi moslashtiriladigan Action tugmasiga ega eng ilg'or flagman smartfon.",
      descriptionRu:
        "Передовой флагманский смартфон с титановым корпусом аэрокосмического класса, процессором A17 Pro (3 нм), Dynamic Island и настраиваемой кнопкой Action.",
      descriptionEn:
        "Flagship smartphone featuring aerospace-grade titanium design, A17 Pro 3nm chip, Dynamic Island, and the customizable Action button.",
      warrantyMonths: 12,
      categoryId: smartphonesCategory.id,
      variants: [
        {
          sku: "IP15P-NAT-128",
          colorNameUz: "Tabiiy titan",
          colorNameRu: "Натуральный титан",
          colorNameEn: "Natural Titanium",
          colorHex: "#9A958E",
          storage: "128GB",
          condition: "NEW",
          price: 13800000,
          oldPrice: 14500000,
          images: [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 4, chilonzor: 2, biy: 1 },
        },
        {
          sku: "IP15P-NAT-256",
          colorNameUz: "Tabiiy titan",
          colorNameRu: "Натуральный титан",
          colorNameEn: "Natural Titanium",
          colorHex: "#9A958E",
          storage: "256GB",
          condition: "NEW",
          price: 15200000,
          oldPrice: 16000000,
          images: [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 5, chilonzor: 3, biy: 2 },
        },
        {
          sku: "IP15P-NAT-512",
          colorNameUz: "Tabiiy titan",
          colorNameRu: "Натуральный титан",
          colorNameEn: "Natural Titanium",
          colorHex: "#9A958E",
          storage: "512GB",
          condition: "NEW",
          price: 17500000,
          oldPrice: null,
          images: [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 2, chilonzor: 1, biy: 0 },
        },
        {
          sku: "IP15P-BLK-128",
          colorNameUz: "Qora titan",
          colorNameRu: "Черный титан",
          colorNameEn: "Black Titanium",
          colorHex: "#3C3B3D",
          storage: "128GB",
          condition: "NEW",
          price: 13800000,
          oldPrice: 14500000,
          images: [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 3, chilonzor: 2, biy: 1 },
        },
        {
          sku: "IP15P-BLK-256",
          colorNameUz: "Qora titan",
          colorNameRu: "Черный титан",
          colorNameEn: "Black Titanium",
          colorHex: "#3C3B3D",
          storage: "256GB",
          condition: "NEW",
          price: 15200000,
          oldPrice: 16000000,
          images: [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 4, chilonzor: 2, biy: 2 },
        },
        {
          sku: "IP15P-BLU-128",
          colorNameUz: "Ko'k titan",
          colorNameRu: "Синий титан",
          colorNameEn: "Blue Titanium",
          colorHex: "#2E3642",
          storage: "128GB",
          condition: "NEW",
          price: 13800000,
          oldPrice: 14500000,
          images: [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 3, chilonzor: 1, biy: 1 },
        },
        {
          sku: "IP15P-BLU-256",
          colorNameUz: "Ko'k titan",
          colorNameRu: "Синий титан",
          colorNameEn: "Blue Titanium",
          colorHex: "#2E3642",
          storage: "256GB",
          condition: "NEW",
          price: 15200000,
          oldPrice: 16000000,
          images: [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 4, chilonzor: 2, biy: 0 },
        },
      ],
    },
    {
      brand: "Apple",
      modelName: "iPhone 15",
      slug: "apple-iphone-15",
      descriptionUz:
        "Dynamic Island innovatsion bildirishnoma paneli, 48 megapikselli o'ta tiniq asosiy kamera va kun bo'yi yetadigan quvvat bilan jihozlangan universal smartfon.",
      descriptionRu:
        "Универсальный смартфон с инновационным Dynamic Island, сверхчеткой 48-мегапиксельной камерой и емким аккумулятором на весь день.",
      descriptionEn:
        "Universal smartphone featuring the innovative Dynamic Island, 48MP high-resolution camera, and all-day battery life.",
      warrantyMonths: 12,
      categoryId: smartphonesCategory.id,
      variants: [
        {
          sku: "IP15-BLU-128",
          colorNameUz: "Moviy",
          colorNameRu: "Голубой",
          colorNameEn: "Blue",
          colorHex: "#D4E1E8",
          storage: "128GB",
          condition: "NEW",
          price: 10200000,
          oldPrice: 10800000,
          images: [
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 6, chilonzor: 3, biy: 2 },
        },
        {
          sku: "IP15-BLU-256",
          colorNameUz: "Moviy",
          colorNameRu: "Голубой",
          colorNameEn: "Blue",
          colorHex: "#D4E1E8",
          storage: "256GB",
          condition: "NEW",
          price: 11600000,
          oldPrice: null,
          images: [
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 4, chilonzor: 2, biy: 1 },
        },
        {
          sku: "IP15-PNK-128",
          colorNameUz: "Pushti",
          colorNameRu: "Розовый",
          colorNameEn: "Pink",
          colorHex: "#F2D8D8",
          storage: "128GB",
          condition: "NEW",
          price: 10200000,
          oldPrice: 10800000,
          images: [
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 3, chilonzor: 2, biy: 0 },
        },
        {
          sku: "IP15-PNK-256",
          colorNameUz: "Pushti",
          colorNameRu: "Розовый",
          colorNameEn: "Pink",
          colorHex: "#F2D8D8",
          storage: "256GB",
          condition: "NEW",
          price: 11600000,
          oldPrice: null,
          images: [
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 2, chilonzor: 1, biy: 1 },
        },
        {
          sku: "IP15-BLK-128",
          colorNameUz: "Qora",
          colorNameRu: "Черный",
          colorNameEn: "Black",
          colorHex: "#35393B",
          storage: "128GB",
          condition: "NEW",
          price: 10200000,
          oldPrice: 10800000,
          images: [
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 5, chilonzor: 4, biy: 3 },
        },
        {
          sku: "IP15-BLK-256",
          colorNameUz: "Qora",
          colorNameRu: "Черный",
          colorNameEn: "Black",
          colorHex: "#35393B",
          storage: "256GB",
          condition: "NEW",
          price: 11600000,
          oldPrice: null,
          images: [
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 4, chilonzor: 2, biy: 2 },
        },
      ],
    },
    {
      brand: "Samsung",
      modelName: "Galaxy S24 Ultra",
      slug: "samsung-galaxy-s24-ultra",
      descriptionUz:
        "Galaxy AI sun'iy intellekt texnologiyalari, titan ramka, 200 megapikselli kamera hamda ichki S Pen ruchkasi bilan ta'minlangan Samsung flagmani.",
      descriptionRu:
        "Флагман Samsung с искусственным интеллектом Galaxy AI, титановым корпусом, камерой 200 Мп и встроенным электронным пером S Pen.",
      descriptionEn:
        "Samsung's top-tier smartphone featuring Galaxy AI, titanium frame, 200MP camera system, and integrated S Pen stylus.",
      warrantyMonths: 12,
      categoryId: smartphonesCategory.id,
      variants: [
        {
          sku: "S24U-TGR-256",
          colorNameUz: "Kulrang titan",
          colorNameRu: "Серый титан",
          colorNameEn: "Titanium Gray",
          colorHex: "#74726E",
          storage: "256GB",
          condition: "NEW",
          price: 14200000,
          oldPrice: 15000000,
          images: [
            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 5, chilonzor: 3, biy: 2 },
        },
        {
          sku: "S24U-TGR-512",
          colorNameUz: "Kulrang titan",
          colorNameRu: "Серый титан",
          colorNameEn: "Titanium Gray",
          colorHex: "#74726E",
          storage: "512GB",
          condition: "NEW",
          price: 16100000,
          oldPrice: null,
          images: [
            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 3, chilonzor: 1, biy: 1 },
        },
        {
          sku: "S24U-TBK-256",
          colorNameUz: "Qora titan",
          colorNameRu: "Черный титан",
          colorNameEn: "Titanium Black",
          colorHex: "#323031",
          storage: "256GB",
          condition: "NEW",
          price: 14200000,
          oldPrice: 15000000,
          images: [
            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 4, chilonzor: 2, biy: 2 },
        },
        {
          sku: "S24U-TBK-512",
          colorNameUz: "Qora titan",
          colorNameRu: "Черный титан",
          colorNameEn: "Titanium Black",
          colorHex: "#323031",
          storage: "512GB",
          condition: "NEW",
          price: 16100000,
          oldPrice: null,
          images: [
            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 2, chilonzor: 1, biy: 0 },
        },
      ],
    },
    {
      brand: "Xiaomi",
      modelName: "Xiaomi 14",
      slug: "xiaomi-14",
      descriptionUz:
        "Leica Summilux professional optikasi, ixcham 6.36 dyuymli ekran va eng so'nggi Snapdragon 8 Gen 3 protsessoriga ega flagman smartfon.",
      descriptionRu:
        "Компактный флагман с оптикой Leica Summilux, удобным экраном 6.36 дюйма и мощнейшим процессором Snapdragon 8 Gen 3.",
      descriptionEn:
        "Compact flagship with Leica Summilux optics, 6.36-inch display, and Snapdragon 8 Gen 3 chipset.",
      warrantyMonths: 12,
      categoryId: smartphonesCategory.id,
      variants: [
        {
          sku: "MI14-BLK-256",
          colorNameUz: "Qora",
          colorNameRu: "Черный",
          colorNameEn: "Black",
          colorHex: "#1F1F1F",
          storage: "256GB",
          condition: "NEW",
          price: 8900000,
          oldPrice: 9500000,
          images: [
            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 4, chilonzor: 3, biy: 1 },
        },
        {
          sku: "MI14-BLK-512",
          colorNameUz: "Qora",
          colorNameRu: "Черный",
          colorNameEn: "Black",
          colorHex: "#1F1F1F",
          storage: "512GB",
          condition: "NEW",
          price: 9900000,
          oldPrice: null,
          images: [
            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 3, chilonzor: 1, biy: 0 },
        },
        {
          sku: "MI14-WHT-256",
          colorNameUz: "Oq",
          colorNameRu: "Белый",
          colorNameEn: "White",
          colorHex: "#F5F5F7",
          storage: "256GB",
          condition: "NEW",
          price: 8900000,
          oldPrice: 9500000,
          images: [
            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 3, chilonzor: 2, biy: 1 },
        },
        {
          sku: "MI14-WHT-512",
          colorNameUz: "Oq",
          colorNameRu: "Белый",
          colorNameEn: "White",
          colorHex: "#F5F5F7",
          storage: "512GB",
          condition: "NEW",
          price: 9900000,
          oldPrice: null,
          images: [
            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
          ],
          inventory: { malika: 2, chilonzor: 1, biy: 1 },
        },
      ],
    },
  ];

  let totalVariants = 0;
  let totalImeiRecords = 0;
  let imeiCounter = 1000;

  for (const productData of productsData) {
    const { variants, ...productFields } = productData;

    const product = await prisma.product.upsert({
      where: { slug: productFields.slug },
      update: productFields,
      create: productFields,
    });

    for (const variantData of variants) {
      const { inventory, ...variantFields } = variantData;

      const variant = await prisma.productVariant.upsert({
        where: { sku: variantFields.sku },
        update: {
          ...variantFields,
          productId: product.id,
        },
        create: {
          ...variantFields,
          productId: product.id,
        },
      });
      totalVariants++;

      // Filial qoldiqlari (Multi-branch inventory)
      const branchInventories = [
        { branchId: malikaBranch.id, quantity: inventory.malika },
        { branchId: chilonzorBranch.id, quantity: inventory.chilonzor },
        { branchId: biyBranch.id, quantity: inventory.biy },
      ];

      for (const inv of branchInventories) {
        await prisma.branchInventory.upsert({
          where: {
            branchId_variantId: {
              branchId: inv.branchId,
              variantId: variant.id,
            },
          },
          update: { quantity: inv.quantity },
          create: {
            branchId: inv.branchId,
            variantId: variant.id,
            quantity: inv.quantity,
          },
        });
      }

      // Sample IMEI records for in-stock devices
      const totalStock = inventory.malika + inventory.chilonzor + inventory.biy;
      for (let i = 0; i < Math.min(totalStock, 2); i++) {
        imeiCounter++;
        const sampleImei = `86543206${imeiCounter.toString().padStart(7, "0")}`;
        await prisma.iMEIRecord.upsert({
          where: { imeiNumber: sampleImei },
          update: { variantId: variant.id, status: "IN_STOCK" },
          create: {
            variantId: variant.id,
            imeiNumber: sampleImei,
            status: "IN_STOCK",
          },
        });
        totalImeiRecords++;
      }
    }
  }

  console.log(`Created/updated ${productsData.length} products with ${totalVariants} variants.`);
  console.log(`Created/updated ${totalImeiRecords} IMEI inventory records.`);

  // 5. Namunaviy Buyurtmalar (Sample Orders)
  const sampleVariant = await prisma.productVariant.findUnique({
    where: { sku: "IP15P-NAT-128" },
  });

  if (sampleVariant) {
    const sampleOrderNumber = "ALO-20261029-001";
    await prisma.order.upsert({
      where: { orderNumber: sampleOrderNumber },
      update: {},
      create: {
        orderNumber: sampleOrderNumber,
        customerName: "Anvar Qosimov",
        customerPhone: "+998 90 123 45 67",
        fulfillmentType: OrderFulfillment.PICKUP_FROM_BRANCH,
        pickupBranchId: malikaBranch.id,
        notes: "Mijoz soat 17:00 da Malika filialidan olib ketadi.",
        totalAmount: sampleVariant.price,
        status: OrderStatus.CONFIRMED,
        paymentType: PaymentType.PAY_AT_BRANCH,
        isPaid: false,
        items: {
          create: [
            {
              variantId: sampleVariant.id,
              quantity: 1,
              unitPrice: sampleVariant.price,
            },
          ],
        },
      },
    });
    console.log(`Created/updated sample pickup order: ${sampleOrderNumber}`);
  }

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
