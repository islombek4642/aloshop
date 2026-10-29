import * as React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import {
  BranchInventoryView,
  type BranchDetails,
  type InventoryItemDetail,
} from "@/components/admin/branch-inventory-view";
import type { VariantOption } from "@/components/admin/stock-transfer-modal";

interface AdminBranchesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminBranchesPage({
  params,
}: AdminBranchesPageProps) {
  const { locale } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const t = await getTranslations({
    locale,
    namespace: "admin.branchesPage",
  });

  const isSuper = isSuperAdmin(session);
  const branchFilter = isSuper ? undefined : session.branchId || "none";

  // 1. Fetch branches accessible to this user
  const branches = await prisma.branch.findMany({
    where: isSuper ? { isActive: true } : { id: branchFilter, isActive: true },
    orderBy: { name: "asc" },
  });

  if (branches.length === 0 && !isSuper) {
    redirect(`/${locale}/admin/dashboard`);
  }

  const branchIds = branches.map((b) => b.id);

  // 2. Fetch inventory items for these branches
  const [inventories, allDbVariants] = await Promise.all([
    prisma.branchInventory.findMany({
      where: {
        branchId: { in: branchIds },
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: [
        { variant: { product: { modelName: "asc" } } },
        { variant: { storage: "asc" } },
      ],
    }),
    prisma.productVariant.findMany({
      include: {
        product: true,
      },
      orderBy: [{ product: { modelName: "asc" } }, { storage: "asc" }],
    }),
  ]);

  const serializedBranches: BranchDetails[] = branches.map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
    address: b.address,
    phone: b.phone,
    workingHours: b.workingHours,
  }));

  const serializedItems: InventoryItemDetail[] = inventories.map((inv) => {
    const colorName =
      locale === "ru"
        ? inv.variant.colorNameRu
        : locale === "en"
        ? inv.variant.colorNameEn
        : inv.variant.colorNameUz;

    return {
      id: inv.id,
      branchId: inv.branchId,
      variantId: inv.variantId,
      quantity: inv.quantity,
      productName: `${inv.variant.product.brand} ${inv.variant.product.modelName}`,
      sku: inv.variant.sku,
      colorName,
      colorHex: inv.variant.colorHex,
      storage: inv.variant.storage,
      condition: inv.variant.condition,
      price: Number(inv.variant.price),
    };
  });

  const serializedAllVariants: VariantOption[] = allDbVariants.map((v) => {
    const colorName =
      locale === "ru"
        ? v.colorNameRu
        : locale === "en"
        ? v.colorNameEn
        : v.colorNameUz;

    return {
      id: v.id,
      sku: v.sku,
      modelName: `${v.product.brand} ${v.product.modelName}`,
      color: colorName,
      storage: v.storage,
    };
  });

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

      {/* Main Multi-Branch Inventory Component */}
      <BranchInventoryView
        branches={serializedBranches}
        inventoryItems={serializedItems}
        allVariants={serializedAllVariants}
        isSuperAdmin={isSuper}
        userBranchId={session.branchId}
      />
    </div>
  );
}
