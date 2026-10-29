"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Link, usePathname } from "@/i18n/routing";
import {
  LayoutDashboard,
  Smartphone,
  Building2,
  ShoppingBag,
  Boxes,
  Users,
  LogOut,
  ShieldCheck,
  Store,
} from "lucide-react";
import type { AdminSessionPayload } from "@/lib/auth/session";
import { logoutAdminAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface AdminSidebarProps {
  session: AdminSessionPayload;
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({
  session,
  className,
  onNavigate,
}: AdminSidebarProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAdminAction();
      router.push(`/${locale}/admin/login`);
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    {
      label: t("dashboard"),
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "BRANCH_ADMIN"],
    },
    {
      label: t("products"),
      href: "/admin/products",
      icon: Smartphone,
      roles: ["SUPER_ADMIN", "BRANCH_ADMIN"],
    },
    {
      label: t("branches"),
      href: "/admin/branches",
      icon: Building2,
      roles: ["SUPER_ADMIN"],
    },
    {
      label: t("orders"),
      href: "/admin/orders",
      icon: ShoppingBag,
      roles: ["SUPER_ADMIN", "BRANCH_ADMIN"],
    },
    {
      label: t("inventory"),
      href: "/admin/inventory",
      icon: Boxes,
      roles: ["SUPER_ADMIN", "BRANCH_ADMIN"],
    },
    {
      label: t("users"),
      href: "/admin/users",
      icon: Users,
      roles: ["SUPER_ADMIN"],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(session.role)
  );

  return (
    <aside
      className={cn(
        "flex flex-col w-64 border-r border-border bg-card select-none shrink-0",
        className
      )}
    >
      {/* Brand & Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
          <Store className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-base tracking-tight leading-tight text-foreground truncate">
            AloShop
          </span>
          <span className="text-[11px] text-muted-foreground font-medium truncate">
            {t("title")}
          </span>
        </div>
      </div>

      {/* Role & Branch Indicator */}
      <div className="px-5 py-4 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-foreground truncate">
            {session.fullName}
          </span>
        </div>
        <div>
          {session.role === "SUPER_ADMIN" ? (
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0 border-primary/30 bg-primary/10 text-primary font-medium"
            >
              {t("roleSuperAdmin")}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-medium truncate max-w-full"
            >
              {session.branchName || t("roleBranchAdmin")}
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full justify-start gap-2.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t("logout")}</span>
        </Button>
      </div>
    </aside>
  );
}
