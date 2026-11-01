"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils/cn";
import type { ProductVariantData } from "@/components/store/variant-selector";

export interface MobileStickyBuyBarProps {
  activeVariant: ProductVariantData;
  colorName: string;
  totalStock: number;
  inStockBranchSummary?: string;
  isAddedToCart: boolean;
  onAddToCart: () => void;
  onOneClickBuy: () => void;
  className?: string;
}

export function MobileStickyBuyBar({
  activeVariant,
  colorName,
  totalStock,
  inStockBranchSummary,
  isAddedToCart,
  onAddToCart,
  onOneClickBuy,
  className,
}: MobileStickyBuyBarProps) {
  const tProduct = useTranslations("product");
  const isOutOfStock = totalStock <= 0;

  return (
    <div
      className={cn(
        "sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-3.5 py-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Variant Summary, Price & Live Branch Availability */}
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
            <span className="font-medium text-foreground">
              {activeVariant?.storage}
            </span>
            <span aria-hidden="true">•</span>
            <span className="truncate">{colorName}</span>
          </div>

          <div className="flex items-baseline">
            <span className="text-base font-black text-foreground truncate">
              {activeVariant ? formatCurrency(activeVariant.price) : "0 so'm"}
            </span>
          </div>

          {/* Real-time Branch Stock summary chip */}
          <div className="flex items-center gap-1 text-[10px] font-medium">
            {!isOutOfStock ? (
              <>
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
                  aria-hidden="true"
                />
                <span className="text-emerald-600 dark:text-emerald-400 truncate">
                  {inStockBranchSummary || tProduct("inStock")}
                </span>
              </>
            ) : (
              <>
                <span
                  className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0"
                  aria-hidden="true"
                />
                <span className="text-destructive truncate">
                  {tProduct("outOfStock")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Dual CTAs (1-Click Fast Checkout + Add to Cart) */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onOneClickBuy}
            disabled={isOutOfStock}
            className="h-11 w-11 rounded-xl border-primary/40 text-primary hover:bg-primary/10 transition-colors shrink-0"
            aria-label={tProduct("buyNow")}
            title={tProduct("buyNow")}
          >
            <Zap className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "h-11 min-w-[124px] rounded-xl px-3.5 text-xs font-semibold gap-1.5 shadow-xs transition-all shrink-0",
              isAddedToCart ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            )}
          >
            {isAddedToCart ? (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                <span>{tProduct("addedToCart")}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 stroke-[2]" aria-hidden="true" />
                <span>{tProduct("addToCart")}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
