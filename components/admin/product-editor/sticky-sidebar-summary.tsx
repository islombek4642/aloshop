"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Save,
  FileDown,
  Building2,
  DollarSign,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { BranchItem, ProductEditorState } from "./types";

interface StickySidebarSummaryProps {
  state: ProductEditorState;
  branches: BranchItem[];
  isPending: boolean;
  onSave: (asDraft: boolean) => void;
  onChange: (fields: Partial<ProductEditorState>) => void;
}

export function StickySidebarSummary({
  state,
  branches,
  isPending,
  onSave,
  onChange,
}: StickySidebarSummaryProps) {
  const t = useTranslations("admin.productCreate");

  // Compute lowest starting price across variants
  const minPrice = React.useMemo(() => {
    if (state.variants.length === 0) return 0;
    const prices = state.variants
      .map((v) => v.price)
      .filter((p) => typeof p === "number" && p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [state.variants]);

  // Compute total branch inventory aggregate
  const { totalStock, branchStockSummary } = React.useMemo(() => {
    let total = 0;
    const branchTotals: Record<string, number> = {};

    for (const b of branches) {
      branchTotals[b.id] = 0;
    }

    for (const v of state.variants) {
      for (const b of branches) {
        const qty = v.stockByBranch[b.id] || 0;
        branchTotals[b.id] += qty;
        total += qty;
      }
    }

    return { totalStock: total, branchStockSummary: branchTotals };
  }, [state.variants, branches]);

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="space-y-4 lg:sticky lg:top-20">
        <Card className="border-border/70 bg-card shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>{t("liveSummaryTitle")}</span>
              </span>
              <Badge
                variant="outline"
                className={
                  state.isActive
                    ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]"
                    : "border-muted-foreground/30 text-muted-foreground text-[10px]"
                }
              >
                {state.isActive ? "Sotuvda faol" : "Nofaol"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Thumbnail Preview */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
              {state.thumbnail ? (
                <Image
                  src={state.thumbnail}
                  alt={state.title || "Preview"}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <div className="text-center p-4 space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Muqova rasmi
                  </div>
                  <div className="text-[11px] text-muted-foreground/70">
                    Media bo'limida yuklanadi
                  </div>
                </div>
              )}
            </div>

            {/* Computed Price Summary */}
            <div className="rounded-xl p-3 bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                {t("sellingPrice")}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-foreground font-mono">
                  {formatCurrency(minPrice)}
                </span>
                {state.variants.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    {t("startingFromPrice")}
                  </span>
                )}
              </div>
            </div>

            {/* Total Stock Summary */}
            <div className="rounded-xl p-3 bg-muted/30 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  {t("totalBranchStock")}
                </span>
                <span className="text-sm font-bold text-foreground font-mono">
                  {totalStock} dona
                </span>
              </div>

              {/* Branch Chips */}
              <div className="space-y-1 pt-1 border-t border-border/40 text-xs">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-muted-foreground"
                  >
                    <span className="truncate">{b.name}:</span>
                    <span className="font-mono font-medium text-foreground">
                      {branchStockSummary[b.id] || 0} dona
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Toggle Card */}
            <div
              onClick={() => onChange({ isActive: !state.isActive })}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
                state.isActive
                  ? "border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-border bg-muted/20"
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${
                    state.isActive
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-border bg-background"
                  }`}
                >
                  {state.isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-xs font-semibold text-foreground block">
                  {state.isActive ? "Sotuvda faol" : "Nofaol (Qoralama)"}
                </span>
                <span className="text-[11px] text-muted-foreground block leading-tight">
                  {state.isActive
                    ? "Do'kon vitrinasida xaridorlarga ko'rinadi"
                    : "Vitrinada vaqtinchalik yashiriladi"}
                </span>
              </div>
            </div>

            {/* Action Buttons (Desktop) */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={() => onSave(false)}
                disabled={isPending}
                className="w-full h-11 text-xs font-semibold gap-2 shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isPending ? t("saving") : t("saveProduct")}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => onSave(true)}
                disabled={isPending}
                className="w-full h-10 text-xs font-medium gap-2"
              >
                <FileDown className="w-4 h-4 text-muted-foreground" />
                <span>{t("saveDraft")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile & Tablet Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background/95 backdrop-blur-md border-t border-border z-40 lg:hidden shadow-lg flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSave(true)}
          disabled={isPending}
          className="flex-1 min-w-0 h-11 text-xs font-medium gap-1.5"
        >
          <FileDown className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{t("saveDraft")}</span>
        </Button>

        <Button
          type="button"
          onClick={() => onSave(false)}
          disabled={isPending}
          className="flex-1 min-w-0 h-11 text-xs font-bold gap-1.5 shadow-sm"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          ) : (
            <Save className="w-4 h-4 shrink-0" />
          )}
          <span className="truncate">{isPending ? t("saving") : t("saveProduct")}</span>
        </Button>
      </div>
    </>
  );
}

