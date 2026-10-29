import * as React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  TrendingUp,
  ShoppingBag,
  Building2,
  AlertTriangle,
  Boxes,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";
import { getAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboardPage({
  params,
}: DashboardPageProps) {
  const { locale } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const t = await getTranslations({ locale, namespace: "admin" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  let totalRevenue = 0;
  let totalOrdersCount = 0;
  let activeBranchesCount = 0;
  let lowStockCount = 0;

  type OrderItemData = {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    pickupBranchName: string | null;
  };

  type BranchItemData = {
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string;
    workingHours: string;
    totalStock: number;
  };

  let recentOrders: OrderItemData[] = [];
  let branchSummaries: BranchItemData[] = [];

  try {
    const isSuper = session.role === "SUPER_ADMIN";
    const branchFilter = isSuper ? undefined : session.branchId;

    // 1. Orders & Revenue metrics
    const orderWhere = branchFilter ? { pickupBranchId: branchFilter } : {};

    const [ordersAgg, ordersCount, branches, lowStockItems, recentDbOrders] =
      await Promise.all([
        prisma.order.aggregate({
          where: orderWhere,
          _sum: { totalAmount: true },
        }),
        prisma.order.count({
          where: orderWhere,
        }),
        prisma.branch.findMany({
          where: isSuper
            ? { isActive: true }
            : { id: branchFilter || "", isActive: true },
          include: {
            inventory: true,
          },
        }),
        prisma.branchInventory.count({
          where: {
            ...(branchFilter ? { branchId: branchFilter } : {}),
            quantity: { lte: 3 },
          },
        }),
        prisma.order.findMany({
          where: orderWhere,
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            pickupBranch: true,
          },
        }),
      ]);

    totalRevenue = Number(ordersAgg._sum.totalAmount || 0);
    totalOrdersCount = ordersCount;
    activeBranchesCount = branches.length;
    lowStockCount = lowStockItems;

    recentOrders = recentDbOrders.map((ord) => ({
      id: ord.id,
      orderNumber: ord.orderNumber,
      customerName: ord.customerName,
      customerPhone: ord.customerPhone,
      totalAmount: Number(ord.totalAmount),
      status: ord.status,
      createdAt: ord.createdAt,
      pickupBranchName: ord.pickupBranch?.name || null,
    }));

    branchSummaries = branches.map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city,
      address: b.address,
      phone: b.phone,
      workingHours: b.workingHours,
      totalStock: b.inventory.reduce((acc, cur) => acc + cur.quantity, 0),
    }));
  } catch (error) {
    console.error("Dashboard database fetch fallback:", error);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            {t("ordersTable.statusPending")}
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge variant="default" className="bg-blue-600 text-white">
            {t("ordersTable.statusConfirmed")}
          </Badge>
        );
      case "SHIPPED":
      case "DELIVERED":
      case "COMPLETED":
        return (
          <Badge variant="success">
            {t("ordersTable.statusCompleted")}
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive">
            {t("ordersTable.statusCancelled")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("dashboard")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.role === "SUPER_ADMIN"
              ? t("allBranchesScope")
              : session.branchName || t("roleBranchAdmin")}
          </p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Revenue */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("totalRevenue")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Orders */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("stats.totalOrders")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tracking-tight text-foreground">
              {totalOrdersCount}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Active Branches */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("activeBranches")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tracking-tight text-foreground">
              {activeBranchesCount}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Low Stock Alert */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("stats.lowStockAlert")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tracking-tight text-foreground">
              {lowStockCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("lowStockThresholdNotice")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold tracking-tight">
              {t("recentOrders")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {t("noOrders")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">{t("ordersTable.orderId")}</TableHead>
                  <TableHead className="text-xs">{t("ordersTable.customer")}</TableHead>
                  <TableHead className="text-xs">{t("ordersTable.phone")}</TableHead>
                  <TableHead className="text-xs">{t("ordersTable.branch")}</TableHead>
                  <TableHead className="text-xs">{t("ordersTable.total")}</TableHead>
                  <TableHead className="text-xs">{t("ordersTable.status")}</TableHead>
                  <TableHead className="text-xs text-right">{t("ordersTable.createdAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono text-xs font-medium text-primary">
                      {ord.orderNumber}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {ord.customerName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ord.customerPhone}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ord.pickupBranchName || t("allBranches")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {formatCurrency(ord.totalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(ord.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground text-right">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(ord.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Branch Inventory Overview Section */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("branchStockOverview")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">{t("branches")}</TableHead>
                <TableHead className="text-xs">{tCommon("labels.date")}</TableHead>
                <TableHead className="text-xs">{t("ordersTable.phone")}</TableHead>
                <TableHead className="text-xs text-right">{t("itemsCount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchSummaries.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="text-xs font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{branch.name}</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                        <span className="truncate max-w-xs">{branch.city}, {branch.address}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                      <span>{branch.workingHours}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                      <span>{branch.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-right">
                    <Badge variant="outline" className="font-mono">
                      {branch.totalStock} {tCommon("labels.pcs")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
