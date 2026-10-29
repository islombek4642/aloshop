import * as React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { ProductCreateForm } from "@/components/admin/product-create-form";

interface NewProductPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminNewProductPage({
  params,
}: NewProductPageProps) {
  const { locale } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  // RBAC: Only SuperAdmin can create products
  if (!isSuperAdmin(session)) {
    redirect(`/${locale}/admin/products`);
  }

  const t = await getTranslations({
    locale,
    namespace: "admin.productCreate",
  });

  const [categories, branches] = await Promise.all([
    prisma.category.findMany({
      orderBy: { nameUz: "asc" },
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        nameEn: true,
      },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name:
      locale === "ru" ? c.nameRu : locale === "en" ? c.nameEn : c.nameUz,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("subtitle")}
        </p>
      </div>

      <ProductCreateForm
        categories={serializedCategories}
        branches={branches}
        locale={locale}
      />
    </div>
  );
}

