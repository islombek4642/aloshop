import * as React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminSession, isSuperAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import {
  UsersListView,
  type SerializedAdminUser,
} from "@/components/admin/users-list-view";

interface AdminUsersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersPage({
  params,
}: AdminUsersPageProps) {
  const { locale } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  // RBAC: SuperAdmin only
  if (!isSuperAdmin(session)) {
    redirect(`/${locale}/admin/dashboard`);
  }

  const t = await getTranslations({
    locale,
    namespace: "admin.usersManagement",
  });

  const [dbUsers, branches] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        branch: true,
      },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serializedUsers: SerializedAdminUser[] = dbUsers.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    branchName: u.branch?.name || null,
    createdAt: u.createdAt.toISOString(),
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

      {/* Users List & Creation Modal */}
      <UsersListView
        users={serializedUsers}
        branches={branches}
        locale={locale}
      />
    </div>
  );
}

