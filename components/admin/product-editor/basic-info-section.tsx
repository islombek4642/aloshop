"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Smartphone, Tag, Layers, Hash, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryItem, ProductEditorState } from "./types";

interface BasicInfoSectionProps {
  state: ProductEditorState;
  categories: CategoryItem[];
  locale: string;
  onChange: (fields: Partial<ProductEditorState>) => void;
}

const POPULAR_BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Honor",
  "Google Pixel",
  "Poco",
  "OnePlus",
  "Vivo",
  "Realme",
];

export function BasicInfoSection({
  state,
  categories,
  locale,
  onChange,
}: BasicInfoSectionProps) {
  const t = useTranslations("admin.productCreate");

  return (
    <Card className="border-border/70 bg-card shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>{t("sectionBasicInfo")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>{t("modelLabel")} *</span>
          </Label>
          <Input
            value={state.title}
            onChange={(e) => {
              const val = e.target.value;
              const autoSlug = val
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
              onChange({
                title: val,
                slug: state.slug && !state.slug.startsWith(autoSlug) ? state.slug : autoSlug,
              });
            }}
            placeholder="Apple iPhone 16 Pro Max"
            className="h-11 sm:h-9 text-base sm:text-xs"
            required
          />
        </div>

        {/* Brand & Category & Condition (3 cols on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Brand */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              {t("brandLabel")} *
            </Label>
            <Select
              value={state.brand || undefined}
              onValueChange={(val) => onChange({ brand: val })}
            >
              <SelectTrigger className="h-11 sm:h-9 text-base sm:text-xs">
                <SelectValue placeholder={t("brandPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_BRANDS.map((b) => (
                  <SelectItem key={b} value={b} className="text-xs">
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("categoryLabel")} *</span>
            </Label>
            <Select
              value={state.categoryId || undefined}
              onValueChange={(val) => onChange({ categoryId: val })}
            >
              <SelectTrigger className="h-11 sm:h-9 text-base sm:text-xs">
                <SelectValue placeholder={t("categorySelect")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => {
                  const catName =
                    locale === "ru"
                      ? c.nameRu
                      : locale === "en"
                        ? c.nameEn
                        : c.nameUz;
                  return (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {catName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Condition Dropdown (Yangi vs Ishlatilgan) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              {t("usedConditionLabel")} *
            </Label>
            <Select
              value={state.condition}
              onValueChange={(val: "NEW" | "USED") => {
                // If switching to USED, ensure variants is constrained to 1
                if (val === "USED" && state.variants.length > 1) {
                  onChange({
                    condition: val,
                    variants: [state.variants[0]],
                  });
                } else {
                  onChange({ condition: val });
                }
              }}
            >
              <SelectTrigger className="h-11 sm:h-9 text-base sm:text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW" className="text-xs font-medium text-emerald-600">
                  {t("conditionNew")}
                </SelectItem>
                <SelectItem value="USED" className="text-xs font-medium text-amber-600">
                  {t("conditionUsed")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SKU Prefix & Warranty Months */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>Artikul / SKU Prefiks</span>
            </Label>
            <Input
              value={state.skuPrefix}
              onChange={(e) => onChange({ skuPrefix: e.target.value.toUpperCase() })}
              placeholder="IP16PM"
              className="h-11 sm:h-9 text-base sm:text-xs font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{t("warrantyLabel")} (oy)</span>
            </Label>
            <Input
              type="number"
              min={0}
              max={36}
              value={state.warrantyMonths}
              onChange={(e) => onChange({ warrantyMonths: parseInt(e.target.value) || 0 })}
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
