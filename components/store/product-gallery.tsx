"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Smartphone, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export const CAROUSEL_AUTOPLAY_INTERVAL_MS = 4000;

export function getNextGalleryIndex(currentIndex: number, totalImages: number): number {
  if (totalImages <= 0) return 0;
  return (currentIndex + 1) % totalImages;
}

export function getPrevGalleryIndex(currentIndex: number, totalImages: number): number {
  if (totalImages <= 0) return 0;
  return (currentIndex - 1 + totalImages) % totalImages;
}

export function computeAutoAdvanceState({
  currentIndex,
  totalImages,
  isPaused,
}: {
  currentIndex: number;
  totalImages: number;
  isPaused: boolean;
}): { nextIndex: number; shouldAdvance: boolean } {
  if (isPaused || totalImages <= 1) {
    return { nextIndex: currentIndex, shouldAdvance: false };
  }
  return {
    nextIndex: getNextGalleryIndex(currentIndex, totalImages),
    shouldAdvance: true,
  };
}

/**
 * Aggregates all unique images across product variants into a unified model gallery.
 * The active variant image is placed first so the user sees the currently selected color immediately.
 */
export function aggregateModelImages(
  variants: Array<{ images?: string[] }>,
  activeVariant?: { images?: string[] }
): string[] {
  const list: string[] = [];
  if (activeVariant?.images?.[0]) {
    list.push(activeVariant.images[0]);
  }
  for (const v of variants) {
    if (Array.isArray(v.images)) {
      for (const img of v.images) {
        if (img && !list.includes(img)) {
          list.push(img);
        }
      }
    }
  }
  return list.length > 0 ? list : ["/images/products/placeholder.webp"];
}

export interface ProductGalleryProps {
  images: string[];
  alt: string;
  condition?: string;
  warrantyMonths?: number;
  initialIndex?: number;
  className?: string;
}

export function ProductGallery({
  images,
  alt,
  condition,
  warrantyMonths,
  initialIndex,
  className,
}: ProductGalleryProps) {
  const tProduct = useTranslations("product");
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex ?? 0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [imageErrors, setImageErrors] = React.useState<Record<number, boolean>>({});

  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const touchEndY = React.useRef<number | null>(null);
  const minSwipeDistance = 40;

  const safeImages = images && images.length > 0 ? images : [];
  const activeImage = safeImages[selectedIndex] || safeImages[0];
  const isCurrentError = imageErrors[selectedIndex];

  // Sync with initialIndex (e.g. user selected another color swatch)
  React.useEffect(() => {
    if (
      typeof initialIndex === "number" &&
      initialIndex >= 0 &&
      initialIndex < safeImages.length
    ) {
      setSelectedIndex(initialIndex);
    }
  }, [initialIndex, safeImages.length]);

  // Reset selected index if current index is out of bounds
  React.useEffect(() => {
    if (selectedIndex >= safeImages.length) {
      setSelectedIndex(0);
    }
    setImageErrors({});
  }, [safeImages.length, selectedIndex]);



  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchEndX.current = null;
    touchEndY.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);

    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    ) {
      touchStartX.current = null;
      touchEndX.current = null;
      touchStartY.current = null;
      touchEndY.current = null;
      return;
    }

    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;

    // Only swipe horizontally if horizontal movement exceeds vertical movement
    if (Math.abs(distanceX) > minSwipeDistance && Math.abs(distanceX) > Math.abs(distanceY)) {
      if (distanceX > 0 && selectedIndex < safeImages.length - 1) {
        setSelectedIndex((prev) => prev + 1);
      } else if (distanceX < 0 && selectedIndex > 0) {
        setSelectedIndex((prev) => prev - 1);
      }
    }
  };

  const handleTouchCancel = () => {
    setIsPaused(false);
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < safeImages.length - 1) {
      setSelectedIndex((prev) => prev + 1);
    }
  };

  const handleSelectThumbnail = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Image Viewport with touch swipe */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-muted/20 via-background to-muted/30 p-6 flex items-center justify-center shadow-xs touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Floating Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
          {condition === "NEW" ? (
            <Badge variant="secondary" className="px-2.5 py-1 text-xs font-medium backdrop-blur-md">
              {tProduct("conditions.new")}
            </Badge>
          ) : condition === "USED" ? (
            <Badge variant="outline" className="px-2.5 py-1 text-xs font-medium backdrop-blur-md bg-background/90">
              {tProduct("conditions.used")}
            </Badge>
          ) : null}

          {warrantyMonths && warrantyMonths > 0 ? (
            <Badge variant="success" className="px-2.5 py-1 text-xs font-medium gap-1.5 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tProduct("warrantyMonths", { count: warrantyMonths })}</span>
            </Badge>
          ) : null}
        </div>

        {/* Primary Image Display */}
        {activeImage && !isCurrentError ? (
          <div className="relative h-full w-full">
            <Image
              src={activeImage}
              alt={`${alt} - ${selectedIndex + 1}`}
              fill
              priority
              quality={95}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              className="object-contain p-2 transition-transform duration-300 hover:scale-105 [image-rendering:-webkit-optimize-contrast]"
              onError={() => handleImageError(selectedIndex)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/35 py-12">
            <Smartphone className="h-28 w-28 stroke-[1.2]" aria-hidden="true" />
          </div>
        )}

        {/* Previous / Next Arrow Controls for touch & mobile accessibility */}
        {safeImages.length > 1 && (
          <>
            {selectedIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-xs border border-border/60 shadow-xs flex items-center justify-center text-foreground hover:bg-background transition-opacity"
                aria-label={tProduct("prevImage")}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            {selectedIndex < safeImages.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-xs border border-border/60 shadow-xs flex items-center justify-center text-foreground hover:bg-background transition-opacity"
                aria-label={tProduct("nextImage")}
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            {/* Pagination Dots indicator on Mobile */}
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 backdrop-blur-xs"
              aria-hidden="true"
            >
              {safeImages.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    dotIdx === selectedIndex
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-muted-foreground/40"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {safeImages.length > 1 && (
        <div
          role="region"
          aria-label={tProduct("gallery")}
          className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5"
        >
          {safeImages.map((imgUrl, idx) => {
            const isSelected = idx === selectedIndex;
            const hasError = imageErrors[idx];

            return (
              <button
                key={`${imgUrl}-${idx}`}
                type="button"
                onClick={() => handleSelectThumbnail(idx)}
                className={cn(
                  "relative h-16 w-16 shrink-0 rounded-xl border bg-muted/20 p-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 ring-offset-1 shadow-xs"
                    : "border-border/60 hover:border-border hover:bg-muted/40 opacity-70 hover:opacity-100"
                )}
                aria-label={`${alt} - ${idx + 1}`}
                aria-current={isSelected ? "true" : undefined}
              >
                {!hasError ? (
                  <Image
                    src={imgUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain p-1 rounded-lg [image-rendering:-webkit-optimize-contrast]"
                    onError={() => handleImageError(idx)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <Smartphone className="h-6 w-6 stroke-[1.5]" aria-hidden="true" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
