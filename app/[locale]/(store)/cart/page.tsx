"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useCart } from "@/lib/store/use-cart";
import { CartItemRow } from "@/components/store/cart-item-row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";

export default function CartPage() {
  const tCart = useTranslations("cart");
  const tNav = useTranslations("nav");
  const tProduct = useTranslations("product");
  const tCheckout = useTranslations("checkout");

  const [mounted, setMounted] = React.useState(false);

  const items = useCart((state) => state.items);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const clearCart = useCart((state) => state.clearCart);
  const getTotalCount = useCart((state) => state.getTotalCount);
  const getTotalPrice = useCart((state) => state.getTotalPrice);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="h-8 w-48 bg-muted/40 rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-28 bg-muted/30 rounded-2xl animate-pulse" />
            <div className="h-28 bg-muted/30 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 bg-muted/30 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const totalCount = getTotalCount();
  const totalPrice = getTotalPrice();

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            {tNav("home")}
          </Link>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">
            {tNav("cart")}
          </span>
        </nav>

        <div className="py-12 sm:py-20 max-w-3xl mx-auto text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/50 text-muted-foreground/60 mb-6">
            <ShoppingBag className="h-10 w-10" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-3">
            {tCart("emptyTitle")}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-8">
            {tCart("emptyDescription")}
          </p>

          <Button asChild size="lg" className="h-11 px-8 gap-2 font-semibold">
            <Link href="/catalog">
              <span>{tCart("continueShopping")}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          {tNav("home")}
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
          aria-hidden="true"
        />
        <span className="font-medium text-foreground">
          {tNav("cart")}
        </span>
      </nav>

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/60 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {tCart("title")}
          </h1>
          <Badge
            variant="secondary"
            className="text-xs px-2.5 py-0.5 font-bold rounded-full"
          >
            {totalCount}
          </Badge>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{tCart("clearCart")}</span>
        </Button>
      </div>

      {/* Main Grid: Item List + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <CartItemRow
              key={item.variantId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}

          <div className="pt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs gap-2"
            >
              <Link href="/catalog">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tCart("continueShopping")}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-foreground">
              {tCart("summary")}
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{tCart("subtotal")}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>{tCart("delivery")}</span>
                <Badge
                  variant="success"
                  className="text-[11px] font-semibold px-2 py-0.5"
                >
                  {tCart("free")}
                </Badge>
              </div>

              <div className="border-t border-border/60 pt-3 flex items-baseline justify-between">
                <span className="text-base font-bold text-foreground">
                  {tCart("total")}
                </span>
                <span className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="w-full h-12 text-sm font-bold gap-2 shadow-sm"
            >
              <Link href="/checkout">
                <span>{tCart("checkout")}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              {tCheckout("deliveryFreeNotice")}
            </p>
          </div>

          {/* Guarantees Box */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block text-foreground">
                  {tProduct("original")}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {tProduct("officialWarrantyNotice")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block text-foreground">
                  {tProduct("fastDeliveryNotice")}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {tProduct("pickupAvailable")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
