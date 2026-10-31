"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ExternalLink,
  Building2,
  Store,
  Menu,
  X,
} from "lucide-react";
import type { AdminSessionPayload } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { AdminSidebar } from "./admin-sidebar";

interface AdminHeaderProps {
  session: AdminSessionPayload;
}

export function AdminHeader({ session }: AdminHeaderProps) {
  const t = useTranslations("admin");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      <header className="h-16 shrink-0 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Branch Badge */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? tNav("closeMenu") : tNav("menu")}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>

          {/* Branch Indicator Badge */}
          <div className="hidden sm:flex items-center">
            {session.role === "SUPER_ADMIN" ? (
              <Badge
                variant="outline"
                className="gap-1.5 px-2.5 py-1 text-xs font-medium border-border/80 bg-muted/50 text-foreground"
              >
                <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>{t("allBranchesScope")}</span>
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
              >
                <Store className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{session.branchName || t("roleBranchAdmin")}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Storefront Link */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            <Link href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t("storefrontPreview")}</span>
            </Link>
          </Button>

          {/* Language Switcher */}
          <LanguageSwitcher variant="select" />
        </div>
      </header>

      {/* Mobile Drawer / Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-64 max-w-xs bg-card shadow-2xl z-50">
            <AdminSidebar
              session={session}
              className="h-full border-r-0"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
