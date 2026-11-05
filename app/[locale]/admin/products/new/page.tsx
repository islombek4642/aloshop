import * as React from "react";
import { redirect } from "next/navigation";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { UnifiedProductEditor } from "@/components/admin/product-editor/unified-product-editor";

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

  const isSuper = isSuperAdmin(session);
  if (!isSuper && !session.branchId) {
    redirect(`/${locale}/admin/products`);
  }

  const branchWhere = isSuper
    ? { isActive: true }
    : { id: session.branchId! };

  const [branches, rawCategories] = await Promise.all([
    prisma.branch.findMany({
      where: branchWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.category.findMany({
      orderBy: { nameUz: "asc" },
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        nameEn: true,
        slug: true,
      },
    }),
  ]);

  let categories = rawCategories;
  if (categories.length === 0) {
    const defaultCat = await prisma.category.create({
      data: {
        nameUz: "Smartfonlar",
        nameRu: "Смартфоны",
        nameEn: "Smartphones",
        slug: "smartphones",
      },
    });
    categories = [defaultCat];
  }

  return (
    <div className="space-y-6">
      <UnifiedProductEditor
        branches={branches}
        categories={categories}
        locale={locale}
        isSuperAdmin={isSuper}
        branchId={session.branchId}
      />
    </div>
  );
}
