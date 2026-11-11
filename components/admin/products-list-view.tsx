"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  Smartphone,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Package,
  Layers,
  Filter,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { AdminPagination } from "./admin-pagination";
import { formatCurrency } from "@/lib/utils/format-currency";
import {
  deleteProductAction,
  bulkDeleteProductsAction,
} from "@/app/actions/admin-products";

export interface SerializedVariant {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  storage: string;
  condition: string;
  price: number;
  oldPrice: number | null;
  totalStock: number;
}

export interface SerializedProduct {
  id: string;
  brand: string;
  modelName: string;
  slug: string;
  categoryName: string;
  categoryId: string;
  warrantyMonths: number;
  variants: SerializedVariant[];
  totalStock: number;
}

interface ProductsListViewProps {
  products: SerializedProduct[];
  brands: string[];
  categories: { id: string; name: string }[];
  isSuperAdmin: boolean;
  locale: string;
}

export function ProductsListView({
  products,
  brands,
  categories,
  isSuperAdmin,
}: ProductsListViewProps) {
  const router = useRouter();
  const t = useTranslations("admin.productsManagement");
  const tCommon = useTranslations("common.actions");

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedBrand, setSelectedBrand] = React.useState("ALL");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [expandedProductIds, setExpandedProductIds] = React.useState<Set<string>>(
    new Set()
  );

  // Pagination state (default: 20 per page)
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Delete modal state
  const [productToDelete, setProductToDelete] = React.useState<SerializedProduct | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Bulk selection & deletion state
  const [selectedProductIds, setSelectedProductIds] = React.useState<Set<string>>(
    new Set()
  );
  const [isBulkModalOpen, setIsBulkModalOpen] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [bulkFeedback, setBulkFeedback] = React.useState<{
    message: string;
    type: "success" | "warning";
  } | null>(null);
  const [bulkError, setBulkError] = React.useState<string | null>(null);

  const toggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const clearSelection = React.useCallback(() => {
    setSelectedProductIds(new Set());
  }, []);

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteProductAction(productToDelete.id);
      if (res.success) {
        setProductToDelete(null);
        router.refresh();
      } else {
        if (res.error === "cannotDeleteWithActiveOrders") {
          setDeleteError(t("cannotDeleteOrders"));
        } else {
          setDeleteError(t("deleteError"));
        }
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      setDeleteError(t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variants.some((v) =>
          v.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesBrand =
        selectedBrand === "ALL" || p.brand === selectedBrand;

      const matchesCategory =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;

      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [products, searchTerm, selectedBrand, selectedCategory]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBrand, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = React.useMemo(() => {
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize, totalPages]);

  // Reset selection when search or filters change (retains selection across currentPage pagination)
  React.useEffect(() => {
    clearSelection();
  }, [clearSelection, searchTerm, selectedBrand, selectedCategory]);

  const isAllPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.has(p.id));

  const isAllFilteredSelected =
    filteredProducts.length > 0 &&
    selectedProductIds.size === filteredProducts.length;

  const toggleSelectAllOnPage = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        for (const p of paginatedProducts) {
          next.delete(p.id);
        }
      } else {
        for (const p of paginatedProducts) {
          next.add(p.id);
        }
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;
    setIsBulkDeleting(true);
    setBulkError(null);

    try {
      const res = await bulkDeleteProductsAction({
        productIds: Array.from(selectedProductIds),
      });

      if (res.success) {
        let msg = t("bulkDeleteSuccess", {
          deleted: res.deletedCount,
          archived: res.archivedCount,
        });
        if (res.skippedActiveCount > 0) {
          msg += ` ${t("bulkDeleteSkipped", { skipped: res.skippedActiveCount })}`;
        }
        setBulkFeedback({
          message: msg,
          type: res.skippedActiveCount > 0 ? "warning" : "success",
        });
        clearSelection();
        setIsBulkModalOpen(false);
        router.refresh();
      } else {
        setBulkError(t("deleteError"));
      }
    } catch (err) {
      console.error("Failed to bulk delete products:", err);
      setBulkError(t("deleteError"));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Delete Feedback Banner */}
      {bulkFeedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 border ${
            bulkFeedback.type === "warning"
              ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-emerald-500/30"
          }`}
        >
          <span>{bulkFeedback.message}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setBulkFeedback(null)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      )}

      {/* Top action row & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-base sm:text-xs"
            />
          </div>

          {/* Brand Filter */}
          <div className="w-[140px]">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="h-9 text-base sm:text-xs">
                <SelectValue placeholder={t("allBrands")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  {t("allBrands")}
                </SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b} className="text-xs">
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="w-[150px]">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="h-9 text-base sm:text-xs">
                <SelectValue placeholder={t("allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  {t("allCategories")}
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create Button */}
        <Button asChild size="sm" className="h-9 gap-1.5 text-xs shrink-0">
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{t("newProduct")}</span>
          </Link>
        </Button>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        {/* Global Cross-Page Selection Banner */}
        {isAllPageSelected && filteredProducts.length > paginatedProducts.length && (
          <div className="bg-primary/5 border-b border-primary/20 text-foreground px-4 py-2.5 text-xs flex flex-wrap items-center justify-center gap-1.5 text-center animate-in fade-in duration-150">
            {!isAllFilteredSelected ? (
              <span>
                {t("selectPageBanner", { count: paginatedProducts.length })}{" "}
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors ml-1 cursor-pointer"
                >
                  {t("selectAllTotal", { total: filteredProducts.length })}
                </button>
              </span>
            ) : (
              <span>
                {t("allSelectedBanner", { total: filteredProducts.length })}{" "}
                <button
                  type="button"
                  onClick={clearSelection}
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors ml-1 cursor-pointer"
                >
                  {t("cancelSelection")}
                </button>
              </span>
            )}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Filter className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium text-foreground">{t("noProducts")}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={toggleSelectAllOnPage}
                        aria-label={t("selectAll")}
                        className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary align-middle"
                      />
                    </TableHead>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-12 text-xs font-semibold text-center">№</TableHead>
                    <TableHead className="text-xs">{t("title")}</TableHead>
                    <TableHead className="text-xs">{t("filterCategory")}</TableHead>
                    <TableHead className="text-xs">{t("warranty")}</TableHead>
                    <TableHead className="text-xs">{t("variants")}</TableHead>
                    <TableHead className="text-xs text-right">{t("totalStock")}</TableHead>
                    <TableHead className="text-xs text-right w-14 pr-4">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product, index) => {
                    const isExpanded = expandedProductIds.has(product.id);
                    const minPrice = Math.min(...product.variants.map((v) => v.price));
                    const maxPrice = Math.max(...product.variants.map((v) => v.price));

                    return (
                      <React.Fragment key={product.id}>
                        {/* Parent Row */}
                        <TableRow
                          onClick={() => toggleExpand(product.id)}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <TableCell
                            className="w-10 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedProductIds.has(product.id)}
                              onChange={() => toggleSelectProduct(product.id)}
                              aria-label={`${product.brand} ${product.modelName}`}
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary align-middle"
                            />
                          </TableCell>
                          <TableCell className="w-8 pr-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        )}
                      </TableCell>
                      <TableCell className="w-12 text-xs font-mono text-muted-foreground text-center">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                            <Smartphone className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">
                              {product.brand} {product.modelName}
                            </span>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {formatCurrency(minPrice)}
                              {minPrice !== maxPrice && ` - ${formatCurrency(maxPrice)}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {product.categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          <span>{t("warrantyMonths", { count: product.warrantyMonths })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t("variantsCount", { count: product.variants.length })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-right">
                        <Badge
                          variant={product.totalStock > 0 ? "secondary" : "destructive"}
                          className="font-mono text-xs"
                        >
                          {product.totalStock}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-xs text-right pr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title={t("edit")}
                          >
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="sr-only">{t("edit")}</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Variants Sub-Table */}
                    {isExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={9} className="p-0 border-b border-border/60">
                          <div className="px-6 py-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                              {product.modelName} &bull; {t("expandVariants")}
                            </div>
                            <div className="rounded-md border border-border/80 bg-card overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent bg-muted/40">
                                    <TableHead className="w-10 text-[11px] h-8 text-center">№</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("sku")}</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("color")}</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("storage")}</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("condition")}</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("price")}</TableHead>
                                    <TableHead className="text-[11px] h-8 text-right">{t("stock")}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {product.variants.map((v, vIndex) => (
                                    <TableRow key={v.id} className="hover:bg-muted/20">
                                      <TableCell className="w-10 text-[11px] font-mono text-muted-foreground text-center">
                                        {vIndex + 1}
                                      </TableCell>
                                      <TableCell className="text-xs font-mono font-medium text-primary">
                                        {v.sku}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                            style={{ backgroundColor: v.colorHex }}
                                            aria-hidden="true"
                                          />
                                          <span>{v.colorName}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs font-medium">
                                        {v.storage}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] py-0 px-1.5 font-normal"
                                        >
                                          {v.condition === "NEW" ? t("conditionNew") : t("conditionUsed")}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-xs font-semibold">
                                        <span>{formatCurrency(v.price)}</span>
                                        {v.oldPrice && (
                                          <span className="text-[10px] text-muted-foreground line-through ml-1.5 font-normal">
                                            {formatCurrency(v.oldPrice)}
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-xs font-mono font-bold text-right">
                                        <span
                                          className={
                                            v.totalStock > 0
                                              ? "text-foreground"
                                              : "text-destructive"
                                          }
                                        >
                                          {v.totalStock}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3 p-3">
          {paginatedProducts.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 shadow-2xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="flex items-center justify-center p-2.5 -m-1.5 min-w-[40px] min-h-[40px] shrink-0">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={toggleSelectAllOnPage}
                    aria-label={t("selectAll")}
                    className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary align-middle"
                  />
                </div>
                <span className="font-semibold text-foreground text-xs">{t("selectAllMobile", { count: filteredProducts.length })}</span>
              </label>
              {selectedProductIds.size > 0 && (
                <span className="text-[11px] font-mono text-primary font-medium">
                  {selectedProductIds.size}/{filteredProducts.length}
                </span>
              )}
            </div>
          )}
          {paginatedProducts.map((product) => {
            const isExpanded = expandedProductIds.has(product.id);
            const minPrice = Math.min(...product.variants.map((v) => v.price));
            const maxPrice = Math.max(...product.variants.map((v) => v.price));

            return (
              <div
                key={product.id}
                className="border border-border/80 rounded-xl bg-card p-3.5 space-y-3 shadow-2xs"
              >
                {/* Card Header: Checkbox, Icon, Brand/Model, Category Badge, Stock Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex items-center justify-center p-2.5 -m-1.5 shrink-0 min-w-[40px] min-h-[40px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.has(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        aria-label={`${product.brand} ${product.modelName}`}
                        className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary align-middle"
                      />
                    </div>
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                      <Smartphone className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {product.brand} {product.modelName}
                      </div>
                      <Badge variant="outline" className="text-[11px] font-normal py-0 px-1.5 mt-0.5">
                        {product.categoryName}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant={product.totalStock > 0 ? "secondary" : "destructive"}
                    className="font-mono text-xs shrink-0"
                  >
                    {product.totalStock}
                  </Badge>
                </div>

                {/* Price & Warranty Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <div className="font-mono font-medium text-foreground">
                    {formatCurrency(minPrice)}
                    {minPrice !== maxPrice && ` - ${formatCurrency(maxPrice)}`}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>{t("warrantyMonths", { count: product.warrantyMonths })}</span>
                  </div>
                </div>

                {/* Action Row: Accordion toggle, Edit, Delete */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpand(product.id)}
                    className="flex-1 justify-between min-h-[44px] text-xs font-medium"
                  >
                    <span>{t("viewVariants", { count: product.variants.length })}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
                    )}
                  </Button>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title={t("edit")}
                    >
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">{t("edit")}</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Expandable Variant Accordion */}
                {isExpanded && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                      {product.modelName} &bull; {t("expandVariants")}
                    </div>
                    <div className="space-y-1.5">
                      {product.variants.map((v) => (
                        <div
                          key={v.id}
                          className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: v.colorHex }}
                                aria-hidden="true"
                              />
                              <span className="font-medium text-foreground truncate">{v.colorName}</span>
                            </div>
                            <Badge
                              variant={v.totalStock > 0 ? "secondary" : "destructive"}
                              className="font-mono text-[10px] py-0 px-1.5 shrink-0"
                            >
                              {v.totalStock}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-primary">{v.sku}</span>
                              <span className="font-medium">{v.storage}</span>
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1 font-normal"
                              >
                                {v.condition === "NEW" ? t("conditionNew") : t("conditionUsed")}
                              </Badge>
                            </div>
                            <div className="font-semibold text-right">
                              <span>{formatCurrency(v.price)}</span>
                              {v.oldPrice && (
                                <span className="text-[10px] text-muted-foreground line-through ml-1 font-normal">
                                  {formatCurrency(v.oldPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    )}

        {filteredProducts.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredProducts.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setProductToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <DialogTitle className="text-base">
                {t("deleteConfirmTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>

          {productToDelete && (
            <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1 my-2">
              <div className="text-xs font-semibold text-foreground">
                {productToDelete.brand} {productToDelete.modelName}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t("deleteProductMeta", { variants: productToDelete.variants.length, stock: productToDelete.totalStock })}
              </div>
            </div>
          )}

          {deleteError && (
            <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
              {deleteError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                setProductToDelete(null);
                setDeleteError(null);
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>{t("deleting")}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t("delete")}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Batch Action Bar */}
      {selectedProductIds.size > 0 && (
        <div
          role="region"
          aria-label="Batch actions"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-full shadow-2xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between sm:justify-start gap-2 sm:gap-3 border border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-200 w-[calc(100%-1.5rem)] sm:w-auto max-w-lg mb-[env(safe-area-inset-bottom,0px)]"
        >
          <span className="text-xs font-semibold whitespace-nowrap">
            <span className="sm:hidden">{selectedProductIds.size} ta</span>
            <span className="hidden sm:inline">{t("selectedCount", { count: selectedProductIds.size })}</span>
          </span>
          <div className="h-4 w-px bg-white/20 dark:bg-slate-900/20" aria-hidden="true" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-8 px-2 sm:px-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10 dark:text-slate-900/80 dark:hover:text-slate-900 dark:hover:bg-slate-900/10 rounded-full"
          >
            <span className="sm:hidden">{t("cancelBtnMobile")}</span>
            <span className="hidden sm:inline">{t("cancelSelection")}</span>
          </Button>
          {isSuperAdmin && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsBulkModalOpen(true);
                setBulkError(null);
              }}
              className="h-8 px-2.5 sm:px-3 text-xs rounded-full gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sm:hidden">{t("deleteBtnMobile")}</span>
              <span className="hidden sm:inline">{t("bulkDeleteBtn")}</span>
            </Button>
          )}
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={isBulkModalOpen}
        onOpenChange={(open) => {
          if (!open && !isBulkDeleting) {
            setIsBulkModalOpen(false);
            setBulkError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <DialogTitle className="text-base">
                {t("bulkDeleteModalTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("bulkDeleteModalDesc", { count: selectedProductIds.size })}
            </DialogDescription>
          </DialogHeader>

          {bulkError && (
            <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
              {bulkError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBulkDeleting}
              onClick={() => {
                setIsBulkModalOpen(false);
                setBulkError(null);
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isBulkDeleting}
              onClick={handleConfirmBulkDelete}
              className="gap-1.5"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>{t("deleting")}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t("delete")}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
