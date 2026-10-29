import * as React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import {
  OrdersListView,
  type SerializedOrder,
} from "@/components/admin/orders-list-view";

interface AdminOrdersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminOrdersPage({
  params,
}: AdminOrdersPageProps) {
  const { locale } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const t = await getTranslations({
    locale,
    namespace: "admin.ordersManagement",
  });

  const isSuper = isSuperAdmin(session);
  const branchFilter = isSuper ? undefined : session.branchId || "none";

  const [dbOrders, branches] = await Promise.all([
    prisma.order.findMany({
      where: isSuper ? {} : { pickupBranchId: branchFilter },
      orderBy: { createdAt: "desc" },
      include: {
        pickupBranch: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serializedOrders: SerializedOrder[] = dbOrders.map((ord) => {
    const items = ord.items.map((item) => {
      const colorName =
        locale === "ru"
          ? item.variant.colorNameRu
          : locale === "en"
          ? item.variant.colorNameEn
          : item.variant.colorNameUz;

      return {
        id: item.id,
        variantName: `${item.variant.product.modelName} (${item.variant.storage}, ${colorName})`,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      };
    });

    return {
      id: ord.id,
      orderNumber: ord.orderNumber,
      customerName: ord.customerName,
      customerPhone: ord.customerPhone,
      fulfillmentType: ord.fulfillmentType,
      pickupBranchId: ord.pickupBranchId,
      pickupBranchName: ord.pickupBranch?.name || null,
      deliveryAddress: ord.deliveryAddress,
      totalAmount: Number(ord.totalAmount),
      status: ord.status,
      paymentType: ord.paymentType,
      isPaid: ord.isPaid,
      createdAt: ord.createdAt.toISOString(),
      items,
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

      {/* Orders List View */}
      <OrdersListView
        orders={serializedOrders}
        branches={branches}
        isSuperAdmin={isSuper}
        locale={locale}
      />
    </div>
  );
}

