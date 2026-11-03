import * as React from "react";
import { redirect } from "next/navigation";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { ProductPresetMatrixForm } from "@/components/admin/product-preset-matrix-form";

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

  const branches = await prisma.branch.findMany({
    where: branchWhere,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="space-y-6">
      <ProductPresetMatrixForm
        branches={branches}
        locale={locale}
        isSuperAdmin={isSuper}
        branchId={session.branchId}
      />
    </div>
  );
}
