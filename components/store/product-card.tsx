"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Cpu, HardDrive, Smartphone, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import { inferDefaultRam, formatRam, formatStorage } from "@/lib/utils/specs";
import { cn } from "@/lib/utils/cn";

export interface ProductCardVariant {
  id: string;
  sku: string;
  colorNameUz?: string;
  colorNameRu?: string;
  colorNameEn?: string;
  colorHex: string;
  ram?: string | null;
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

export const CAROUSEL_INTERVAL_MS = 3000;
export const MIN_SWIPE_DISTANCE_PX = 30;

export interface CardImageItem {
  url: string;
  colorHex: string;
  variantIndex: number;
}

/**
 * Extracts unique photos across product variants with their associated color and variant index.
 */
export function extractCardImages(variants: ProductCardVariant[]): CardImageItem[] {
  if (!Array.isArray(variants) || variants.length === 0) return [];
  const items: CardImageItem[] = [];
  const seenUrls = new Set<string>();

  variants.forEach((v, vIdx) => {
    if (Array.isArray(v.images)) {
      v.images.forEach((img) => {
        if (img && typeof img === "string" && !seenUrls.has(img)) {
          seenUrls.add(img);
          items.push({
            url: img,
            colorHex: v.colorHex || "",
            variantIndex: vIdx,
          });
        }
      });
    }
  });

  return items;
}

export function getNextCarouselIndex(currentIndex: number, totalImages: number): number {
  if (totalImages <= 0) return 0;
  return (currentIndex + 1) % totalImages;
}

export function getPrevCarouselIndex(currentIndex: number, totalImages: number): number {
  if (totalImages <= 0) return 0;
  return (currentIndex - 1 + totalImages) % totalImages;
}

export function calculateSwipeAction(
  touchStartX: number,
  touchEndX: number,
  minDistance: number = MIN_SWIPE_DISTANCE_PX
): "next" | "prev" | "none" {
  const diff = touchStartX - touchEndX;
  if (diff > minDistance) return "next";
  if (diff < -minDistance) return "prev";
  return "none";
}

export interface ProductCardData {
  id: string;
  brand: string;
  modelName: string;
  slug: string;
  warrantyMonths?: number;
  screenSize?: string | null;
  processor?: string | null;
  battery?: string | null;
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
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const touchStartXRef = React.useRef<number | null>(null);
  const swipedRef = React.useRef(false);
  const activeImageIndexRef = React.useRef(activeImageIndex);
  activeImageIndexRef.current = activeImageIndex;

  const variants = product.variants && product.variants.length > 0 ? product.variants : [];
  const activeVariant = variants[selectedIndex] || variants[0];
  const cardImages = React.useMemo(() => extractCardImages(variants), [variants]);

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

  // Reset image error on variant or active image change
  React.useEffect(() => {
    setImageError(false);
  }, [selectedIndex, activeImageIndex]);

  // Auto-cycle carousel every 3 seconds on hover
  React.useEffect(() => {
    if (!isHovered || cardImages.length <= 1) return;

    const timer = setInterval(() => {
      const next = (activeImageIndexRef.current + 1) % cardImages.length;
      setActiveImageIndex(next);
      setImageError(false);

      const targetVariantIdx = cardImages[next]?.variantIndex;
      if (typeof targetVariantIdx === "number" && targetVariantIdx >= 0) {
        setSelectedIndex(targetVariantIdx);
      }
    }, CAROUSEL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isHovered, cardImages]);

  // Mobile touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      swipedRef.current = false;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || cardImages.length <= 1) return;
    const touchEndX = e.changedTouches[0]?.clientX;
    if (typeof touchEndX !== "number") return;

    const action = calculateSwipeAction(touchStartXRef.current, touchEndX, MIN_SWIPE_DISTANCE_PX);
    touchStartXRef.current = null;

    if (action === "next") {
      swipedRef.current = true;
      const next = getNextCarouselIndex(activeImageIndexRef.current, cardImages.length);
      setActiveImageIndex(next);
      setImageError(false);
      const targetVariantIdx = cardImages[next]?.variantIndex;
      if (typeof targetVariantIdx === "number" && targetVariantIdx >= 0) {
        setSelectedIndex(targetVariantIdx);
      }
    } else if (action === "prev") {
      swipedRef.current = true;
      const prev = getPrevCarouselIndex(activeImageIndexRef.current, cardImages.length);
      setActiveImageIndex(prev);
      setImageError(false);
      const targetVariantIdx = cardImages[prev]?.variantIndex;
      if (typeof targetVariantIdx === "number" && targetVariantIdx >= 0) {
        setSelectedIndex(targetVariantIdx);
      }
    }
  };

  const primaryImage =
    cardImages[activeImageIndex]?.url ||
    (activeVariant?.images && activeVariant.images.length > 0 ? activeVariant.images[0] : null);

  const displayRam =
    formatRam(activeVariant?.ram) ||
    inferDefaultRam(product.brand, product.modelName, activeVariant?.storage);

  const displayStorage =
    formatStorage(activeVariant?.storage) || activeVariant?.storage;

