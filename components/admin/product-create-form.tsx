"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Smartphone,
  Layers,
  Building2,
  Sparkles,
  Zap,
  Cpu,
  RefreshCw,
  Palette,
  HardDrive,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  createProductAction,
  type CreateProductInput,
} from "@/app/actions/admin-products";
import {
  getCatalogPresets,
  getCatalogBrands,
  getPresetsByBrand,
  generateSku,
  type CatalogPreset,
  type CatalogPresetColor,
} from "@/lib/catalog/presets";

interface BranchItem {
  id: string;
  name: string;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface ProductCreateFormProps {
  categories: CategoryItem[];
  branches: BranchItem[];
  locale: string;
}

interface VariantFormState {
  id: string; // local temporary key
  sku: string;
  colorNameUz: string;
  colorNameRu: string;
  colorNameEn: string;
  colorHex: string;
  ram: string;
  storage: string;
  condition: "NEW" | "USED";
  price: string;
  oldPrice: string;
  images: string;
  isCustomColor?: boolean;
  initialStock: Record<string, string>; // branchId -> qty string
}

const COMMON_STORAGES = ["64GB", "128GB", "256GB", "512GB", "1TB"];

export function ProductCreateForm({
  categories,
  branches,
  locale,
}: ProductCreateFormProps) {
  const t = useTranslations("admin.productCreate");
  const router = useRouter();

  // Preset state
  const [selectedPresetBrand, setSelectedPresetBrand] = React.useState<string>("Apple");
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>("");
  const [activePreset, setActivePreset] = React.useState<CatalogPreset | null>(null);

  // Form states - General
  const [brand, setBrand] = React.useState("");
  const [modelName, setModelName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id || "");
  const [warrantyMonths, setWarrantyMonths] = React.useState(12);

  // Form states - Hardware Specs
  const [series, setSeries] = React.useState("");
  const [releaseYear, setReleaseYear] = React.useState<number | undefined>(undefined);
  const [screenSize, setScreenSize] = React.useState("");
  const [processor, setProcessor] = React.useState("");
  const [battery, setBattery] = React.useState("");
  const [camera, setCamera] = React.useState("");
  const [charging, setCharging] = React.useState("");
  const [os, setOs] = React.useState("");

  // Descriptions across 3 locales
  const [descriptionUz, setDescriptionUz] = React.useState("");
  const [descriptionRu, setDescriptionRu] = React.useState("");
  const [descriptionEn, setDescriptionEn] = React.useState("");

  const createEmptyVariant = (index: number): VariantFormState => ({
    id: `temp-${Date.now()}-${index}`,
    sku: "",
    colorNameUz: "",
    colorNameRu: "",
    colorNameEn: "",
    colorHex: "#000000",
    ram: "8GB",
    storage: "128GB",
    condition: "NEW",
    price: "",
    oldPrice: "",
    images: "",
    isCustomColor: false,
    initialStock: branches.reduce((acc, b) => {
      acc[b.id] = "0";
      return acc;
    }, {} as Record<string, string>),
  });

  const [variants, setVariants] = React.useState<VariantFormState[]>([
    createEmptyVariant(1),
  ]);

  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [presetNotice, setPresetNotice] = React.useState<string | null>(null);

  // Presets by selected brand
  const availablePresets = React.useMemo(() => {
    if (!selectedPresetBrand || selectedPresetBrand === "custom") return [];
    return getPresetsByBrand(selectedPresetBrand);
  }, [selectedPresetBrand]);

  // Handle Preset Application
  const handleApplyPreset = () => {
    if (!selectedPresetId) return;
    const all = getCatalogPresets();
    const preset = all.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    setActivePreset(preset);
    setBrand(preset.brand);
    setModelName(preset.modelName);
    setSeries(preset.series);
    setReleaseYear(preset.releaseYear);
    setSlug(preset.slug);
    setScreenSize(preset.screenSize);
    setProcessor(preset.processor);
    setBattery(preset.battery);
    setCamera(preset.camera);
    setCharging(preset.charging);
    setOs(preset.os);
    setWarrantyMonths(preset.warrantyMonths);
    setDescriptionUz(preset.descriptionUz);
    setDescriptionRu(preset.descriptionRu);
    setDescriptionEn(preset.descriptionEn);

    // Auto-generate variants for official preset colors
    if (preset.colors && preset.colors.length > 0) {
      const defaultStorage = preset.storageOptions[0] || "128GB";
      const newVariants: VariantFormState[] = preset.colors.map((c, i) => ({
        id: `preset-var-${Date.now()}-${i}`,
        sku: generateSku(preset.brand, preset.modelName, defaultStorage, c.nameEn),
        colorNameUz: c.nameUz,
        colorNameRu: c.nameRu,
        colorNameEn: c.nameEn,
        colorHex: c.hex,
        ram: preset.ram || "8GB",
        storage: defaultStorage,
        condition: "NEW",
        price: "",
        oldPrice: "",
        images: c.imageUrl ? c.imageUrl : "",
        isCustomColor: false,
        initialStock: branches.reduce((acc, b) => {
          acc[b.id] = "0";
          return acc;
        }, {} as Record<string, string>),
      }));
      setVariants(newVariants);
    }

    setPresetNotice(t("presetApplied"));
    setTimeout(() => setPresetNotice(null), 3000);
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant(prev.length + 1)]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVariant = <K extends keyof VariantFormState>(
    id: string,
    field: K,
    value: VariantFormState[K]
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Helper to apply quick color swatch to a variant
  const handleApplyColorSwatch = (variantId: string, color: CatalogPresetColor) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const newSku = generateSku(
          brand || "DEV",
          modelName || "PHONE",
          v.storage || "128GB",
          color.nameEn || color.nameUz
        );
        return {
          ...v,
          colorHex: color.hex,
          colorNameUz: color.nameUz,
          colorNameRu: color.nameRu,
          colorNameEn: color.nameEn,
          images: color.imageUrl ? color.imageUrl : v.images,
          sku: newSku,
        };
      })
    );
  };

  // Helper to apply quick storage pill
  const handleApplyStorage = (variantId: string, storage: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const newSku = generateSku(
          brand || "DEV",
          modelName || "PHONE",
          storage,
          v.colorNameEn || v.colorNameUz || "STD"
        );
        return {
          ...v,
          storage,
          sku: newSku,
        };
      })
    );
  };

  // Auto-generate SKU button handler
  const handleAutoSku = (variantId: string) => {
    const v = variants.find((item) => item.id === variantId);
    if (!v) return;
    const newSku = generateSku(
      brand || "DEV",
      modelName || "PHONE",
      v.storage || "128GB",
      v.colorNameEn || v.colorNameUz || "STD"
    );
    updateVariant(variantId, "sku", newSku);
  };

  const updateVariantStock = (
    variantId: string,
    branchId: string,
    qty: string
  ) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          return {
            ...v,
            initialStock: {
              ...v.initialStock,
              [branchId]: qty,
            },
          };
        }
        return v;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (
      !brand.trim() ||
      !modelName.trim() ||
      !categoryId ||
      !descriptionUz.trim() ||
      !descriptionRu.trim() ||
      !descriptionEn.trim()
    ) {
      setErrorMessage(t("validationError"));
      return;
    }

    // Validate variants
    for (const v of variants) {
      if (
        !v.sku.trim() ||
        !v.colorNameUz.trim() ||
        !v.colorNameRu.trim() ||
        !v.colorNameEn.trim() ||
        !v.storage.trim() ||
        !v.price ||
        Number(v.price) <= 0
      ) {
        setErrorMessage(t("validationError"));
        return;
      }
    }

    setIsPending(true);

    try {
      const payload: CreateProductInput = {
        brand: brand.trim(),
        modelName: modelName.trim(),
        slug: slug.trim() ? slug.trim() : undefined,
        categoryId,
        warrantyMonths: Number(warrantyMonths) || 12,
        series: series.trim() ? series.trim() : undefined,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        screenSize: screenSize.trim() ? screenSize.trim() : undefined,
        processor: processor.trim() ? processor.trim() : undefined,
        battery: battery.trim() ? battery.trim() : undefined,
        camera: camera.trim() ? camera.trim() : undefined,
        charging: charging.trim() ? charging.trim() : undefined,
        os: os.trim() ? os.trim() : undefined,
        descriptionUz: descriptionUz.trim(),
        descriptionRu: descriptionRu.trim(),
        descriptionEn: descriptionEn.trim(),
        variants: variants.map((v) => {
          const initialStockParsed: Record<string, number> = {};
          for (const [branchId, qtyStr] of Object.entries(v.initialStock)) {
            initialStockParsed[branchId] = Math.max(0, parseInt(qtyStr, 10) || 0);
          }

          const parsedImages = v.images
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url.length > 0);

          return {
            sku: v.sku.trim().toUpperCase(),
            colorNameUz: v.colorNameUz.trim(),
            colorNameRu: v.colorNameRu.trim(),
            colorNameEn: v.colorNameEn.trim(),
            colorHex: v.colorHex.trim(),
            ram: v.ram?.trim() || undefined,
            storage: v.storage.trim(),
            condition: v.condition,
            price: Number(v.price),
            oldPrice: v.oldPrice.trim() ? Number(v.oldPrice) : null,
            images: parsedImages,
            initialStock: initialStockParsed,
          };
        }),
      };

      const result = await createProductAction(payload);

      if (!result.success) {
        setErrorMessage(t("error"));
        setIsPending(false);
        return;
      }

      setSuccessMessage(t("success"));
      setTimeout(() => {
        router.push(`/${locale}/admin/products`);
        router.refresh();
      }, 1000);
    } catch {
      setErrorMessage(t("error"));
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{t("backToProducts")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="gap-1.5 text-xs font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t("saveProduct")}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-900">
          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {presetNotice && (
        <div className="flex items-center gap-2 p-3 text-xs text-primary bg-primary/10 rounded-md border border-primary/20">
          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{presetNotice}</span>
        </div>
      )}

      {/* Card 0: Catalog Preset Quick-Fill */}
      <Card className="border-primary/30 bg-primary/5 shadow-xs">
        <CardHeader className="border-b border-primary/10 pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{t("presetSection")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("presetBrandLabel")}
              </label>
              <Select
                value={selectedPresetBrand}
                onValueChange={(val) => {
                  setSelectedPresetBrand(val);
                  setSelectedPresetId("");
                }}
              >
                <SelectTrigger className="text-base sm:text-xs h-9 bg-card">
                  <SelectValue placeholder={t("presetSelectBrand")} />
                </SelectTrigger>
                <SelectContent>
                  {getCatalogBrands().map((b) => (
                    <SelectItem key={b} value={b} className="text-xs">
                      {b}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-xs">
                    {t("customPreset")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("presetModelLabel")}
              </label>
              <Select
                value={selectedPresetId}
                onValueChange={setSelectedPresetId}
                disabled={selectedPresetBrand === "custom" || availablePresets.length === 0}
              >
                <SelectTrigger className="text-base sm:text-xs h-9 bg-card">
                  <SelectValue placeholder={t("presetSelectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {availablePresets.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.modelName} ({p.series})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Button
                type="button"
                onClick={handleApplyPreset}
                disabled={!selectedPresetId}
                className="w-full text-xs h-9 gap-1.5 font-medium"
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t("applyPreset")}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 1: General Info */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("generalInfo")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("brandLabel")} *
              </label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder={t("brandPlaceholder")}
                className="text-base sm:text-xs h-9"
                required
              />
            </div>

            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("modelLabel")} *
              </label>
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder={t("modelPlaceholder")}
                className="text-base sm:text-xs h-9"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("categoryLabel")} *
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="text-base sm:text-xs h-9">
                  <SelectValue placeholder={t("categorySelect")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warranty (Months) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("warrantyLabel")}
              </label>
              <Input
                type="number"
                min={0}
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="text-base sm:text-xs h-9"
              />
            </div>
          </div>

          {/* Slug (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("slugLabel")}
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="apple-iphone-16-pro"
              className="text-base sm:text-xs h-9 font-mono"
            />
          </div>

          {/* Descriptions across 3 languages */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("descUzLabel")} *
              </label>
              <Textarea
                rows={2}
                value={descriptionUz}
                onChange={(e) => setDescriptionUz(e.target.value)}
                className="text-base sm:text-xs resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("descRuLabel")} *
              </label>
              <Textarea
                rows={2}
                value={descriptionRu}
                onChange={(e) => setDescriptionRu(e.target.value)}
                className="text-base sm:text-xs resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("descEnLabel")} *
              </label>
              <Textarea
                rows={2}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="text-base sm:text-xs resize-none"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Hardware Specifications */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("hardwareSpecsSection")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Series */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("seriesLabel")}
              </label>
              <Input
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder={t("seriesPlaceholder")}
                className="text-base sm:text-xs h-9"
              />
            </div>

            {/* Release Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("releaseYearLabel")}
              </label>
              <Input
                type="number"
                min={2015}
                max={2030}
                value={releaseYear ?? ""}
                onChange={(e) =>
                  setReleaseYear(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder={t("releaseYearPlaceholder")}
                className="text-base sm:text-xs h-9 font-mono"
              />
            </div>

            {/* Display / Screen */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("screenLabel")}
              </label>
              <Input
                value={screenSize}
                onChange={(e) => setScreenSize(e.target.value)}
                placeholder={t("screenPlaceholder")}
                className="text-base sm:text-xs h-9"
              />
            </div>

            {/* CPU / Processor */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("cpuLabel")}
              </label>
              <Input
                value={processor}
                onChange={(e) => setProcessor(e.target.value)}
                placeholder={t("cpuPlaceholder")}
                className="text-base sm:text-xs h-9"
              />
            </div>

            {/* Battery */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("batteryLabel")}
              </label>
              <Input
                value={battery}
                onChange={(e) => setBattery(e.target.value)}
                placeholder={t("batteryPlaceholder")}
                className="text-base sm:text-xs h-9"
              />
            </div>

            {/* Camera */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("cameraLabel")}
              </label>
              <Input
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                placeholder={t("cameraPlaceholder")}
                className="text-base sm:text-xs h-9"
              />
            </div>

            {/* Charging */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("chargingLabel")}
              </label>
              <Input
                value={charging}
                onChange={(e) => setCharging(e.target.value)}
                placeholder={t("chargingPlaceholder")}
                className="text-base sm:text-xs h-9"
              />
            </div>

            {/* OS */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("osLabel")}
              </label>
              <Input
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder={t("osPlaceholder")}
                className="text-base sm:text-xs h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Variants Section */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("variantsSection")}</span>
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            className="text-xs h-8 gap-1.5 font-medium"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("addVariant")}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {variants.map((v, index) => {
            const presetColors = activePreset?.colors || [];
            const storageOptions = activePreset?.storageOptions || COMMON_STORAGES;
            const parsedImageUrls = v.images
              .split(",")
              .map((u) => u.trim())
              .filter((u) => u.length > 0);

            return (
              <div
                key={v.id}
                className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-4 relative"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-bold text-foreground">
                    {t("variantNum", { num: index + 1 })}
                  </span>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(v.id)}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      <span>{t("removeVariant")}</span>
                    </Button>
                  )}
                </div>

                {/* Storage Pills Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                      <span>{t("quickStorage")}</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {storageOptions.map((opt) => (
                      <Button
                        key={opt}
                        type="button"
                        size="sm"
                        variant={v.storage === opt ? "default" : "outline"}
                        onClick={() => handleApplyStorage(v.id, opt)}
                        className="text-xs h-7 px-2.5 font-medium rounded-full"
                      >
                        {opt}
                      </Button>
                    ))}
                    <div className="w-24 ml-2">
                      <Input
                        value={v.storage}
                        onChange={(e) => updateVariant(v.id, "storage", e.target.value)}
                        placeholder={t("storagePlaceholder")}
                        className="text-xs h-7 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Color Swatches Quick-Pick */}
                {presetColors.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                        <Palette className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                        <span>{t("quickColors")}</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateVariant(v.id, "isCustomColor", !v.isCustomColor)
                        }
                        className="text-[11px] h-6 px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {t("customColor")}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map((c) => {
                        const isSelected = v.colorHex.toLowerCase() === c.hex.toLowerCase();
                        return (
                          <button
                            key={c.nameEn}
                            type="button"
                            onClick={() => handleApplyColorSwatch(v.id, c)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 font-semibold"
                                : "border-border/80 bg-background hover:border-primary/50"
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>{c.nameUz}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SKU, RAM & Condition */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-foreground">
                        SKU *
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAutoSku(v.id)}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" aria-hidden="true" />
                        <span>{t("generateSkuBtn")}</span>
                      </button>
                    </div>
                    <Input
                      value={v.sku}
                      onChange={(e) => updateVariant(v.id, "sku", e.target.value)}
                      placeholder="e.g. IP16P-256-DES"
                      className="text-base sm:text-xs h-8 font-mono uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("ramLabel")}
                    </label>
                    <Input
                      value={v.ram}
                      onChange={(e) => updateVariant(v.id, "ram", e.target.value)}
                      placeholder={t("ramPlaceholder")}
                      className="text-base sm:text-xs h-8 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("conditionLabel")}
                    </label>
                    <Select
                      value={v.condition}
                      onValueChange={(val: "NEW" | "USED") =>
                        updateVariant(v.id, "condition", val)
                      }
                    >
                      <SelectTrigger className="text-base sm:text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW" className="text-xs">
                          {t("conditionNew")}
                        </SelectItem>
                        <SelectItem value="USED" className="text-xs">
                          {t("conditionUsed")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Color Details (Always editable or expandable) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("colorUzLabel")} *
                    </label>
                    <Input
                      value={v.colorNameUz}
                      onChange={(e) =>
                        updateVariant(v.id, "colorNameUz", e.target.value)
                      }
                      placeholder="Qora"
                      className="text-base sm:text-xs h-8"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("colorRuLabel")} *
                    </label>
                    <Input
                      value={v.colorNameRu}
                      onChange={(e) =>
                        updateVariant(v.id, "colorNameRu", e.target.value)
                      }
                      placeholder="Черный"
                      className="text-base sm:text-xs h-8"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("colorEnLabel")} *
                    </label>
                    <Input
                      value={v.colorNameEn}
                      onChange={(e) =>
                        updateVariant(v.id, "colorNameEn", e.target.value)
                      }
                      placeholder="Black"
                      className="text-base sm:text-xs h-8"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("colorHexLabel")} *
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={v.colorHex}
                        onChange={(e) =>
                          updateVariant(v.id, "colorHex", e.target.value)
                        }
                        className="w-8 h-8 p-0 border border-input cursor-pointer rounded shrink-0"
                      />
                      <Input
                        value={v.colorHex}
                        onChange={(e) =>
                          updateVariant(v.id, "colorHex", e.target.value)
                        }
                        className="text-base sm:text-xs h-8 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Image URLs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("priceLabel")} *
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={v.price}
                      onChange={(e) => updateVariant(v.id, "price", e.target.value)}
                      placeholder="14500000"
                      className="text-base sm:text-xs h-8 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("oldPriceLabel")}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={v.oldPrice}
                      onChange={(e) =>
                        updateVariant(v.id, "oldPrice", e.target.value)
                      }
                      placeholder="15500000"
                      className="text-base sm:text-xs h-8 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      {t("imageUrlsLabel")}
                    </label>
                    <Input
                      value={v.images}
                      onChange={(e) => updateVariant(v.id, "images", e.target.value)}
                      placeholder={t("imageUrlsPlaceholder")}
                      className="text-base sm:text-xs h-8"
                    />
                  </div>
                </div>

                {/* Image Previews if URLs exist */}
                {parsedImageUrls.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Camera className="w-3 h-3" aria-hidden="true" />
                      <span>{t("imagePreview")}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {parsedImageUrls.map((url, imgIdx) => (
                        <div
                          key={`${url}-${imgIdx}`}
                          className="w-12 h-12 rounded-lg border border-border/80 bg-background overflow-hidden flex items-center justify-center p-0.5 shadow-2xs"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initial Stock per branch */}
                <div className="pt-2 border-t border-border/40">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Building2 className="w-3 h-3" aria-hidden="true" />
                    <span>{t("initialStockSection")}</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {branches.map((b) => (
                      <div key={b.id} className="space-y-1">
                        <label className="text-[10px] text-muted-foreground truncate block">
                          {b.name}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={v.initialStock[b.id] || "0"}
                          onChange={(e) =>
                            updateVariantStock(v.id, b.id, e.target.value)
                          }
                          className="text-base sm:text-xs h-8 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Footer Submit */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t sm:border-t-0 p-3 sm:p-0 -mx-4 sm:mx-0 flex justify-end gap-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0 z-20">
        <Link href="/admin/products">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            className="text-xs"
          >
            {t("cancel")}
          </Button>
        </Link>
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="text-xs gap-1.5 font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>{t("saving")}</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("saveProduct")}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
