"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Home, Layers, ShoppingBag, Store } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/lib/store/use-cart";

export interface MobileNavProps {
  cartItemCount?: number;
}

export function MobileNav({ cartItemCount: propCount }: MobileNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  const storeCartCount = useCart((state) => state.getTotalCount());

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount =
    propCount !== undefined ? propCount : mounted ? storeCartCount : 0;

  const navItems = [
    {
      href: "/",
      label: t("home"),
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/catalog",
      label: t("catalog"),
      icon: Layers,
      isActive: pathname.startsWith("/catalog"),
    },
    {
      href: "/cart",
      label: t("cart"),
      icon: ShoppingBag,
      isActive: pathname.startsWith("/cart"),
      badge: cartItemCount > 0 ? cartItemCount : null,
    },
    {
      href: "/branches",
      label: t("branches"),
      icon: Store,
      isActive: pathname.startsWith("/branches"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid h-14 grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 h-full py-1 text-center transition-colors select-none",
                item.isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={item.isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    item.isActive ? "scale-110 stroke-[2.25]" : "stroke-[1.75]"
                  )}
                  aria-hidden="true"
                />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-tight truncate px-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

