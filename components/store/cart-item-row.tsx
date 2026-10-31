"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Minus, Plus, Trash2, Smartphone } from "lucide-react";
import { type CartItem } from "@/lib/store/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  const tCart = useTranslations("cart");
  const tProduct = useTranslations("product");

  const isMaxReached =
    item.maxStock !== undefined && item.quantity >= item.maxStock;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/70 bg-card shadow-2xs transition-colors hover:border-border">
      {/* Left: Thumbnail & Details */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Product Image */}
        <div className="relative h-20 w-20 sm:h-22 sm:w-22 shrink-0 rounded-xl bg-muted/40 border border-border/40 overflow-hidden flex items-center justify-center">
          {item.image ? (
            <Image
              src={item.image}
              alt={`${item.brand} ${item.modelName}`}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              className="object-contain p-2 transition-transform hover:scale-105"
            />
          ) : (
            <Smartphone
              className="h-8 w-8 text-muted-foreground/40"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {item.brand}
            </span>
            {item.condition === "USED" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {tProduct("conditions.used")}
              </Badge>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
            {item.brand} {item.modelName}
          </h3>

          {/* Config Swatches */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* Storage */}
            {item.storage && (
              <Badge
                variant="outline"
                className="text-[11px] font-medium px-2 py-0.5 bg-muted/30"
              >
                {item.storage}
              </Badge>
            )}

            {/* Color */}
            {item.colorName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {item.colorHex && (
                  <span
                    className="h-3 w-3 rounded-full border border-black/10 shadow-2xs shrink-0"
                    style={{ backgroundColor: item.colorHex }}
                    aria-hidden="true"
                  />
                )}
                <span className="text-[11px] font-medium truncate max-w-[120px]">
                  {item.colorName}
                </span>
              </div>
            )}
          </div>

          {/* Unit Price on Mobile */}
          <div className="sm:hidden text-xs text-muted-foreground">
            {formatCurrency(item.price)}
          </div>
        </div>
      </div>

      {/* Right: Quantity Stepper, Price & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
        {/* Stepper */}
        <div className="flex items-center border border-border/80 rounded-lg bg-muted/20 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
            aria-label={`${tCart("quantity")} - 1`}
            className="h-9 w-9 sm:h-7 sm:w-7 rounded-md text-foreground hover:bg-background"
          >
            <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          </Button>

          <span
            className="w-8 text-center text-xs font-bold tabular-nums text-foreground select-none"
            aria-label={`${tCart("quantity")}: ${item.quantity}`}
          >
            {item.quantity}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isMaxReached}
            onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
            aria-label={`${tCart("quantity")} + 1`}
            className="h-9 w-9 sm:h-7 sm:w-7 rounded-md text-foreground hover:bg-background disabled:opacity-40"
          >
            <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          </Button>
        </div>

        {/* Item Total Price */}
        <div className="text-right sm:min-w-[130px]">
          <div className="text-sm sm:text-base font-extrabold text-foreground tabular-nums">
            {formatCurrency(item.price * item.quantity)}
          </div>
          <div className="hidden sm:block text-[11px] text-muted-foreground tabular-nums">
            {item.quantity} × {formatCurrency(item.price)}
          </div>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.variantId)}
          aria-label={tCart("removeItem")}
          className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
