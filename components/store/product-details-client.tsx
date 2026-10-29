"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  Store,
  Phone,
  Send,
  Check,
  ChevronRight,
  Smartphone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ProductGallery } from "@/components/store/product-gallery";
import {
  VariantSelector,
  type ProductVariantData,
} from "@/components/store/variant-selector";
import {
  BranchStockWidget,
  type BranchStockItem,
} from "@/components/store/branch-stock-widget";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/lib/store/use-cart";
import { createOrderAction } from "@/app/actions/checkout";

export interface SerializedProduct {
  id: string;
  brand: string;
  modelName: string;
  slug: string;
  descriptionUz: string;
  descriptionRu: string;
  descriptionEn: string;
  warrantyMonths: number;
  category?: {
    id: string;
    nameUz: string;
    nameRu: string;
    nameEn: string;
    slug: string;
  } | null;
  variants: ProductVariantData[];
}

export interface ProductDetailsClientProps {
  product: SerializedProduct;
  branches: BranchStockItem[];
}

export function ProductDetailsClient({
  product,
  branches,
}: ProductDetailsClientProps) {
  const tProduct = useTranslations("product");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();

  const [selectedVariantId, setSelectedVariantId] = React.useState<string>(
    product.variants[0]?.id || ""
  );
  const [isAddedToCart, setIsAddedToCart] = React.useState(false);
  const [oneClickOpen, setOneClickOpen] = React.useState(false);
  const [oneClickName, setOneClickName] = React.useState("");
  const [oneClickPhone, setOneClickPhone] = React.useState("+998 ");
  const [oneClickSubmitted, setOneClickSubmitted] = React.useState(false);
  const [oneClickLoading, setOneClickLoading] = React.useState(false);
  const [oneClickOrderNumber, setOneClickOrderNumber] = React.useState<string | null>(null);
  const [oneClickError, setOneClickError] = React.useState<string | null>(null);

  const addItem = useCart((state) => state.addItem);

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  // Localized description
  const description = React.useMemo(() => {
    if (locale === "ru") return product.descriptionRu || product.descriptionUz;
    if (locale === "en") return product.descriptionEn || product.descriptionUz;
    return product.descriptionUz;
  }, [locale, product]);

  // Localized category name
  const categoryName = React.useMemo(() => {
    if (!product.category) return null;
    if (locale === "ru") return product.category.nameRu;
    if (locale === "en") return product.category.nameEn;
    return product.category.nameUz;
  }, [locale, product]);

  // Localized color name
  const colorName = React.useMemo(() => {
    if (!activeVariant) return "";
    if (locale === "ru") return activeVariant.colorNameRu || activeVariant.colorNameUz || "";
    if (locale === "en") return activeVariant.colorNameEn || activeVariant.colorNameUz || "";
    return activeVariant.colorNameUz || "";
  }, [locale, activeVariant]);

  // Discount percentage
  const discountPercent = React.useMemo(() => {
    if (!activeVariant?.oldPrice || !activeVariant?.price) return null;
    if (activeVariant.oldPrice > activeVariant.price && activeVariant.oldPrice > 0) {
      return Math.round(
        ((activeVariant.oldPrice - activeVariant.price) / activeVariant.oldPrice) * 100
      );
    }
    return null;
  }, [activeVariant]);

  // Total stock across branches
  const totalStock = React.useMemo(() => {
    if (!activeVariant?.inventory) return 0;
    return activeVariant.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [activeVariant]);

  const handleAddToCart = () => {
    if (!activeVariant) return;
    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      modelName: product.modelName,
      brand: product.brand,
      colorName,
      colorHex: activeVariant.colorHex,
      storage: activeVariant.storage,
      condition: activeVariant.condition,
      price: activeVariant.price,
      image: activeVariant.images[0] || "",
      maxStock: totalStock,
    });
    setIsAddedToCart(true);
    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2500);
  };

  const handleOneClickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVariant || !oneClickName.trim() || oneClickPhone.trim().length < 9) return;
    setOneClickLoading(true);
    setOneClickError(null);

    try {
      const res = await createOrderAction({
        customerName: oneClickName.trim(),
        customerPhone: oneClickPhone.trim(),
        fulfillmentType: "DELIVERY",
        pickupBranchId: null,
        deliveryAddress: "Toshkent (1-Click)",
        paymentType: "CASH_ON_DELIVERY",
        notes: `1-Click: ${product.brand} ${product.modelName} (${activeVariant.storage})`,
        items: [
          {
            variantId: activeVariant.id,
            quantity: 1,
            unitPrice: activeVariant.price,
          },
        ],
      });

      if (res.success) {
        setOneClickSubmitted(true);
        setOneClickOrderNumber(res.orderNumber);
      } else {
        setOneClickError(res.error);
      }
    } catch {
      setOneClickError(tCheckout("errorGeneric"));
    } finally {
      setOneClickLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-foreground transition-colors">
          {tNav("home")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        <Link href="/catalog" className="hover:text-foreground transition-colors">
          {tNav("catalog")}
        </Link>
        {categoryName && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
            <span className="hover:text-foreground transition-colors">
              {categoryName}
            </span>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
          {product.brand} {product.modelName}
        </span>
      </nav>

      {/* Main Grid: Gallery + Variant & Purchase Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Interactive Image Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <ProductGallery
            images={activeVariant?.images || []}
            alt={`${product.brand} ${product.modelName}`}
            condition={activeVariant?.condition}
            warrantyMonths={product.warrantyMonths}
          />

          {/* Value Prop Badges (Desktop) */}
          <div className="mt-6 hidden lg:grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-xs font-semibold text-foreground">
                  {tProduct("original")}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {tProduct("officialWarrantyNotice")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-xs font-semibold text-foreground">
                  {tProduct("fastDeliveryNotice")}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {tProduct("pickupAvailable")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Reactive Variant Selector, CTAs, Stock Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header & Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {product.brand}
              </span>
              <span className="text-muted-foreground/40">•</span>
              {totalStock > 0 ? (
                <Badge variant="success" className="text-[11px] px-2 py-0.5 gap-1 font-medium">
                  <Check className="h-3 w-3" aria-hidden="true" />
                  <span>{tProduct("inStock")}</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px] px-2 py-0.5 text-muted-foreground font-medium">
                  {tProduct("outOfStock")}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {product.brand} {product.modelName}
            </h1>
          </div>

          {/* Reactive Price Section */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {activeVariant ? formatCurrency(activeVariant.price) : "0 so'm"}
              </span>

              {activeVariant?.oldPrice && discountPercent !== null && (
                <>
                  <span className="text-sm sm:text-base text-muted-foreground line-through">
                    {formatCurrency(activeVariant.oldPrice)}
                  </span>
                  <Badge variant="destructive" className="font-bold text-xs px-2 py-0.5">
                    -{discountPercent}%
                  </Badge>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {tProduct("officialWarrantyNotice")}
            </p>
          </div>

          {/* Reactive Variant Selector (Color Swatches + Storage Pills) */}
          <VariantSelector
            variants={product.variants}
            selectedVariantId={selectedVariantId}
            onSelectVariant={(variant) => setSelectedVariantId(variant.id)}
          />

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              size="lg"
              onClick={handleAddToCart}
              disabled={totalStock <= 0}
              className={cn(
                "flex-1 h-12 text-sm font-semibold gap-2 shadow-sm transition-all",
                isAddedToCart ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
              )}
            >
              {isAddedToCart ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>{tProduct("addedToCart")}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  <span>{tProduct("addToCart")}</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={totalStock <= 0}
              onClick={() => setOneClickOpen(true)}
              className="flex-1 h-12 text-sm font-semibold gap-2 border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{tProduct("buyNow")}</span>
            </Button>
          </div>

          {/* Direct Consultation Links */}
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-xs">
            <span className="text-muted-foreground font-medium">
              {tProduct("contactConsultant")}
            </span>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs">
                <a href="tel:+998712001122">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{tProduct("callStore")}</span>
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs text-primary">
                <a href="https://t.me/aloshop_official" target="_blank" rel="noopener noreferrer">
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{tProduct("writeTelegram")}</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Branch Stock Breakdown Widget */}
          <BranchStockWidget
            branches={branches}
            inventory={activeVariant?.inventory}
          />

          {/* Tech Specifications Table */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              {tProduct("specs")}
            </h3>

            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-1/3 font-medium text-xs text-muted-foreground py-2.5">
                      {tProduct("brand")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground py-2.5">
                      {product.brand}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/3 font-medium text-xs text-muted-foreground py-2.5">
                      {tProduct("model")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground py-2.5">
                      {product.modelName}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/3 font-medium text-xs text-muted-foreground py-2.5">
                      {tProduct("condition")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground py-2.5">
                      {activeVariant?.condition === "NEW"
                        ? tProduct("conditions.new")
                        : tProduct("conditions.used")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/3 font-medium text-xs text-muted-foreground py-2.5">
                      {tProduct("warranty")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground py-2.5">
                      {tProduct("warrantyMonths", { count: product.warrantyMonths })}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/3 font-medium text-xs text-muted-foreground py-2.5">
                      {tProduct("storage")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground py-2.5">
                      {activeVariant?.storage}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/3 font-medium text-xs text-muted-foreground py-2.5">
                      {tProduct("color")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground py-2.5 flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: activeVariant?.colorHex }}
                      />
                      <span>{colorName}</span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/3 font-medium text-xs text-muted-foreground py-2.5">
                      {tProduct("sku")}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground py-2.5">
                      {activeVariant?.sku}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Description Section */}
          {description && (
            <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {tProduct("description")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="block text-[10px] text-muted-foreground font-medium">
              {activeVariant?.storage} • {colorName}
            </span>
            <span className="block text-base font-black text-foreground">
              {activeVariant ? formatCurrency(activeVariant.price) : "0 so'm"}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleAddToCart}
            disabled={totalStock <= 0}
            className={cn(
              "h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs transition-all",
              isAddedToCart ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            )}
          >
            {isAddedToCart ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tProduct("addedToCart")}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tProduct("addToCart")}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 1-Click Fast Checkout Modal */}
      <Dialog open={oneClickOpen} onOpenChange={setOneClickOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {tCheckout("oneClickTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {tCheckout("orderSuccessDescription")}
            </DialogDescription>
          </DialogHeader>

          {oneClickSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Check className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />
              </div>
              <h4 className="text-base font-semibold text-foreground">
                {tCheckout("orderSuccessTitle")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {tCheckout("orderSuccessDescription")}
              </p>
              {oneClickOrderNumber && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 py-2 px-3 text-sm font-bold text-primary">
                  {tCheckout("orderNumber", { orderNumber: oneClickOrderNumber })}
                </div>
              )}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOneClickOpen(false);
                    setOneClickSubmitted(false);
                    setOneClickOrderNumber(null);
                    setOneClickName("");
                    setOneClickPhone("+998 ");
                  }}
                  className="text-xs h-9"
                >
                  {tCommon("actions.close")}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOneClickSubmit} className="space-y-4 pt-2">
              {oneClickError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{oneClickError}</span>
                </div>
              )}

              {/* Selected product summary */}
              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Smartphone className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {product.brand} {product.modelName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {activeVariant?.storage} • {colorName}
                  </p>
                </div>
                <div className="text-right font-bold text-foreground">
                  {activeVariant ? formatCurrency(activeVariant.price) : "0"}
                </div>
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {tCheckout("fullName")}
                </label>
                <Input
                  required
                  value={oneClickName}
                  onChange={(e) => setOneClickName(e.target.value)}
                  placeholder={tCheckout("fullNamePlaceholder")}
                  className="h-10 text-xs"
                />
              </div>

              {/* Phone field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {tCheckout("phone")}
                </label>
                <Input
                  required
                  value={oneClickPhone}
                  onChange={(e) => setOneClickPhone(e.target.value)}
                  placeholder={tCheckout("phonePlaceholder")}
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOneClickOpen(false)}
                  className="text-xs h-9"
                >
                  {tCommon("actions.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={oneClickLoading}
                  className="text-xs h-9 gap-1.5"
                >
                  {oneClickLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  )}
                  <span>
                    {oneClickLoading
                      ? tCheckout("submitting")
                      : tCheckout("submitOrder")}
                  </span>
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