  const handleStorageSelect = (storage: string) => {
    const currentColorHex = activeVariant?.colorHex?.toLowerCase();
    let foundIdx = variants.findIndex(
      (v) => v.storage === storage && v.colorHex?.toLowerCase() === currentColorHex
    );
    if (foundIdx === -1) {
      foundIdx = variants.findIndex((v) => v.storage === storage);
    }
    if (foundIdx !== -1) {
      setSelectedIndex(foundIdx);
      setImageError(false);
      const imgIdx = cardImages.findIndex((item) => item.variantIndex === foundIdx);
      if (imgIdx !== -1) {
        setActiveImageIndex(imgIdx);
      }
    }
  };

  const handleColorSelect = (idx: number) => {
    setSelectedIndex(idx);
    setImageError(false);
    const imgIdx = cardImages.findIndex((item) => item.variantIndex === idx);
    if (imgIdx !== -1) {
      setActiveImageIndex(imgIdx);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-2.5 sm:p-3.5 md:p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md",
        className
      )}
    >
      {/* Micro-badge Header */}
      <div className="flex items-center justify-between gap-1.5 z-10 min-h-[22px]">
        <div className="flex flex-wrap items-center gap-1">
          {discountPercent !== null && (
            <Badge variant="destructive" className="font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 leading-none">
              -{discountPercent}%
            </Badge>
          )}
          {activeVariant?.condition === "NEW" ? (
            <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0.5 leading-none font-medium">
              {tProduct("conditions.new")}
            </Badge>
          ) : activeVariant?.condition === "USED" ? (
            <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0.5 leading-none font-medium">
              {tProduct("conditions.used")}
            </Badge>
          ) : null}
        </div>

        {/* Live Branch Stock Pulse Indicator */}
        {totalStock > 0 ? (
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span className="truncate">{tProduct("inStock")}</span>
          </span>
        ) : (
          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium shrink-0">
            {tProduct("outOfStock")}
          </span>
        )}
      </div>

      {/* Product Image Section */}
      <div
        className="relative my-1.5 sm:my-2.5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted/15 p-2 transition-colors group-hover:bg-muted/25"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          href={`/product/${product.slug}`}
          onClick={(e) => {
            if (swipedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              swipedRef.current = false;
            }
          }}
          className="relative flex h-full w-full items-center justify-center"
          aria-label={`${product.brand} ${product.modelName}`}
        >
          {primaryImage && !imageError ? (
            <Image
              src={primaryImage}
              alt={`${product.brand} ${product.modelName}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 25vw"
              className="object-contain p-1.5 sm:p-2 transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/40">
              <Smartphone className="h-12 w-12 sm:h-16 sm:w-16 stroke-[1.25]" aria-hidden="true" />
            </div>
          )}
        </Link>

        {/* Pagination Dots Indicator */}
        {cardImages.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 z-10 flex items-center justify-center gap-1.5 pointer-events-auto">
            {cardImages.map((img, idx) => {
              const isActive = idx === activeImageIndex;
              return (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveImageIndex(idx);
                    setImageError(false);
                    if (typeof img.variantIndex === "number" && img.variantIndex >= 0) {
                      setSelectedIndex(img.variantIndex);
                    }
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    isActive
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/60"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Info & Specs */}
      <div className="flex flex-col space-y-1.5 sm:space-y-2">
        {/* Brand & Model */}
        <div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            {product.brand}
          </span>
          <h3 className="line-clamp-1 text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            <Link href={`/product/${product.slug}`}>
              {product.modelName}
            </Link>
          </h3>
        </div>

        {/* Hardware Specs Badge: RAM & Storage */}
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {displayRam && (
            <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-foreground">
              <Cpu className="h-2.5 w-2.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{displayRam} {tProduct("ram")}</span>
            </span>
          )}
          {displayStorage && (
            <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-foreground">
              <HardDrive className="h-2.5 w-2.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{displayStorage}</span>
            </span>
          )}
        </div>

        {/* Storage Chips (if multiple storages available) */}
        {availableStorages.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {availableStorages.map((storage) => {
              const isSelected = activeVariant?.storage === storage;
              return (
                <button
                  key={storage}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStorageSelect(storage);
                  }}
                  className={cn(
                    "min-h-[22px] px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors inline-flex items-center justify-center",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted"
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
          <div className="flex items-center gap-1.5 pt-0.5">
            {availableColors.map((c) => {
              const isSelected =
                activeVariant?.colorHex.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleColorSelect(c.index);
                  }}
                  className={cn(
                    "relative h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border shadow-xs transition-transform before:absolute before:inset-[-6px] before:content-['']",
                    isSelected
                      ? "ring-2 ring-primary ring-offset-1 scale-110"
                      : "border-black/20 hover:scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                  aria-label={`${tProduct("color")}: ${c.hex}`}
                />
              );
            })}
          </div>
        )}

        {/* Price Section */}
        <div className="pt-1.5">
          {activeVariant?.oldPrice && discountPercent !== null && (
            <span className="block text-[10px] sm:text-xs text-muted-foreground line-through">
              {formatCurrency(activeVariant.oldPrice)}
            </span>
          )}
          <div className="text-sm sm:text-base md:text-lg font-black text-foreground truncate">
            {activeVariant ? formatCurrency(activeVariant.price) : "0 so'm"}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-3 pt-2.5 border-t border-border/60">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full h-8 text-[11px] sm:text-xs font-semibold justify-between rounded-lg border-border/80 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
        >
          <Link href={`/product/${product.slug}`}>
            <span>{tProduct("viewDetails")}</span>
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
