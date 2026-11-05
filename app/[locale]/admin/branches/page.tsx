import * as React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import {
  BranchesListView,
  type BranchListItem,
} from "@/components/admin/branches-list-view";

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

  if (!isSuperAdmin(session)) {
    redirect(`/${locale}/admin/dashboard`);
  }

  const t = await getTranslations({
    locale,
    namespace: "admin.branchesManagement",
  });

  const isSuper = true;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Fetch branches with relation counts, inventory, assigned admins, and today's sales
  const [branches, rawAdmins, todayOrders] = await Promise.all([
    prisma.branch.findMany({
      include: {
        users: {
          where: { role: "BRANCH_ADMIN", isActive: true },
          select: { id: true, fullName: true, username: true },
        },
        inventory: {
          select: { quantity: true },
        },
        _count: {
          select: {
            orders: true,
            users: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.user.findMany({
      where: { role: "BRANCH_ADMIN", isActive: true },
      select: {
        id: true,
        fullName: true,
        username: true,
        branchId: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: startOfToday },
        status: { not: "CANCELLED" },
      },
      select: {
        totalAmount: true,
        pickupBranchId: true,
      },
    }),
  ]);

  // Aggregate today's sales and top branch
  const todaySalesTotal = todayOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );

  const branchSalesMap: Record<string, number> = {};
  for (const o of todayOrders) {
    if (o.pickupBranchId) {
      branchSalesMap[o.pickupBranchId] =
        (branchSalesMap[o.pickupBranchId] || 0) + Number(o.totalAmount || 0);
    }
  }

  let topBranchName = "-";
  let maxSales = 0;
  for (const [bId, sales] of Object.entries(branchSalesMap)) {
    if (sales > maxSales) {
      maxSales = sales;
      const b = branches.find((item) => item.id === bId);
      if (b) topBranchName = b.name;
    }
  }

  if (topBranchName === "-" && branches.length > 0) {
    const sorted = [...branches].sort((a, b) => {
      const aStock = a.inventory.reduce((sum, cur) => sum + cur.quantity, 0);
      const bStock = b.inventory.reduce((sum, cur) => sum + cur.quantity, 0);
      return bStock - aStock;
    });
    topBranchName = sorted[0].name;
  }

  const serializedBranches: BranchListItem[] = branches.map((b) => {
    const assignedAdmin = b.users[0]
      ? {
          id: b.users[0].id,
          fullName: b.users[0].fullName,
          username: b.users[0].username,
        }
      : null;

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      city: b.city,
      address: b.address,
      phone: b.phone,
      workingHours: b.workingHours,
      isActive: b.isActive,
      staffCount: b._count.users,
      totalInventory: b.inventory.reduce((sum, cur) => sum + cur.quantity, 0),
      totalVariants: b.inventory.length,
      ordersCount: b._count.orders,
      createdAt: b.createdAt.toISOString(),
      assignedAdmin,
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

      {/* Main Branch Management Component */}
      <BranchesListView
        branches={serializedBranches}
        availableAdmins={rawAdmins}
        todaySalesTotal={todaySalesTotal}
        topBranchName={topBranchName}
        isSuperAdmin={isSuper}
        locale={locale}
      />
    </div>
  );
}
