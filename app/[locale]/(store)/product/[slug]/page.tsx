import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db/prisma";
import {
  ProductDetailsClient,
  type SerializedProduct,
} from "@/components/store/product-details-client";
import type { BranchStockItem } from "@/components/store/branch-stock-widget";
import type { ProductVariantData } from "@/components/store/variant-selector";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const FALLBACK_BRANCHES: BranchStockItem[] = [
  {
    id: "b1",
    name: "Malika Savdo Markazi",
    slug: "malika",
    city: "Toshkent",
    address: "Navoiy shoh ko'chasi, Malika SM, A-blok 14-do'kon",
    phone: "+998 71 200 11 22",
    workingHours: "09:00 - 20:00",
  },
  {
    id: "b2",
    name: "Chilonzor filiali",
    slug: "chilonzor",
    city: "Toshkent",
    address: "Chilonzor 9-mavze, Qatortol ko'chasi 1-uy",
    phone: "+998 71 200 33 44",
    workingHours: "09:00 - 21:00",
  },
  {
    id: "b3",
    name: "Buyuk Ipak Yo'li filiali",
    slug: "buyuk-ipak-yoli",
    city: "Toshkent",
    address: "Mirzo Ulug'bek shoh ko'chasi, Maksim Gorkiy metro bekati yaqinida",
    phone: "+998 71 200 55 66",
    workingHours: "09:00 - 21:00",
  },
];

