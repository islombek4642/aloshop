"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  PackagePlus,
  Loader2,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { BasicInfoSection } from "./basic-info-section";
import { SpecsSection } from "./specs-section";
import { VariantsSection } from "./variants-section";
import { MediaSection } from "./media-section";
import { DescriptionSeoSection } from "./description-seo-section";
import { StickySidebarSummary } from "./sticky-sidebar-summary";
import type { BranchItem, CategoryItem, ProductEditorState } from "./types";
import { createProductAction } from "@/app/actions/admin-products";

export interface UnifiedProductEditorProps {
  branches: BranchItem[];
  categories: CategoryItem[];
  locale: string;
  isSuperAdmin?: boolean;
  branchId?: string | null;
}

export function UnifiedProductEditor({
  branches,
  categories,
  locale,
  isSuperAdmin = true,
  branchId,
}: UnifiedProductEditorProps) {
  const router = useRouter();
  const t = useTranslations("admin.productCreate");

  // Initial Form State
  const [state, setState] = React.useState<ProductEditorState>(() => {
    const initialBranchStock: Record<string, number> = {};
    for (const b of branches) {
      initialBranchStock[b.id] = 0;
    }

    return {
      title: "",
      brand: "Apple",
      categoryId: categories[0]?.id || "",
      condition: "NEW",
      skuPrefix: "",
      warrantyMonths: 12,
      series: "",
      releaseYear: new Date().getFullYear(),
      screenSize: "",
      processor: "",
      battery: "",
      camera: "",
      charging: "",
      os: "",
      imei: "",
      batteryHealth: null,
      usedConditionGrade: "A",
      shortDescUz: "",
      shortDescRu: "",
      shortDescEn: "",
      descriptionUz: "",
      descriptionRu: "",
      descriptionEn: "",
      slug: "",
      thumbnail: "",
      galleryImages: [],
      variants: [
        {
          id: `var-init-1`,
          sku: "",
          colorNameUz: "Qora",
          colorNameRu: "Черный",
          colorNameEn: "Black",
          colorHex: "#1C1C1E",
          ram: "8GB",
          storage: "128GB",
          condition: "NEW",
          price: 12000000,
          costPrice: null,
          oldPrice: null,
          images: [],
          stockByBranch: initialBranchStock,
        },
      ],
      basePrice: 12000000,
      costPrice: null,
      oldPrice: null,
      isActive: true,
      isDraft: false,
    };
  });

  const [isPending, setIsPending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleStateChange = (patch: Partial<ProductEditorState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async (asDraft: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic client validation
    if (!state.title.trim()) {
      setErrorMessage("Mahsulot nomi kiritilishi shart");
      return;
    }

    if (!asDraft) {
      if (!state.brand.trim()) {
        setErrorMessage("Brend tanlanishi shart");
        return;
      }
      if (!state.categoryId) {
        setErrorMessage("Kategoriya tanlanishi shart");
        return;
      }
      if (state.variants.length === 0) {
        setErrorMessage("Kamida 1 ta variant kiritilishi shart");
        return;
      }
      if (state.condition === "USED") {
        if (!state.imei || !/^\d{15}$/.test(state.imei.trim())) {
          setErrorMessage("Ishlatilgan telefon uchun 15 xonali IMEI kodi kiritilishi shart");
          return;
        }
      }
    }

    setIsPending(true);

    try {
      // Map variants ensuring SKU and condition match
      const mappedVariants = state.variants.map((v, idx) => ({
        sku:
          v.sku.trim() ||
          `${state.brand.slice(0, 3)}-${v.storage}-${idx + 1}`.toUpperCase(),
        colorNameUz: v.colorNameUz.trim(),
        colorNameRu: v.colorNameRu.trim(),
        colorNameEn: v.colorNameEn.trim(),
        colorHex: v.colorHex.trim(),
        ram: v.ram?.trim() || undefined,
        storage: v.storage.trim(),
        condition: state.condition,
        price: v.price > 0 ? v.price : 1000000,
        costPrice: v.costPrice ?? undefined,
        oldPrice: v.oldPrice ?? undefined,
        images:
          v.images.length > 0
            ? v.images
            : state.thumbnail
              ? [state.thumbnail]
              : [],
        initialStock: v.stockByBranch,
        imei: state.condition === "USED" ? state.imei.trim() : v.imei,
      }));

      const res = await createProductAction({
        brand: state.brand.trim(),
        modelName: state.title.trim(),
        slug: state.slug.trim() || undefined,
        categoryId: state.categoryId,
        warrantyMonths: state.warrantyMonths,
        series: state.series.trim() || undefined,
        releaseYear: state.releaseYear ?? undefined,
        screenSize: state.screenSize.trim() || undefined,
        processor: state.processor.trim() || undefined,
        battery: state.battery.trim() || undefined,
        camera: state.camera.trim() || undefined,
        charging: state.charging.trim() || undefined,
        os: state.os.trim() || undefined,
        condition: state.condition,
        imei: state.condition === "USED" ? state.imei.trim() : undefined,
        batteryHealth: state.batteryHealth ?? undefined,
        usedConditionGrade: state.usedConditionGrade || undefined,
        costPrice: state.costPrice ?? undefined,
        isDraft: asDraft,
        shortDescUz: state.shortDescUz.trim() || undefined,
        shortDescRu: state.shortDescRu.trim() || undefined,
        shortDescEn: state.shortDescEn.trim() || undefined,
        descriptionUz: state.descriptionUz.trim() || (asDraft ? "" : state.title),
        descriptionRu: state.descriptionRu.trim() || (asDraft ? "" : state.title),
        descriptionEn: state.descriptionEn.trim() || (asDraft ? "" : state.title),
        variants: mappedVariants,
      });

      if (!res.success) {
        setErrorMessage(
          res.error === "unauthorized"
            ? "Ruxsat etilmagan amal"
            : res.error === "validationError"
              ? "Ma'lumotlar to'liq yoki to'g'ri kiritilmadi"
              : res.error
        );
        setIsPending(false);
        return;
      }

      setSuccessMessage(
        asDraft
          ? t("draftSavedSuccess")
          : "Mahsulot muvaffaqiyatli saqlandi va katalogga qo'shildi"
      );

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 700);
    } catch {
      setErrorMessage("Kutilmagan xatolik yuz berdi");
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className="text-muted-foreground hover:text-foreground p-1 -ml-1 rounded-lg hover:bg-muted transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <PackagePlus className="w-6 h-6 text-primary" />
              <span>{t("title")}</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground ml-7">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2-Column Responsive Layout: Desktop 70/30 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Body (Left 70% -> 8 cols of 12) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Asosiy ma'lumotlar */}
          <BasicInfoSection
            state={state}
            categories={categories}
            locale={locale}
            onChange={handleStateChange}
          />

          {/* 2. Texnik xususiyatlar */}
          <SpecsSection state={state} onChange={handleStateChange} />

          {/* 3. Variantlar va xususiyatlar */}
          <VariantsSection
            state={state}
            branches={branches}
            onChange={handleStateChange}
          />

          {/* 4. Media va rasmlar */}
          <MediaSection state={state} onChange={handleStateChange} />

          {/* 5. Tavsif va SEO */}
          <DescriptionSeoSection state={state} onChange={handleStateChange} />
        </div>

        {/* Sticky Sidebar (Right 30% -> 4 cols of 12) */}
        <div className="lg:col-span-4">
          <StickySidebarSummary
            state={state}
            branches={branches}
            isPending={isPending}
            onSave={handleSave}
            onChange={handleStateChange}
          />
        </div>
      </div>
    </div>
  );
}

