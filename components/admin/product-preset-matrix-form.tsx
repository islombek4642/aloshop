"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Smartphone,
  Cpu,
  Camera,
  Battery,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  createOrUpdateProductFromPresetAction,
  type PresetProductInput,
} from "@/app/actions/admin-products";
import {
  CATALOG_PRESETS,
  getCatalogBrands,
  getPresetsByBrand,
  type CatalogPreset,
} from "@/lib/catalog/presets";
import { getSuggestedPriceForModel } from "@/lib/catalog/pricing";
import { formatCurrency } from "@/lib/utils/format-currency";

export interface BranchItem {
  id: string;
  name: string;
}

export interface InitialVariantData {
  id?: string;
  sku?: string;
  colorNameUz: string;
  colorNameRu?: string;
  colorNameEn?: string;
  colorHex?: string;
  storage: string;
  price: number;
  oldPrice?: number | null;
  initialStock: Record<string, number>;
}

export interface InitialProductData {
  id: string;
  brand: string;
  modelName: string;
  slug: string;
  variants: InitialVariantData[];
}

export interface ProductPresetMatrixFormProps {
  branches: BranchItem[];
  initialData?: InitialProductData | null;
  locale: string;
  isSuperAdmin?: boolean;
  branchId?: string | null;
}

interface MatrixRow {
  key: string;
  included: boolean;
  colorNameUz: string;
  colorNameRu: string;
  colorNameEn: string;
  colorHex: string;
  imageUrl?: string;
  storage: string;
  price: number;
  oldPrice?: number | null;
  stock: Record<string, number>;
}

