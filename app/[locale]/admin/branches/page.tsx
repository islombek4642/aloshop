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

  // Fetch branches with relation counts and metrics
  const branches = await prisma.branch.findMany({
    include: {
      users: {
        select: { id: true },
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
  });


  const serializedBranches: BranchListItem[] = branches.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    city: b.city,
    address: b.address,
    phone: b.phone,
    workingHours: b.workingHours,
    isActive: b.isActive,
    staffCount: b.users.length,
    totalInventory: b.inventory.reduce((sum, cur) => sum + cur.quantity, 0),
    totalVariants: b.inventory.length,
    ordersCount: b._count.orders,
    createdAt: b.createdAt.toISOString(),
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

      {/* Main Branch Management Component */}
      <BranchesListView
        branches={serializedBranches}
        isSuperAdmin={isSuper}
        locale={locale}
      />
    </div>
  );
}
