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
  Settings,
  PanelLeftClose,
  PanelLeft,
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
  isMobileDrawer?: boolean;
}

const SIDEBAR_STORAGE_KEY = "alo_admin_sidebar_collapsed";

export function AdminSidebar({
  session,
  className,
  onNavigate,
  isMobileDrawer = false,
}: AdminSidebarProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Sync collapsed state with localStorage on mount (desktop only)
  React.useEffect(() => {
    if (isMobileDrawer) return;
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [isMobileDrawer]);

  const toggleCollapsed = () => {
    if (isMobileDrawer) return;
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

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
    {
      label: t("settings"),
      href: "/admin/settings",
      icon: Settings,
      roles: ["SUPER_ADMIN"],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(session.role)
  );

  const effectiveCollapsed = isMobileDrawer ? false : isCollapsed;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card select-none shrink-0 transition-[width] duration-300 ease-in-out",
        effectiveCollapsed ? "w-[68px]" : "w-64",
        className
      )}
    >
      {/* Brand & Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-3.5 sm:px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold shadow-sm shrink-0">
            <Store className="w-5 h-5" aria-hidden="true" />
          </div>
          {!effectiveCollapsed && (
            <div className="flex flex-col overflow-hidden animate-in fade-in duration-200">
              <span className="font-bold text-base tracking-tight leading-tight text-foreground truncate">
                AloShop
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate">
                {t("title")}
              </span>
            </div>
          )}
        </div>

        {/* Collapsible toggle (desktop only) */}
        {!isMobileDrawer && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 hidden md:flex"
            title={effectiveCollapsed ? "Kengaytirish" : "Yig'ish"}
            aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveCollapsed ? (
              <PanelLeft className="w-4 h-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      {/* Role & Branch Indicator */}
      <div
        className={cn(
          "border-b border-border/60 bg-muted/30 shrink-0 transition-all",
          effectiveCollapsed ? "p-2.5 flex justify-center" : "px-5 py-3.5"
        )}
      >
        {effectiveCollapsed ? (
          <div
            title={`${session.fullName} (${session.role === "SUPER_ADMIN" ? t("roleSuperAdmin") : session.branchName || t("roleBranchAdmin")})`}
            className="cursor-default"
          >
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 min-h-0 px-2.5 py-4 space-y-1 overflow-y-auto">
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
              title={effectiveCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-xs font-medium active:scale-[0.98] transition-all duration-150",
                effectiveCollapsed
                  ? "justify-center h-10 w-full px-0"
                  : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {!effectiveCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div
        className={cn(
          "border-t border-border shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]",
          effectiveCollapsed ? "p-2.5 flex justify-center" : "p-4"
        )}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={effectiveCollapsed ? t("logout") : undefined}
          className={cn(
            "text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30",
            effectiveCollapsed
              ? "h-10 w-10 p-0 justify-center"
              : "w-full justify-start gap-2.5"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          {!effectiveCollapsed && <span>{t("logout")}</span>}
        </Button>
      </div>
    </aside>
  );
}