export function ProductPresetMatrixForm({
  branches,
  initialData,
  locale,
  isSuperAdmin = true,
  branchId,
}: ProductPresetMatrixFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.productMatrix");
  const tCommon = useTranslations("common.actions");

  const brands = React.useMemo(() => getCatalogBrands(), []);

  // Determine initial brand & preset
  const defaultBrand = initialData?.brand || brands[0] || "Apple";
  const [selectedBrand, setSelectedBrand] = React.useState<string>(defaultBrand);

  const availablePresets = React.useMemo(() => {
    return getPresetsByBrand(selectedBrand);
  }, [selectedBrand]);

  const defaultPreset = React.useMemo(() => {
    if (initialData) {
      const match = CATALOG_PRESETS.find(
        (p) =>
          p.slug === initialData.slug ||
          (p.brand.toLowerCase() === initialData.brand.toLowerCase() &&
            p.modelName.toLowerCase() === initialData.modelName.toLowerCase())
      );
      if (match) return match;
    }
    return availablePresets[0] || CATALOG_PRESETS[0];
  }, [initialData, availablePresets]);

  const [selectedPresetId, setSelectedPresetId] = React.useState<string>(
    defaultPreset?.id || ""
  );

  const currentPreset = React.useMemo(() => {
    return (
      availablePresets.find((p) => p.id === selectedPresetId) ||
      availablePresets[0] ||
      null
    );
  }, [availablePresets, selectedPresetId]);

  // Sync selectedPresetId if brand changes and currentPreset is outside the brand
  React.useEffect(() => {
    if (availablePresets.length > 0) {
      const exists = availablePresets.some((p) => p.id === selectedPresetId);
      if (!exists) {
        setSelectedPresetId(availablePresets[0].id);
      }
    }
  }, [availablePresets, selectedPresetId]);

  // Matrix rows state
  const [rows, setRows] = React.useState<MatrixRow[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Initialize or recompute matrix rows when currentPreset changes
  React.useEffect(() => {
    if (!currentPreset) return;

    const newRows: MatrixRow[] = [];

    for (const color of currentPreset.colors) {
      for (const storage of currentPreset.storageOptions) {
        const key = `${color.nameUz}__${storage}`;

        // Check if matching variant exists in initialData
        const existingVariant = initialData?.variants.find(
          (v) =>
            v.colorNameUz.trim().toLowerCase() === color.nameUz.trim().toLowerCase() &&
            v.storage.trim().toLowerCase() === storage.trim().toLowerCase()
        );

        const suggested = getSuggestedPriceForModel(
          currentPreset.brand,
          currentPreset.modelName,
          storage
        );

        // Build default stock per branch
        const defaultStock: Record<string, number> = {};
        for (const branch of branches) {
          defaultStock[branch.id] = existingVariant?.initialStock[branch.id] ?? 0;
        }

        newRows.push({
          key,
          included: initialData ? Boolean(existingVariant) : true,
          colorNameUz: color.nameUz,
          colorNameRu: color.nameRu,
          colorNameEn: color.nameEn,
          colorHex: color.hex,
          imageUrl: color.imageUrl,
          storage,
          price: existingVariant ? existingVariant.price : suggested.price,
          oldPrice: existingVariant ? existingVariant.oldPrice : suggested.oldPrice,
          stock: defaultStock,
        });
      }
    }

    setRows(newRows);
  }, [currentPreset, initialData, branches]);

  const includedCount = React.useMemo(() => {
    return rows.filter((r) => r.included).length;
  }, [rows]);

  const isAllSelected = rows.length > 0 && includedCount === rows.length;

  const handleToggleRow = (key: string) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, included: !r.included } : r))
    );
  };

  const handleSelectAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, included: true })));
  };

  const handleDeselectAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, included: false })));
  };

  const toggleAll = () => {
    if (isAllSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  };

  const handlePriceChange = (key: string, value: number) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, price: Math.max(0, value) } : r))
    );
  };

  const handleStockChange = (key: string, targetBranchId: string, value: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        return {
          ...r,
          stock: {
            ...r.stock,
            [targetBranchId]: Math.max(0, Math.floor(value)),
          },
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPreset) {
      setErrorMessage(t("chooseModelNotice"));
      return;
    }

    const includedRows = rows.filter((r) => r.included);
    if (includedRows.length === 0) {
      setErrorMessage(t("validationAtLeastOne"));
      return;
    }

    const hasInvalidPrice = includedRows.some((r) => !r.price || r.price <= 0);
    if (hasInvalidPrice) {
      setErrorMessage(t("validationPositivePrice"));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: PresetProductInput = {
        presetId: currentPreset.id,
        variants: includedRows.map((r) => ({
          colorNameUz: r.colorNameUz,
          colorNameRu: r.colorNameRu,
          colorNameEn: r.colorNameEn,
          colorHex: r.colorHex,
          storage: r.storage,
          condition: "NEW",
          price: r.price,
          oldPrice: r.oldPrice ?? null,
          images: r.imageUrl ? [r.imageUrl] : [],
          initialStock: r.stock,
        })),
      };

      const result = await createOrUpdateProductFromPresetAction(payload);

      if (result.success) {
        setSuccessMessage(t("saveSuccess"));
        router.push("/admin/products");
        router.refresh();
      } else {
        setErrorMessage(t("saveError") + (result.error ? `: ${result.error}` : ""));
      }
    } catch (err) {
      console.error("Failed to save product:", err);
      setErrorMessage(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorName = (row: MatrixRow) => {
    if (locale === "ru") return row.colorNameRu;
    if (locale === "en") return row.colorNameEn;
    return row.colorNameUz;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header / Brand & Model Selection */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {initialData ? t("editTitle") : t("matrixTitle")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initialData ? t("editSubtitle") : t("matrixSubtitle")}
            </p>
          </div>

          <Link href="/admin/products">
            <Button variant="outline" size="sm" type="button" className="h-9 gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>{t("backToProducts")}</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
          {/* Brand Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("brandSelect")}
            </label>
            <Select
              value={selectedBrand}
              onValueChange={(val) => {
                setSelectedBrand(val);
                const presets = getPresetsByBrand(val);
                if (presets.length > 0) {
                  setSelectedPresetId(presets[0].id);
                }
              }}
              disabled={Boolean(initialData)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t("brandSelect")} />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b} value={b} className="text-xs">
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("modelSelect")}
            </label>
            <Select
              value={selectedPresetId}
              onValueChange={setSelectedPresetId}
              disabled={Boolean(initialData)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t("modelSelect")} />
              </SelectTrigger>
              <SelectContent>
                {availablePresets.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.modelName} &bull; {p.series} ({p.releaseYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Model Hardware Specs Summary Card */}
      {currentPreset && (
        <Card className="shadow-xs border-border/80">
          <CardHeader className="py-3 px-5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {currentPreset.brand} {currentPreset.modelName} &bull; {t("specsSummary")}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                {currentPreset.releaseYear} &bull; {t("warrantyMonths", { count: currentPreset.warrantyMonths })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-background border border-border/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>{t("processor")}</span>
              </div>
              <p className="font-semibold text-foreground truncate" title={currentPreset.processor}>
                {currentPreset.processor}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <Camera className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>{t("camera")}</span>
              </div>
              <p className="font-semibold text-foreground truncate" title={currentPreset.camera}>
                {currentPreset.camera}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <Smartphone className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>{t("display")}</span>
              </div>
              <p className="font-semibold text-foreground truncate" title={currentPreset.screenSize}>
                {currentPreset.screenSize}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <Battery className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>{t("battery")}</span>
              </div>
              <p className="font-semibold text-foreground truncate" title={currentPreset.battery}>
                {currentPreset.battery}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Matrix Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t("selectedCount", { count: includedCount })}
            </span>
            <span className="text-xs text-muted-foreground">
              / {rows.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs gap-1"
            >
              <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("selectAll")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              className="h-8 text-xs gap-1"
            >
              <Square className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("deselectAll")}</span>
            </Button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/40">
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    aria-label={t("selectAll")}
                    className="w-4 h-4 rounded border-border text-primary cursor-pointer align-middle"
                  />
                </TableHead>
                <TableHead className="text-xs">{t("color")}</TableHead>
                <TableHead className="text-xs">{t("storage")}</TableHead>
                <TableHead className="text-xs">{t("price")}</TableHead>
                {branches.map((b) => (
                  <TableHead
                    key={b.id}
                    className="text-xs text-center min-w-[90px]"
                  >
                    {b.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.key}
                  className={`transition-colors ${
                    row.included ? "hover:bg-muted/40" : "opacity-45 bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  {/* Inclusion Checkbox */}
                  <TableCell className="w-12 text-center py-2.5">
                    <input
                      type="checkbox"
                      checked={row.included}
                      onChange={() => handleToggleRow(row.key)}
                      aria-label={`${getColorName(row)} ${row.storage}`}
                      className="w-4 h-4 rounded border-border text-primary cursor-pointer align-middle"
                    />
                  </TableCell>

                  {/* Color dot + localized name */}
                  <TableCell className="text-xs py-2.5 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                        style={{ backgroundColor: row.colorHex }}
                        aria-hidden="true"
                      />
                      <span>{getColorName(row)}</span>
                    </div>
                  </TableCell>

                  {/* Storage Badge */}
                  <TableCell className="text-xs py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold">
                      {row.storage}
                    </Badge>
                  </TableCell>

                  {/* Price input */}
                  <TableCell className="text-xs py-2.5">
                    <div className="space-y-0.5">
                      <Input
                        type="number"
                        min={0}
                        step={100000}
                        disabled={!row.included}
                        value={row.price}
                        onChange={(e) =>
                          handlePriceChange(row.key, Number(e.target.value))
                        }
                        className="h-8 w-36 text-xs font-mono font-semibold"
                      />
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {formatCurrency(row.price)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Stock inputs per active branch */}
                  {branches.map((b) => {
                    const isEditable = isSuperAdmin || b.id === branchId;
                    return (
                      <TableCell key={b.id} className="text-xs py-2.5 text-center">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          disabled={!row.included || !isEditable}
                          value={row.stock[b.id] ?? 0}
                          onChange={(e) =>
                            handleStockChange(row.key, b.id, Number(e.target.value))
                          }
                          className="h-8 w-20 text-xs font-mono text-center mx-auto"
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Status Banners */}
        {errorMessage && (
          <div className="p-3 bg-destructive/10 border-t border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border-t border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {t("selectedCount", { count: includedCount })} &bull;{" "}
            {includedCount > 0 ? (
              <span className="text-foreground font-medium">
                {t("saveProduct")}
              </span>
            ) : (
              <span className="text-destructive font-medium">
                {t("validationAtLeastOne")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/products">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="h-9 text-xs"
                disabled={isSubmitting}
              >
                {tCommon("cancel")}
              </Button>
            </Link>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || includedCount === 0}
              className="h-9 gap-1.5 text-xs font-semibold px-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>{t("saveProduct")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
