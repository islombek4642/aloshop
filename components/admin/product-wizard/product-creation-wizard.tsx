"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Package,
  Smartphone,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NewProductFlow } from "./new-product-flow";
import { UsedProductFlow } from "./used-product-flow";
import type {
  BranchItem,
  CategoryItem,
  DeviceCondition,
  ExistingProductItem,
} from "./types";
import { cn } from "@/lib/utils/cn";

export interface ProductCreationWizardProps {
  branches: BranchItem[];
  categories: CategoryItem[];
  existingProducts: ExistingProductItem[];
  locale: string;
  isSuperAdmin?: boolean;
  branchId?: string | null;
}

export function ProductCreationWizard({
  branches,
  categories,
  existingProducts,
  locale,
  isSuperAdmin = true,
  branchId,
}: ProductCreationWizardProps) {
  const t = useTranslations("admin.productCreate");

  // Step 0: Condition selection ("NEW" vs "USED" vs null)
  const [selectedCondition, setSelectedCondition] = React.useState<DeviceCondition | null>(null);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t("title")}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 ml-7">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* GUIDED STEP-BY-STEP WORKFLOW */}
      <div className="space-y-6">
        {/* STEP 0: Select Device Condition (NEW vs USED) */}
        {selectedCondition === null ? (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2 py-4">
              <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                {t("conditionStepBadge")}
              </Badge>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t("conditionStepTitle")}
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {t("conditionStepSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* CARD 1: NEW SMARTPHONE */}
              <Card
                onClick={() => setSelectedCondition("NEW")}
                className="group relative p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center transition-transform group-hover:scale-105">
                      <Package className="w-6 h-6" />
                    </div>
                    <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border-sky-200 text-xs font-bold">
                      {t("conditionNewBadge")}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {t("conditionNewTitle")}
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {t("conditionNewDesc")}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t("conditionNewFeature1")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t("conditionNewFeature2")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t("conditionNewFeature3")}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    type="button"
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs h-10 shadow-sm"
                  >
                    {t("conditionNewContinue")}
                  </Button>
                </div>
              </Card>

              {/* CARD 2: USED SMARTPHONE */}
              <Card
                onClick={() => setSelectedCondition("USED")}
                className="group relative p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200 text-xs font-bold">
                      {t("conditionUsedBadge")}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {t("conditionUsedTitle")}
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {t("conditionUsedDesc")}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t("conditionUsedFeature1")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t("conditionUsedFeature2")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t("conditionUsedFeature3")}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    type="button"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-10 shadow-sm"
                  >
                    {t("conditionUsedContinue")}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Selected Condition Active Flow */
          <div className="space-y-6">
            {/* Condition Banner & Switch button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    selectedCondition === "NEW"
                      ? "bg-sky-600 text-white"
                      : "bg-amber-600 text-white"
                  )}
                >
                  {selectedCondition === "NEW" ? (
                    <Package className="w-5 h-5" />
                  ) : (
                    <Smartphone className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {t("conditionCurrentLabel")}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-bold",
                        selectedCondition === "NEW"
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                      )}
                    >
                      {selectedCondition === "NEW"
                        ? t("conditionNewBadgeActive")
                        : t("conditionUsedBadgeActive")}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                    {selectedCondition === "NEW"
                      ? t("conditionNewSummaryDesc")
                      : t("conditionUsedSummaryDesc")}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm(t("leavePromptConfirm"))) {
                    setSelectedCondition(null);
                  }
                }}
                className="gap-1.5 text-xs font-semibold shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t("switchCondition")}
              </Button>
            </div>

            {/* RENDER THE APPROPRIATE WORKFLOW */}
            {selectedCondition === "NEW" ? (
              <NewProductFlow
                branches={branches}
                categories={categories}
                existingProducts={existingProducts}
                locale={locale}
                isSuperAdmin={isSuperAdmin}
                branchId={branchId}
                onCancel={() => setSelectedCondition(null)}
              />
            ) : (
              <UsedProductFlow
                branches={branches}
                categories={categories}
                existingProducts={existingProducts}
                locale={locale}
                isSuperAdmin={isSuperAdmin}
                branchId={branchId}
                onCancel={() => setSelectedCondition(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
