import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import {
  ProductPresetMatrixForm,
  type InitialProductData,
} from "@/components/admin/product-preset-matrix-form";

interface EditProductPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function AdminEditProductPage({
  params,
}: EditProductPageProps) {
  const { locale, id } = await params;
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

  const [product, branches] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            inventory: {
              select: {
                branchId: true,
                quantity: true,
              },
            },
          },
        },
      },
    }),
    prisma.branch.findMany({
      where: branchWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const initialData: InitialProductData = {
    id: product.id,
    brand: product.brand,
    modelName: product.modelName,
    slug: product.slug,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      colorNameUz: v.colorNameUz,
      colorNameRu: v.colorNameRu,
      colorNameEn: v.colorNameEn,
      colorHex: v.colorHex,
      storage: v.storage,
      price: Number(v.price),
      oldPrice: v.oldPrice ? Number(v.oldPrice) : null,
      initialStock: v.inventory.reduce<Record<string, number>>((acc, inv) => {
        acc[inv.branchId] = inv.quantity;
        return acc;
      }, {}),
    })),
  };

  return (
    <div className="space-y-6">
      <ProductPresetMatrixForm
        branches={branches}
        initialData={initialData}
        locale={locale}
        isSuperAdmin={isSuper}
        branchId={session.branchId}
      />
    </div>
  );
}
