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
      {/* Header with Title & SKU */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
          {tProduct("specs")}
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {activeVariant?.sku}
        </span>
      </div>

      {/* 2-column (mobile) to 3-column (sm+) high-density spec tiles (8 tiles) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* 1. RAM Tile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cpu className="h-4 w-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tProduct("ram")}
            </span>
            <span className="block text-xs font-bold text-foreground truncate">
              {ramDisplay}
            </span>
          </div>
        </div>

        {/* 2. Storage / ROM Tile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HardDrive className="h-4 w-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tProduct("storage")}
            </span>
            <span className="block text-xs font-bold text-foreground truncate">
              {storageDisplay}
            </span>
          </div>
        </div>

        {/* 3. Display / Screen Tile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Smartphone className="h-4 w-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tProduct("screen")}
            </span>
            <span className="block text-xs font-bold text-foreground truncate" title={displayScreen}>
              {displayScreen}
            </span>
          </div>
        </div>

        {/* 4. Processor Tile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cpu className="h-4 w-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tProduct("processor")}
            </span>
            <span className="block text-xs font-bold text-foreground truncate" title={displayProcessor}>
              {displayProcessor}
            </span>
          </div>
        </div>

        {/* 5. Battery Tile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BatteryCharging className="h-4 w-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tProduct("battery")}
            </span>
            <span className="block text-xs font-bold text-foreground truncate" title={displayBattery}>
              {displayBattery}
            </span>
          </div>
        </div>

        {/* 6. Color Tile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Palette className="h-4 w-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tProduct("color")}
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/20 dark:border-white/20"
                style={{ backgroundColor: activeVariant?.colorHex }}
                aria-hidden="true"
              />
              <span className="block text-xs font-bold text-foreground truncate">
                {colorName}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Condition Tile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tProduct("condition")}
            </span>
            <span className="block text-xs font-bold text-foreground truncate">
              {conditionDisplay}
            </span>
          </div>
        </div>

        {/* 8. Live Branch Availability Tile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Building2 className="h-4 w-4 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tProduct("stockInBranches")}
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              {isStockAvailable ? (
                <>
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                    aria-hidden="true"
                  />
                  <span className="block text-xs font-bold text-foreground truncate">
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
                  <span className="block text-xs font-bold text-destructive truncate">
                    {tProduct("outOfStock")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
