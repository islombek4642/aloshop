"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Smartphone,
  Layers,
  DollarSign,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelSelector, type ModelSelectionResult } from "./model-selector";
import { ImageUploader } from "./image-uploader";
import type {
  BranchItem,
  CategoryItem,
  ExistingProductItem,
  NewVariantItem,
} from "./types";
import { generateSku } from "@/lib/catalog/presets";
import { getSuggestedPriceForModel } from "@/lib/catalog/pricing";
import { formatCurrency } from "@/lib/utils/format-currency";
import { createProductAction } from "@/app/actions/admin-products";
import { cn } from "@/lib/utils/cn";

export interface NewProductFlowProps {
  branches: BranchItem[];
  categories: CategoryItem[];
  existingProducts: ExistingProductItem[];
  locale: string;
  isSuperAdmin?: boolean;
  branchId?: string | null;
  onCancel?: () => void;
}

const COMMON_STORAGES = ["64GB", "128GB", "256GB", "512GB", "1TB"];
const COMMON_RAMS = ["6GB", "8GB", "12GB", "16GB"];

export function NewProductFlow({
  branches,
  categories,
  existingProducts,
  locale,
  isSuperAdmin = true,
  branchId,
  onCancel,
}: NewProductFlowProps) {
  const router = useRouter();
  const t = useTranslations("admin.productCreate");

  // Stepper state: 1 to 6
  const [currentStep, setCurrentStep] = React.useState<number>(1);

  // Section 1: Model & Category
  const [selectedModel, setSelectedModel] = React.useState<ModelSelectionResult | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>(
    categories[0]?.id || ""
  );
  const [warrantyMonths, setWarrantyMonths] = React.useState<number>(12);
  const [descriptionUz, setDescriptionUz] = React.useState("");
  const [descriptionRu, setDescriptionRu] = React.useState("");
  const [descriptionEn, setDescriptionEn] = React.useState("");

  // Section 2, 3, 4, 5: Variants
  const [variants, setVariants] = React.useState<NewVariantItem[]>([
    {
      id: "var-1",
      sku: "",
      colorNameUz: "Qora",
      colorNameRu: "Черный",
      colorNameEn: "Black",
      colorHex: "#1C1C1E",
      ram: "8GB",
      storage: "128GB",
      price: 12000000,
      oldPrice: null,
      images: [],
      initialStock: branches.reduce<Record<string, number>>((acc, b) => {
        acc[b.id] = 0;
        return acc;
      }, {}),
    },
  ]);

  // Selected variant tab in editor
  const [activeVariantIndex, setActiveVariantIndex] = React.useState<number>(0);

  // Submission state
  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Auto-fill form when a model is selected
  const handleModelSelected = (model: ModelSelectionResult) => {
    setSelectedModel(model);
    if (model.categoryId) {
      setSelectedCategoryId(model.categoryId);
    }
    setWarrantyMonths(model.warrantyMonths || 12);
    setDescriptionUz(model.descriptionUz);
    setDescriptionRu(model.descriptionRu);
    setDescriptionEn(model.descriptionEn);

    // If preset has colors and storages, intelligently pre-populate variants
    if (model.presetColors && model.presetColors.length > 0) {
      const defaultStorage = model.presetStorages?.[0] || "128GB";
      const defaultRam = model.presetRam || "8GB";

      const newVariants: NewVariantItem[] = model.presetColors.map((c, idx) => {
        const sku = generateSku(
          model.brand,
          model.modelName,
          defaultStorage,
          c.nameEn
        );
        const suggested = getSuggestedPriceForModel(
          model.brand,
          model.modelName,
          defaultStorage
        );

        return {
          id: `var-${Date.now()}-${idx}`,
          sku,
          colorNameUz: c.nameUz,
          colorNameRu: c.nameRu,
          colorNameEn: c.nameEn,
          colorHex: c.hex,
          ram: defaultRam,
          storage: defaultStorage,
          price: suggested.price > 0 ? suggested.price : 14000000,
          oldPrice: suggested.oldPrice || null,
          images: c.imageUrl ? [c.imageUrl] : [],
          initialStock: branches.reduce<Record<string, number>>((acc, b) => {
            acc[b.id] = 0;
            return acc;
          }, {}),
        };
      });

      setVariants(newVariants);
      setActiveVariantIndex(0);
    }
  };

  // Helper to add a new variant
  const handleAddVariant = () => {
    const brand = selectedModel?.brand || "PHONE";
    const model = selectedModel?.modelName || "MODEL";
    const storage = "256GB";
    const colorEn = "Color";
    const sku = generateSku(brand, model, storage, `${colorEn}${variants.length + 1}`);

    const newVar: NewVariantItem = {
      id: `var-${Date.now()}-${variants.length + 1}`,
      sku,
      colorNameUz: `Yangi rang ${variants.length + 1}`,
      colorNameRu: `Новый цвет ${variants.length + 1}`,
      colorNameEn: `New Color ${variants.length + 1}`,
      colorHex: "#000000",
      ram: variants[0]?.ram || "8GB",
      storage: storage,
      price: variants[0]?.price || 12000000,
      oldPrice: null,
      images: [],
      initialStock: branches.reduce<Record<string, number>>((acc, b) => {
        acc[b.id] = 0;
        return acc;
      }, {}),
    };

    setVariants([...variants, newVar]);
    setActiveVariantIndex(variants.length);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    const nextVariants = variants.filter((_, idx) => idx !== index);
    setVariants(nextVariants);
    if (activeVariantIndex >= nextVariants.length) {
      setActiveVariantIndex(nextVariants.length - 1);
    }
  };

  const handleDuplicateVariant = (index: number) => {
    const target = variants[index];
    const brand = selectedModel?.brand || "PHONE";
    const model = selectedModel?.modelName || "MODEL";
    const sku = generateSku(brand, model, target.storage, `${target.colorNameEn}Copy`);

    const copyVar: NewVariantItem = {
      ...target,
      id: `var-copy-${Date.now()}`,
      sku,
      colorNameUz: `${target.colorNameUz} (Nusxa)`,
      colorNameRu: `${target.colorNameRu} (Копия)`,
      colorNameEn: `${target.colorNameEn} (Copy)`,
      initialStock: { ...target.initialStock },
    };

    setVariants([...variants, copyVar]);
    setActiveVariantIndex(variants.length);
  };

  const updateActiveVariant = <K extends keyof NewVariantItem>(
    field: K,
    value: NewVariantItem[K]
  ) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === activeVariantIndex ? { ...v, [field]: value } : v))
    );
  };

  // Validation before proceeding
  const validateStep = (stepNumber: number): boolean => {
    setErrorMessage(null);

    if (stepNumber === 1) {
      if (!selectedModel) {
        setErrorMessage(t("validationModelRequired"));
        return false;
      }
      if (!selectedCategoryId) {
        setErrorMessage(t("validationCategoryRequired"));
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (variants.length === 0) {
        setErrorMessage(t("validationAtLeastOneVariant"));
        return false;
      }
      for (const v of variants) {
        if (!v.colorNameUz.trim()) {
          setErrorMessage(t("validationColorRequired"));
          return false;
        }
        if (!v.storage.trim()) {
          setErrorMessage(t("validationStorageRequired"));
          return false;
        }
      }
      return true;
    }

    if (stepNumber === 3) {
      for (const v of variants) {
        if (!v.price || v.price <= 0) {
          setErrorMessage(t("validationPositivePriceAll"));
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(6, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Submit Handler
  const handleFinalSubmit = async () => {
    if (!selectedModel) return;
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        brand: selectedModel.brand,
        modelName: selectedModel.modelName,
        categoryId: selectedCategoryId,
        warrantyMonths: warrantyMonths,
        series: selectedModel.series,
        releaseYear: selectedModel.releaseYear,
        screenSize: selectedModel.screenSize,
        processor: selectedModel.processor,
        battery: selectedModel.battery,
        camera: selectedModel.camera,
        charging: selectedModel.charging,
        os: selectedModel.os,
        descriptionUz: descriptionUz || `${selectedModel.brand} ${selectedModel.modelName} smartfoni`,
        descriptionRu: descriptionRu || `Смартфон ${selectedModel.brand} ${selectedModel.modelName}`,
        descriptionEn: descriptionEn || `Smartphone ${selectedModel.brand} ${selectedModel.modelName}`,
        variants: variants.map((v) => ({
          sku: v.sku.trim() || generateSku(selectedModel.brand, selectedModel.modelName, v.storage, v.colorNameEn),
          colorNameUz: v.colorNameUz.trim(),
          colorNameRu: v.colorNameRu.trim() || v.colorNameUz.trim(),
          colorNameEn: v.colorNameEn.trim() || v.colorNameUz.trim(),
          colorHex: v.colorHex || "#000000",
          ram: v.ram?.trim() || undefined,
          storage: v.storage.trim(),
          condition: "NEW" as const,
          price: Number(v.price),
          oldPrice: v.oldPrice ? Number(v.oldPrice) : null,
          images: v.images.length > 0 ? v.images : ["/images/products/placeholder.webp"],
          initialStock: v.initialStock,
        })),
      };

      const result = await createProductAction(payload);

      if (result.success) {
        setSuccessMessage(t("successCreatedNew"));
        setTimeout(() => {
          router.push(`/${locale}/admin/products`);
        }, 1200);
      } else {
        setErrorMessage(
          result.error === "unauthorized"
            ? t("unauthorizedError")
            : result.error || t("unexpectedError")
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      setErrorMessage(t("unexpectedError"));
    } finally {
      setIsPending(false);
    }
  };

  const activeVariant = variants[activeVariantIndex] || variants[0];

  // Steps definition for top progress indicator
  const steps = [
    { num: 1, title: t("stepProductInfo"), icon: Smartphone },
    { num: 2, title: t("stepVariants"), icon: Layers },
    { num: 3, title: t("stepPricing"), icon: DollarSign },
    { num: 4, title: t("stepInventory"), icon: Building2 },
    { num: 5, title: t("stepImages"), icon: ImageIcon },
    { num: 6, title: t("stepReview"), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Stepper Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  if (st.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(st.num);
                  }
                }}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all",
                  isCurrent
                    ? "bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 shadow-sm"
                    : isCompleted
                      ? "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-emerald-700 dark:text-emerald-400"
                      : "opacity-60 text-slate-700 dark:text-slate-200"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                    isCurrent
                      ? "bg-sky-600 text-white"
                      : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.num}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold truncate leading-tight">
                    {st.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error / Success Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* STEP 1: Product Information */}
      {currentStep === 1 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step1NewTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
              {t("step1NewSubtitle")}
            </p>
          </div>

          <ModelSelector
            categories={categories}
            existingProducts={existingProducts}
            selectedModel={selectedModel}
            onSelectModel={handleModelSelected}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("categoryLabel")} <span className="text-rose-500">*</span>
              </label>
              <Select
                value={selectedCategoryId}
                onValueChange={(val) => setSelectedCategoryId(val)}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder={t("categorySelect")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {locale === "ru" ? c.nameRu : locale === "en" ? c.nameEn : c.nameUz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("warrantyLabel")}
              </label>
              <Select
                value={warrantyMonths.toString()}
                onValueChange={(val) => setWarrantyMonths(Number(val))}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder={t("warrantyLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("warrantyNoneOpt")}</SelectItem>
                  <SelectItem value="6">{t("warranty6MonthsOpt")}</SelectItem>
                  <SelectItem value="12">{t("warranty12MonthsOpt")}</SelectItem>
                  <SelectItem value="24">{t("warranty24MonthsOpt")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: Product Variants (Color, RAM, Storage) */}
      {currentStep === 2 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("step2NewTitle")}
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                {t("step2NewSubtitle")}
              </p>
            </div>

            <Button
              type="button"
              onClick={handleAddVariant}
              className="h-9 text-xs font-semibold gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t("addVariant")}
            </Button>
          </div>

          {/* Variants Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {variants.map((v, index) => {
              const isActive = index === activeVariantIndex;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveVariantIndex(index)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0",
                    isActive
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                  )}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: v.colorHex || "#000000" }}
                  />
                  <span>
                    {v.colorNameUz || `Variant #${index + 1}`} • {v.storage}
                  </span>
                  {variants.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVariant(index);
                      }}
                      className="text-slate-700 hover:text-rose-600 p-0.5 ml-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Variant Editing Panel */}
          {activeVariant && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/50 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {t("configNum", { num: activeVariantIndex + 1 })}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateVariant(activeVariantIndex)}
                    className="h-8 text-xs gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t("duplicateVariant")}
                  </Button>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveVariant(activeVariantIndex)}
                      className="h-8 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {t("removeVariant")}
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Preset Colors Palette if available */}
              {selectedModel?.presetColors && selectedModel.presetColors.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("officialColorsQuick")}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedModel.presetColors.map((color) => (
                      <button
                        key={color.nameUz}
                        type="button"
                        onClick={() => {
                          updateActiveVariant("colorNameUz", color.nameUz);
                          updateActiveVariant("colorNameRu", color.nameRu);
                          updateActiveVariant("colorNameEn", color.nameEn);
                          updateActiveVariant("colorHex", color.hex);
                          if (color.imageUrl) {
                            updateActiveVariant("images", [color.imageUrl]);
                          }
                          const newSku = generateSku(
                            selectedModel.brand,
                            selectedModel.modelName,
                            activeVariant.storage,
                            color.nameEn
                          );
                          updateActiveVariant("sku", newSku);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition",
                          activeVariant.colorNameUz === color.nameUz
                            ? "border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{locale === "ru" ? color.nameRu : locale === "en" ? color.nameEn : color.nameUz}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("colorUzLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={activeVariant.colorNameUz}
                    onChange={(e) => updateActiveVariant("colorNameUz", e.target.value)}
                    placeholder="Qora titan"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("colorRuLabel")}
                  </label>
                  <Input
                    type="text"
                    value={activeVariant.colorNameRu}
                    onChange={(e) => updateActiveVariant("colorNameRu", e.target.value)}
                    placeholder="Черный титан"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("colorEnLabel")}
                  </label>
                  <Input
                    type="text"
                    value={activeVariant.colorNameEn}
                    onChange={(e) => updateActiveVariant("colorNameEn", e.target.value)}
                    placeholder="Black Titanium"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("colorHexLabel")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeVariant.colorHex}
                      onChange={(e) => updateActiveVariant("colorHex", e.target.value)}
                      className="w-9 h-9 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={activeVariant.colorHex}
                      onChange={(e) => updateActiveVariant("colorHex", e.target.value)}
                      placeholder="#1C1C1E"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Storage & RAM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("storageLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {COMMON_STORAGES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          updateActiveVariant("storage", st);
                          if (selectedModel) {
                            const newSku = generateSku(
                              selectedModel.brand,
                              selectedModel.modelName,
                              st,
                              activeVariant.colorNameEn
                            );
                            updateActiveVariant("sku", newSku);
                          }
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-semibold transition",
                          activeVariant.storage === st
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                            : "bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="text"
                    value={activeVariant.storage}
                    onChange={(e) => updateActiveVariant("storage", e.target.value)}
                    placeholder={t("storagePlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("ramLabel")}
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {COMMON_RAMS.map((ram) => (
                      <button
                        key={ram}
                        type="button"
                        onClick={() => updateActiveVariant("ram", ram)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-semibold transition",
                          activeVariant.ram === ram
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                            : "bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {ram}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="text"
                    value={activeVariant.ram || ""}
                    onChange={(e) => updateActiveVariant("ram", e.target.value)}
                    placeholder={t("ramPlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: Pricing */}
      {currentStep === 3 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step3NewTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step3NewSubtitle")}
            </p>
          </div>

          <div className="space-y-4">
            {variants.map((v, idx) => (
              <div
                key={v.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: v.colorHex || "#000000" }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {v.colorNameUz} — {v.storage}
                    </h4>
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-200">
                      SKU: {v.sku}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 sm:w-[380px]">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                      {t("priceLabel")} <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="10000"
                      value={v.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVariants((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                        );
                      }}
                      className="h-9 text-xs font-semibold"
                    />
                    <span className="text-[10px] text-slate-700 dark:text-slate-200">
                      {formatCurrency(v.price)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                      {t("oldPriceLabel")}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="10000"
                      value={v.oldPrice || ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setVariants((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, oldPrice: val } : item))
                        );
                      }}
                      placeholder="0"
                      className="h-9 text-xs"
                    />
                    {v.oldPrice ? (
                      <span className="text-[10px] text-slate-700 dark:text-slate-200 line-through">
                        {formatCurrency(v.oldPrice)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 4: Inventory / Stock per Branch */}
      {currentStep === 4 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step4NewTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step4NewSubtitle")}
            </p>
          </div>

          <div className="space-y-5">
            {variants.map((v, vIdx) => (
              <div
                key={v.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-900/40 space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: v.colorHex || "#000000" }}
                  />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {v.colorNameUz} • {v.storage}
                  </span>
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {t("totalStockCount", {
                      count: Object.values(v.initialStock).reduce((a, b) => a + (Number(b) || 0), 0),
                    })}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {branches.map((b) => {
                    const isDisabled = !isSuperAdmin && branchId !== b.id;
                    const currentQty = v.initialStock[b.id] ?? 0;

                    return (
                      <div
                        key={b.id}
                        className={cn(
                          "p-3 rounded-lg border bg-white dark:bg-slate-800 space-y-1",
                          isDisabled ? "opacity-50" : "border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {b.name}
                          </span>
                          {isDisabled && (
                            <span className="text-[10px] text-slate-700 dark:text-slate-200">
                              {t("noPermissionBranch")}
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          min="0"
                          disabled={isDisabled}
                          value={currentQty}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setVariants((prev) =>
                              prev.map((item, idx) =>
                                idx === vIdx
                                  ? {
                                      ...item,
                                      initialStock: {
                                        ...item.initialStock,
                                        [b.id]: val,
                                      },
                                    }
                                  : item
                              )
                            );
                          }}
                          className="h-8 text-xs font-semibold"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 5: Images Upload */}
      {currentStep === 5 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step5NewTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step5NewSubtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {variants.map((v, index) => {
                const isActive = index === activeVariantIndex;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVariantIndex(index)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shrink-0",
                      isActive
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: v.colorHex || "#000000" }}
                    />
                    <span>
                      {v.colorNameUz} ({v.images.length})
                    </span>
                  </button>
                );
              })}
            </div>

            {activeVariant && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/30 dark:bg-slate-900/30">
                <div className="mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeVariant.colorNameUz} ({activeVariant.storage})
                  </h4>
                </div>
                <ImageUploader
                  images={activeVariant.images}
                  onChange={(newImgs) => updateActiveVariant("images", newImgs)}
                  maxImages={8}
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* STEP 6: Review & Final Submission */}
      {currentStep === 6 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step6NewTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step6NewSubtitle")}
            </p>
          </div>

          {/* Summary Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-700 dark:text-slate-200">{t("selectedModelBadge")}</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {selectedModel?.brand} {selectedModel?.modelName}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                {t("warrantyLabel")}: {t("warrantyMonthsCount", { count: warrantyMonths })}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-700 dark:text-slate-200">{t("totalVariantsCount", { count: variants.length })}</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {t("totalVariants", { count: variants.length })}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                {t("conditionNewBadgeActive")}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-700 dark:text-slate-200">{t("totalStockCount", { count: variants.reduce((sum, v) => sum + Object.values(v.initialStock).reduce((a, b) => a + (Number(b) || 0), 0), 0) })}</span>
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {t("totalUnits", {
                  count: variants.reduce(
                    (sum, v) =>
                      sum + Object.values(v.initialStock).reduce((a, b) => a + (Number(b) || 0), 0),
                    0
                  ),
                })}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                {t("byBranches", { count: branches.length })}
              </p>
            </div>
          </div>

          {/* Variants Summary Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">{t("tableColor")}</th>
                  <th className="py-2.5 px-3">{t("tableStorageRam")}</th>
                  <th className="py-2.5 px-3">{t("tableSku")}</th>
                  <th className="py-2.5 px-3">{t("tablePrice")}</th>
                  <th className="py-2.5 px-3">{t("tableStock")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {variants.map((v) => {
                  const totalStock = Object.values(v.initialStock).reduce(
                    (a, b) => a + (Number(b) || 0),
                    0
                  );
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: v.colorHex || "#000000" }}
                          />
                          <span>{v.colorNameUz}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {v.storage} {v.ram ? `(${v.ram})` : ""}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-200">
                        {v.sku}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(v.price)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={totalStock > 0 ? "secondary" : "outline"}
                          className="text-[11px]"
                        >
                          {t("totalUnits", { count: totalStock })}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Navigation Buttons (Back & Next) */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("prevStep")}
            </Button>
          ) : onCancel ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (window.confirm(t("leavePromptConfirm"))) {
                  onCancel();
                }
              }}
              className="text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900"
            >
              {t("cancel")}
            </Button>
          ) : null}
        </div>

        <div>
          {currentStep < 6 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="gap-1.5 text-xs font-semibold px-5"
            >
              {t("nextStep")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-bold px-6 h-10 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("savingNewProduct")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("completeAndSave")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
