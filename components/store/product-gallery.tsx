"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Smartphone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export interface ProductGalleryProps {
  images: string[];
  alt: string;
  condition?: string;
  warrantyMonths?: number;
  className?: string;
}

export function ProductGallery({
  images,
  alt,
  condition,
  warrantyMonths,
  className,
}: ProductGalleryProps) {
  const tProduct = useTranslations("product");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [imageErrors, setImageErrors] = React.useState<Record<number, boolean>>({});

  // Reset selected image when images list changes (e.g. variant switched)
  const imageKey = images.join("|");
  React.useEffect(() => {
    setSelectedIndex(0);
    setImageErrors({});
  }, [imageKey]);

  const safeImages = images && images.length > 0 ? images : [];
  const activeImage = safeImages[selectedIndex] || safeImages[0];
  const isCurrentError = imageErrors[selectedIndex];

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Main Image Viewport */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-muted/20 via-background to-muted/30 p-6 flex items-center justify-center shadow-xs">
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              className="object-contain p-2 transition-transform duration-300 hover:scale-105"
              onError={() => handleImageError(selectedIndex)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/35 py-12">
            <Smartphone className="h-28 w-28 stroke-[1.2]" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Thumbnails Strip */}
      {safeImages.length > 1 && (
        <div
          role="region"
          aria-label={tProduct("details")}
          className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5"
        >
          {safeImages.map((imgUrl, idx) => {
            const isSelected = idx === selectedIndex;
            const hasError = imageErrors[idx];

            return (
              <button
                key={`${imgUrl}-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
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
                    className="object-contain p-1 rounded-lg"
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
