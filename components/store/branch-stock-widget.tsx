"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Building2, MapPin, Clock, Phone, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export interface BranchStockItem {
  id: string;
  name: string;
  slug: string;
  city?: string;
  address: string;
  phone?: string;
  workingHours?: string;
}

export interface BranchInventoryBreakdown {
  branchId?: string;
  quantity: number;
  branch?: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

export interface BranchStockWidgetProps {
  branches: BranchStockItem[];
  inventory?: BranchInventoryBreakdown[];
  className?: string;
}

export function BranchStockWidget({
  branches,
  inventory = [],
  className,
}: BranchStockWidgetProps) {
  const tProduct = useTranslations("product");
  const tBranches = useTranslations("branches");

  // Map inventory by branch id and by branch slug
  const stockMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      if (item.branchId) {
        map.set(item.branchId, item.quantity);
      }
      if (item.branch?.id) {
        map.set(item.branch.id, item.quantity);
      }
      if (item.branch?.slug) {
        map.set(item.branch.slug.toLowerCase(), item.quantity);
      }
    }
    return map;
  }, [inventory]);

  // Count branches with stock > 0
  const availableBranchesCount = React.useMemo(() => {
    return branches.filter((b) => {
      const qty = stockMap.get(b.id) ?? stockMap.get(b.slug.toLowerCase()) ?? 0;
      return qty > 0;
    }).length;
  }, [branches, stockMap]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4",
        className
      )}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {tProduct("stockInBranches")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {tProduct("pickupAvailable")}
            </p>
          </div>
        </div>

        {availableBranchesCount > 0 ? (
          <Badge variant="success" className="text-[11px] px-2 py-0.5 font-medium gap-1">
            <Check className="h-3 w-3" aria-hidden="true" />
            <span>{availableBranchesCount} / {branches.length}</span>
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[11px] px-2 py-0.5 text-muted-foreground">
            {tProduct("outOfStock")}
          </Badge>
        )}
      </div>

      {/* Branch Items List */}
      <div className="divide-y divide-border/60">
        {branches.map((branch) => {
          const qty =
            stockMap.get(branch.id) ?? stockMap.get(branch.slug.toLowerCase()) ?? 0;
          const isInStock = qty > 0;

          return (
            <div
              key={branch.id}
              className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {branch.name}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/80" aria-hidden="true" />
                  <span className="line-clamp-1">{branch.address}</span>
                </div>

                {(branch.workingHours || branch.phone) && (
                  <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[10px] text-muted-foreground/75">
                    {branch.workingHours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span>{branch.workingHours}</span>
                      </span>
                    )}
                    {branch.phone && (
                      <a
                        href={`tel:${branch.phone.replace(/[^\d+]/g, "")}`}
                        className="flex items-center gap-1 hover:text-foreground hover:underline transition-colors py-0.5"
                      >
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        <span>{branch.phone}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Branch Stock Status Badge */}
              <div className="shrink-0 pt-1 sm:pt-0">
                {isInStock ? (
                  <Badge
                    variant="success"
                    className="text-[11px] px-2.5 py-1 font-medium gap-1"
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                    <span>{tProduct("availableInStock", { count: qty })}</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-[11px] px-2.5 py-1 text-muted-foreground/90 gap-1 font-normal"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                    <span>{tProduct("outOfStock")}</span>
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