const FALLBACK_PRODUCTS: SerializedProduct[] = [
  {
    id: "p1",
    brand: "Apple",
    modelName: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    warrantyMonths: 12,
    descriptionUz:
      "Apple A17 Pro 3nm protsessori, yengil va mustahkam aerokosmik titan korpus, Dynamic Island hamda yangi moslashtiriladigan Action tugmasiga ega eng ilg'or flagman smartfon.",
    descriptionRu:
      "Передовой флагманский смартфон с титановым корпусом аэрокосмического класса, процессором A17 Pro (3 нм), Dynamic Island и настраиваемой кнопкой Action.",
    descriptionEn:
      "Flagship smartphone featuring aerospace-grade titanium design, A17 Pro 3nm chip, Dynamic Island, and the customizable Action button.",
    category: {
      id: "cat-smartphones",
      nameUz: "Smartfonlar",
      nameRu: "Смартфоны",
      nameEn: "Smartphones",
      slug: "smartphones",
    },
    variants: [
      {
        id: "v1-1",
        sku: "IP15P-NAT-128",
        colorNameUz: "Tabiiy titan",
        colorNameRu: "Натуральный титан",
        colorNameEn: "Natural Titanium",
        colorHex: "#9A958E",
        storage: "128GB",
        condition: "NEW",
        price: 14850000,
        oldPrice: 15500000,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 4 },
          { branchId: "b2", quantity: 2 },
          { branchId: "b3", quantity: 1 },
        ],
      },
      {
        id: "v1-2",
        sku: "IP15P-NAT-256",
        colorNameUz: "Tabiiy titan",
        colorNameRu: "Натуральный титан",
        colorNameEn: "Natural Titanium",
        colorHex: "#9A958E",
        storage: "256GB",
        condition: "NEW",
        price: 16200000,
        oldPrice: 17000000,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 5 },
          { branchId: "b2", quantity: 3 },
          { branchId: "b3", quantity: 2 },
        ],
      },
      {
        id: "v1-3",
        sku: "IP15P-NAT-512",
        colorNameUz: "Tabiiy titan",
        colorNameRu: "Натуральный титан",
        colorNameEn: "Natural Titanium",
        colorHex: "#9A958E",
        storage: "512GB",
        condition: "NEW",
        price: 18500000,
        oldPrice: null,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 2 },
          { branchId: "b2", quantity: 1 },
          { branchId: "b3", quantity: 0 },
        ],
      },
      {
        id: "v1-4",
        sku: "IP15P-BLK-128",
        colorNameUz: "Qora titan",
        colorNameRu: "Черный титан",
        colorNameEn: "Black Titanium",
        colorHex: "#393836",
        storage: "128GB",
        condition: "NEW",
        price: 14850000,
        oldPrice: 15500000,
        images: [
          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 3 },
          { branchId: "b2", quantity: 2 },
          { branchId: "b3", quantity: 1 },
        ],
      },
      {
        id: "v1-5",
        sku: "IP15P-BLK-256",
        colorNameUz: "Qora titan",
        colorNameRu: "Черный титан",
        colorNameEn: "Black Titanium",
        colorHex: "#393836",
        storage: "256GB",
        condition: "NEW",
        price: 16200000,
        oldPrice: null,
        images: [
          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 4 },
          { branchId: "b2", quantity: 0 },
          { branchId: "b3", quantity: 2 },
        ],
      },
      {
        id: "v1-6",
        sku: "IP15P-BLU-256",
        colorNameUz: "Moviy titan",
        colorNameRu: "Синий титан",
        colorNameEn: "Blue Titanium",
        colorHex: "#2F3542",
        storage: "256GB",
        condition: "NEW",
        price: 16200000,
        oldPrice: 16900000,
        images: [
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 2 },
          { branchId: "b2", quantity: 1 },
          { branchId: "b3", quantity: 1 },
        ],
      },
    ],
  },
  {
    id: "p2",
    brand: "Apple",
    modelName: "iPhone 15",
    slug: "iphone-15",
    warrantyMonths: 12,
    descriptionUz:
      "A16 Bionic protsessori, 48 MP asosiy kamera, Dynamic Island va rangli mat orqa oyna bilan yangilangan yorqin smartfon.",
    descriptionRu:
      "Яркий смартфон с процессором A16 Bionic, 48-мегапиксельной основной камерой, Dynamic Island и стеклянной задней панелью с матовым покрытием.",
    descriptionEn:
      "Vibrant smartphone featuring A16 Bionic processor, 48MP main camera, Dynamic Island, and color-infused back glass.",
    category: {
      id: "cat-smartphones",
      nameUz: "Smartfonlar",
      nameRu: "Смартфоны",
      nameEn: "Smartphones",
      slug: "smartphones",
    },
    variants: [
      {
        id: "v2-1",
        sku: "IP15-128-BLK",
        colorNameUz: "Qora",
        colorNameRu: "Черный",
        colorNameEn: "Black",
        colorHex: "#34393D",
        storage: "128GB",
        condition: "NEW",
        price: 10450000,
        oldPrice: 11000000,
        images: [
          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 5 },
          { branchId: "b2", quantity: 3 },
          { branchId: "b3", quantity: 2 },
        ],
      },
      {
        id: "v2-2",
        sku: "IP15-256-BLU",
        colorNameUz: "Moviy",
        colorNameRu: "Синий",
        colorNameEn: "Blue",
        colorHex: "#D4E0E8",
        storage: "256GB",
        condition: "NEW",
        price: 11800000,
        oldPrice: null,
        images: [
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 3 },
          { branchId: "b2", quantity: 2 },
          { branchId: "b3", quantity: 0 },
        ],
      },
    ],
  },
  {
    id: "p3",
    brand: "Samsung",
    modelName: "Galaxy S24 Ultra",
    slug: "galaxy-s24-ultra",
    warrantyMonths: 12,
    descriptionUz:
      "Galaxy AI intellektual imkoniyatlari, titan ramka, o'rnatilgan S Pen ruchkasi va 200 MP flagman kamera.",
    descriptionRu:
      "Флагман со встроенным искусственным интеллектом Galaxy AI, титановым корпусом, встроенным электронным пером S Pen и 200 МП камерой.",
    descriptionEn:
      "Flagship with integrated Galaxy AI, titanium frame, built-in S Pen, and a 200MP camera system.",
    category: {
      id: "cat-smartphones",
      nameUz: "Smartfonlar",
      nameRu: "Смартфоны",
      nameEn: "Smartphones",
      slug: "smartphones",
    },
    variants: [
      {
        id: "v3-1",
        sku: "S24U-256-GRY",
        colorNameUz: "Kulrang titan",
        colorNameRu: "Титановый серый",
        colorNameEn: "Titanium Gray",
        colorHex: "#686561",
        storage: "256GB",
        condition: "NEW",
        price: 15300000,
        oldPrice: 16200000,
        images: [
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 2 },
          { branchId: "b2", quantity: 3 },
          { branchId: "b3", quantity: 1 },
        ],
      },
      {
        id: "v3-2",
        sku: "S24U-512-BLK",
        colorNameUz: "Qora titan",
        colorNameRu: "Титановый черный",
        colorNameEn: "Titanium Black",
        colorHex: "#2C2C2C",
        storage: "512GB",
        condition: "NEW",
        price: 17200000,
        oldPrice: null,
        images: [
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 1 },
          { branchId: "b2", quantity: 2 },
          { branchId: "b3", quantity: 0 },
        ],
      },
    ],
  },
  {
    id: "p4",
    brand: "Xiaomi",
    modelName: "Xiaomi 14",
    slug: "xiaomi-14",
    warrantyMonths: 12,
    descriptionUz:
      "Leica optikasi bilan jihozlangan ixcham flagman, Snapdragon 8 Gen 3 protsessori va yorqin AMOLED displey.",
    descriptionRu:
      "Компактный флагман с оптикой Leica, процессором Snapdragon 8 Gen 3 и сверхъярким дисплеем AMOLED.",
    descriptionEn:
      "Compact flagship equipped with Leica Summilux lens, Snapdragon 8 Gen 3, and an ultra-bright AMOLED display.",
    category: {
      id: "cat-smartphones",
      nameUz: "Smartfonlar",
      nameRu: "Смартфоны",
      nameEn: "Smartphones",
      slug: "smartphones",
    },
    variants: [
      {
        id: "v4-1",
        sku: "MI14-256-BLK",
        colorNameUz: "Qora",
        colorNameRu: "Черный",
        colorNameEn: "Black",
        colorHex: "#222222",
        storage: "256GB",
        condition: "NEW",
        price: 9200000,
        oldPrice: 9800000,
        images: [
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        ],
        inventory: [
          { branchId: "b1", quantity: 6 },
          { branchId: "b2", quantity: 4 },
          { branchId: "b3", quantity: 3 },
        ],
      },
    ],
  },
];

