import { PrismaClient, UserRole, OrderFulfillment, OrderStatus, PaymentType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATALOG_PRESETS, type CatalogPreset, generateSku } from "../lib/catalog/presets";
import { getSuggestedPriceForModel } from "../lib/catalog/pricing";

const prisma = new PrismaClient();

async function main() {
  console.log("===============================================================");
  console.log("AloShop: Seeding Official 41-Smartphone Catalog into Database");
  console.log("===============================================================\n");

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
  console.log(`[PASS] Configured ${branches.length} branches.`);

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
  console.log(`[PASS] Configured ${usersData.length} admin accounts.`);

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
  console.log(`[PASS] Configured ${categories.length} categories.`);

  const smartphonesCategory = categories.find((c) => c.slug === "smartphones")!;

  const isProduction = process.env.NODE_ENV === "production";
  const forceClean = process.argv.includes("--force-clean");

  if (isProduction && !forceClean) {
    console.warn("[SAFETY GUARD] Seed script running in production without --force-clean flag.");
    console.warn("[SAFETY GUARD] Skipping destructive deletion to protect customer orders, inventory, and IMEI records.");
  } else {
    // 4. Eski namunaviy mahsulotlarni tozalash (Purge old dummy products in development)
    console.log("\nPurging old hardcoded dummy products...");
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.iMEIRecord.deleteMany({});
    await prisma.branchInventory.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    console.log("[PASS] Old products purged cleanly.");
  }

  // 5. Barcha 41 ta smartfonni joylash (Seed all 41 phones from data)
  console.log(`\nSeeding ${CATALOG_PRESETS.length} official smartphones from data/...`);

  let totalVariants = 0;
  let totalImeiRecords = 0;
  let imeiCounter = 1000000;
  let firstVariantId: string | null = null;
  let firstVariantPrice = 0;
  const usedSkus = new Set<string>();

  for (const preset of CATALOG_PRESETS) {
    const product = await prisma.product.create({
      data: {
        brand: preset.brand,
        modelName: preset.modelName,
        slug: preset.slug,
        series: preset.series,
        releaseYear: preset.releaseYear,
        screenSize: preset.screenSize,
        processor: preset.processor,
        battery: preset.battery,
        camera: preset.camera,
        charging: preset.charging,
        os: preset.os,
        warrantyMonths: preset.warrantyMonths,
        descriptionUz: preset.descriptionUz,
        descriptionRu: preset.descriptionRu,
        descriptionEn: preset.descriptionEn,
        categoryId: smartphonesCategory.id,
      },
    });

    // Seed top 2 storage options for each model to provide rich, realistic configurations
    const seedStorages = preset.storageOptions.slice(0, 2);

    for (const storage of seedStorages) {
      const { price, oldPrice } = getSuggestedPriceForModel(
        preset.brand,
        preset.modelName,
        storage
      );

      for (const color of preset.colors) {



        const baseSku = generateSku(preset.brand, preset.modelName, storage, color.nameEn);
        let sku = baseSku;
        let suffix = 1;
        while (usedSkus.has(sku)) {
          sku = `${baseSku}-${suffix++}`;
        }
        usedSkus.add(sku);

        const images = color.imageUrl ? [color.imageUrl] : ["/images/products/placeholder.webp"];

        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            colorNameUz: color.nameUz,
            colorNameRu: color.nameRu,
            colorNameEn: color.nameEn,
            colorHex: color.hex,
            ram: preset.ram,
            storage,
            condition: "NEW",
            price,
            oldPrice,
            images,
          },
        });

        totalVariants++;
        if (!firstVariantId) {
          firstVariantId = variant.id;
          firstVariantPrice = price;
        }

        // Multi-branch realistic inventory distribution
        const branchInventories = [
          { branchId: malikaBranch.id, quantity: Math.floor(3 + Math.random() * 4) },
          { branchId: chilonzorBranch.id, quantity: Math.floor(2 + Math.random() * 3) },
          { branchId: biyBranch.id, quantity: Math.floor(1 + Math.random() * 3) },
        ];

        for (const inv of branchInventories) {
          await prisma.branchInventory.create({
            data: {
              branchId: inv.branchId,
              variantId: variant.id,
              quantity: inv.quantity,
            },
          });
        }

        // Sample IMEI serial numbers
        const totalStock = branchInventories.reduce((acc, cur) => acc + cur.quantity, 0);
        for (let i = 0; i < Math.min(totalStock, 2); i++) {
          imeiCounter++;
          const sampleImei = `86543206${imeiCounter.toString()}`;
          await prisma.iMEIRecord.create({
            data: {
              variantId: variant.id,
              imeiNumber: sampleImei,
              status: "IN_STOCK",
            },
          });
          totalImeiRecords++;
        }
      }
    }
  }

  console.log(`[PASS] Successfully created ${CATALOG_PRESETS.length} products with ${totalVariants} variants.`);
  console.log(`[PASS] Created ${totalImeiRecords} IMEI inventory tracking records.`);

  // 6. Namunaviy buyurtma (Sample Order)
  if (firstVariantId) {
    const sampleOrderNumber = "ALO-20261103-001";
    await prisma.order.create({
      data: {
        orderNumber: sampleOrderNumber,
        customerName: "Anvar Qosimov",
        customerPhone: "+998 90 123 45 67",
        fulfillmentType: OrderFulfillment.PICKUP_FROM_BRANCH,
        pickupBranchId: malikaBranch.id,
        notes: "Mijoz soat 17:00 da Malika filialidan olib ketadi.",
        totalAmount: firstVariantPrice,
        status: OrderStatus.CONFIRMED,
        paymentType: PaymentType.PAY_AT_BRANCH,
        isPaid: false,
        items: {
          create: [
            {
              variantId: firstVariantId,
              quantity: 1,
              unitPrice: firstVariantPrice,
            },
          ],
        },
      },
    });
    console.log(`[PASS] Created sample verified order: ${sampleOrderNumber}`);
  }

  console.log("\n===============================================================");
  console.log("Database Seed SUCCEEDED! All 41 Phones Live in PostgreSQL.");
  console.log("===============================================================\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
