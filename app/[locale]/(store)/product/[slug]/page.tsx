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
import { inferDefaultRam } from "@/lib/utils/specs";
import { getFallbackProductBySlug } from "@/lib/catalog/store-fallbacks";
import { getSiteSettings } from "@/lib/settings/site-settings";

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

    if (dbProduct && !dbProduct.isDraft && !dbProduct.isArchived && dbProduct.variants.length > 0) {
      return {
        id: dbProduct.id,
        brand: dbProduct.brand,
        modelName: dbProduct.modelName,
        slug: dbProduct.slug,
        descriptionUz: dbProduct.descriptionUz,
        descriptionRu: dbProduct.descriptionRu,
        descriptionEn: dbProduct.descriptionEn,
        warrantyMonths: dbProduct.warrantyMonths,
        screenSize: dbProduct.screenSize,
        processor: dbProduct.processor,
        battery: dbProduct.battery,
        camera: dbProduct.camera,
        charging: dbProduct.charging,
        os: dbProduct.os,
        series: dbProduct.series,
        releaseYear: dbProduct.releaseYear,
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
          ram: v.ram || inferDefaultRam(dbProduct.brand, dbProduct.modelName, v.storage),
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

  return getFallbackProductBySlug(normalizedSlug);
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

  const [product, branches, siteSettings] = await Promise.all([
    getProductBySlug(slug),
    getBranches(),
    getSiteSettings().catch(() => null),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailsClient
      product={product}
      branches={branches}
      siteSettings={siteSettings}
    />
  );
}
