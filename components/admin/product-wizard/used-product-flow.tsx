"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Smartphone,
  ShieldAlert,
  Hash,
  DollarSign,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Battery,
  AlertCircle,
  Loader2,
  Check,
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
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector, type ModelSelectionResult } from "./model-selector";
import { ImageUploader } from "./image-uploader";
import type {
  BranchItem,
  CategoryItem,
  ExistingProductItem,
  PhysicalConditionGrade,
  UsedDeviceFormState,
} from "./types";
import { formatCurrency } from "@/lib/utils/format-currency";
import { createProductAction } from "@/app/actions/admin-products";
import { cn } from "@/lib/utils/cn";

export interface UsedProductFlowProps {
  branches: BranchItem[];
  categories: CategoryItem[];
  existingProducts: ExistingProductItem[];
  locale: string;
  isSuperAdmin?: boolean;
  branchId?: string | null;
  onCancel?: () => void;
}

const COMMON_STORAGES = ["64GB", "128GB", "256GB", "512GB", "1TB"];
const COMMON_RAMS = ["4GB", "6GB", "8GB", "12GB", "16GB"];

export function UsedProductFlow({
  branches,
  categories,
  existingProducts,
  locale,
  isSuperAdmin = true,
  branchId,
  onCancel,
}: UsedProductFlowProps) {
  const router = useRouter();
  const t = useTranslations("admin.productCreate");

  // Stepper state: 1 to 7
  const [currentStep, setCurrentStep] = React.useState<number>(1);

  // Selected Model
  const [selectedModel, setSelectedModel] = React.useState<ModelSelectionResult | null>(null);

  // Form state
  const [form, setForm] = React.useState<UsedDeviceFormState>({
    brand: "",
    modelName: "",
    categoryId: categories[0]?.id || "",
    colorNameUz: "Qora",
    colorNameRu: "Черный",
    colorNameEn: "Black",
    colorHex: "#1C1C1E",
    ram: "8GB",
    storage: "128GB",
    physicalCondition: "EXCELLENT",
    batteryHealth: 88,
    batteryUnavailable: false,
    defects: "",
    notes: "",
    warrantyMonths: 3, // 3 months store warranty by default for used devices
    imei: "",
    sku: "",
    price: 9500000,
    oldPrice: null,
    branchId: branchId || branches[0]?.id || "",
    images: [],
  });

  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Detect whether this model is Apple / iPhone
  const isIphone = React.useMemo(() => {
    const brand = (selectedModel?.brand || form.brand).toLowerCase();
    const model = (selectedModel?.modelName || form.modelName).toLowerCase();
    return brand === "apple" || model.includes("iphone");
  }, [selectedModel, form.brand, form.modelName]);

  // Model selection handler
  const handleModelSelected = (model: ModelSelectionResult) => {
    setSelectedModel(model);

    const isApple = model.brand.toLowerCase() === "apple" || model.modelName.toLowerCase().includes("iphone");
    const defaultStorage = model.presetStorages?.[0] || "128GB";
    const defaultRam = model.presetRam || "8GB";
    const defaultColor = model.presetColors?.[0] || {
      nameUz: "Qora",
      nameRu: "Черный",
      nameEn: "Black",
      hex: "#1C1C1E",
    };

    const cleanModel = model.modelName.replace(/[^A-Za-z0-9]/g, "").slice(0, 5).toUpperCase();
    const cleanStorage = defaultStorage.replace(/\s+/g, "").replace(/GB$/, "");
    const cleanColor = defaultColor.nameEn.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const autoSku = `USED-${cleanModel}-${cleanStorage}-${cleanColor}-${randomSuffix}`;

    setForm((prev) => ({
      ...prev,
      brand: model.brand,
      modelName: model.modelName,
      categoryId: model.categoryId || prev.categoryId,
      colorNameUz: defaultColor.nameUz,
      colorNameRu: defaultColor.nameRu,
      colorNameEn: defaultColor.nameEn,
      colorHex: defaultColor.hex,
      ram: defaultRam,
      storage: defaultStorage,
      batteryHealth: isApple ? 88 : null,
      batteryUnavailable: false,
      sku: autoSku,
      series: model.series,
      screenSize: model.screenSize,
      processor: model.processor,
      battery: model.battery,
      camera: model.camera,
      charging: model.charging,
      os: model.os,
    }));
  };

  const updateForm = <K extends keyof UsedDeviceFormState>(
    field: K,
    value: UsedDeviceFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Validation
  const validateStep = (step: number): boolean => {
    setErrorMessage(null);

    if (step === 1) {
      if (!form.brand.trim() || !form.modelName.trim()) {
        setErrorMessage(t("validationModelRequired"));
        return false;
      }
      if (!form.categoryId) {
        setErrorMessage(t("validationCategoryRequired"));
        return false;
      }
      if (!form.colorNameUz.trim()) {
        setErrorMessage(t("validationColorRequired"));
        return false;
      }
      if (!form.storage.trim()) {
        setErrorMessage(t("validationStorageRequired"));
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!form.batteryUnavailable && form.batteryHealth !== null) {
        if (form.batteryHealth < 1 || form.batteryHealth > 100) {
          setErrorMessage(t("validationBatteryIphone"));
          return false;
        }
      }
      return true;
    }

    if (step === 3) {
      const cleanImei = form.imei.replace(/\s+/g, "");
      if (!cleanImei) {
        setErrorMessage(t("imeiInvalid"));
        return false;
      }
      if (cleanImei.length !== 15 || !/^\d{15}$/.test(cleanImei)) {
        setErrorMessage(t("validationImeiExact15"));
        return false;
      }
      if (!form.sku.trim()) {
        setErrorMessage(t("skuLabel"));
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!form.price || form.price <= 0) {
        setErrorMessage(t("validationPositivePriceAll"));
        return false;
      }
      return true;
    }

    if (step === 5) {
      if (!form.branchId) {
        setErrorMessage(t("validationBranchRequired"));
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(7, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Final Submission
  const handleFinalSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const conditionTextMap: Record<PhysicalConditionGrade, string> = {
      IDEAL: t("condIdeal"),
      EXCELLENT: t("condExcellent"),
      GOOD: t("condGood"),
      FAIR: t("condFair"),
    };

    const effectiveBattery = form.batteryUnavailable ? null : form.batteryHealth;
    const batteryText = effectiveBattery ? `Batareya: ${effectiveBattery}%` : t("batteryNotAvailable");
    const defectText = form.defects.trim() ? `${t("defectsSummary")}: ${form.defects.trim()}` : "";
    const notesText = form.notes.trim() ? `${t("notesSummary")}: ${form.notes.trim()}` : "";

    const descUz = `B/U (Ishlatilgan) ${form.brand} ${form.modelName} ${form.storage} ${form.colorNameUz}. Holati: ${conditionTextMap[form.physicalCondition]}. ${batteryText}. ${defectText}. ${notesText}. IMEI: ${form.imei}. ${form.warrantyMonths} oy kafolat.`;
    const descRu = `Б/У ${form.brand} ${form.modelName} ${form.storage} ${form.colorNameRu}. Состояние: ${conditionTextMap[form.physicalCondition]}. ${batteryText}. ${defectText}. ${notesText}. IMEI: ${form.imei}. Гарантия: ${form.warrantyMonths} мес.`;
    const descEn = `Pre-Owned ${form.brand} ${form.modelName} ${form.storage} ${form.colorNameEn}. Condition: ${conditionTextMap[form.physicalCondition]}. ${batteryText}. ${defectText}. ${notesText}. IMEI: ${form.imei}. Warranty: ${form.warrantyMonths} mo.`;

    // Stock for the selected branch is 1, and 0 for all other branches
    const initialStockMap: Record<string, number> = {};
    for (const b of branches) {
      initialStockMap[b.id] = b.id === form.branchId ? 1 : 0;
    }

    const payload = {
      brand: form.brand.trim(),
      modelName: form.modelName.trim(),
      categoryId: form.categoryId,
      warrantyMonths: form.warrantyMonths,
      series: form.series,
      screenSize: form.screenSize,
      processor: form.processor,
      battery: form.battery,
      camera: form.camera,
      charging: form.charging,
      os: form.os,
      specs: {
        condition: "USED",
        physicalCondition: form.physicalCondition,
        batteryHealth: effectiveBattery,
        batteryUnavailable: form.batteryUnavailable,
        defects: form.defects.trim() || null,
        notes: form.notes.trim() || null,
        imei: form.imei.trim(),
        branchId: form.branchId,
      },
      descriptionUz: descUz,
      descriptionRu: descRu,
      descriptionEn: descEn,
      variants: [
        {
          sku: form.sku.trim().toUpperCase(),
          colorNameUz: form.colorNameUz.trim(),
          colorNameRu: form.colorNameRu.trim() || form.colorNameUz.trim(),
          colorNameEn: form.colorNameEn.trim() || form.colorNameUz.trim(),
          colorHex: form.colorHex || "#000000",
          ram: form.ram.trim() || undefined,
          storage: form.storage.trim(),
          condition: "USED" as const,
          price: Number(form.price),
          oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
          images: form.images.length > 0 ? form.images : ["/images/products/placeholder.webp"],
          initialStock: initialStockMap,
          imei: form.imei.trim(),
        },
      ],
    };

    try {
      const result = await createProductAction(payload);
      if (result.success) {
        setSuccessMessage(t("successCreatedUsed"));
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
      console.error("Used device submit error:", err);
      setErrorMessage(t("unexpectedError"));
    } finally {
      setIsPending(false);
    }
  };

  // Steps definition for top stepper
  const steps = [
    { num: 1, title: t("stepUsedInfo"), icon: Smartphone },
    { num: 2, title: t("stepUsedCondition"), icon: ShieldAlert },
    { num: 3, title: t("stepUsedId"), icon: Hash },
    { num: 4, title: t("stepUsedPricing"), icon: DollarSign },
    { num: 5, title: t("stepUsedInventory"), icon: Building2 },
    { num: 6, title: t("stepUsedImages"), icon: ImageIcon },
    { num: 7, title: t("stepUsedReview"), icon: CheckCircle2 },
  ];

  const conditionBadges: Record<PhysicalConditionGrade, { title: string; color: string; desc: string }> = {
    IDEAL: {
      title: t("condIdeal"),
      color: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200",
      desc: t("condIdeal"),
    },
    EXCELLENT: {
      title: t("condExcellent"),
      color: "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200",
      desc: t("condExcellent"),
    },
    GOOD: {
      title: t("condGood"),
      color: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200",
      desc: t("condGood"),
    },
    FAIR: {
      title: t("condFair"),
      color: "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200",
      desc: t("condFair"),
    },
  };

  const selectedBranchName = branches.find((b) => b.id === form.branchId)?.name || t("branchNotSelected");

  return (
    <div className="space-y-6">
      {/* Stepper Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
                  "flex items-center gap-2 p-2 rounded-xl text-left transition-all",
                  isCurrent
                    ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-sm"
                    : isCompleted
                      ? "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-emerald-700 dark:text-emerald-400"
                      : "opacity-60 text-slate-700 dark:text-slate-200"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                    isCurrent
                      ? "bg-amber-600 text-white"
                      : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : st.num}
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {t("conditionUsedBadgeActive")}
              </Badge>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("step1UsedTitle")}
              </h2>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
              {t("step1UsedSubtitle")}
            </p>
          </div>

          <ModelSelector
            categories={categories}
            existingProducts={existingProducts}
            selectedModel={selectedModel}
            onSelectModel={handleModelSelected}
          />

          {/* Category & Warranty Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("categoryLabel")} <span className="text-rose-500">*</span>
              </label>
              <Select
                value={form.categoryId}
                onValueChange={(val) => updateForm("categoryId", val)}
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
                {t("warrantyUsedLabel")}
              </label>
              <Select
                value={form.warrantyMonths.toString()}
                onValueChange={(val) => updateForm("warrantyMonths", Number(val))}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder={t("warrantyUsedLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("warrantyNone")}</SelectItem>
                  <SelectItem value="1">{t("warranty1Month")}</SelectItem>
                  <SelectItem value="3">{t("warranty3Months")}</SelectItem>
                  <SelectItem value="6">{t("warranty6Months")}</SelectItem>
                  <SelectItem value="12">{t("warranty12Months")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color & Storage & RAM for this single unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("deviceColorLabel")} <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.colorHex}
                  onChange={(e) => updateForm("colorHex", e.target.value)}
                  className="w-9 h-9 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <Input
                  type="text"
                  value={form.colorNameUz}
                  onChange={(e) => updateForm("colorNameUz", e.target.value)}
                  placeholder="Moviy titan"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("storageLabel")} <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1 mb-1">
                {COMMON_STORAGES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateForm("storage", st)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-semibold border transition",
                      form.storage === st
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <Input
                type="text"
                value={form.storage}
                onChange={(e) => updateForm("storage", e.target.value)}
                placeholder={t("storagePlaceholder")}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("ramLabel")}
              </label>
              <div className="flex flex-wrap gap-1 mb-1">
                {COMMON_RAMS.map((ram) => (
                  <button
                    key={ram}
                    type="button"
                    onClick={() => updateForm("ram", ram)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-semibold border transition",
                      form.ram === ram
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {ram}
                  </button>
                ))}
              </div>
              <Input
                type="text"
                value={form.ram}
                onChange={(e) => updateForm("ram", e.target.value)}
                placeholder={t("ramPlaceholder")}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: Device Condition & Battery Health */}
      {currentStep === 2 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step2UsedTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step2UsedSubtitle")}
            </p>
          </div>

          {/* Physical Condition Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t("physicalConditionLabel")} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(conditionBadges) as PhysicalConditionGrade[]).map((grade) => {
                const item = conditionBadges[grade];
                const isSelected = form.physicalCondition === grade;

                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => updateForm("physicalCondition", grade)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left transition-all",
                      isSelected
                        ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intelligent Battery Health */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-amber-600" />
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  {t("batteryHealthLabel")}
                </label>
                <Badge variant="outline" className="text-[10px] text-slate-700 dark:text-slate-200">
                  {isIphone ? t("batteryHealthHelperIphone") : t("batteryHealthHelperAndroid")}
                </Badge>
              </div>
            </div>

            {/* Checkbox for unavailable battery health */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="batteryUnavailableCheckbox"
                checked={form.batteryUnavailable || false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  updateForm("batteryUnavailable", checked);
                  if (checked) {
                    updateForm("batteryHealth", null);
                  } else if (isIphone) {
                    updateForm("batteryHealth", 88);
                  }
                }}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <label
                htmlFor="batteryUnavailableCheckbox"
                className="text-xs text-slate-700 dark:text-slate-200 cursor-pointer select-none"
              >
                {t("batteryCheckboxNotAvailable")}
              </label>
            </div>

            {!form.batteryUnavailable && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="w-36">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={form.batteryHealth ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      updateForm("batteryHealth", val);
                    }}
                    placeholder={t("batteryHealthPlaceholder")}
                    className="h-9 text-xs font-bold"
                  />
                </div>

                {/* Quick Pills */}
                <div className="flex items-center gap-1.5">
                  {[100, 95, 90, 85, 80].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => updateForm("batteryHealth", pct)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold border transition",
                        form.batteryHealth === pct
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visible Defects */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t("defectsLabel")}
            </label>
            <Input
              type="text"
              value={form.defects}
              onChange={(e) => updateForm("defects", e.target.value)}
              placeholder={t("defectsPlaceholder")}
              className="h-9 text-xs"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t("notesLabel")}
            </label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="text-xs"
            />
          </div>
        </Card>
      )}

      {/* STEP 3: Identification (IMEI & SKU) */}
      {currentStep === 3 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step3UsedTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step3UsedSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("imeiLabel")} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                maxLength={15}
                value={form.imei}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 15);
                  updateForm("imei", cleaned);
                }}
                placeholder={t("imeiPlaceholder")}
                className="h-10 text-sm font-mono tracking-wider font-bold"
              />
              <p className="text-[11px] text-slate-700 dark:text-slate-200">
                {t("imeiHelper")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("skuLabel")} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={form.sku}
                onChange={(e) => updateForm("sku", e.target.value.toUpperCase())}
                placeholder="USED-IP16P-256-NAT-1234"
                className="h-10 text-sm font-mono"
              />
              <p className="text-[11px] text-slate-700 dark:text-slate-200">
                {t("skuHelper")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: Pricing */}
      {currentStep === 4 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step4UsedTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step4UsedSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("priceLabel")} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="10000"
                value={form.price}
                onChange={(e) => updateForm("price", Number(e.target.value))}
                className="h-10 text-sm font-bold"
              />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {formatCurrency(form.price)}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("oldPriceLabel")}
              </label>
              <Input
                type="number"
                min="0"
                step="10000"
                value={form.oldPrice || ""}
                onChange={(e) =>
                  updateForm("oldPrice", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="0"
                className="h-10 text-sm"
              />
              {form.oldPrice ? (
                <p className="text-xs text-slate-700 dark:text-slate-200 line-through">
                  {formatCurrency(form.oldPrice)}
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 5: Inventory Location */}
      {currentStep === 5 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step5UsedTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step5UsedSubtitle")}
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("selectBranchLabel")} <span className="text-rose-500">*</span>
              </label>
              <Select
                value={form.branchId}
                onValueChange={(val) => updateForm("branchId", val)}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder={t("selectBranchPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => {
                    const isDisabled = !isSuperAdmin && branchId !== b.id;
                    return (
                      <SelectItem key={b.id} value={b.id} disabled={isDisabled}>
                        {b.name} {isDisabled ? t("noPermissionBranch") : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
              {t("usedQtyNotice")}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 6: Actual Device Photos */}
      {currentStep === 6 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step6UsedTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step6UsedSubtitle")}
            </p>
          </div>

          <ImageUploader
            images={form.images}
            onChange={(newImgs) => updateForm("images", newImgs)}
            maxImages={8}
          />
        </Card>
      )}

      {/* STEP 7: Review & Final Submission (Device Passport) */}
      {currentStep === 7 && (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("step7UsedTitle")}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
              {t("step7UsedSubtitle")}
            </p>
          </div>

          {/* Device Passport Card */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/50 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    {t("conditionUsedBadgeActive")}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-bold">
                    {form.brand}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("warrantyUsedLabel")}: {t("warrantyMonthsCount", { count: form.warrantyMonths })}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {form.brand} {form.modelName} — {form.storage}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-700 dark:text-slate-200">{t("priceLabel")}</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(form.price)}
                </p>
                {form.oldPrice && (
                  <p className="text-xs text-slate-700 dark:text-slate-200 line-through">
                    {formatCurrency(form.oldPrice)}
                  </p>
                )}
              </div>
            </div>

            {/* Grid of Key Properties */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-700 dark:text-slate-200">{t("physicalConditionLabel")}</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {conditionBadges[form.physicalCondition]?.title}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-700 dark:text-slate-200">{t("batteryHealthLabel")}</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {form.batteryUnavailable
                    ? t("batteryNotAvailable")
                    : form.batteryHealth
                      ? `${form.batteryHealth}%`
                      : t("unspecified")}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-700 dark:text-slate-200">{t("imeiLabel")}</span>
                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {form.imei}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-700 dark:text-slate-200">{t("selectBranchLabel")}</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {selectedBranchName} ({t("totalUnits", { count: 1 })})
                </p>
              </div>
            </div>

            {/* Defects & Notes Summary */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <p>
                <strong className="text-slate-700 dark:text-slate-200">{t("colorSummary")}:</strong> {form.colorNameUz} ({form.colorHex})
              </p>
              {form.defects && (
                <p>
                  <strong className="text-slate-700 dark:text-slate-200">{t("defectsSummary")}:</strong> {form.defects}
                </p>
              )}
              {form.notes && (
                <p>
                  <strong className="text-slate-700 dark:text-slate-200">{t("notesSummary")}:</strong> {form.notes}
                </p>
              )}
              <p>
                <strong className="text-slate-700 dark:text-slate-200">{t("skuSummary")}:</strong>{" "}
                <span className="font-mono">{form.sku}</span>
              </p>
            </div>

            {/* Photo Preview Gallery */}
            {form.images.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t("uploadedPhotosCount", { count: form.images.length })}
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {form.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-white dark:bg-slate-800"
                    >
                      <Image
                        src={img}
                        alt="Device photo"
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
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
          {currentStep < 7 ? (
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
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2 text-xs font-bold px-6 h-10 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("savingUsedDevice")}
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
