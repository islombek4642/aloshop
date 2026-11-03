"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Cpu,
  HardDrive,
  Smartphone,
  BatteryCharging,
  Palette,
  Sparkles,
  Building2,
  Camera,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  getDeviceVitals,
  inferDefaultRam,
  formatRam,
  formatStorage,
} from "@/lib/utils/specs";
import type { ProductVariantData } from "@/components/store/variant-selector";

export interface SnapshotSpecsViewProps {
  activeVariant: ProductVariantData;
  brand: string;
  modelName: string;
  warrantyMonths?: number;
  screenSize?: string | null;
  processor?: string | null;
  battery?: string | null;
  camera?: string | null;
  charging?: string | null;
  os?: string | null;
  branchesInStockCount: number;
  totalStockCount: number;
  className?: string;
}

export function SnapshotSpecsView({
  activeVariant,
  brand,
  modelName,
  screenSize,
  processor,
  battery,
  camera,
  charging,
  os,
  branchesInStockCount,
  totalStockCount,
  className,
}: SnapshotSpecsViewProps) {
  const tProduct = useTranslations("product");
  const locale = useLocale();

  // Localized color name
  const colorName = React.useMemo(() => {
    if (!activeVariant) return "";
    if (locale === "ru") {
      return activeVariant.colorNameRu || activeVariant.colorNameUz || activeVariant.colorHex;
    }
    if (locale === "en") {
      return activeVariant.colorNameEn || activeVariant.colorNameUz || activeVariant.colorHex;
    }
    return activeVariant.colorNameUz || activeVariant.colorHex;
  }, [locale, activeVariant]);

  // Reactive RAM resolution with resilient fallback
  const ramDisplay = React.useMemo(() => {
    const formatted = formatRam(activeVariant?.ram);
    if (formatted) return formatted;
    return inferDefaultRam(brand, modelName, activeVariant?.storage);
  }, [activeVariant?.ram, activeVariant?.storage, brand, modelName]);

  // Reactive Storage formatting
  const storageDisplay = React.useMemo(() => {
    return formatStorage(activeVariant?.storage) || activeVariant?.storage || "";
  }, [activeVariant?.storage]);

  // Condition display
  const conditionDisplay =
    activeVariant?.condition === "NEW"
      ? tProduct("conditions.new")
      : tProduct("conditions.used");

  // Device Vitals (Display, Processor, Battery) with resilient fallback
  const vitals = React.useMemo(() => {
    return getDeviceVitals(brand, modelName);
  }, [brand, modelName]);

  const displayScreen = screenSize || vitals.screenSize;
  const displayProcessor = processor || vitals.processor;
  const displayBattery = battery || vitals.battery;
  const displayCamera = camera || null;
  const displayCharging = charging || null;

  // Stock status
  const isStockAvailable = branchesInStockCount > 0 && totalStockCount > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5",
        className
      )}
    >
      {/* Header with Title */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
          {tProduct("specs")}
        </h3>
      </div>

      {/* Grid of specifications - Stacked cards with zero label truncation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* 1. RAM Row */}
        <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Cpu className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {tProduct("ram")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
            {ramDisplay}
          </span>
        </div>

        {/* 2. Storage / ROM Row */}
        <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <HardDrive className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {tProduct("storage")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
            {storageDisplay}
          </span>
        </div>

        {/* 3. Display / Screen Row */}
        <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Smartphone className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {tProduct("screen")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
            {displayScreen}
          </span>
        </div>

        {/* 4. Processor Row */}
        <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Cpu className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {tProduct("processor")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
            {displayProcessor}
          </span>
        </div>

        {/* 5. Battery Row */}
        <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BatteryCharging className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {tProduct("battery")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
            {displayBattery}
          </span>
        </div>

        {/* 6. Camera Row (Optional) */}
        {displayCamera && (
          <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Camera className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {tProduct("camera")}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
              {displayCamera}
            </span>
          </div>
        )}

        {/* 7. Charging Row (Optional) */}
        {displayCharging && (
          <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Zap className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {tProduct("charging")}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
              {displayCharging}
            </span>
          </div>
        )}

        {/* 8. Operating System Row (Optional) */}
        {os && (
          <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Smartphone className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {tProduct("os")}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
              {os}
            </span>
          </div>
        )}

        {/* 9. Color Row */}
        <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Palette className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {tProduct("color")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20 dark:border-white/20 shadow-2xs"
              style={{ backgroundColor: activeVariant?.colorHex }}
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
              {colorName}
            </span>
          </div>
        </div>

        {/* 10. Condition Row */}
        <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {tProduct("condition")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
            {conditionDisplay}
          </span>
        </div>

        {/* 11. Live Branch Availability Row */}
        <div className="sm:col-span-2 flex min-h-[72px] flex-col justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                  isStockAvailable
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Building2 className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {tProduct("stockInBranches")}
              </span>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shrink-0",
                isStockAvailable
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}
            >
              {isStockAvailable ? tProduct("inStock") : tProduct("outOfStock")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
            {isStockAvailable
              ? tProduct("branchesInStockSummary", {
                  branchCount: branchesInStockCount,
                  totalCount: totalStockCount,
                })
              : tProduct("outOfStock")}
          </span>
        </div>
      </div>
    </div>
  );
}
