"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, ShoppingBag, Smartphone, Store, Layers, Home } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/lib/store/use-cart";

export interface StoreHeaderProps {
  cartItemCount?: number;
}

export function StoreHeader({ cartItemCount: propCount }: StoreHeaderProps) {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  const storeCartCount = useCart((state) => state.getTotalCount());

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount =
    propCount !== undefined ? propCount : mounted ? storeCartCount : 0;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/catalog?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/catalog");
    }
  };

  const navLinks = [
    { href: "/", label: tNav("home"), icon: Home, exact: true },
    { href: "/catalog", label: tNav("catalog"), icon: Layers, exact: false },
    { href: "/branches", label: tNav("branches"), icon: Store, exact: false },
  ];

  const isActiveLink = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0"
          aria-label={tCommon("siteName")}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground leading-none">
              {tCommon("siteName")}
            </span>
            <span className="hidden text-[10px] text-muted-foreground sm:inline-block leading-tight">
              {tCommon("siteTagline")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-1 text-sm font-medium"
          aria-label="Desktop Navigation"
        >
          {navLinks.map((link) => {
            const active = isActiveLink(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-colors",
                  active
                    ? "bg-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-md hidden sm:block"
          role="search"
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tNav("searchPlaceholder")}
              className="w-full pl-9 pr-4 h-9 bg-muted/40 text-base sm:text-sm focus-visible:bg-background"
              aria-label={tNav("searchPlaceholder")}
            />
          </div>
        </form>

        {/* Actions (Language Switcher & Cart) */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher variant="select" />

          {/* Cart Button */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="relative h-9 px-3 gap-2"
          >
            <Link href="/cart" aria-label={tNav("cart")}>
              <ShoppingBag className="h-4 w-4 text-foreground" aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-medium">
                {tNav("cart")}
              </span>
              {cartItemCount > 0 ? (
                <Badge
                  variant="default"
                  className="h-5 min-w-5 px-1 text-[11px] font-bold rounded-full flex items-center justify-center"
                >
                  {cartItemCount}
                </Badge>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Search Input Row */}
      <div className="border-t px-4 py-2 sm:hidden bg-background">
        <form onSubmit={handleSearchSubmit} role="search">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tNav("searchPlaceholder")}
              className="w-full pl-9 pr-3 h-9 sm:h-8 text-base sm:text-xs bg-muted/40 focus-visible:bg-background"
              aria-label={tNav("searchPlaceholder")}
            />
          </div>
        </form>
      </div>
    </header>
  );
}

