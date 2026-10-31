"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, RotateCcw, Check, Store, ArrowUpDown, X } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

export interface FilterBranch {
  id: string;
  name: string;
  slug: string;
}

export interface FilterSidebarProps {
  availableBrands?: string[];
  availableStorages?: string[];
  branches?: FilterBranch[];
  className?: string;
}

export function FilterSidebar({
  availableBrands = ["Apple", "Samsung", "Xiaomi"],
  availableStorages = ["128GB", "256GB", "512GB", "1TB"],
  branches = [],
  className,
}: FilterSidebarProps) {
  const tCatalog = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedBrand = searchParams.get("brand") || "";
  const selectedStorage = searchParams.get("storage") || "";
  const selectedBranch = searchParams.get("branch") || "";
  const selectedSort = searchParams.get("sort") || "newest";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  const [minPrice, setMinPrice] = React.useState(minPriceParam);
  const [maxPrice, setMaxPrice] = React.useState(maxPriceParam);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Sync state if URL changes
  React.useEffect(() => {
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim().length > 0) {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleBrandToggle = (brand: string) => {
    if (selectedBrand.toLowerCase() === brand.toLowerCase()) {
      updateParam("brand", null);
    } else {
      updateParam("brand", brand);
    }
  };

  const handleStorageToggle = (storage: string) => {
    if (selectedStorage.toLowerCase() === storage.toLowerCase()) {
      updateParam("storage", null);
    } else {
      updateParam("storage", storage);
    }
  };

  const handleBranchChange = (branchSlug: string) => {
    if (branchSlug === "all" || !branchSlug) {
      updateParam("branch", null);
    } else {
      updateParam("branch", branchSlug);
    }
  };

  const handleSortChange = (sort: string) => {
    updateParam("sort", sort);
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    router.push(`${pathname}?${params.toString()}`);
    setIsMobileOpen(false);
  };

  const handleResetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    router.push(pathname);
    setIsMobileOpen(false);
  };

  const hasActiveFilters = Boolean(
    selectedBrand ||
      selectedStorage ||
      selectedBranch ||
      minPriceParam ||
      maxPriceParam ||
      (selectedSort && selectedSort !== "newest")
  );

  const filterContent = (
    <div className="space-y-6">
      {/* Header with Title and Reset */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold tracking-wide text-foreground">
            {tCatalog("filter")}
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>{tCatalog("resetFilters")}</span>
          </button>
        )}
      </div>

      {/* Sort By Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span>{tCatalog("sortBy")}</span>
        </label>
        <Select value={selectedSort} onValueChange={handleSortChange}>
          <SelectTrigger className="h-9 text-xs bg-background">
            <SelectValue placeholder={tCatalog("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className="text-xs">
              {tCatalog("sortOptions.newest")}
            </SelectItem>
            <SelectItem value="priceAsc" className="text-xs">
              {tCatalog("sortOptions.priceAsc")}
            </SelectItem>
            <SelectItem value="priceDesc" className="text-xs">
              {tCatalog("sortOptions.priceDesc")}
            </SelectItem>
            <SelectItem value="nameAsc" className="text-xs">
              {tCatalog("sortOptions.nameAsc")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brand Checkboxes */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tCatalog("brand")}
        </h4>
        <div className="space-y-1.5">
          {availableBrands.map((brand) => {
            const isChecked = selectedBrand.toLowerCase() === brand.toLowerCase();
            return (
              <button
                key={brand}
                type="button"
                onClick={() => handleBrandToggle(brand)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
                  isChecked
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-pressed={isChecked}
              >
                <span>{brand}</span>
                {isChecked && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Storage Chips */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tCatalog("storage")}
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {availableStorages.map((storage) => {
            const isSelected = selectedStorage.toLowerCase() === storage.toLowerCase();
            return (
              <button
                key={storage}
                type="button"
                onClick={() => handleStorageToggle(storage)}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-center text-xs font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-border/80 bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
                aria-pressed={isSelected}
              >
                {storage}
              </button>
            );
          })}
        </div>
      </div>

      {/* Branch Availability Dropdown */}
      {branches.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span>{tCatalog("branchesFilter")}</span>
          </label>
          <Select
            value={selectedBranch || "all"}
            onValueChange={handleBranchChange}
          >
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder={tCatalog("allBranches")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {tCatalog("allBranches")}
              </SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.slug} className="text-xs">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Price Range */}
      <form onSubmit={handlePriceSubmit} className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tCatalog("priceRange")}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder={tCatalog("minPrice")}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 sm:h-8 text-base sm:text-xs bg-background"
              aria-label={tCatalog("minPrice")}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder={tCatalog("maxPrice")}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9 sm:h-8 text-base sm:text-xs bg-background"
              aria-label={tCatalog("maxPrice")}
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="w-full text-xs h-8"
        >
          {tCatalog("applyFilters")}
        </Button>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop Filter Sidebar */}
      <aside
        className={cn(
          "hidden md:block w-64 shrink-0 rounded-xl border border-border/80 bg-card p-5 shadow-xs",
          className
        )}
        aria-label="Product Catalog Filters"
      >
        {filterContent}
      </aside>

      {/* Mobile Filter Trigger Button & Dialog */}
      <div className="md:hidden flex items-center justify-between gap-2 pb-4">
        <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-xs font-medium w-full sm:w-auto"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tCatalog("filter")}</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {tCatalog("filter")}
              </DialogTitle>
            </DialogHeader>
            <div className="pt-2">{filterContent}</div>
          </DialogContent>
        </Dialog>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-9 gap-1 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{tCatalog("clearAll")}</span>
          </Button>
        )}
      </div>
    </>
  );
}

