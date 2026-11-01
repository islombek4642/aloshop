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

  // Stock status
  const isStockAvailable = branchesInStockCount > 0 && totalStockCount > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5",
        className
      )}
    >
      {/* Header with Title (Artikul olib tashlandi) */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
          {tProduct("specs")}
        </h3>
      </div>

      {/* Har bir element alohida qatorda (grid-cols-1 sm:grid-cols-2) uzun yozuvlar to'liq sig'ishi uchun */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* 1. RAM Row */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {tProduct("ram")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground text-right pl-2 shrink-0">
            {ramDisplay}
          </span>
        </div>

        {/* 2. Storage / ROM Row */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HardDrive className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {tProduct("storage")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground text-right pl-2 shrink-0">
            {storageDisplay}
          </span>
        </div>

        {/* 3. Display / Screen Row */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smartphone className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {tProduct("screen")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground text-right pl-2 shrink-0">
            {displayScreen}
          </span>
        </div>

        {/* 4. Processor Row */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {tProduct("processor")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground text-right pl-2 shrink-0">
            {displayProcessor}
          </span>
        </div>

        {/* 5. Battery Row */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BatteryCharging className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {tProduct("battery")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground text-right pl-2 shrink-0">
            {displayBattery}
          </span>
        </div>

        {/* 6. Color Row */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {tProduct("color")}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-2 shrink-0">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20 dark:border-white/20 shadow-2xs"
              style={{ backgroundColor: activeVariant?.colorHex }}
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm font-bold text-foreground text-right">
              {colorName}
            </span>
          </div>
        </div>

        {/* 7. Condition Row */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {tProduct("condition")}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground text-right pl-2 shrink-0">
            {conditionDisplay}
          </span>
        </div>

        {/* 8. Live Branch Availability Row */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {tProduct("stockInBranches")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pl-2">
            {isStockAvailable ? (
              <>
                <span
                  className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs sm:text-sm font-bold text-foreground text-right">
                  {tProduct("branchesInStockSummary", {
                    branchCount: branchesInStockCount,
                    totalCount: totalStockCount,
                  })}
                </span>
              </>
            ) : (
              <>
                <span
                  className="h-2 w-2 rounded-full bg-destructive shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs sm:text-sm font-bold text-destructive text-right">
                  {tProduct("outOfStock")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
