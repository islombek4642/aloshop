"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency } from "@/lib/utils/format-currency";

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
  const t = useTranslations("admin.productsManagement");

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedBrand, setSelectedBrand] = React.useState("ALL");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [expandedProductIds, setExpandedProductIds] = React.useState<Set<string>>(
    new Set()
  );

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

  return (
    <div className="space-y-4">
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
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Brand Filter */}
          <div className="w-[140px]">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="h-9 text-xs">
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
              <SelectTrigger className="h-9 text-xs">
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

        {/* Create Button (SuperAdmin only) */}
        {isSuperAdmin && (
          <Link href="/admin/products/new">
            <Button size="sm" className="h-9 gap-1.5 text-xs shrink-0">
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{t("newProduct")}</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Products Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Filter className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium text-foreground">{t("noProducts")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead className="text-xs">{t("title")}</TableHead>
                <TableHead className="text-xs">{t("filterCategory")}</TableHead>
                <TableHead className="text-xs">{t("warrantyMonths", { count: 0 }).replace("0 ", "")}</TableHead>
                <TableHead className="text-xs">{t("variantsCount", { count: 0 }).replace("0 ", "")}</TableHead>
                <TableHead className="text-xs text-right">{t("totalStock")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
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
                      <TableCell className="w-8 pr-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        )}
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
                    </TableRow>

                    {/* Expandable Variants Sub-Table */}
                    {isExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={6} className="p-0 border-b border-border/60">
                          <div className="px-6 py-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                              {product.modelName} &bull; {t("expandVariants")}
                            </div>
                            <div className="rounded-md border border-border/80 bg-card overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent bg-muted/40">
                                    <TableHead className="text-[11px] h-8">{t("sku")}</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("color")}</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("storage")}</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("condition")}</TableHead>
                                    <TableHead className="text-[11px] h-8">{t("price")}</TableHead>
                                    <TableHead className="text-[11px] h-8 text-right">{t("stock")}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {product.variants.map((v) => (
                                    <TableRow key={v.id} className="hover:bg-muted/20">
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
        )}
      </div>
    </div>
  );
}

