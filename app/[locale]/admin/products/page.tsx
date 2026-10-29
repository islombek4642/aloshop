import * as React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import {
  ProductsListView,
  type SerializedProduct,
} from "@/components/admin/products-list-view";

interface AdminProductsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminProductsPage({
  params,
}: AdminProductsPageProps) {
  const { locale } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const t = await getTranslations({
    locale,
    namespace: "admin.productsManagement",
  });

  const isSuper = isSuperAdmin(session);
  const productWhere = isSuper
    ? {}
    : {
        variants: {
          some: {
            inventory: {
              some: {
                branchId: session.branchId || "none",
                quantity: { gt: 0 },
              },
            },
          },
        },
      };

  const [dbProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        variants: {
          include: {
            inventory: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { nameUz: "asc" },
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        nameEn: true,
      },
    }),
  ]);

  const branchFilter = isSuper ? null : session.branchId;

  const serializedProducts: SerializedProduct[] = dbProducts.map((p) => {
    const categoryName =
      locale === "ru"
        ? p.category.nameRu
        : locale === "en"
        ? p.category.nameEn
        : p.category.nameUz;

    const variants = p.variants.map((v) => {
      const colorName =
        locale === "ru"
          ? v.colorNameRu
          : locale === "en"
          ? v.colorNameEn
          : v.colorNameUz;

      const totalStock = v.inventory
        .filter((inv) => (branchFilter ? inv.branchId === branchFilter : true))
        .reduce((sum, cur) => sum + cur.quantity, 0);

      return {
        id: v.id,
        sku: v.sku,
        colorName,
        colorHex: v.colorHex,
        storage: v.storage,
        condition: v.condition,
        price: Number(v.price),
        oldPrice: v.oldPrice ? Number(v.oldPrice) : null,
        totalStock,
      };
    });

    const totalStock = variants.reduce((sum, cur) => sum + cur.totalStock, 0);

    return {
      id: p.id,
      brand: p.brand,
      modelName: p.modelName,
      slug: p.slug,
      categoryName,
      categoryId: p.categoryId,
      warrantyMonths: p.warrantyMonths,
      variants,
      totalStock,
    };
  });

  const brands = Array.from(new Set(dbProducts.map((p) => p.brand))).sort();
  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name:
      locale === "ru" ? c.nameRu : locale === "en" ? c.nameEn : c.nameUz,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Interactive Products List & Filtering */}
      <ProductsListView
        products={serializedProducts}
        brands={brands}
        categories={serializedCategories}
        isSuperAdmin={isSuperAdmin(session)}
        locale={locale}
      />
    </div>
  );
}

