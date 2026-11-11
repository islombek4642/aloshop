"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Layers,
  Plus,
  Copy,
  Trash2,
  Building2,
  DollarSign,
  Palette,
  HardDrive,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { BranchItem, EditorVariant, ProductEditorState } from "./types";
import { generateSku } from "@/lib/catalog/presets";

interface VariantsSectionProps {
  state: ProductEditorState;
  branches: BranchItem[];
  onChange: (fields: Partial<ProductEditorState>) => void;
}

const COMMON_STORAGES = ["64GB", "128GB", "256GB", "512GB", "1TB"];
const COMMON_RAMS = ["6GB", "8GB", "12GB", "16GB"];

export function VariantsSection({
  state,
  branches,
  onChange,
}: VariantsSectionProps) {
  const t = useTranslations("admin.productCreate");
  const isUsed = state.condition === "USED";

  const handleAddVariant = () => {
    const idx = state.variants.length + 1;
    const baseVariant = state.variants[0];
    const newStorage = "256GB";
    const newColorUz = `Rang ${idx}`;
    const newSku = generateSku(
      state.brand || "PHONE",
      state.title || "MODEL",
      newStorage,
      `COLOR${idx}`
    );

    const initialStock: Record<string, number> = {};
    for (const b of branches) {
      initialStock[b.id] = 0;
    }

    const newVar: EditorVariant = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sku: newSku,
      colorNameUz: newColorUz,
      colorNameRu: `Цвет ${idx}`,
      colorNameEn: `Color ${idx}`,
      colorHex: "#1C1C1E",
      ram: baseVariant?.ram || "8GB",
      storage: newStorage,
      condition: "NEW",
      price: baseVariant?.price || 12000000,
      costPrice: baseVariant?.costPrice || null,
      oldPrice: null,
      images: [],
      stockByBranch: initialStock,
    };

    onChange({ variants: [...state.variants, newVar] });
  };

  const handleDuplicateVariant = (sourceIdx: number) => {
    const src = state.variants[sourceIdx];
    const nextIdx = state.variants.length + 1;
    const initialStock: Record<string, number> = {};
    for (const b of branches) {
      initialStock[b.id] = src.stockByBranch[b.id] ?? 0;
    }

    const baseSku = src.sku.replace(/-COPY\d+$/i, "");
    const copyRegex = new RegExp(`^${baseSku}-COPY(\\d+)$`, "i");
    let maxCopy = 0;
    for (const item of state.variants) {
      const match = item.sku.match(copyRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxCopy) maxCopy = num;
      }
    }
    const nextSku = `${baseSku}-COPY${maxCopy + 1}`;
    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const duplicated: EditorVariant = {
      ...src,
      id: uniqueId,
      sku: nextSku,
      colorNameUz: `${src.colorNameUz} (Nusxa)`,
      colorNameRu: `${src.colorNameRu} (Копия)`,
      colorNameEn: `${src.colorNameEn} (Copy)`,
      stockByBranch: initialStock,
      images: [...src.images],
    };

    const nextVariants = [...state.variants];
    nextVariants.splice(sourceIdx + 1, 0, duplicated);
    onChange({ variants: nextVariants });
  };

  const handleRemoveVariant = (idx: number) => {
    if (state.variants.length <= 1) return;
    const nextVariants = state.variants.filter((_, i) => i !== idx);
    onChange({ variants: nextVariants });
  };

  const handleUpdateVariant = (idx: number, patch: Partial<EditorVariant>) => {
    const nextVariants = [...state.variants];
    nextVariants[idx] = { ...nextVariants[idx], ...patch };
    onChange({ variants: nextVariants });
  };

  const handleBranchStockChange = (
    varIdx: number,
    branchId: string,
    quantity: number
  ) => {
    const targetVar = state.variants[varIdx];
    const updatedStock = {
      ...targetVar.stockByBranch,
      [branchId]: Math.max(0, quantity),
    };
    handleUpdateVariant(varIdx, { stockByBranch: updatedStock });
  };

  return (
    <Card className="border-border/70 bg-card shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("sectionVariants")}</span>
            <Badge variant="outline" className="text-xs font-mono font-medium">
              {state.variants.length} {t("variantCount")}
            </Badge>
          </CardTitle>

          {!isUsed && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
              className="h-11 sm:h-8 text-xs font-medium gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>{t("addVariantManual")}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {state.variants.map((v, idx) => (
          <div
            key={v.id}
            className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4 shadow-2xs"
          >
            {/* Variant Top Bar: Sku, Color Preview, Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <div
                  className="w-5 h-5 rounded-full border border-border/80 shrink-0 shadow-2xs"
                  style={{ backgroundColor: v.colorHex }}
                />
                <span className="text-xs font-bold text-foreground">
                  Variant #{idx + 1}: {v.colorNameUz} ({v.storage})
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  SKU: {v.sku}
                </span>
              </div>

              {!isUsed && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateVariant(idx)}
                    className="h-11 sm:h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                    title={t("duplicateVariant")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t("duplicateVariant")}</span>
                  </Button>
                  {state.variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariant(idx)}
                      className="h-11 sm:h-8 px-2 text-destructive hover:bg-destructive/10"
                      title={t("removeVariant")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Colors & Memory Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Color Name UZ */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Palette className="w-3 h-3 text-muted-foreground" />
                  <span>Rang nomi (O'zbek) *</span>
                </Label>
                <Input
                  value={v.colorNameUz}
                  onChange={(e) =>
                    handleUpdateVariant(idx, { colorNameUz: e.target.value })
                  }
                  placeholder="Qora"
                  className="h-10 sm:h-9 text-base sm:text-xs"
                  required
                />
              </div>

              {/* Color Hex */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  Rang kodi (Hex)
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={v.colorHex.startsWith("#") ? v.colorHex : "#000000"}
                    onChange={(e) =>
                      handleUpdateVariant(idx, { colorHex: e.target.value })
                    }
                    className="w-10 h-10 sm:h-9 rounded-md border border-border cursor-pointer bg-background p-0.5"
                  />
                  <Input
                    value={v.colorHex}
                    onChange={(e) =>
                      handleUpdateVariant(idx, { colorHex: e.target.value })
                    }
                    placeholder="#1C1C1E"
                    className="h-10 sm:h-9 text-base sm:text-xs font-mono uppercase"
                  />
                </div>
              </div>

              {/* Storage */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-muted-foreground" />
                  <span>Xotira (ROM) *</span>
                </Label>
                <Input
                  value={v.storage}
                  onChange={(e) =>
                    handleUpdateVariant(idx, { storage: e.target.value })
                  }
                  placeholder="128GB, 256GB"
                  className="h-10 sm:h-9 text-base sm:text-xs"
                  required
                />
              </div>

              {/* RAM */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  Tezkor xotira (RAM)
                </Label>
                <Input
                  value={v.ram}
                  onChange={(e) =>
                    handleUpdateVariant(idx, { ram: e.target.value })
                  }
                  placeholder="8GB, 12GB"
                  className="h-10 sm:h-9 text-base sm:text-xs"
                />
              </div>
            </div>

            {/* Pricing Inputs: Selling Price, Cost Price, Old Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span>{t("sellingPrice")} (so'm) *</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={v.price || ""}
                  onChange={(e) =>
                    handleUpdateVariant(idx, {
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="12 500 000"
                  className="h-10 sm:h-9 text-base sm:text-xs font-mono font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  {t("costPrice")} (so'm)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={v.costPrice ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                      ? parseFloat(e.target.value)
                      : null;
                    handleUpdateVariant(idx, { costPrice: val });
                  }}
                  placeholder="10 000 000"
                  className="h-10 sm:h-9 text-base sm:text-xs font-mono text-muted-foreground"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  {t("discountPrice")} (so'm)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={v.oldPrice ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                      ? parseFloat(e.target.value)
                      : null;
                    handleUpdateVariant(idx, { oldPrice: val });
                  }}
                  placeholder="14 000 000"
                  className="h-10 sm:h-9 text-base sm:text-xs font-mono"
                />
              </div>
            </div>

            {/* Multi-Branch Inventory for this variant */}
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Filiallar bo'yicha qoldiq (dona)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border"
                  >
                    <span className="text-xs font-medium text-foreground truncate">
                      {b.name}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={v.stockByBranch[b.id] ?? 0}
                      onChange={(e) =>
                        handleBranchStockChange(
                          idx,
                          b.id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20 h-9 sm:h-8 text-center text-base sm:text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

