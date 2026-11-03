"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Check,
  Smartphone,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CATALOG_PRESETS,
  getCatalogBrands,
} from "@/lib/catalog/presets";
import type { CategoryItem, ExistingProductItem } from "./types";
import { cn } from "@/lib/utils/cn";

export interface ModelSelectionResult {
  isCustom: boolean;
  brand: string;
  modelName: string;
  categoryId?: string;
  series?: string;
  releaseYear?: number;
  screenSize?: string;
  processor?: string;
  battery?: string;
  camera?: string;
  charging?: string;
  os?: string;
  warrantyMonths: number;
  descriptionUz: string;
  descriptionRu: string;
  descriptionEn: string;
  presetColors?: Array<{
    nameUz: string;
    nameRu: string;
    nameEn: string;
    hex: string;
    imageUrl?: string;
  }>;
  presetStorages?: string[];
  presetRam?: string;
}

export interface ModelSelectorProps {
  categories: CategoryItem[];
  existingProducts: ExistingProductItem[];
  selectedModel: ModelSelectionResult | null;
  onSelectModel: (model: ModelSelectionResult) => void;
  className?: string;
}

export function ModelSelector({
  categories,
  existingProducts,
  selectedModel,
  onSelectModel,
  className,
}: ModelSelectorProps) {
  const t = useTranslations("admin.productCreate");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = React.useState<string>("ALL");
  const [isCustomMode, setIsCustomMode] = React.useState(false);
  const [showAdvancedSpecs, setShowAdvancedSpecs] = React.useState(false);

  // Custom model form state
  const [customBrand, setCustomBrand] = React.useState("");
  const [customModelName, setCustomModelName] = React.useState("");
  const [customSeries, setCustomSeries] = React.useState("");
  const [customReleaseYear, setCustomReleaseYear] = React.useState<number>(new Date().getFullYear());
  const [customScreen, setCustomScreen] = React.useState("");
  const [customCpu, setCustomCpu] = React.useState("");
  const [customBattery, setCustomBattery] = React.useState("");
  const [customCamera, setCustomCamera] = React.useState("");
  const [customCharging, setCustomCharging] = React.useState("");
  const [customOs, setCustomOs] = React.useState("");
  const [customWarranty, setCustomWarranty] = React.useState(12);

  // Available brands
  const brands = React.useMemo(() => {
    const list = getCatalogBrands();
    const existingBrands = existingProducts.map((p) => p.brand);
    const combined = Array.from(new Set([...list, ...existingBrands]));
    return combined.sort();
  }, [existingProducts]);

  // Combined models list (deduplicating presets and DB models)
  const allModels = React.useMemo(() => {
    const presetList: Array<ModelSelectionResult & { id: string }> = CATALOG_PRESETS.map((p) => ({
      id: `preset-${p.id}`,
      isCustom: false,
      brand: p.brand,
      modelName: p.modelName,
      series: p.series,
      releaseYear: p.releaseYear,
      screenSize: p.screenSize,
      processor: p.processor,
      battery: p.battery,
      camera: p.camera,
      charging: p.charging,
      os: p.os,
      warrantyMonths: p.warrantyMonths,
      descriptionUz: p.descriptionUz,
      descriptionRu: p.descriptionRu,
      descriptionEn: p.descriptionEn,
      presetColors: p.colors,
      presetStorages: p.storageOptions,
      presetRam: p.ram,
    }));

    // Add unique existing DB products that might not be in presets
    const dbOnlyList: Array<ModelSelectionResult & { id: string }> = [];
    for (const ep of existingProducts) {
      const alreadyInPreset = presetList.some(
        (p) =>
          p.brand.toLowerCase() === ep.brand.toLowerCase() &&
          p.modelName.toLowerCase() === ep.modelName.toLowerCase()
      );
      if (!alreadyInPreset) {
        dbOnlyList.push({
          id: `db-${ep.id}`,
          isCustom: false,
          brand: ep.brand,
          modelName: ep.modelName,
          categoryId: ep.categoryId,
          series: ep.series || undefined,
          releaseYear: ep.releaseYear || undefined,
          screenSize: ep.screenSize || undefined,
          processor: ep.processor || undefined,
          battery: ep.battery || undefined,
          camera: ep.camera || undefined,
          charging: ep.charging || undefined,
          os: ep.os || undefined,
          warrantyMonths: ep.warrantyMonths,
          descriptionUz: ep.descriptionUz,
          descriptionRu: ep.descriptionRu,
          descriptionEn: ep.descriptionEn,
        });
      }
    }

    return [...presetList, ...dbOnlyList];
  }, [existingProducts]);

  // Filtered models by search query and brand
  const filteredModels = React.useMemo(() => {
    return allModels.filter((m) => {
      const matchesBrand =
        selectedBrandFilter === "ALL" ||
        m.brand.toLowerCase() === selectedBrandFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.modelName.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        (m.processor && m.processor.toLowerCase().includes(q));

      return matchesBrand && matchesQuery;
    });
  }, [allModels, selectedBrandFilter, searchQuery]);

  const handleSelectPreset = (model: ModelSelectionResult) => {
    setIsCustomMode(false);
    onSelectModel(model);
  };

  const handleApplyCustomModel = () => {
    if (!customBrand.trim() || !customModelName.trim()) return;

    const brandName = customBrand.trim();
    const model = customModelName.trim();

    onSelectModel({
      isCustom: true,
      brand: brandName,
      modelName: model,
      series: customSeries.trim() || undefined,
      releaseYear: customReleaseYear,
      screenSize: customScreen.trim() || undefined,
      processor: customCpu.trim() || undefined,
      battery: customBattery.trim() || undefined,
      camera: customCamera.trim() || undefined,
      charging: customCharging.trim() || undefined,
      os: customOs.trim() || undefined,
      warrantyMonths: customWarranty,
      descriptionUz: `${brandName} ${model} smartfoni. Rasmiy sifat kafolati bilan.`,
      descriptionRu: `Смартфон ${brandName} ${model}. Официальная гарантия качества.`,
      descriptionEn: `Smartphone ${brandName} ${model}. Official quality warranty.`,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* If a model is already selected, show clean summary with option to reselect */}
      {selectedModel && !isCustomMode ? (
        <Card className="border border-sky-200 dark:border-sky-900 bg-sky-50/40 dark:bg-sky-950/20 p-5 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-semibold bg-white dark:bg-slate-900">
                    {selectedModel.brand}
                  </Badge>
                  {selectedModel.isCustom && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t("customModelBadge")}
                    </Badge>
                  )}
                  {selectedModel.releaseYear && (
                    <span className="text-xs text-slate-700 dark:text-slate-200">
                      {selectedModel.releaseYear}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedModel.brand} {selectedModel.modelName}
                </h3>
                {selectedModel.processor && (
                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                    {selectedModel.processor} • {selectedModel.screenSize || ""}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
              }}
              className="border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40"
            >
              {t("changeModel")}
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Model Selection Toolbar & Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-300" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchModelPlaceholder")}
              className="pl-9 pr-8 h-10 text-sm rounded-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggle Custom Model Mode */}
          <Button
            type="button"
            variant={isCustomMode ? "default" : "outline"}
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="h-10 text-xs font-semibold gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {isCustomMode ? t("catalogPresetsTab") : t("customModelTab")}
          </Button>
        </div>

        {/* Brand Filter Pills (only when not in custom mode) */}
        {!isCustomMode && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedBrandFilter("ALL")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition shrink-0",
                selectedBrandFilter === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              {t("allBrands", { count: allModels.length })}
            </button>
            {brands.map((brand) => {
              const count = allModels.filter(
                (m) => m.brand.toLowerCase() === brand.toLowerCase()
              ).length;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrandFilter(brand)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition shrink-0",
                    selectedBrandFilter === brand
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  {brand} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW A: Custom Model Creation Form */}
      {isCustomMode ? (
        <Card className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 bg-white dark:bg-slate-900">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {t("customModelTitle")}
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("customModelDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("brandLabel")} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder={t("brandPlaceholder")}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("modelLabel")} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                placeholder={t("modelPlaceholder")}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Collapsible Advanced Technical Specs */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 py-1"
            >
              <span>{t("specsToggle")}</span>
              {showAdvancedSpecs ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvancedSpecs && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {t("screenLabel")}
                  </label>
                  <Input
                    type="text"
                    value={customScreen}
                    onChange={(e) => setCustomScreen(e.target.value)}
                    placeholder={t("screenPlaceholder")}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {t("cpuLabel")}
                  </label>
                  <Input
                    type="text"
                    value={customCpu}
                    onChange={(e) => setCustomCpu(e.target.value)}
                    placeholder={t("cpuPlaceholder")}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {t("batteryLabel")}
                  </label>
                  <Input
                    type="text"
                    value={customBattery}
                    onChange={(e) => setCustomBattery(e.target.value)}
                    placeholder={t("batteryPlaceholder")}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {t("cameraLabel")}
                  </label>
                  <Input
                    type="text"
                    value={customCamera}
                    onChange={(e) => setCustomCamera(e.target.value)}
                    placeholder={t("cameraPlaceholder")}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {t("chargingLabel")}
                  </label>
                  <Input
                    type="text"
                    value={customCharging}
                    onChange={(e) => setCustomCharging(e.target.value)}
                    placeholder={t("chargingPlaceholder")}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {t("osLabel")}
                  </label>
                  <Input
                    type="text"
                    value={customOs}
                    onChange={(e) => setCustomOs(e.target.value)}
                    placeholder={t("osPlaceholder")}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleApplyCustomModel}
              disabled={!customBrand.trim() || !customModelName.trim()}
              className="h-9 px-4 text-xs font-semibold"
            >
              {t("confirmModelBtn")}
            </Button>
          </div>
        </Card>
      ) : (
        /* VIEW B: Preset Models Grid with Live Filter */
        <div className="space-y-2">
          {filteredModels.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 p-6">
              <Smartphone className="w-8 h-8 text-slate-600 dark:text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("searchModelEmpty", { query: searchQuery })}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                {t("searchModelEmptyHint")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredModels.map((item) => {
                const isSelected =
                  selectedModel?.brand.toLowerCase() === item.brand.toLowerCase() &&
                  selectedModel?.modelName.toLowerCase() === item.modelName.toLowerCase();

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPreset(item)}
                    className={cn(
                      "text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between",
                      isSelected
                        ? "border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 ring-1 ring-sky-500 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-1.5 py-0 uppercase"
                        >
                          {item.brand}
                        </Badge>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {item.modelName}
                      </h4>

                      {item.processor && (
                        <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 line-clamp-1">
                          {item.processor}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-200">
                      {item.screenSize && (
                        <span>{item.screenSize.split('"')[0]}&quot;</span>
                      )}
                      {item.battery && (
                        <span>• {item.battery.split(" ")[0]} mAh</span>
                      )}
                      {item.presetColors && (
                        <span className="ml-auto text-[10px] font-medium text-slate-700 dark:text-slate-200">
                          {t("colorsCount", { count: item.presetColors.length })}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
