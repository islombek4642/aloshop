"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Check, ShieldCheck, Smartphone, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils/cn";

export interface ProductCardVariant {
  id: string;
  sku: string;
  colorNameUz?: string;
  colorNameRu?: string;
  colorNameEn?: string;
  colorHex: string;
  storage: string;
  condition: string;
  price: number | string | { toString(): string };
  oldPrice?: number | string | { toString(): string } | null;
  images: string[];
  inventory?: {
    quantity: number;
    branch?: { name: string; slug?: string };
  }[];
}

export interface ProductCardData {
  id: string;
  brand: string;
  modelName: string;
  slug: string;
  warrantyMonths?: number;
  variants: ProductCardVariant[];
}

export interface ProductCardProps {
  product: ProductCardData;
  className?: string;
  onAddToCart?: (variantId: string) => void;
}

export function ProductCard({
  product,
  className,
  onAddToCart,
}: ProductCardProps) {
  const tProduct = useTranslations("product");
  const tCatalog = useTranslations("catalog");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [imageError, setImageError] = React.useState(false);

  const variants = product.variants && product.variants.length > 0 ? product.variants : [];
  const activeVariant = variants[selectedIndex] || variants[0];

  // Distinct storages available
  const availableStorages = React.useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => {
      if (v.storage) set.add(v.storage);
    });
    return Array.from(set);
  }, [variants]);

  // Distinct colors available
  const availableColors = React.useMemo(() => {
    const map = new Map<string, { hex: string; index: number }>();
    variants.forEach((v, idx) => {
      if (v.colorHex && !map.has(v.colorHex.toLowerCase())) {
        map.set(v.colorHex.toLowerCase(), { hex: v.colorHex, index: idx });
      }
    });
    return Array.from(map.values());
  }, [variants]);

  // Calculate stock for active variant
  const totalStock = React.useMemo(() => {
    if (!activeVariant?.inventory) return 0;
    return activeVariant.inventory.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  }, [activeVariant]);

  // Calculate discount percentage if oldPrice exists
  const discountPercent = React.useMemo(() => {
    if (!activeVariant?.oldPrice || !activeVariant?.price) return null;
    const current = Number(activeVariant.price.toString());
    const old = Number(activeVariant.oldPrice.toString());
    if (old > current && old > 0) {
      return Math.round(((old - current) / old) * 100);
    }
    return null;
  }, [activeVariant]);

  const primaryImage =
    activeVariant?.images && activeVariant.images.length > 0
      ? activeVariant.images[0]
      : null;

  const handleStorageSelect = (storage: string) => {
    const foundIdx = variants.findIndex((v) => v.storage === storage);
    if (foundIdx !== -1) {
      setSelectedIndex(foundIdx);
      setImageError(false);
    }
  };

  const handleColorSelect = (idx: number) => {
    setSelectedIndex(idx);
    setImageError(false);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-md",
        className
      )}
    >
      {/* Top Badges */}
      <div className="flex items-start justify-between gap-2 z-10">
        <div className="flex flex-wrap items-center gap-1.5">
          {discountPercent !== null && (
            <Badge variant="destructive" className="font-bold text-[10px] px-2 py-0.5">
              -{discountPercent}%
            </Badge>
          )}
          {activeVariant?.condition === "NEW" ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-medium">
              {tProduct("conditions.new")}
            </Badge>
          ) : activeVariant?.condition === "USED" ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-medium">
              {tProduct("conditions.used")}
            </Badge>
          ) : null}
        </div>

        {/* Stock Status Badge */}
        {totalStock > 0 ? (
          <Badge
            variant="success"
            className="text-[10px] px-2 py-0.5 gap-1 shrink-0 font-medium"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            <span>{tProduct("inStock")}</span>
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="text-[10px] px-2 py-0.5 text-muted-foreground shrink-0 font-medium"
          >
            {tProduct("outOfStock")}
          </Badge>
        )}
      </div>

      {/* Product Image Section */}
      <Link
        href={`/product/${product.slug}`}
        className="relative my-3 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-muted/20 p-2"
        aria-label={`${product.brand} ${product.modelName}`}
      >
        {primaryImage && !imageError ? (
          <Image
            src={primaryImage}
            alt={`${product.brand} ${product.modelName}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/40">
            <Smartphone className="h-20 w-20 stroke-[1.25]" aria-hidden="true" />
          </div>
        )}
      </Link>

      {/* Info & Specs */}
      <div className="flex flex-col space-y-2">
        {/* Brand & Model */}
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </span>
          <h3 className="line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {product.modelName}
          </h3>
        </div>

        {/* Storage Chips */}
        {availableStorages.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {availableStorages.map((storage) => {
              const isSelected = activeVariant?.storage === storage;
              return (
                <button
                  key={storage}
                  type="button"
                  onClick={() => handleStorageSelect(storage)}
                  className={cn(
                    "min-h-[36px] px-2 py-1 sm:min-h-0 sm:px-1.5 sm:py-0.5 rounded text-[11px] font-medium border transition-colors inline-flex items-center justify-center",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                  )}
                  aria-pressed={isSelected}
                >
                  {storage}
                </button>
              );
            })}
          </div>
        )}

        {/* Color Swatch Circles */}
        {availableColors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {availableColors.map((c) => {
              const isSelected =
                activeVariant?.colorHex.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleColorSelect(c.index)}
                  className={cn(
                    "relative h-4 w-4 rounded-full border shadow-xs transition-transform before:absolute before:inset-[-8px] before:content-['']",
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 scale-110"
                      : "border-black/20 hover:scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                  aria-label={`Color ${c.hex}`}
                />
              );
            })}
          </div>
        )}

        {/* Price Section */}
        <div className="pt-2">
          {activeVariant?.oldPrice && discountPercent !== null && (
            <span className="block text-xs text-muted-foreground line-through">
              {formatCurrency(activeVariant.oldPrice)}
            </span>
          )}
          <div className="text-lg font-bold text-foreground">
            {activeVariant ? formatCurrency(activeVariant.price) : "0 so'm"}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-4 pt-3 border-t flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full text-xs font-medium justify-between h-9 sm:h-8"
        >
          <Link href={`/product/${product.slug}`}>
            <span>{tProduct("viewDetails")}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

