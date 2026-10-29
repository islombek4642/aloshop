"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ProductVariantInventory {
  branchId: string;
  quantity: number;
  branch?: {
    id: string;
    name: string;
    slug: string;
    address?: string;
    phone?: string;
    workingHours?: string;
  };
}

export interface ProductVariantData {
  id: string;
  sku: string;
  colorNameUz?: string;
  colorNameRu?: string;
  colorNameEn?: string;
  colorHex: string;
  storage: string;
  condition: string;
  price: number;
  oldPrice?: number | null;
  images: string[];
  inventory?: ProductVariantInventory[];
}

export interface VariantSelectorProps {
  variants: ProductVariantData[];
  selectedVariantId: string;
  onSelectVariant: (variant: ProductVariantData) => void;
  className?: string;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelectVariant,
  className,
}: VariantSelectorProps) {
  const tProduct = useTranslations("product");
  const locale = useLocale();

  const activeVariant =
    variants.find((v) => v.id === selectedVariantId) || variants[0];

  const getLocalizedColorName = React.useCallback(
    (variant: ProductVariantData): string => {
      if (locale === "ru") {
        return variant.colorNameRu || variant.colorNameUz || variant.colorHex;
      }
      if (locale === "en") {
        return variant.colorNameEn || variant.colorNameUz || variant.colorHex;
      }
      return variant.colorNameUz || variant.colorNameRu || variant.colorNameEn || variant.colorHex;
    },
    [locale]
  );

  // Group unique colors
  const availableColors = React.useMemo(() => {
    const map = new Map<string, { hex: string; name: string; variant: ProductVariantData }>();
    for (const v of variants) {
      const hexKey = v.colorHex.toLowerCase().trim();
      if (!map.has(hexKey)) {
        map.set(hexKey, {
          hex: v.colorHex,
          name: getLocalizedColorName(v),
          variant: v,
        });
      }
    }
    return Array.from(map.values());
  }, [variants, getLocalizedColorName]);

  // Distinct storages
  const availableStorages = React.useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) {
      if (v.storage) set.add(v.storage);
    }
    return Array.from(set);
  }, [variants]);

  // Handle color selection: prefer same storage, otherwise fallback to first variant with this color
  const handleColorChange = (hex: string) => {
    const targetHex = hex.toLowerCase();
    const currentStorage = activeVariant?.storage;

    const exactMatch = variants.find(
      (v) =>
        v.colorHex.toLowerCase() === targetHex &&
        v.storage.toLowerCase() === currentStorage?.toLowerCase()
    );

    if (exactMatch) {
      onSelectVariant(exactMatch);
      return;
    }

    const colorMatch = variants.find(
      (v) => v.colorHex.toLowerCase() === targetHex
    );
    if (colorMatch) {
      onSelectVariant(colorMatch);
    }
  };

  // Handle storage selection: prefer same color, otherwise fallback to first variant with this storage
  const handleStorageChange = (storage: string) => {
    const currentColor = activeVariant?.colorHex.toLowerCase();

    const exactMatch = variants.find(
      (v) =>
        v.storage.toLowerCase() === storage.toLowerCase() &&
        v.colorHex.toLowerCase() === currentColor
    );

    if (exactMatch) {
      onSelectVariant(exactMatch);
      return;
    }

    const storageMatch = variants.find(
      (v) => v.storage.toLowerCase() === storage.toLowerCase()
    );
    if (storageMatch) {
      onSelectVariant(storageMatch);
    }
  };

  if (!variants || variants.length === 0) {
    return null;
  }

  const activeColorName = activeVariant ? getLocalizedColorName(activeVariant) : "";

  return (
    <div className={cn("space-y-5", className)}>
      {/* Color Selection */}
      {availableColors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {tProduct("color")}:{" "}
              <span className="text-muted-foreground font-normal">
                {activeColorName}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {availableColors.map((item) => {
              const isSelected =
                activeVariant?.colorHex.toLowerCase() === item.hex.toLowerCase();

              return (
                <button
                  key={item.hex}
                  type="button"
                  onClick={() => handleColorChange(item.hex)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs font-medium"
                      : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  )}
                  aria-pressed={isSelected}
                  aria-label={item.name}
                >
                  <span
                    className={cn(
                      "relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border shadow-2xs",
                      isSelected ? "border-black/30" : "border-black/20"
                    )}
                    style={{ backgroundColor: item.hex }}
                  >
                    {isSelected && (
                      <Check
                        className="h-2.5 w-2.5 stroke-[3] text-white mix-blend-difference"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Storage Selection */}
      {availableStorages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {tProduct("storage")}:{" "}
              <span className="text-muted-foreground font-normal">
                {activeVariant?.storage}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableStorages.map((storage) => {
              const isSelected =
                activeVariant?.storage.toLowerCase() === storage.toLowerCase();

              // Check if this storage exists for currently selected color
              const existsInColor = variants.some(
                (v) =>
                  v.storage.toLowerCase() === storage.toLowerCase() &&
                  v.colorHex.toLowerCase() === activeVariant?.colorHex.toLowerCase()
              );

              return (
                <button
                  key={storage}
                  type="button"
                  onClick={() => handleStorageChange(storage)}
                  className={cn(
                    "min-w-16 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                      : existsInColor
                      ? "border-border/80 bg-background text-foreground hover:border-foreground/40 hover:bg-muted/40"
                      : "border-border/40 bg-muted/20 text-muted-foreground hover:border-border"
                  )}
                  aria-pressed={isSelected}
                >
                  {storage}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SKU Info */}
      {activeVariant?.sku && (
        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{tProduct("sku")}:</span>
          <span className="font-mono text-[11px] tracking-wide">{activeVariant.sku}</span>
        </div>
      )}
    </div>
  );
}