async function getBranches(): Promise<BranchStockItem[]> {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    if (!branches || branches.length === 0) return FALLBACK_BRANCHES;
    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      city: b.city,
      address: b.address,
      phone: b.phone,
      workingHours: b.workingHours,
    }));
  } catch {
    return FALLBACK_BRANCHES;
  }
}

async function getProductBySlug(slug: string): Promise<SerializedProduct | null> {
  const normalizedSlug = slug.toLowerCase().trim();

  try {
    const dbProduct = await prisma.product.findUnique({
      where: { slug: normalizedSlug },
      include: {
        category: true,
        variants: {
          include: {
            inventory: {
              include: {
                branch: true,
              },
            },
          },
          orderBy: { price: "asc" },
        },
      },
    });

    if (dbProduct && dbProduct.variants.length > 0) {
      return {
        id: dbProduct.id,
        brand: dbProduct.brand,
        modelName: dbProduct.modelName,
        slug: dbProduct.slug,
        descriptionUz: dbProduct.descriptionUz,
        descriptionRu: dbProduct.descriptionRu,
        descriptionEn: dbProduct.descriptionEn,
        warrantyMonths: dbProduct.warrantyMonths,
        category: dbProduct.category
          ? {
              id: dbProduct.category.id,
              nameUz: dbProduct.category.nameUz,
              nameRu: dbProduct.category.nameRu,
              nameEn: dbProduct.category.nameEn,
              slug: dbProduct.category.slug,
            }
          : null,
        variants: dbProduct.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          colorNameUz: v.colorNameUz,
          colorNameRu: v.colorNameRu,
          colorNameEn: v.colorNameEn,
          colorHex: v.colorHex,
          storage: v.storage,
          condition: v.condition,
          price: Number(v.price.toString()),
          oldPrice: v.oldPrice ? Number(v.oldPrice.toString()) : null,
          images: v.images,
          inventory: v.inventory.map((inv) => ({
            branchId: inv.branchId,
            quantity: inv.quantity,
            branch: {
              id: inv.branch.id,
              name: inv.branch.name,
              slug: inv.branch.slug,
              address: inv.branch.address,
              phone: inv.branch.phone,
              workingHours: inv.branch.workingHours,
            },
          })),
        })),
      };
    }
  } catch {
    // Continue to fallback search
  }

  // Fallback lookup: match exact slug, or aliases (e.g. apple-iphone-15-pro -> iphone-15-pro)
  const fallback = FALLBACK_PRODUCTS.find((p) => {
    if (p.slug.toLowerCase() === normalizedSlug) return true;
    if (normalizedSlug.includes(p.slug.toLowerCase())) return true;
    if (p.slug.toLowerCase().includes(normalizedSlug)) return true;
    return false;
  });

  return fallback || null;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "AloShop",
    };
  }

  const title = `${product.brand} ${product.modelName} — AloShop`;
  const description =
    locale === "ru"
      ? product.descriptionRu
      : locale === "en"
      ? product.descriptionEn
      : product.descriptionUz;

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      images: product.variants[0]?.images[0] ? [product.variants[0].images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [product, branches] = await Promise.all([
    getProductBySlug(slug),
    getBranches(),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductDetailsClient product={product} branches={branches} />;
}
