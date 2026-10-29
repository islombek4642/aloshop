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
  storage: string;
  condition: "NEW" | "USED";
  price: string;
  oldPrice: string;
  images: string;
  initialStock: Record<string, string>; // branchId -> qty string
}

export function ProductCreateForm({
  categories,
  branches,
  locale,
}: ProductCreateFormProps) {
  const t = useTranslations("admin.productCreate");
  const router = useRouter();

  // Form states
  const [brand, setBrand] = React.useState("");
  const [modelName, setModelName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id || "");
  const [warrantyMonths, setWarrantyMonths] = React.useState(12);
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
    storage: "128GB",
    condition: "NEW",
    price: "",
    oldPrice: "",
    images: "",
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
            className="gap-1.5 text-xs"
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
                className="text-xs h-9"
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
                className="text-xs h-9"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("categoryLabel")} *
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="text-xs h-9">
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
                className="text-xs h-9"
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
              placeholder="apple-iphone-15-pro"
              className="text-xs h-9 font-mono"
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
                className="text-xs resize-none"
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
                className="text-xs resize-none"
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
                className="text-xs resize-none"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Variants Section */}
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
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("addVariant")}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {variants.map((v, index) => (
            <div
              key={v.id}
              className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-4 relative"
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

              {/* SKU & Storage & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    SKU *
                  </label>
                  <Input
                    value={v.sku}
                    onChange={(e) => updateVariant(v.id, "sku", e.target.value)}
                    placeholder="e.g. IP15P-BLK-128"
                    className="text-xs h-8 font-mono uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    {t("storageLabel")} *
                  </label>
                  <Input
                    value={v.storage}
                    onChange={(e) =>
                      updateVariant(v.id, "storage", e.target.value)
                    }
                    placeholder={t("storagePlaceholder")}
                    className="text-xs h-8"
                    required
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
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW" className="text-xs">
                        NEW (Yangi)
                      </SelectItem>
                      <SelectItem value="USED" className="text-xs">
                        USED (B/U)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color Fields */}
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
                    className="text-xs h-8"
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
                    className="text-xs h-8"
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
                    className="text-xs h-8"
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
                      className="text-xs h-8 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Images */}
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
                    placeholder="12000000"
                    className="text-xs h-8 font-mono"
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
                    placeholder="13000000"
                    className="text-xs h-8 font-mono"
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
                    className="text-xs h-8"
                  />
                </div>
              </div>

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
                        className="text-xs h-8 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer Submit */}
      <div className="flex justify-end gap-3 pt-2">
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
          className="text-xs gap-1.5"
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
