"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { FileText, Globe, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductEditorState } from "./types";

interface DescriptionSeoSectionProps {
  state: ProductEditorState;
  onChange: (fields: Partial<ProductEditorState>) => void;
}

export function DescriptionSeoSection({
  state,
  onChange,
}: DescriptionSeoSectionProps) {
  const t = useTranslations("admin.productCreate");
  const [activeLang, setActiveLang] = React.useState<"uz" | "ru" | "en">("uz");

  return (
    <Card className="border-border/70 bg-card shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{t("sectionDescription")}</span>
          </CardTitle>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
            {(["uz", "ru", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setActiveLang(l)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeLang === l
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Short Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            {t("shortDescLabel")} ({activeLang.toUpperCase()})
          </Label>
          {activeLang === "uz" && (
            <Input
              value={state.shortDescUz}
              onChange={(e) => onChange({ shortDescUz: e.target.value })}
              placeholder={t("shortDescPlaceholder")}
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          )}
          {activeLang === "ru" && (
            <Input
              value={state.shortDescRu}
              onChange={(e) => onChange({ shortDescRu: e.target.value })}
              placeholder={t("shortDescPlaceholder")}
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          )}
          {activeLang === "en" && (
            <Input
              value={state.shortDescEn}
              onChange={(e) => onChange({ shortDescEn: e.target.value })}
              placeholder={t("shortDescPlaceholder")}
              className="h-11 sm:h-9 text-base sm:text-xs"
            />
          )}
        </div>

        {/* Full Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            To'liq tavsif ({activeLang.toUpperCase()}) {!state.isDraft && "*"}
          </Label>
          {activeLang === "uz" && (
            <Textarea
              rows={4}
              value={state.descriptionUz}
              onChange={(e) => onChange({ descriptionUz: e.target.value })}
              placeholder="Mahsulot haqida to'liq xarakteristika va komplektatsiya..."
              className="text-base sm:text-xs leading-relaxed"
              required={!state.isDraft}
            />
          )}
          {activeLang === "ru" && (
            <Textarea
              rows={4}
              value={state.descriptionRu}
              onChange={(e) => onChange({ descriptionRu: e.target.value })}
              placeholder="Полное описание товара и комплектация..."
              className="text-base sm:text-xs leading-relaxed"
              required={!state.isDraft}
            />
          )}
          {activeLang === "en" && (
            <Textarea
              rows={4}
              value={state.descriptionEn}
              onChange={(e) => onChange({ descriptionEn: e.target.value })}
              placeholder="Full product overview and package contents..."
              className="text-base sm:text-xs leading-relaxed"
              required={!state.isDraft}
            />
          )}
        </div>

        {/* SEO Slug */}
        <div className="pt-2 border-t border-border/50 space-y-1.5">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Havola manzili (URL Slug)</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
              aloshop.uz/product/
            </span>
            <Input
              value={state.slug}
              onChange={(e) =>
                onChange({
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-"),
                })
              }
              placeholder="apple-iphone-16-pro"
              className="h-11 sm:h-9 text-base sm:text-xs font-mono"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

